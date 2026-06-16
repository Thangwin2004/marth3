/**
 * @file SaveManager.js
 * @description Handles persistent leaderboard scores via localStorage.
 *   No PixiJS dependency — pure data management.
 */

const KEY = 'match3_pure_leaderboard';

/**
 * Returns a fresh default save object (deep copy).
 * @returns {{ leaderboard: Array<{score: number, date: string}> }}
 */
function defaultSave() {
  return {
    leaderboard: []
  };
}

/**
 * Manages saving / loading game leaderboard to localStorage.
 */
class SaveManager {
  /**
   * Persist the save data object.
   * @param {Object} data - Full save data to store.
   */
  save(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch (err) {
      console.error('[SaveManager] Failed to save:', err);
    }
  }

  /**
   * Load save data from localStorage.
   * Returns a default save if nothing is stored or data is corrupt.
   * @returns {Object} The saved game state.
   */
  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultSave();
      const loaded = JSON.parse(raw);
      return {
        leaderboard: loaded.leaderboard || []
      };
    } catch (err) {
      console.warn('[SaveManager] Corrupt save data, resetting:', err);
      return defaultSave();
    }
  }

  /**
   * Get the sorted list of top scores.
   * @returns {Array<{score: number, date: string}>}
   */
  getLeaderboard() {
    const data = this.load();
    return data.leaderboard || [];
  }

  /**
   * Add a new score to the leaderboard.
   * Keeps top 5 highest scores.
   * @param {number} score - The score achieved.
   * @returns {number|null} Rank achieved (1 to 5) or null if didn't make it to Top 5.
   */
  addScore(score) {
    const data = this.load();
    const leaderboard = data.leaderboard || [];

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const dateString = `${day}/${month}/${year} ${hours}:${minutes}`;

    const newEntry = { score, date: dateString };
    leaderboard.push(newEntry);

    // Sort descending by score
    leaderboard.sort((a, b) => b.score - a.score);

    // Keep top 5
    const trimmed = leaderboard.slice(0, 5);
    data.leaderboard = trimmed;
    this.save(data);

    // Find if the new score made it into the top 5, and at what rank
    // (If there are duplicate scores, findIndex will find the first matching entry)
    const index = trimmed.findIndex(entry => entry.score === score && entry.date === dateString);
    return index !== -1 ? index + 1 : null;
  }

  /**
   * Wipe all saved leaderboard progress.
   */
  reset() {
    try {
      localStorage.removeItem(KEY);
    } catch (err) {
      console.error('[SaveManager] Failed to reset:', err);
    }
  }
}

/** Singleton instance */
export const saveManager = new SaveManager();

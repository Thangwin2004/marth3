/**
 * @file SaveManager.js
 * @description Singleton that handles persistent game state via localStorage.
 *   No PixiJS dependency — pure data management.
 */

/** @type {string} localStorage key */
const KEY = 'match3_boss_battle_save';

/**
 * Returns a fresh default save object (deep copy).
 * @returns {{ currentLevel:number, unlockedLevels:number[], unlockedSkills:string[], bestScores:Object.<number,number> }}
 */
function defaultSave() {
  return {
    currentLevel: 1,
    unlockedLevels: [1],
    unlockedSkills: [],
    bestScores: {},
  };
}

/**
 * Manages saving / loading game progress to localStorage.
 */
class SaveManager {
  /**
   * Persist the entire save data object.
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
      return JSON.parse(raw);
    } catch (err) {
      console.warn('[SaveManager] Corrupt save data, resetting:', err);
      return defaultSave();
    }
  }

  /**
   * Unlock a level (adds to unlockedLevels if new) and advances currentLevel.
   * @param {number} level - The level number to unlock.
   */
  unlockLevel(level) {
    const data = this.load();
    if (!data.unlockedLevels.includes(level)) {
      data.unlockedLevels.push(level);
      data.unlockedLevels.sort((a, b) => a - b);
    }
    if (level > data.currentLevel) {
      data.currentLevel = level;
    }
    this.save(data);
  }

  /**
   * Unlock a player skill.
   * @param {string} skillId - Skill identifier to unlock.
   */
  unlockSkill(skillId) {
    const data = this.load();
    if (!data.unlockedSkills.includes(skillId)) {
      data.unlockedSkills.push(skillId);
    }
    this.save(data);
  }

  /**
   * Check whether a given level is unlocked.
   * @param {number} level
   * @returns {boolean}
   */
  isLevelUnlocked(level) {
    const data = this.load();
    return data.unlockedLevels.includes(level);
  }

  /**
   * Get all currently unlocked skill IDs.
   * @returns {string[]}
   */
  getUnlockedSkills() {
    const data = this.load();
    return data.unlockedSkills || [];
  }

  /**
   * Wipe all saved progress and return to defaults.
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

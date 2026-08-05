/**
 * @file SaveManager.js
 * @description Handles persistent leaderboard scores via localStorage.
 *   No PixiJS dependency — pure data management.
 */

const BASE_KEY = "match3_pure_leaderboard";

function getKey() {
  try {
    const savedUser = localStorage.getItem("google_user");
    if (savedUser) {
      const user = JSON.parse(savedUser);
      return `${BASE_KEY}_${user.id}`;
    }
  } catch (e) {
    console.error(e);
  }
  return BASE_KEY;
}

/**
 * Returns a fresh default save object (deep copy).
 * @returns {{ leaderboard: Array<{score: number, date: string}> }}
 */
function defaultSave() {
  return {
    leaderboard: [],
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
      localStorage.setItem(getKey(), JSON.stringify(data));
    } catch (err) {
      console.error("[SaveManager] Failed to save:", err);
    }
  }

  /**
   * Load save data from localStorage.
   * Returns a default save if nothing is stored or data is corrupt.
   * @returns {Object} The saved game state.
   */
  load() {
    try {
      const raw = localStorage.getItem(getKey());
      if (!raw) return defaultSave();
      const loaded = JSON.parse(raw);
      return {
        leaderboard: loaded.leaderboard || [],
      };
    } catch (err) {
      console.warn("[SaveManager] Corrupt save data, resetting:", err);
      return defaultSave();
    }
  }

  /**
  /**
   * Get the sorted list of top scores across all unique profiles,
   * keeping only the single highest score for each person/profile.
   * If there are fewer than 5 entries, populates with themed default bots.
   * @returns {Array<{score: number, date: string, userName: string, profileKey: string}>}
   */
  getLeaderboard() {
    const allEntries = [];

    // Get active user details
    let activeId = null;
    let activeName = null;
    try {
      const savedUser = localStorage.getItem("google_user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        activeId = user.id;
        activeName = user.name;
      }
    } catch (e) {
      console.error(e);
    }

    // 1. Scan localStorage to collect the best score of each unique profile
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(BASE_KEY)) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const list = parsed.leaderboard || [];
            if (list.length > 0) {
              const best = list[0]; // first item is their highest score

              let name = parsed.userName;
              // If this key matches the active logged-in Google user, override or fallback to their name!
              if (activeId && key === `${BASE_KEY}_${activeId}`) {
                name = activeName;
              }
              // Support mockup profiles fallback for visual testing
              if (!name) {
                if (key.endsWith("_laclac")) name = "Lạc Lạc (Bơ Lạc)";
                else if (key.endsWith("_dauphong")) name = "Đậu Phộng";
                else name = key === BASE_KEY ? "Khách" : "Người chơi";
              }

              allEntries.push({
                score: best.score,
                date: best.date,
                userName: name,
                profileKey: key,
              });
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    // 2. Define themed bot competitors
    const defaultCompetitors = [
      {
        userName: "Bơ Lạc",
        score: 5500,
        date: "Hệ thống",
        profileKey: "bot_1",
      },
      {
        userName: "Đậu Phộng",
        score: 4000,
        date: "Hệ thống",
        profileKey: "bot_2",
      },
      {
        userName: "Ếch Xanh",
        score: 2500,
        date: "Hệ thống",
        profileKey: "bot_3",
      },
      {
        userName: "Gấu Trúc",
        score: 1500,
        date: "Hệ thống",
        profileKey: "bot_4",
      },
      {
        userName: "Mèo Lười",
        score: 800,
        date: "Hệ thống",
        profileKey: "bot_5",
      },
    ];

    // Append all bots to ensure the leaderboard is always populated
    defaultCompetitors.forEach((bot) => allEntries.push(bot));

    // 3. Keep only the single highest score for each unique player name
    const uniqueMap = new Map();
    allEntries.sort((a, b) => b.score - a.score);
    allEntries.forEach((entry) => {
      if (!uniqueMap.has(entry.userName)) {
        uniqueMap.set(entry.userName, entry);
      }
    });

    const finalLeaderboard = Array.from(uniqueMap.values());
    finalLeaderboard.sort((a, b) => b.score - a.score);

    return finalLeaderboard.slice(0, 5);
  }

  /**
   * Add a new score to the leaderboard.
   * Keeps top 5 highest scores.
   * @param {number} score - The score achieved.
   * @returns {number|null} Rank achieved (1 to 5) or null if didn't make it to Top 5.
   */
  addScore(score) {
    const data = this.load();

    // Set active username at root of save data for aggregation
    let activeName = "Khách";
    try {
      const savedUser = localStorage.getItem("google_user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        activeName = user.name || "Người chơi";
      }
    } catch (e) {
      console.error(e);
    }
    data.userName = activeName;

    const leaderboard = data.leaderboard || [];

    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = now.getFullYear();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
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
    const index = trimmed.findIndex(
      (entry) => entry.score === score && entry.date === dateString,
    );
    return index !== -1 ? index + 1 : null;
  }

  /**
   * Wipe all saved leaderboard progress.
   */
  reset() {
    try {
      localStorage.removeItem(getKey());
    } catch (err) {
      console.error("[SaveManager] Failed to reset:", err);
    }
  }
}

/** Singleton instance */
export const saveManager = new SaveManager();

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
/**
 * Returns a fresh default save object (deep copy).
 * @returns {{ currentLevel:number, unlockedLevels:number[], unlockedSkills:string[], bestScores:Object.<number,number>, gold:number, heroLevel:number, heroExp:number, elementShards:Object.<string,number>, masteryLevels:Object.<string,number> }}
 */
function defaultSave() {
  return {
    currentLevel: 1,
    unlockedLevels: [1],
    unlockedSkills: [],
    bestScores: {},
    // RPG PROGRESSION DATA
    gold: 100, // Bắt đầu với 100 Vàng
    heroLevel: 1,
    heroExp: 0,
    elementShards: {
      fire: 0, water: 0, nature: 0, ice: 0, lightning: 0,
      earth: 0, 'wind-air': 0, 'psychic-eye': 0, sun: 0, 'poison-death': 0
    },
    masteryLevels: {
      fire: 0, water: 0, nature: 0, ice: 0, lightning: 0,
      earth: 0, 'wind-air': 0, 'psychic-eye': 0, sun: 0, 'poison-death': 0
    }
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
      const loaded = JSON.parse(raw);
      // Merge with defaultSave to ensure backward compatibility for old saves
      const defaults = defaultSave();
      
      // Merge nested objects deep enough
      const elementShards = { ...defaults.elementShards, ...loaded.elementShards };
      const masteryLevels = { ...defaults.masteryLevels, ...loaded.masteryLevels };
      
      return {
        ...defaults,
        ...loaded,
        elementShards,
        masteryLevels
      };
    } catch (err) {
      console.warn('[SaveManager] Corrupt save data, resetting:', err);
      return defaultSave();
    }
  }

  addGold(amount) {
    const data = this.load();
    data.gold = (data.gold || 0) + amount;
    this.save(data);
  }

  addExp(amount) {
    const data = this.load();
    data.heroExp = (data.heroExp || 0) + amount;
    
    // Level up math: EXP required for next level = heroLevel * 100
    let expNeeded = data.heroLevel * 100;
    let leveledUp = false;
    while (data.heroExp >= expNeeded) {
      data.heroExp -= expNeeded;
      data.heroLevel++;
      expNeeded = data.heroLevel * 100;
      leveledUp = true;
    }
    this.save(data);
    return { level: data.heroLevel, leveledUp };
  }

  addShards(color, amount) {
    const data = this.load();
    data.elementShards[color] = (data.elementShards[color] || 0) + amount;
    this.save(data);
  }

  upgradeMastery(color) {
    const data = this.load();
    const currentMastery = data.masteryLevels[color] || 0;
    // Upgrade cost = (currentMastery + 1) * 5 shards
    const shardCost = (currentMastery + 1) * 5;
    const currentShards = data.elementShards[color] || 0;
    
    if (currentShards >= shardCost) {
      data.elementShards[color] -= shardCost;
      data.masteryLevels[color] = currentMastery + 1;
      this.save(data);
      return true;
    }
    return false;
  }

  upgradeHeroLevelWithGold() {
    const data = this.load();
    // Cost = data.heroLevel * 80 gold
    const goldCost = data.heroLevel * 80;
    if (data.gold >= goldCost) {
      data.gold -= goldCost;
      data.heroLevel++;
      this.save(data);
      return true;
    }
    return false;
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

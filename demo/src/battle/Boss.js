/**
 * @fileoverview Boss entity for the Match-3 Boss Battle RPG.
 * Extends BattleEntity with weakness/resistance multipliers,
 * AI skill selection, and turn-interval skill usage.
 * Pure logic — no PixiJS dependencies.
 */

import { BattleEntity } from './BattleEntity.js';

export class Boss extends BattleEntity {
  /**
   * Create a new Boss entity from a level configuration object.
   *
   * @param {Object}   levelConfig                  - Full level descriptor.
   * @param {string}   levelConfig.bossName         - Display name of the boss.
   * @param {string}   levelConfig.bossEmoji        - Emoji representing the boss.
   * @param {number}   levelConfig.level            - Level/stage number.
   * @param {Object}   levelConfig.boss             - Boss-specific stats block.
   * @param {number}   levelConfig.boss.maxHP       - Boss maximum hit points.
   * @param {string|null} levelConfig.boss.weakness    - Tile type the boss is weak to, or null.
   * @param {string|null} levelConfig.boss.resistance  - Tile type the boss resists, or null.
   * @param {number}   levelConfig.boss.aiOptimalChance - Probability (0–1) the boss plays optimally.
   * @param {string[]} levelConfig.boss.skills      - Array of skill ID strings the boss can use.
   * @param {number}   levelConfig.boss.skillInterval - Boss uses a skill every N turns.
   */
  constructor(levelConfig) {
    super(levelConfig.bossName, levelConfig.boss.maxHP);

    /** @type {string} Emoji icon for UI display. */
    this.emoji = levelConfig.bossEmoji;

    /** @type {string|null} Tile type the boss takes extra damage from (×1.5). */
    this.weakness = levelConfig.boss.weakness;

    /** @type {string|null} Tile type the boss resists (×0.5). */
    this.resistance = levelConfig.boss.resistance;

    /** @type {number} Probability (0–1) that the boss chooses an optimal move. */
    this.aiOptimalChance = levelConfig.boss.aiOptimalChance;

    /** @type {string[]} Skill IDs the boss can activate. */
    this.skills = levelConfig.boss.skills;

    /** @type {number} The boss uses a skill every this-many turns. */
    this.skillInterval = levelConfig.boss.skillInterval;

    /** @type {number} Tracks how many turns have elapsed. */
    this.turnCounter = 0;

    /** @type {number} Current level/stage number. */
    this.level = levelConfig.level;
  }

  /**
   * Determine whether the boss should activate a skill this turn.
   * A skill fires when:
   *  - The boss has at least one skill available.
   *  - At least one turn has passed (`turnCounter > 0`).
   *  - The current turn is a multiple of `skillInterval`.
   *
   * @returns {boolean} `true` if the boss should use a skill now.
   */
  shouldUseSkill() {
    return (
      this.skills.length > 0 &&
      this.turnCounter > 0 &&
      this.turnCounter % this.skillInterval === 0
    );
  }

  /**
   * Pick a random skill from the boss's skill pool.
   *
   * @returns {string|null} A random skill ID, or `null` if the boss has no skills.
   */
  getRandomSkill() {
    if (this.skills.length === 0) return null;
    return this.skills[Math.floor(Math.random() * this.skills.length)];
  }

  /**
   * Advance the boss's internal turn counter by one.
   * Should be called once per boss turn.
   */
  incrementTurn() {
    this.turnCounter++;
  }

  /**
   * Calculate the damage multiplier for a given tile type based on weakness/resistance.
   *
   * @param {string} tileType - The tile type being matched (e.g. 'fire', 'water').
   * @returns {number} Multiplier: 1.5 for weakness, 0.5 for resistance, 1.0 otherwise.
   */
  getWeaknessMultiplier(tileType) {
    if (this.weakness && tileType === this.weakness) return 2.0;
    if (this.resistance && tileType === this.resistance) return 0.5;
    return 1.0;
  }
}

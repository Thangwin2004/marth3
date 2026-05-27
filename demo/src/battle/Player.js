/**
 * @fileoverview Player entity for the Match-3 Boss Battle RPG.
 * Extends BattleEntity with skill unlocking and cooldown management.
 * Pure logic — no PixiJS dependencies.
 */

import { BattleEntity } from './BattleEntity.js';

/**
 * @typedef {Object} SkillState
 * @property {string}  id       - Skill identifier.
 * @property {number}  cooldown - Remaining cooldown turns (0 = ready).
 * @property {boolean} ready    - Whether the skill can be used this turn.
 */

export class Player extends BattleEntity {
  /**
   * Create a new Player entity.
   *
   * @param {string[]} [unlockedSkills=[]] - Array of skill IDs the player starts with.
   */
  constructor(unlockedSkills = [], maxHP = 100) {
    super('Player', maxHP);

    /** @type {string[]} Skill IDs that have been unlocked. */
    this.unlockedSkills = [...unlockedSkills];

    /** @type {Map<string, number>} Cooldown tracker — maps skillId → turnsRemaining. */
    this.cooldowns = new Map();

    // Initialise every unlocked skill as ready (0 cooldown)
    this.unlockedSkills.forEach(id => this.cooldowns.set(id, 0));
  }

  /**
   * Determine whether a skill can be activated right now.
   * A skill is usable when it is unlocked, off cooldown, and the player is not stunned.
   *
   * @param {string} skillId - The skill to check.
   * @returns {boolean} `true` if the skill is ready to use.
   */
  canUseSkill(skillId) {
    return (
      this.unlockedSkills.includes(skillId) &&
      this.cooldowns.get(skillId) === 0 &&
      !this.stunned
    );
  }

  /**
   * Mark a skill as used, placing it on cooldown.
   *
   * @param {string} skillId      - The skill that was just used.
   * @param {number} cooldownValue - Number of turns before the skill is available again.
   */
  useSkill(skillId, cooldownValue) {
    this.cooldowns.set(skillId, cooldownValue);
  }

  /**
   * Advance all cooldowns by one turn.
   * Called at the end (or start) of the player's turn.
   */
  tickCooldowns() {
    for (const [id, cd] of this.cooldowns) {
      if (cd > 0) {
        this.cooldowns.set(id, cd - 1);
      }
    }
  }

  /**
   * Build a snapshot of every unlocked skill's state for the UI layer.
   *
   * @returns {SkillState[]} Array describing each skill's readiness.
   */
  getSkillStates() {
    return this.unlockedSkills.map(id => ({
      id,
      cooldown: this.cooldowns.get(id) || 0,
      ready: this.cooldowns.get(id) === 0,
    }));
  }
}

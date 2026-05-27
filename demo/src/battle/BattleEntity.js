/**
 * @fileoverview Base class for all battle participants (Player, Boss).
 * Provides core HP, shield, and damage/heal mechanics.
 * Pure logic — no PixiJS dependencies.
 */

/**
 * @typedef {Object} DamageResult
 * @property {number} absorbed - Amount of damage absorbed by shield.
 * @property {number} hpLost   - Amount of HP actually lost after shield absorption.
 */

export class BattleEntity {
  /**
   * Create a new battle entity.
   *
   * @param {string} name  - Display name of the entity.
   * @param {number} maxHP - Maximum hit points.
   */
  constructor(name, maxHP) {
    /** @type {string} */
    this.name = name;

    /** @type {number} */
    this.maxHP = maxHP;

    /** @type {number} */
    this.currentHP = maxHP;

    /** @type {number} Flat damage absorbed before HP is reduced. */
    this.shield = 0;

    /** @type {import('./StatusEffects.js').StatusEffect[]} Active status effects. */
    this.statusEffects = [];

    /** @type {boolean} When true the entity skips its turn. Set by StatusEffectManager. */
    this.stunned = false;
  }

  /**
   * Apply damage to this entity.
   * Shield absorbs damage first; any remainder reduces HP.
   * HP cannot drop below 0.
   *
   * @param {number} amount - Raw damage to apply (must be ≥ 0).
   * @returns {DamageResult} Breakdown of absorbed vs. actual HP lost.
   */
  takeDamage(amount) {
    if (this.shield > 0) {
      if (this.shield >= amount) {
        this.shield -= amount;
        return { absorbed: amount, hpLost: 0 };
      }

      const absorbed = this.shield;
      amount -= this.shield;
      this.shield = 0;
      this.currentHP = Math.max(0, this.currentHP - amount);
      return { absorbed, hpLost: amount };
    }

    this.currentHP = Math.max(0, this.currentHP - amount);
    return { absorbed: 0, hpLost: amount };
  }

  /**
   * Heal the entity, capped at maxHP.
   *
   * @param {number} amount - Amount to heal.
   * @returns {number} The actual amount healed (may be less if near max).
   */
  heal(amount) {
    const before = this.currentHP;
    this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
    return this.currentHP - before;
  }

  /**
   * Add shield points. Shields stack additively.
   *
   * @param {number} amount - Shield points to add.
   * @returns {number} New total shield value.
   */
  addShield(amount) {
    this.shield += amount;
    return this.shield;
  }

  /**
   * Check whether the entity is still alive.
   *
   * @returns {boolean} `true` if currentHP > 0.
   */
  isAlive() {
    return this.currentHP > 0;
  }

  /**
   * Get the entity's current HP as a fraction of max (0–1).
   *
   * @returns {number} HP percentage in the range [0, 1].
   */
  getHPPercent() {
    return this.currentHP / this.maxHP;
  }
}

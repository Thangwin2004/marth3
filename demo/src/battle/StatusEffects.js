/**
 * @fileoverview Status effect management system for the Match-3 Boss Battle RPG.
 * Handles applying, ticking, cleansing, and querying status effects on battle entities.
 * Pure logic — no PixiJS dependencies.
 *
 * Supported effect types:
 *  - burn:   { type:'burn',   damage:N, duration:N }
 *  - poison: { type:'poison', damage:N, duration:N, stackable:true }
 *  - freeze: { type:'freeze', duration:N }           (affects tiles, not entity directly)
 *  - stun:   { type:'stun',   duration:N }           (skip turn)
 *  - curse:  { type:'curse',  damageReduction:0.3, duration:N }
 *
 * Shield is stored directly on the entity and is NOT a status effect.
 */

/**
 * @typedef {Object} StatusEffect
 * @property {string}  type              - Effect identifier (burn | poison | freeze | stun | curse).
 * @property {number}  [damage]          - Damage dealt per tick (burn, poison).
 * @property {number}  duration          - Remaining turns.
 * @property {boolean} [stackable]       - Whether the effect stacks (poison).
 * @property {number}  [damageReduction] - Fraction of damage reduction (curse).
 */

/**
 * @typedef {Object} TickResult
 * @property {number}  totalDotDamage - Total damage-over-time dealt this tick.
 * @property {boolean} wasStunned     - Whether the entity was stunned this tick.
 */

export class StatusEffectManager {
  /**
   * Add a status effect to an entity.
   *
   * - If the effect is **stackable** (e.g. poison) and the same type already exists,
   *   the existing effect's damage is increased and its duration is reset.
   * - If the effect is **not stackable** and the same type already exists,
   *   only the duration is reset (to the new effect's duration).
   * - Otherwise the effect is pushed as a new entry.
   *
   * @param {import('./BattleEntity.js').BattleEntity} entity - Target entity.
   * @param {StatusEffect} effect - The effect to apply (will be shallow-cloned).
   */
  addEffect(entity, effect) {
    // Quartz Fortress Stun Immunity Check
    if (effect.type === 'stun' && entity.name === 'Player' && entity.quartzImmunityTurns > 0) {
      console.log('[StatusEffects] Player is immune to Stun due to Quartz Fortress!');
      return;
    }

    const clone = { ...effect };
    const existing = entity.statusEffects.find(e => e.type === clone.type);

    if (existing) {
      if (clone.stackable) {
        // Stack: increase damage, reset duration
        existing.damage = (existing.damage || 0) + (clone.damage || 0);
        existing.duration = clone.duration;
      } else {
        // Refresh duration only
        existing.duration = clone.duration;
      }
    } else {
      entity.statusEffects.push(clone);
    }
  }

  /**
   * Process every active effect at the start of an entity's turn.
   *
   * Processing order:
   *  1. **burn**  → deal damage to entity.
   *  2. **poison** → deal damage to entity.
   *  3. **stun**  → flag `entity.stunned = true`.
   *  4. **curse** → handled externally by DamageSystem (no action here).
   *  5. **freeze** → tile-level effect (no action on entity here).
   *  6. Decrease `duration` of every effect by 1.
   *  7. Remove effects whose `duration` has reached 0 or below.
   *
   * @param {import('./BattleEntity.js').BattleEntity} entity - The entity whose effects are ticked.
   * @returns {TickResult} Summary of what happened this tick.
   */
  tickEffects(entity) {
    let totalDotDamage = 0;
    let wasStunned = false;

    // Reset stun flag before evaluating
    entity.stunned = false;

    for (const effect of entity.statusEffects) {
      switch (effect.type) {
        case 'burn':
          if (effect.damage > 0) {
            entity.takeDamage(effect.damage);
            totalDotDamage += effect.damage;
          }
          break;

        case 'poison':
          if (effect.damage > 0) {
            entity.takeDamage(effect.damage);
            totalDotDamage += effect.damage;
          }
          break;

        case 'stun':
          entity.stunned = true;
          wasStunned = true;
          break;

        case 'curse':
          // Damage reduction is read by DamageSystem; nothing to process here.
          break;

        case 'freeze':
          // Freeze affects tiles, not the entity directly.
          break;

        default:
          break;
      }
    }

    // Decrease duration of every effect
    for (const effect of entity.statusEffects) {
      effect.duration -= 1;
    }

    // Remove expired effects
    entity.statusEffects = entity.statusEffects.filter(e => e.duration > 0);

    return { totalDotDamage, wasStunned };
  }

  /**
   * Remove the first debuff found on the entity (used by Water cleanse).
   * Debuff types considered: burn, poison, stun, curse, freeze.
   *
   * @param {import('./BattleEntity.js').BattleEntity} entity - Target entity.
   * @returns {StatusEffect|null} The removed effect, or null if none found.
   */
  cleanse(entity) {
    const debuffTypes = ['burn', 'poison', 'stun', 'curse', 'freeze'];
    const index = entity.statusEffects.findIndex(e => debuffTypes.includes(e.type));

    if (index !== -1) {
      const [removed] = entity.statusEffects.splice(index, 1);
      // If the removed debuff was stun, clear the stunned flag
      if (removed.type === 'stun') {
        entity.stunned = false;
      }
      return removed;
    }

    return null;
  }

  /**
   * Check whether an entity currently has a specific effect type.
   *
   * @param {import('./BattleEntity.js').BattleEntity} entity - Target entity.
   * @param {string} type - Effect type to check for.
   * @returns {boolean} `true` if the effect is present.
   */
  hasEffect(entity, type) {
    return entity.statusEffects.some(e => e.type === type);
  }

  /**
   * Retrieve the effect object of a given type from the entity, if present.
   *
   * @param {import('./BattleEntity.js').BattleEntity} entity - Target entity.
   * @param {string} type - Effect type to retrieve.
   * @returns {StatusEffect|undefined} The effect, or `undefined` if not found.
   */
  getEffect(entity, type) {
    return entity.statusEffects.find(e => e.type === type);
  }

  /**
   * Remove **all** status effects from an entity (purify).
   *
   * @param {import('./BattleEntity.js').BattleEntity} entity - Target entity.
   * @returns {StatusEffect[]} Array of effects that were removed.
   */
  removeAll(entity) {
    const removed = [...entity.statusEffects];
    entity.statusEffects = [];
    entity.stunned = false;
    return removed;
  }
}

/** Singleton instance for convenient access across the battle system. */
export const statusEffectManager = new StatusEffectManager();

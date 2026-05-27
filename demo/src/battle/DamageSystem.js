/**
 * ===== src/battle/DamageSystem.js =====
 * 
 * Calculates damage from tile matches for both Player and Boss.
 * Applies terrain buffs/debuffs, elemental weakness/resistance,
 * match length bonuses, combo chain multipliers, and curse effects.
 */

import { Config } from '../config.js';
import { TILE_DAMAGE } from '../data/LevelData.js';
import { statusEffectManager } from './StatusEffects.js';

export class DamageSystem {
    /**
     * @param {object} terrainConfig - Current level's terrain config
     * @param {number} levelNum - Current level number
     */
    constructor(terrainConfig, levelNum = 1) {
        this.terrain = terrainConfig;
        this.levelNum = levelNum;
    }

    /**
     * Calculate total damage and effects from a set of matches.
     * 
     * @param {Array} matches - Array of { tiles, length } from CombinationManager
     * @param {import('./BattleEntity.js').BattleEntity} attacker - Who made the match
     * @param {import('./BattleEntity.js').BattleEntity} defender - Who receives damage
     * @param {number} comboChain - Current combo chain count (1-based)
     * @returns {{ totalDamage: number, effects: Array, healAmount: number, shieldAmount: number }}
     */
    calculate(matches, attacker, defender, comboChain = 1) {
        let totalDamage = 0;
        let healAmount = 0;
        let shieldAmount = 0;
        const effects = [];

        for (const match of matches) {
            const tileType = match.tiles[0]?.color;
            if (!tileType) continue;

            const tileInfo = TILE_DAMAGE[tileType];
            if (!tileInfo) continue;

            // Base damage × tile count
            let matchDamage = tileInfo.baseDmg * match.tiles.length;

            // Match length multiplier (3=×1.0, 4=×1.3, 5=×1.6, 6+=×2.0)
            const lengthKey = Math.min(match.length, 6);
            const lengthMult = Config.matchMultipliers[lengthKey] || Config.matchMultipliers[6];
            matchDamage *= lengthMult;

            // Terrain buff/debuff
            if (this.terrain.buff && this.terrain.buff[tileType]) {
                matchDamage *= (1 + this.terrain.buff[tileType]);
            }
            if (this.terrain.debuff && this.terrain.debuff[tileType]) {
                matchDamage *= (1 - this.terrain.debuff[tileType]);
            }

            // Scale player damage with level progress! (+15% damage per level above Level 1)
            if (attacker.name === 'Player') {
                const dmgMultiplier = 1 + (this.levelNum - 1) * 0.15;
                matchDamage *= dmgMultiplier;
            } else {
                // Scale Boss damage based on level to prevent early bosses from unexpectedly one-shotting the player.
                // Level 1 starts at 35% damage, gradually scaling up to 100% at Level 10 (Final Boss).
                let bossScale = 1.0;
                if (this.levelNum === 1) bossScale = 0.35;
                else if (this.levelNum === 2) bossScale = 0.40;
                else if (this.levelNum === 3) bossScale = 0.48;
                else if (this.levelNum === 4) bossScale = 0.55;
                else if (this.levelNum === 5) bossScale = 0.63;
                else if (this.levelNum === 6) bossScale = 0.70;
                else if (this.levelNum === 7) bossScale = 0.76;
                else if (this.levelNum === 8) bossScale = 0.82;
                else if (this.levelNum === 9) bossScale = 0.90;
                
                matchDamage *= bossScale;
            }

            // Elemental weakness/resistance (defender-specific)
            if (defender.getWeaknessMultiplier) {
                matchDamage *= defender.getWeaknessMultiplier(tileType);
            }

            totalDamage += matchDamage;

            // --- Self effects (benefit the attacker) ---
            if (tileInfo.selfEffect) {
                const se = tileInfo.selfEffect;
                if (se.type === 'heal') {
                    healAmount += se.amount;
                } else if (se.type === 'shield') {
                    shieldAmount += se.amount;
                } else if (se.type === 'cleanse') {
                    effects.push({ target: 'self', type: 'cleanse' });
                }
            }

            // --- Enemy effects (applied to defender) ---
            if (tileInfo.enemyEffect) {
                const ee = tileInfo.enemyEffect;
                // Chance-based effects
                if (ee.chance !== undefined) {
                    if (Math.random() < ee.chance) {
                        effects.push({ target: 'enemy', ...ee });
                    }
                } else {
                    effects.push({ target: 'enemy', ...ee });
                }
            }
        }

        // Combo chain multiplier
        const comboIndex = Math.min(comboChain, Config.comboMultipliers.length - 1);
        const comboMult = Config.comboMultipliers[comboIndex] || 1;
        totalDamage *= comboMult;

        // Curse debuff on attacker reduces damage output
        if (statusEffectManager.hasEffect(attacker, 'curse')) {
            const curse = statusEffectManager.getEffect(attacker, 'curse');
            totalDamage *= (1 - (curse.damageReduction || 0.3));
        }

        totalDamage = Math.floor(totalDamage);

        return { totalDamage, effects, healAmount, shieldAmount };
    }

    /**
     * Apply calculated effects to entities.
     * 
     * @param {Array} effects - Effects array from calculate()
     * @param {import('./BattleEntity.js').BattleEntity} attacker
     * @param {import('./BattleEntity.js').BattleEntity} defender
     * @param {import('../game/Board.js').Board} board - For freeze effects on tiles
     */
    applyEffects(effects, attacker, defender, board) {
        for (const effect of effects) {
            const target = effect.target === 'self' ? attacker : defender;

            switch (effect.type) {
                case 'burn':
                    statusEffectManager.addEffect(target, {
                        type: 'burn',
                        damage: effect.damage,
                        duration: effect.duration,
                    });
                    break;

                case 'poison':
                    statusEffectManager.addEffect(target, {
                        type: 'poison',
                        damage: effect.damage,
                        duration: effect.duration,
                        stackable: true,
                    });
                    break;

                case 'stun':
                    statusEffectManager.addEffect(target, {
                        type: 'stun',
                        duration: effect.duration,
                    });
                    break;

                case 'curse':
                    statusEffectManager.addEffect(target, {
                        type: 'curse',
                        damageReduction: effect.damageReduction,
                        duration: effect.duration,
                    });
                    break;

                case 'freeze':
                    // Freeze random tiles on the board
                    if (board && board.freezeRandom) {
                        board.freezeRandom(effect.count || 2, effect.duration || 1);
                    }
                    break;

                case 'pierce':
                    // Wind effect: handled during takeDamage calculation
                    // Already factored into damage calc
                    break;

                case 'cleanse':
                    statusEffectManager.cleanse(target);
                    break;
            }
        }
    }

    /**
     * Apply damage with wind shield-pierce consideration.
     * 
     * @param {import('./BattleEntity.js').BattleEntity} target
     * @param {number} damage
     * @param {Array} effects - To check for pierce effect
     * @returns {{ absorbed: number, hpLost: number }}
     */
    applyDamage(target, damage, effects = []) {
        const hasPierce = effects.some(e => e.type === 'pierce' && e.target === 'enemy');

        if (hasPierce && target.shield > 0) {
            // Wind: pierce 50% of shield
            const pierceAmount = Math.floor(target.shield * 0.5);
            target.shield = Math.max(0, target.shield - pierceAmount);
        }

        return target.takeDamage(damage);
    }
}

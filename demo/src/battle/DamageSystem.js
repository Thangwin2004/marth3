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
import { saveManager } from '../system/SaveManager.js';

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
     * @param {number} currentRound - Current round number of the battle
     * @returns {{ totalDamage: number, effects: Array, healAmount: number, shieldAmount: number }}
     */
    calculate(matches, attacker, defender, comboChain = 1, currentRound = 1) {
        let totalDamage = 0;
        let healAmount = 0;
        let shieldAmount = 0;
        const effects = [];

        for (const match of matches) {
            const mainTileType = match.tiles[0]?.color;
            if (!mainTileType) continue;

            let matchBaseDamage = 0;

            // Iterate over each tile in the match and sum up its customized damage
            match.tiles.forEach(tile => {
                const color = tile.color;
                const tileInfo = TILE_DAMAGE[color];
                if (!tileInfo) return;

                let tileDmg = tileInfo.baseDmg;

                // Terrain buff/debuff for this specific element
                if (this.terrain.buff && this.terrain.buff[color]) {
                    tileDmg *= (1 + this.terrain.buff[color]);
                }
                if (this.terrain.debuff && this.terrain.debuff[color]) {
                    tileDmg *= (1 - this.terrain.debuff[color]);
                }

                // Scale player damage with Hero Level, Element Mastery, and Weapons
                if (attacker.name === 'Player') {
                    const saveData = saveManager.load();
                    const heroLvl = saveData.heroLevel || 1;
                    const masteryLvl = saveData.masteryLevels ? (saveData.masteryLevels[color] || 0) : 0;
                    
                    // Add weapon slot flat damage (+15 for Lightning)
                    const equipped = saveData.equippedItems || {};
                    if (equipped.weapon === 'magic_sword' && color === 'lightning') {
                        tileDmg += 15;
                    }
                    
                    const dmgMultiplier = (1 + (heroLvl - 1) * 0.10) * (1 + masteryLvl * 0.05);
                    tileDmg *= dmgMultiplier;
                } else {
                    // Scale Boss damage based on level
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
                    
                    tileDmg *= bossScale;

                    // Enrage Timer (Cuồng Nộ) — after round 18, damage increases.
                    if (currentRound > 18) {
                        const extraRounds = currentRound - 18;
                        let enrageBonus = 0;
                        if (currentRound <= 20) {
                            enrageBonus = extraRounds * 0.25;
                        } else {
                            enrageBonus = 0.50 + (currentRound - 20) * 0.20;
                        }
                        tileDmg *= (1 + enrageBonus);
                    }
                }

                // Elemental weakness/resistance (defender-specific) for this tile's element
                if (defender.getWeaknessMultiplier) {
                    const mult = defender.getWeaknessMultiplier(color);
                    if (mult > 1.0) {
                        let critMult = 1.0;
                        if (attacker.name === 'Player') {
                            const saveData = saveManager.load();
                            const equippedSkills = saveData.equippedSkills || {};
                            const passives = equippedSkills.passives || [];
                            if (passives.includes('elem_crit')) {
                                critMult = 1.3;
                            }
                        }
                        tileDmg *= (mult * critMult);
                    } else {
                        tileDmg *= mult;
                    }
                }

                // If it is a collateral explosion match, reduce the tile damage significantly (to 30% of base damage)
                if (match.isExplosion) {
                    tileDmg *= 0.30;
                }

                matchBaseDamage += tileDmg;
            });

            // Match length multiplier (3=×1.0, 4=×1.3, 5=×1.6, 6+=×2.0)
            const lengthKey = Math.min(match.length, 6);
            let lengthMult = Config.matchMultipliers[lengthKey] || Config.matchMultipliers[6];
            
            // Explosions should NOT receive length multipliers (keep at 1.0)
            if (match.isExplosion) {
                lengthMult = 1.0;
            }
            
            let matchDamage = matchBaseDamage * lengthMult;

            totalDamage += matchDamage;

            // Apply self and enemy status effects based on the main tile color of the match
            // (We look at mainTileType so that a mixed explosion doesn't apply 10 status effects at once)
            const mainTileInfo = TILE_DAMAGE[mainTileType];
            if (mainTileInfo) {
                // --- Self effects (benefit the attacker) ---
                if (mainTileInfo.selfEffect) {
                    const se = mainTileInfo.selfEffect;
                    if (se.type === 'heal') {
                        healAmount += se.amount;
                    } else if (se.type === 'shield') {
                        shieldAmount += se.amount;
                    } else if (se.type === 'cleanse') {
                        effects.push({ target: 'self', type: 'cleanse' });
                    }
                }

                // --- Enemy effects (applied to defender) ---
                if (mainTileInfo.enemyEffect) {
                    const ee = mainTileInfo.enemyEffect;
                    if (ee.chance !== undefined) {
                        if (Math.random() < ee.chance) {
                            effects.push({ target: 'enemy', ...ee });
                        }
                    } else {
                        effects.push({ target: 'enemy', ...ee });
                    }
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

        // Vampiric Fang Relic lifesteal calculation (15% of Fire/Poison damage matches)
        if (attacker.name === 'Player' && totalDamage > 0) {
            const saveData = saveManager.load();
            const equipped = saveData.equippedItems || {};
            if (equipped.relic === 'vampiric_fang') {
                let firePoisonDamage = 0;
                for (const match of matches) {
                    let matchFPDamage = 0;
                    match.tiles.forEach(tile => {
                        const color = tile.color;
                        if (color === 'fire' || color === 'poison-death') {
                            const tileInfo = TILE_DAMAGE[color];
                            if (tileInfo) {
                                let tDmg = tileInfo.baseDmg;

                                // Terrain
                                if (this.terrain.buff && this.terrain.buff[color]) tDmg *= (1 + this.terrain.buff[color]);
                                if (this.terrain.debuff && this.terrain.debuff[color]) tDmg *= (1 - this.terrain.debuff[color]);

                                // Mastery & Level
                                const heroLvl = saveData.heroLevel || 1;
                                const masteryLvl = saveData.masteryLevels ? (saveData.masteryLevels[color] || 0) : 0;
                                tDmg *= (1 + (heroLvl - 1) * 0.10) * (1 + masteryLvl * 0.05);

                                // Weakness
                                if (defender.getWeaknessMultiplier) {
                                    tDmg *= defender.getWeaknessMultiplier(color);
                                }
                                matchFPDamage += tDmg;
                            }
                        }
                    });
                    
                    const lengthKey = Math.min(match.length, 6);
                    const lengthMult = Config.matchMultipliers[lengthKey] || Config.matchMultipliers[6];
                    firePoisonDamage += matchFPDamage * lengthMult;
                }

                // Factoring in combo and curse
                firePoisonDamage *= comboMult;
                if (statusEffectManager.hasEffect(attacker, 'curse')) {
                    const curse = statusEffectManager.getEffect(attacker, 'curse');
                    firePoisonDamage *= (1 - (curse.damageReduction || 0.3));
                }

                if (firePoisonDamage > 0) {
                    const lifesteal = Math.floor(firePoisonDamage * 0.15);
                    if (lifesteal > 0) {
                        healAmount += lifesteal;
                    }
                }
            }
        }

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

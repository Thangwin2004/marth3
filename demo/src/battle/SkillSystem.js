/**
 * ===== src/battle/SkillSystem.js =====
 * 
 * Manages player skill execution during battle.
 * Skills are unlocked by defeating bosses and consume a turn when used.
 */

import { SKILLS } from '../data/SkillData.js';

export class SkillSystem {
    /**
     * @param {import('./Player.js').Player} player
     */
    constructor(player) {
        this.player = player;
    }

    /**
     * Get the definition of a specific skill.
     * @param {string} skillId
     * @returns {object|undefined}
     */
    getSkill(skillId) {
        return SKILLS[skillId];
    }

    /**
     * Get available skill definitions for the player.
     * @returns {Array<object>} Skill configs with cooldown states
     */
    getAvailableSkills() {
        const states = this.player.getSkillStates();
        return states.map(s => ({
            ...SKILLS[s.id],
            ...s,
        }));
    }

    /**
     * Check if a specific skill can be used right now.
     * @param {string} skillId
     * @returns {boolean}
     */
    canUse(skillId) {
        return this.player.canUseSkill(skillId);
    }

    /**
     * Execute a player skill.
     * 
     * @param {string} skillId
     * @param {import('../game/Board.js').Board} board
     * @param {object} target - Target info (row/col for tile skills, col for column, etc.)
     * @param {import('./BattleEntity.js').BattleEntity} defender - Boss entity
     * @returns {{ success: boolean, endsTurn: boolean, result: object }}
     */
    execute(skillId, board, target, defender) {
        const skill = SKILLS[skillId];
        if (!skill) return { success: false, endsTurn: false, result: null };
        if (!this.canUse(skillId)) return { success: false, endsTurn: false, result: null };

        const result = {};

        switch (skillId) {
            case 'fireball': {
                // Deal 15 direct damage to the boss
                if (target && target.boss) {
                    result.damage = 15;
                    defender.takeDamage(15);
                    result.type = 'damage';
                } else {
                    return { success: false, endsTurn: false, result: null };
                }
                break;
            }

            case 'heal': {
                const healed = this.player.heal(25);
                result.type = 'heal';
                result.amount = healed;
                break;
            }

            case 'shuffle': {
                board.shuffleAll();
                result.type = 'board';
                break;
            }

            case 'barrier': {
                this.player.addShield(30);
                result.type = 'shield';
                result.amount = 30;
                break;
            }

            case 'lightning': {
                // Deal 45 direct damage to the boss
                if (target && target.boss) {
                    result.damage = 45;
                    defender.takeDamage(45);
                    result.type = 'damage';
                } else {
                    return { success: false, endsTurn: false, result: null };
                }
                break;
            }

            case 'purify': {
                const purified = board.purifyAll();
                result.type = 'board';
                result.purifiedCount = purified;
                break;
            }

            case 'bomb': {
                // Deal 72 direct damage to the boss
                if (target && target.boss) {
                    result.damage = 72;
                    defender.takeDamage(72);
                    result.type = 'damage';
                } else {
                    return { success: false, endsTurn: false, result: null };
                }
                break;
            }

            case 'rainbow': {
                board.rainbowTransform(5);
                result.type = 'board';
                break;
            }

            case 'extraTurn': {
                result.type = 'extraTurn';
                // Handled by BattleScene — skip switchTurn
                this.player.useSkill(skillId, skill.cooldown);
                return { success: true, endsTurn: false, result };
            }

            case 'meteor_shower': {
                if (target && target.boss) {
                    let fireTilesDestroyed = 0;
                    if (board && board.destroyAllOfColor) {
                        const destroyed = board.destroyAllOfColor('fire');
                        fireTilesDestroyed = destroyed.length;
                    }
                    const totalDamage = fireTilesDestroyed * 12; // 12 damage per fire tile
                    result.damage = totalDamage;
                    defender.takeDamage(totalDamage);
                    result.type = 'damage';
                    result.fireTilesDestroyed = fireTilesDestroyed;
                } else {
                    return { success: false, endsTurn: false, result: null };
                }
                break;
            }

            case 'quartz_fortress': {
                this.player.addShield(40);
                result.type = 'shield';
                result.amount = 40;
                this.player.quartzImmunityTurns = 3; // Immune for 2 player turns (expires at start of player turn 3)
                break;
            }
        }

        // Set cooldown
        this.player.useSkill(skillId, skill.cooldown);

        return { success: true, endsTurn: true, result };
    }
}

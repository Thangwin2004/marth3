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
                // Destroy 1 tile + deal 15 damage
                if (target && target.row !== undefined && target.col !== undefined) {
                    const field = board.getField(target.row, target.col);
                    if (field && field.tile && !field.tile.isStone && !field.tile.isVoid) {
                        field.tile.remove();
                        field.tile = null;
                        result.damage = 15;
                        defender.takeDamage(15);
                        result.type = 'damage';
                        result.destroyedTiles = [{ row: target.row, col: target.col }];
                    }
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
                // Destroy 1 column + deal 5 damage per tile
                if (target && target.col !== undefined) {
                    const destroyed = board.destroyColumn(target.col);
                    const damage = destroyed * 5;
                    defender.takeDamage(damage);
                    result.type = 'damage';
                    result.damage = damage;
                    result.destroyedCount = destroyed;
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
                // Destroy 3×3 area + deal 8 damage per tile
                if (target && target.row !== undefined && target.col !== undefined) {
                    const destroyed = board.destroyArea(target.row, target.col, 3);
                    const damage = destroyed * 8;
                    defender.takeDamage(damage);
                    result.type = 'damage';
                    result.damage = damage;
                    result.destroyedCount = destroyed;
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
        }

        // Set cooldown
        this.player.useSkill(skillId, skill.cooldown);

        return { success: true, endsTurn: true, result };
    }
}

/**
 * ===== src/battle/BossSkillSystem.js =====
 * 
 * Boss skills that manipulate the board — the core difficulty mechanic.
 * Boss uses a skill every N turns (skillInterval) BEFORE swapping tiles.
 * Skills destroy, corrupt, freeze, or alter tiles on the shared board.
 */

export class BossSkillSystem {
    /**
     * @param {import('./Boss.js').Boss} boss
     * @param {import('../game/Board.js').Board} board
     */
    constructor(boss, board) {
        this.boss = boss;
        this.board = board;
    }

    /**
     * Check if boss should use a skill this turn.
     * @returns {boolean}
     */
    shouldUseSkill() {
        return this.boss.shouldUseSkill();
    }

    /**
     * Execute a boss skill on the board.
     * @returns {{ skillId: string, description: string, affectedTiles: Array } | null}
     */
    executeSkill() {
        const skillId = this.boss.getRandomSkill();
        if (!skillId) return null;

        const result = { skillId, description: '', affectedTiles: [] };

        switch (skillId) {
            case 'freezeTiles': {
                const count = this.boss.level >= 7 ? 4 : 3;
                const duration = this.boss.level >= 7 ? 3 : 2;
                result.affectedTiles = this.board.freezeRandom(count, duration);
                result.description = `Freezes ${count} tiles for ${duration} turns!`;
                break;
            }

            case 'destroyRow': {
                const row = Math.floor(Math.random() * this.board.rows);
                result.affectedTiles = this.board.destroyRow(row);
                result.description = `Destroys row ${row + 1}!`;
                break;
            }

            case 'destroyCol': {
                const col = Math.floor(Math.random() * this.board.cols);
                result.affectedTiles = this.board.destroyColumn(col);
                result.description = `Destroys column ${col + 1}!`;
                break;
            }

            case 'corruptTiles': {
                const count = this.boss.level >= 8 ? 5 : 3;
                result.affectedTiles = this.board.corruptRandom(count);
                result.description = `Corrupts ${count} tiles! (0 damage when matched)`;
                break;
            }

            case 'stoneBlock': {
                const count = this.boss.level >= 8 ? 4 : 2;
                result.affectedTiles = this.board.addStones(count);
                result.description = `Places ${count} stone blocks!`;
                break;
            }

            case 'shuffleBoard': {
                this.board.shuffleAll();
                result.description = 'Shuffles the entire board!';
                break;
            }

            case 'poisonTiles': {
                const count = this.boss.level >= 9 ? 5 : 3;
                result.affectedTiles = this.board.poisonRandom(count);
                result.description = `Poisons ${count} tiles! (matching hurts you)`;
                break;
            }

            case 'cloneTiles': {
                const row = Math.floor(Math.random() * this.board.rows);
                result.affectedTiles = this.board.cloneRow(row);
                result.description = `Clones row ${row + 1} to same color!`;
                break;
            }

            case 'voidTiles': {
                const count = this.boss.level >= 10 ? 3 : 2;
                result.affectedTiles = this.board.addVoids(count);
                result.description = `Creates ${count} void tiles!`;
                break;
            }

            default:
                return null;
        }

        return result;
    }
}

/**
 * ===== src/battle/EnvironmentSystem.js =====
 * 
 * Terrain hazard events that affect the board every N turns.
 * Each terrain has a unique environmental event.
 * Events are warned 1 turn before they trigger.
 */

export class EnvironmentSystem {
    /**
     * @param {object} terrainConfig - Terrain config from LevelData
     * @param {import('../game/Board.js').Board} board
     */
    constructor(terrainConfig, board) {
        this.terrain = terrainConfig;
        this.board = board;
        this.turnCounter = 0;
        this.event = terrainConfig.event;
        this.warning = false; // True 1 turn before event triggers
    }

    /**
     * Called at the start of each full round (after both player and boss turn).
     * @returns {{ warning: string|null, triggered: string|null, result: object|null }}
     */
    tick() {
        if (!this.event) return { warning: null, triggered: null, result: null };

        this.turnCounter++;

        const turnsUntilEvent = this.event.interval - (this.turnCounter % this.event.interval);

        // Show warning 1 turn before
        if (turnsUntilEvent === 1) {
            this.warning = true;
            return {
                warning: `⚠️ ${this.event.name} incoming!`,
                triggered: null,
                result: null,
            };
        }

        // Trigger event
        if (this.turnCounter % this.event.interval === 0) {
            this.warning = false;
            const result = this.triggerEvent();
            return {
                warning: null,
                triggered: this.event.name,
                result,
            };
        }

        this.warning = false;
        return { warning: null, triggered: null, result: null };
    }

    /**
     * Execute the terrain's environmental event.
     * @returns {object} Result info for animations
     */
    triggerEvent() {
        const eventName = this.event.name;
        const result = { eventName, affectedTiles: [], damage: 0 };

        switch (eventName) {
            case 'Wind Shift': {
                // Shift 1 random row right by 1
                const row = Math.floor(Math.random() * this.board.rows);
                this.board.shiftRow(row, 1);
                result.description = `Wind shifts row ${row + 1}!`;
                break;
            }

            case 'Lava Drip': {
                // Destroy 2 random tiles
                const tiles = this.getRandomNormalTiles(2);
                tiles.forEach(({ row, col }) => {
                    const field = this.board.getField(row, col);
                    if (field && field.tile) {
                        field.tile.remove();
                        field.tile = null;
                    }
                });
                result.affectedTiles = tiles;
                result.description = 'Lava destroys 2 tiles!';
                break;
            }

            case 'Blizzard': {
                // Freeze 3 random tiles for 2 turns
                result.affectedTiles = this.board.freezeRandom(3, 2);
                result.description = 'Blizzard freezes 3 tiles!';
                break;
            }

            case 'Lightning Strike': {
                // Destroy 1 tile + 5 damage to both
                const tiles = this.getRandomNormalTiles(1);
                if (tiles.length > 0) {
                    const { row, col } = tiles[0];
                    const field = this.board.getField(row, col);
                    if (field && field.tile) {
                        field.tile.remove();
                        field.tile = null;
                    }
                }
                result.affectedTiles = tiles;
                result.damage = 5; // Applied to both player AND boss
                result.damageTarget = 'both';
                result.description = 'Lightning strikes! 5 damage to both!';
                break;
            }

            case 'Tidal Wave': {
                // Shuffle 1 random row
                const row = Math.floor(Math.random() * this.board.rows);
                this.board.shuffleRow(row);
                result.description = `Wave shuffles row ${row + 1}!`;
                break;
            }

            case 'Ghost Haunt': {
                // Corrupt 3 random tiles
                result.affectedTiles = this.board.corruptRandom(3);
                result.description = 'Ghosts corrupt 3 tiles!';
                break;
            }

            case 'Eruption': {
                // Destroy bottom row + 10 damage to both
                const bottomRow = this.board.rows - 1;
                result.affectedTiles = this.board.destroyRow(bottomRow);
                result.damage = 10;
                result.damageTarget = 'both';
                result.description = 'Eruption! Bottom row destroyed! 10 damage to both!';
                break;
            }

            case 'Darkness': {
                // Hide 4 random tiles (visual only — they show "?")
                const tiles = this.getRandomNormalTiles(4);
                tiles.forEach(({ row, col }) => {
                    const field = this.board.getField(row, col);
                    if (field && field.tile) {
                        field.tile.hidden = true;
                        field.tile.hiddenDuration = 2;
                    }
                });
                result.affectedTiles = tiles;
                result.description = 'Darkness hides 4 tiles!';
                break;
            }

            case 'Tornado': {
                // Rotate a random 3×3 area 90 degrees
                const row = Math.floor(Math.random() * (this.board.rows - 2));
                const col = Math.floor(Math.random() * (this.board.cols - 2));
                this.board.rotateArea(row, col, 3);
                result.description = 'Tornado rotates tiles!';
                break;
            }

            case 'Chaos': {
                // Random event from all above (excluding Chaos itself)
                const allEvents = [
                    'Wind Shift', 'Lava Drip', 'Blizzard', 'Lightning Strike',
                    'Tidal Wave', 'Ghost Haunt', 'Eruption', 'Darkness', 'Tornado',
                ];
                const randomEvent = allEvents[Math.floor(Math.random() * allEvents.length)];
                // Temporarily set event name and recurse
                const savedName = this.event.name;
                this.event.name = randomEvent;
                const chaosResult = this.triggerEvent();
                this.event.name = savedName;
                return { ...chaosResult, description: `Chaos! ${chaosResult.description}` };
            }
        }

        return result;
    }

    /**
     * Get N random normal (non-frozen, non-stone, non-void) tile positions.
     * @param {number} count
     * @returns {Array<{ row: number, col: number }>}
     */
    getRandomNormalTiles(count) {
        const candidates = [];
        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                const field = this.board.getField(row, col);
                if (field && field.tile && !field.tile.frozen && !field.tile.isStone && !field.tile.isVoid) {
                    candidates.push({ row, col });
                }
            }
        }

        // Shuffle and take first N
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }

        return candidates.slice(0, count);
    }

    /**
     * Get turns until next environment event.
     * @returns {number}
     */
    getTurnsUntilEvent() {
        if (!this.event) return Infinity;
        return this.event.interval - (this.turnCounter % this.event.interval);
    }
}

/**
 * ===== src/battle/BossAI.js =====
 * 
 * AI for Boss to find the best tile swap on the shared board.
 * Difficulty scales by level — higher levels = smarter choices.
 */

import { TILE_DAMAGE } from '../data/LevelData.js';

export class BossAI {
    /**
     * @param {number} optimalChance - Probability (0-1) of choosing the optimal swap
     */
    constructor(optimalChance = 0.3) {
        this.optimalChance = optimalChance;
    }

    /**
     * Find a swap for the boss to execute.
     * 
     * @param {import('../game/Board.js').Board} board
     * @param {import('../game/CombinationManager.js').CombinationManager} combinationManager
     * @param {object} terrain - Terrain config for damage estimation
     * @returns {{ tile1: object, tile2: object, score: number } | null}
     */
    findBestSwap(board, combinationManager, terrain = null) {
        const validSwaps = this.getAllValidSwaps(board, combinationManager);

        if (validSwaps.length === 0) return null;

        // Score each swap
        const scored = validSwaps.map(swap => ({
            ...swap,
            score: this.estimateScore(swap.matches, terrain),
        }));

        // Sort by score descending
        scored.sort((a, b) => b.score - a.score);

        // Choose based on difficulty
        if (Math.random() < this.optimalChance) {
            // Pick the best swap
            return scored[0];
        } else {
            // Pick a random valid swap (weighted towards better ones)
            const topHalf = scored.slice(0, Math.max(1, Math.ceil(scored.length / 2)));
            return topHalf[Math.floor(Math.random() * topHalf.length)];
        }
    }

    /**
     * Find all valid swaps on the board (swaps that produce at least one match).
     * 
     * @param {import('../game/Board.js').Board} board
     * @param {import('../game/CombinationManager.js').CombinationManager} combinationManager
     * @returns {Array<{ tile1: object, tile2: object, matches: Array }>}
     */
    getAllValidSwaps(board, combinationManager) {
        const validSwaps = [];
        const rows = board.rows;
        const cols = board.cols;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const field = board.getField(row, col);
                if (!field || !field.tile) continue;

                // Check tile states — skip frozen, stone, void
                const tile = field.tile;
                if (tile.frozen || tile.isStone || tile.isVoid) continue;

                // Try swap with right neighbor
                if (col < cols - 1) {
                    const rightField = board.getField(row, col + 1);
                    if (rightField && rightField.tile && !rightField.tile.frozen && !rightField.tile.isStone && !rightField.tile.isVoid) {
                        const matches = this.trySwap(board, combinationManager, field, rightField);
                        if (matches.length > 0) {
                            validSwaps.push({
                                tile1: field.tile,
                                tile2: rightField.tile,
                                field1: field,
                                field2: rightField,
                                matches,
                            });
                        }
                    }
                }

                // Try swap with bottom neighbor
                if (row < rows - 1) {
                    const bottomField = board.getField(row + 1, col);
                    if (bottomField && bottomField.tile && !bottomField.tile.frozen && !bottomField.tile.isStone && !bottomField.tile.isVoid) {
                        const matches = this.trySwap(board, combinationManager, field, bottomField);
                        if (matches.length > 0) {
                            validSwaps.push({
                                tile1: field.tile,
                                tile2: bottomField.tile,
                                field1: field,
                                field2: bottomField,
                                matches,
                            });
                        }
                    }
                }
            }
        }

        return validSwaps;
    }

    /**
     * Simulate a swap and check for matches without modifying the board.
     * 
     * @param {import('../game/Board.js').Board} board
     * @param {import('../game/CombinationManager.js').CombinationManager} combinationManager
     * @param {object} field1
     * @param {object} field2
     * @returns {Array} matches found after simulated swap
     */
    trySwap(board, combinationManager, field1, field2) {
        // Temporarily swap tile references
        const tile1 = field1.tile;
        const tile2 = field2.tile;

        field1.tile = tile2;
        field2.tile = tile1;
        tile1.field = field2;
        tile2.field = field1;

        // Check for matches in the affected region
        const { dirtyRows, dirtyCols } = combinationManager.getDirtyRegionAfterSwap(tile1, tile2);
        const matches = combinationManager.getMatchesInRegion(dirtyRows, dirtyCols);

        // Undo swap
        field1.tile = tile1;
        field2.tile = tile2;
        tile1.field = field1;
        tile2.field = field2;

        return matches;
    }

    /**
     * Estimate the score/value of a set of matches for AI decision-making.
     * Higher score = more attractive swap for the boss.
     * 
     * @param {Array} matches
     * @param {object} terrain
     * @returns {number}
     */
    estimateScore(matches, terrain) {
        let score = 0;

        for (const match of matches) {
            const tileType = match.tiles[0]?.color;
            if (!tileType) continue;

            const tileInfo = TILE_DAMAGE[tileType];
            const baseDmg = tileInfo ? tileInfo.baseDmg : 10;

            // Base score from damage
            let matchScore = baseDmg * match.tiles.length;

            // Length bonus
            if (match.length >= 5) matchScore *= 2.5;
            else if (match.length >= 4) matchScore *= 1.5;

            // Terrain buff bonus
            if (terrain && terrain.buff && terrain.buff[tileType]) {
                matchScore *= (1 + terrain.buff[tileType]);
            }

            // Prefer damage tiles over heal tiles (boss wants to hurt player)
            if (tileInfo && tileInfo.enemyEffect) {
                matchScore *= 1.2; // Bonus for tiles with enemy effects
            }
            if (tileInfo && tileInfo.selfEffect && tileInfo.selfEffect.type === 'heal') {
                // Boss also values healing when low HP
                matchScore *= 1.1;
            }

            score += matchScore;
        }

        return score;
    }
}

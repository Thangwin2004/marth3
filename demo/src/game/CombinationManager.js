/**
 * ===== src/game/CombinationManager.js =====
 * 
 * Quản lý phát hiện combo — THUẬT TOÁN LINE SCAN + DIRTY REGION
 * 
 * === SO SÁNH VỚI PHIÊN BẢN CŨ ===
 * 
 * PHIÊN BẢN CŨ (Brute-Force Per-Cell):
 *   - Duyệt TỪNG Ô trên board (64 ô cho 8×8)
 *   - Với mỗi ô, áp 2 rules (ngang + dọc) với offset cố định
 *   - Chỉ detect đúng 3 tiles, không phát hiện match-4, match-5
 *   - Combo bị trùng lặp (4 tile liên tiếp → 2 combo chồng nhau)
 *   - Luôn quét TOÀN BỘ board, kể cả vùng không thay đổi
 * 
 * PHIÊN BẢN MỚI (Line Scan + Dirty Region):
 *   - Quét theo HÀNG và CỘT, đếm chuỗi liên tiếp (Run-Length Encoding)
 *   - Tự nhiên detect match-3, match-4, match-5, match-N
 *   - Không trùng lặp nhờ dùng Set
 *   - Dirty Region: chỉ quét hàng/cột bị ảnh hưởng sau swap/cascade
 * 
 * === THUẬT TOÁN LINE SCAN ===
 * 
 * Ý tưởng: Quét từng hàng (hoặc cột) từ trái → phải, đếm số tile
 * liên tiếp cùng màu. Khi gặp tile khác màu hoặc hết hàng:
 *   - Nếu run ≥ 3 → đánh dấu tất cả tiles trong run là matched
 *   - Reset run, bắt đầu đếm mới
 * 
 * Ví dụ quét hàng: 🔵 🔵 🔵 🔵 🔴 🟢 🟢 🟢
 *   Run 1: 4 × 🔵 → match-4! (có thể tạo special tile)
 *   Run 2: 1 × 🔴 → skip
 *   Run 3: 3 × 🟢 → match-3!
 * 
 * === DIRTY REGION ===
 * 
 * Thay vì quét toàn bộ board, chỉ quét các hàng/cột bị ảnh hưởng:
 *   - Sau swap: chỉ quét hàng + cột của 2 tile bị swap
 *   - Sau cascade: chỉ quét các cột có tile rơi xuống
 * 
 * Board 12×12: Full scan = 288 checks, Dirty = ~48 checks → nhanh ~6x
 * 
 * === BOSS BATTLE ===
 * 
 * Special tile handling for boss battle states:
 *   - isVoid fields are skipped (permanent empty spaces)
 *   - isStone tiles are skipped (cannot be matched)
 *   - Stone tiles adjacent to matches are destroyed
 */

import { App } from '../system/App.js';

export class CombinationManager {
    /**
     * @param {Board} board - Tham chiếu đến bảng game
     */
    constructor(board) {
        this.board = board;
    }

    // ================================================================
    //  PUBLIC API
    // ================================================================

    /**
     * Tìm TẤT CẢ combo trên TOÀN BỘ board
     * Dùng khi: khởi tạo board (removeStartMatches), hoặc full scan
     * 
     * @returns {Array<{tiles: Array<Tile>, length: number}>}
     *   Mảng các combo, mỗi combo có:
     *   - tiles: mảng các Tile trong combo
     *   - length: số tile trong combo (3, 4, 5, ...)
     */
    getMatches() {
        const allRows = [];
        const allCols = [];
        for (let i = 0; i < this.board.rows; i++) allRows.push(i);
        for (let i = 0; i < this.board.cols; i++) allCols.push(i);

        return this.getMatchesInRegion(allRows, allCols);
    }

    /**
     * Tìm combo CHỈ TRONG VÙNG bị ảnh hưởng (Dirty Region)
     * Dùng khi: sau swap hoặc sau cascade
     * 
     * @param {Array<number>} dirtyRows - Các hàng cần quét
     * @param {Array<number>} dirtyCols - Các cột cần quét
     * @returns {Array<{tiles: Array<Tile>, length: number}>}
     * 
     * === VÍ DỤ ===
     * Sau swap tile [3,2] và [3,3]:
     *   dirtyRows = [3]      → quét hàng 3
     *   dirtyCols = [2, 3]   → quét cột 2 và cột 3
     *   Tổng: 1 hàng + 2 cột = ~36 checks (thay vì 288 cho board 12×12)
     */
    getMatchesInRegion(dirtyRows, dirtyCols) {
        // Set lưu ID của tile đã matched → tránh trùng lặp
        const matchedTileIds = new Set();
        // Mảng kết quả: mỗi phần tử là 1 combo {tiles, length}
        const result = [];

        // === QUÉT NGANG: từng dirty row ===
        dirtyRows.forEach(row => {
            const combos = this.scanRow(row);
            combos.forEach(combo => {
                result.push(combo);
                combo.tiles.forEach(tile => matchedTileIds.add(tile));
            });
        });

        // === QUÉT DỌC: từng dirty col ===
        dirtyCols.forEach(col => {
            const combos = this.scanCol(col);
            combos.forEach(combo => {
                // Chỉ thêm combo nếu có ít nhất 1 tile chưa matched
                // (tránh đếm trùng ở giao điểm hàng-cột)
                const hasNewTile = combo.tiles.some(t => !matchedTileIds.has(t));
                if (hasNewTile) {
                    result.push(combo);
                    combo.tiles.forEach(tile => matchedTileIds.add(tile));
                }
            });
        });

        // Combine intersections to form T-shape/L-shape matches!
        return this.combineIntersections(result);
    }

    combineIntersections(combos) {
        const combosByColor = {};
        combos.forEach(combo => {
            if (combo.tiles.length === 0) return;
            const color = combo.tiles[0].color;
            if (!combosByColor[color]) combosByColor[color] = [];
            combosByColor[color].push(combo);
        });

        const combined = [];
        
        for (const color in combosByColor) {
            const colorCombos = combosByColor[color];
            
            const horizontals = [];
            const verticals = [];
            
            colorCombos.forEach(combo => {
                const firstTile = combo.tiles[0];
                const isHoriz = combo.tiles.every(t => t.field && t.field.row === firstTile.field.row);
                if (isHoriz) {
                    horizontals.push(combo);
                } else {
                    verticals.push(combo);
                }
            });
            
            const mergedIndices = new Set();
            
            for (let i = 0; i < horizontals.length; i++) {
                const h = horizontals[i];
                
                for (let j = 0; j < verticals.length; j++) {
                    const v = verticals[j];
                    
                    const sharedTile = h.tiles.find(t => v.tiles.includes(t));
                    if (sharedTile) {
                        const mergedTiles = [...new Set([...h.tiles, ...v.tiles])];
                        combined.push({
                            tiles: mergedTiles,
                            length: mergedTiles.length,
                            isTLMatch: true,
                            intersectionTile: sharedTile
                        });
                        mergedIndices.add(`h_${i}`);
                        mergedIndices.add(`v_${j}`);
                    }
                }
            }
            
            horizontals.forEach((h, idx) => {
                if (!mergedIndices.has(`h_${idx}`)) {
                    combined.push(h);
                }
            });
            
            verticals.forEach((v, idx) => {
                if (!mergedIndices.has(`v_${idx}`)) {
                    combined.push(v);
                }
            });
        }
        
        return combined;
    }

    /**
     * Tính dirty region sau khi swap 2 tile
     * 
     * @param {Tile} tile1 - Tile đầu tiên
     * @param {Tile} tile2 - Tile thứ hai
     * @returns {{dirtyRows: Array<number>, dirtyCols: Array<number>}}
     */
    getDirtyRegionAfterSwap(tile1, tile2) {
        const dirtyRows = [...new Set([tile1.field.row, tile2.field.row])];
        const dirtyCols = [...new Set([tile1.field.col, tile2.field.col])];
        return { dirtyRows, dirtyCols };
    }

    /**
     * Tính dirty region sau khi cascade (tiles rơi xuống)
     * 
     * @param {Array<number>} affectedCols - Các cột có tile rơi
     * @returns {{dirtyRows: Array<number>, dirtyCols: Array<number>}}
     */
    getDirtyRegionAfterCascade(affectedCols) {
        // Quét tất cả hàng (vì tile mới có thể tạo match ở bất kỳ hàng nào)
        // nhưng chỉ quét các cột bị ảnh hưởng
        const allRows = [];
        for (let i = 0; i < this.board.rows; i++) allRows.push(i);
        return { dirtyRows: allRows, dirtyCols: [...new Set(affectedCols)] };
    }

    // ================================================================
    //  BOSS BATTLE: STONE DESTRUCTION
    // ================================================================

    /**
     * Check and find stone tiles adjacent to matched tiles for destruction.
     * Stones can't be matched directly, but are destroyed when a match
     * occurs next to them.
     * 
     * @param {Array<{tiles: Array<Tile>}>} matches - Array of match results
     * @returns {Array<Field>} Fields containing stones to destroy
     */
    getStonesToDestroy(matches) {
        const stonesToDestroy = new Set();
        matches.forEach(match => {
            match.tiles.forEach(tile => {
                if (!tile.field) return;
                const { row, col } = tile.field;
                // Check 4 neighbors (up, down, left, right)
                const neighbors = [
                    { r: row - 1, c: col },
                    { r: row + 1, c: col },
                    { r: row, c: col - 1 },
                    { r: row, c: col + 1 },
                ];
                neighbors.forEach(({ r, c }) => {
                    const field = this.board.getField(r, c);
                    if (field && field.tile && field.tile.isStone) {
                        stonesToDestroy.add(field);
                    }
                });
            });
        });
        return [...stonesToDestroy];
    }

    // ================================================================
    //  PRIVATE: LINE SCAN CORE
    // ================================================================

    /**
     * Quét 1 HÀNG, tìm tất cả combo ngang
     * 
     * === THUẬT TOÁN RUN-LENGTH ===
     * 
     * Duyệt từ col=0 → col=cols, theo dõi "run" (chuỗi liên tiếp):
     *   - runStart: cột bắt đầu run hiện tại
     *   - So sánh tile hiện tại với tile trước đó
     *   - Nếu khác màu hoặc hết hàng → kết thúc run
     *   - Nếu runLength ≥ 3 → COMBO!
     * 
     * @param {number} row - Hàng cần quét
     * @returns {Array<{tiles: Array<Tile>, length: number}>}
     * 
     * === VÍ DỤ ===
     * Hàng: 🔵 🔵 🔵 🔵 🔴 🟢 🟢 🟢 🔴 🔴 🔵 🔵
     * 
     * col=0: runStart=0, color=🔵
     * col=1: 🔵==🔵 → tiếp
     * col=2: 🔵==🔵 → tiếp
     * col=3: 🔵==🔵 → tiếp
     * col=4: 🔴≠🔵 → runLength=4 ≥ 3 → MATCH-4! → runStart=4
     * col=5: 🟢≠🔴 → runLength=1 → skip → runStart=5
     * col=6: 🟢==🟢 → tiếp
     * col=7: 🟢==🟢 → tiếp
     * col=8: 🔴≠🟢 → runLength=3 ≥ 3 → MATCH-3! → runStart=8
     * ...
     */
    scanRow(row) {
        const combos = [];
        let runStart = 0;

        for (let col = 1; col <= this.board.cols; col++) {
            const current = this.getTileAt(row, col);
            const prev = this.getTileAt(row, col - 1);

            // Kết thúc run khi: hết hàng, ô trống, hoặc khác màu
            const endOfRun =
                col === this.board.cols ||
                !current ||
                !prev ||
                current.color !== prev.color;

            if (endOfRun) {
                const runLength = col - runStart;

                if (runLength >= 3 && prev) {
                    // Thu thập tất cả tiles trong run
                    const tiles = [];
                    for (let c = runStart; c < col; c++) {
                        const tile = this.getTileAt(row, c);
                        if (tile) tiles.push(tile);
                    }

                    if (tiles.length >= 3) {
                        combos.push({
                            tiles: tiles,
                            length: tiles.length,
                        });
                    }
                }

                runStart = col;
            }
        }

        return combos;
    }

    /**
     * Quét 1 CỘT, tìm tất cả combo dọc
     * (Logic tương tự scanRow, nhưng duyệt theo row thay vì col)
     * 
     * @param {number} col - Cột cần quét
     * @returns {Array<{tiles: Array<Tile>, length: number}>}
     */
    scanCol(col) {
        const combos = [];
        let runStart = 0;

        for (let row = 1; row <= this.board.rows; row++) {
            const current = this.getTileAt(row, col);
            const prev = this.getTileAt(row - 1, col);

            const endOfRun =
                row === this.board.rows ||
                !current ||
                !prev ||
                current.color !== prev.color;

            if (endOfRun) {
                const runLength = row - runStart;

                if (runLength >= 3 && prev) {
                    const tiles = [];
                    for (let r = runStart; r < row; r++) {
                        const tile = this.getTileAt(r, col);
                        if (tile) tiles.push(tile);
                    }

                    if (tiles.length >= 3) {
                        combos.push({
                            tiles: tiles,
                            length: tiles.length,
                        });
                    }
                }

                runStart = row;
            }
        }

        return combos;
    }

    /**
     * Kiểm tra xem trên bảng còn nước đi hợp lệ nào không.
     * Thử giả lập tráo đổi từng cặp ô kề cạnh (ngang và dọc)
     * xem có tạo được combo match-3 hay không.
     * 
     * @returns {boolean} True nếu còn ít nhất 1 nước đi, ngược lại False.
     */
    hasPossibleMoves() {
        for (let row = 0; row < this.board.rows; row++) {
            for (let col = 0; col < this.board.cols; col++) {
                const field = this.board.getField(row, col);
                if (!field || !field.tile || field.isVoid) continue;
                const tile = field.tile;

                // Thử đổi chỗ với ô bên phải
                if (col < this.board.cols - 1) {
                    const rightField = this.board.getField(row, col + 1);
                    if (rightField && rightField.tile && !rightField.isVoid) {
                        const rightTile = rightField.tile;

                        // Swap giả lập
                        this.board.swap(tile, rightTile);

                        const { dirtyRows, dirtyCols } = this.getDirtyRegionAfterSwap(tile, rightTile);
                        const matches = this.getMatchesInRegion(dirtyRows, dirtyCols);

                        // Swap trả lại vị trí cũ
                        this.board.swap(rightTile, tile);

                        if (matches.length > 0) {
                            return true;
                        }
                    }
                }

                // Thử đổi chỗ với ô bên dưới
                if (row < this.board.rows - 1) {
                    const bottomField = this.board.getField(row + 1, col);
                    if (bottomField && bottomField.tile && !bottomField.isVoid) {
                        const bottomTile = bottomField.tile;

                        // Swap giả lập
                        this.board.swap(tile, bottomTile);

                        const { dirtyRows, dirtyCols } = this.getDirtyRegionAfterSwap(tile, bottomTile);
                        const matches = this.getMatchesInRegion(dirtyRows, dirtyCols);

                        // Swap trả lại vị trí cũ
                        this.board.swap(bottomTile, tile);

                        if (matches.length > 0) {
                            return true;
                        }
                    }
                }
            }
        }
        return false;
    }

    /**
     * Helper: Lấy tile tại vị trí (row, col)
     * Trả về null nếu ngoài board, ô trống, void field, hoặc stone tile
     * 
     * Updated for boss battle:
     *   - Void fields return null (permanent empty spaces)
     *   - Stone tiles return null (cannot be matched)
     */
    getTileAt(row, col) {
        const field = this.board.getField(row, col);
        if (!field || field.isVoid) return null;
        const tile = field.tile;
        if (!tile) return null;
        if (tile.isStone) return null;  // Stone tiles can't match
        return tile;
    }
}

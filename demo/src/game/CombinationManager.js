/**
 * ===== src/game/CombinationManager.js =====
 * 
 * Quản lý phát hiện combo (3+ tiles cùng màu liên tiếp)
 * 
 * === THUẬT TOÁN ===
 * 
 * Duyệt qua TỪNG ô trên bảng, với mỗi ô:
 *   - Áp dụng từng rule (ngang, dọc)
 *   - So sánh tile hiện tại với 2 tile tiếp theo theo rule
 *   - Nếu cả 3 cùng màu → thêm vào danh sách matches
 * 
 * === VÍ DỤ ===
 * 
 * Board:
 *   🔴 🔵 🔴 🟢
 *   🔵 🔵 🔵 🔴   ← 3 xanh ngang ở row=1, col=0,1,2
 *   🟢 🔴 🔵 🔵
 * 
 * Khi kiểm tra ô [1,0] (🔵) với rule ngang [{col:1,row:0}, {col:2,row:0}]:
 *   - Ô [1,0] = 🔵
 *   - Ô [1,1] = 🔵 (col+1) → cùng màu ✅
 *   - Ô [1,2] = 🔵 (col+2) → cùng màu ✅
 *   → matches = [🔵, 🔵, 🔵] ← COMBO!
 */

import { App } from '../system/App.js';

export class CombinationManager {
    /**
     * @param {Board} board - Tham chiếu đến bảng game
     */
    constructor(board) {
        this.board = board;
    }

    /**
     * Tìm TẤT CẢ combo trên bảng hiện tại
     * 
     * @returns {Array<Array<Tile>>} Mảng các combo, mỗi combo là mảng tiles
     *   Ví dụ: [[tile1, tile2, tile3], [tile4, tile5, tile6]]
     *   → 2 combo, mỗi combo 3 tiles
     */
    getMatches() {
        let result = [];

        // Duyệt qua từng ô trên bảng
        this.board.fields.forEach(checkingField => {
            // Bỏ qua ô không có tile (đã bị xóa)
            if (!checkingField.tile) return;

            // Kiểm tra từng rule (ngang & dọc)
            App.config.combinationRules.forEach(rule => {
                // Bắt đầu với tile hiện tại
                let matches = [checkingField.tile];

                // So sánh với các tile theo offset trong rule
                rule.forEach(position => {
                    const row = checkingField.row + position.row;
                    const col = checkingField.col + position.col;
                    const comparingField = this.board.getField(row, col);

                    // Kiểm tra: ô tồn tại, có tile, và cùng màu
                    if (
                        comparingField &&
                        comparingField.tile &&
                        comparingField.tile.color === checkingField.tile.color
                    ) {
                        matches.push(comparingField.tile);
                    }
                });

                // Nếu tìm đủ tiles theo rule → đó là combo!
                // rule.length = 2 (2 offset) + 1 (tile gốc) = 3 tiles
                if (matches.length === rule.length + 1) {
                    result.push(matches);
                }
            });
        });

        return result;
    }
}

/**
 * ===== src/game/Field.js =====
 * 
 * Lớp Field (Ô vuông trên bảng game)
 * 
 * === GIẢI THÍCH CHI TIẾT ===
 * 
 * Trong game Match-3, bảng game là lưới 8x8 = 64 ô vuông.
 * Mỗi ô vuông gọi là 1 "Field" (trường/ô).
 * 
 * Field có 2 nhiệm vụ:
 * 1. HIỂN THỊ: Render hình nền ô vuông (field.svg)
 * 2. DỮ LIỆU: Lưu vị trí (row, col) và tile đang nằm trên ô đó
 * 
 * === MÔ HÌNH DỮ LIỆU ===
 * 
 * Mỗi Field biết:
 * - Nó ở hàng mấy, cột mấy (row, col) → vị trí logic
 * - Pixel x, y trên canvas (position) → vị trí vật lý
 * - Tile nào đang đặt trên nó (tile) → tham chiếu 2 chiều
 * 
 * === THAM CHIẾU 2 CHIỀU ===
 * 
 *   field.tile ──── tile   (Field biết Tile của nó)
 *   field ────── tile.field (Tile biết Field của nó)
 * 
 * Khi swap 2 tiles, ta chỉ cần đổi các tham chiếu này, 
 * KHÔNG cần thay đổi vị trí vật lý của Field.
 */

import { App } from '../system/App.js';

export class Field {
    /**
     * Tạo 1 ô vuông tại vị trí (row, col) trên bảng
     * 
     * @param {number} row - Hàng (0 = hàng đầu tiên trên cùng)
     * @param {number} col - Cột (0 = cột đầu tiên bên trái)
     * 
     * === VÍ DỤ ===
     * new Field(0, 0) → ô góc trên trái
     * new Field(7, 7) → ô góc dưới phải (board 8x8)
     * new Field(2, 5) → hàng 3, cột 6 (0-indexed)
     */
    constructor(row, col) {
        // === DỮ LIỆU VỊ TRÍ ===
        this.row = row;  // Hàng (index từ 0)
        this.col = col;  // Cột (index từ 0)

        // === THAM CHIẾU ĐẾN TILE ===
        this.tile = null;  // Ban đầu ô trống, chưa có tile
        
        // === SPRITE NỀN Ô ===
        // App.sprite('field') tạo 1 Sprite từ texture 'field' đã load
        this.sprite = App.sprite('field');

        // anchor.set(0.5) → điểm neo ở TÂM sprite (thay vì góc trên-trái)
        // Giúp việc tính vị trí và xoay sprite dễ hơn
        this.sprite.anchor.set(0.5);

        // Đặt sprite ở vị trí pixel tính toán từ (row, col)
        this.sprite.x = this.position.x;
        this.sprite.y = this.position.y;

        // === SPRITE "ĐƯỢC CHỌN" (viền vàng) ===
        // Khi player click vào tile trên ô này, ta hiện viền vàng
        this.selected = App.sprite('field-selected');
        this.selected.anchor.set(0.5);
        this.selected.x = this.position.x;
        this.selected.y = this.position.y;
        this.selected.visible = false;  // Ẩn mặc định, chỉ hiện khi được chọn
    }

    /**
     * Getter tính vị trí PIXEL trên canvas
     * 
     * === CÔNG THỨC ===
     *   x = col * tileSize    (cột × kích thước ô)
     *   y = row * tileSize    (hàng × kích thước ô)
     * 
     * === VÍ DỤ (tileSize = 70px) ===
     *   Field(0,0) → { x: 0,   y: 0   }  ← góc trên-trái
     *   Field(0,3) → { x: 210, y: 0   }  ← hàng 1, cột 4
     *   Field(2,5) → { x: 350, y: 140 }  ← hàng 3, cột 6
     * 
     * Trục tọa độ canvas:
     *   → X tăng sang phải (col)
     *   ↓ Y tăng xuống dưới (row)
     */
    get position() {
        return {
            x: this.col * App.config.tileSize,
            y: this.row * App.config.tileSize,
        };
    }

    /**
     * Hiện viền vàng khi ô được chọn
     * Gọi khi player click vào tile trên ô này
     */
    select() {
        this.selected.visible = true;
    }

    /**
     * Ẩn viền vàng khi bỏ chọn
     * Gọi khi player chọn ô khác hoặc sau khi swap
     */
    unselect() {
        this.selected.visible = false;
    }
}

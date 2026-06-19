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
 *
 * === BOSS BATTLE ===
 *
 * Fields can be set as "void" (permanent empty spaces) by boss abilities.
 * Void fields cannot hold tiles and appear as dark holes on the board.
 * Fields can also have terrain-themed colors for different battle environments.
 */

import { App } from "../system/App.js";
import { Graphics } from "pixi.js";
import gsap from "gsap";

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
    this.row = row; // Hàng (index từ 0)
    this.col = col; // Cột (index từ 0)

    // === THAM CHIẾU ĐẾN TILE ===
    this.tile = null; // Ban đầu ô trống, chưa có tile

    // === BOSS BATTLE STATE ===
    this.isVoid = false; // Permanent empty space (boss ability)

    const tileSize = App.config.tileSize;

    // === NỀN Ô (PixiJS v8 Graphics API) ===
    this.sprite = new Graphics();
    // Main background
    this.sprite.roundRect(0, 0, tileSize, tileSize, 14);
    this.sprite.fill({ color: 0x101830, alpha: 0.92 });
    this.sprite.stroke({ color: 0xffffff, width: 3, alpha: 0.14 });

    // Ánh sáng nhẹ ở góc trên bên trái giống hiệu ứng đá quý
    this.sprite.roundRect(
      tileSize * 0.1,
      tileSize * 0.08,
      tileSize * 0.7,
      tileSize * 0.18,
      8,
    );
    this.sprite.fill({ color: 0xffffff, alpha: 0.08 });

    this.sprite.x = this.position.x;
    this.sprite.y = this.position.y;

    // === HIỂN THỊ Ô ĐƯỢC CHỌN (PixiJS v8 Graphics API) ===
    this.selected = new Graphics();
    this.selected.roundRect(0, 0, tileSize, tileSize, 14);
    this.selected.fill({ color: 0x00e5ff, alpha: 0.16 });
    this.selected.stroke({ color: 0x00e5ff, width: 3.5, alpha: 0.95 });
    this.selected.x = this.position.x;
    this.selected.y = this.position.y;
    this.selected.visible = false; // Ẩn mặc định, chỉ hiện khi được chọn
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
    this.selected.alpha = 0.5;
    gsap.killTweensOf(this.selected);
    gsap.to(this.selected, {
      alpha: 1.0,
      duration: 0.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }

  /**
   * Ẩn viền khi bỏ chọn
   * Gọi khi player chọn ô khác hoặc sau khi swap
   */
  unselect() {
    gsap.killTweensOf(this.selected);
    this.selected.visible = false;
  }

  // ================================================================
  //  BOSS BATTLE METHODS
  // ================================================================

  /**
   * Set this field as a permanent void (empty space).
   * Removes any tile on this field and redraws as a dark hole.
   * Void fields cannot hold tiles.
   */
  setVoid() {
    this.isVoid = true;
    if (this.tile) {
      this.tile.remove();
      this.tile = null;
    }
    // Redraw sprite as dark hole
    const tileSize = App.config.tileSize;
    this.sprite.clear();
    this.sprite.rect(0, 0, tileSize, tileSize);
    this.sprite.fill({ color: 0x000000, alpha: 0.8 });
    // Border
    this.sprite.stroke({ color: 0x1a1a2a, width: 1 });
  }

  /**
   * Apply terrain-themed color to this field background.
   * Used for different boss battle environments (lava, ice, poison swamp, etc.)
   *
   * @param {number} fieldColor - Hex color for the field background (e.g. 0x2a1010 for lava)
   */
  setTerrainColor(fieldColor) {
    const tileSize = App.config.tileSize;
    this.sprite.clear();
    this.sprite.rect(0, 0, tileSize, tileSize);
    this.sprite.fill({ color: fieldColor, alpha: 0.92 });
    this.sprite.stroke({ color: 0xffffff, width: 2, alpha: 0.14 });
    // Light reflection
    this.sprite.rect(
      tileSize * 0.1,
      tileSize * 0.08,
      tileSize * 0.7,
      tileSize * 0.18,
    );
    this.sprite.fill({ color: 0xffffff, alpha: 0.06 });
  }
}

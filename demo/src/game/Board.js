/**
 * ===== src/game/Board.js =====
 *
 * Lớp Board (Bảng game)
 *
 * === GIẢI THÍCH CHI TIẾT ===
 *
 * Board quản lý toàn bộ lưới game:
 * - Tạo 64 ô Field (8x8)
 * - Tạo 64 Tile ngẫu nhiên (mỗi ô 1 tile)
 * - Căn giữa board trên canvas
 *
 * === CONTAINER HIERARCHY (Cấu trúc phân cấp) ===
 *
 * PixiJS hiển thị objects theo cấu trúc cây cha-con:
 *
 *   App.stage (root)
 *     └── board.container          ← Board tạo Container riêng
 *           ├── field.sprite [0,0] ← Nền ô vuông
 *           ├── field.sprite [0,1]
 *           ├── ...
 *           ├── field.selected [0,0] ← Viền vàng (ẩn)
 *           ├── ...
 *           ├── tile.sprite [0,0]   ← Viên gạch màu
 *           ├── tile.sprite [0,1]
 *           └── ...
 *
 * Tại sao dùng Container riêng?
 * → Khi di chuyển container, TẤT CẢ children di chuyển theo
 * → Dễ căn giữa toàn bộ board chỉ bằng thay đổi container.x/y
 *
 * === SORTABLE CHILDREN ===
 * container.sortableChildren = true → sprites có zIndex cao hiện trên
 * → Khi swap, tile đang di chuyển có zIndex=2 → hiện trên tile kia
 *
 * === BOSS BATTLE EXTENSIONS ===
 *
 * New methods for boss skills, player skills, and environment events:
 * - freezeRandom, corruptRandom, poisonRandom — status effects on tiles
 * - addStones, addVoids — obstacle tiles
 * - destroyRow, destroyColumn, destroyArea — area destruction
 * - shuffleAll, shuffleRow — randomize tile colors
 * - cloneRow, rainbowTransform — color manipulation
 * - purifyAll — cleanse all negative effects
 * - shiftRow, rotateArea — positional manipulation
 * - getNormalTiles — utility to find eligible tiles
 * - tickFrozenTiles, tickHiddenTiles — per-turn status tick
 * - setInputEnabled — lock/unlock board input
 */

import { Container, Graphics } from "pixi.js";
import { Field } from "./Field.js";
import { Tile } from "./Tile.js";
import { App } from "../system/App.js";
import { Config } from "../config.js";

export class Board {
  /**
   * @param {object} [levelConfig] - Optional level configuration
   * @param {Array<string>} [customColors] - Custom session colors
   */
  constructor(levelConfig, customColors) {
    /**
     * Container: "hộp chứa" tất cả sprites của board
     *
     * Container giống như <div> trong HTML:
     * - Có thể chứa nhiều children (sprites)
     * - Có position (x, y) riêng
     * - Children được vẽ relative to container
     */
    this.container = new Container();
    this.container.sortableChildren = true; // Cho phép sort theo zIndex

    /** Mảng chứa tất cả Field objects */
    this.fields = [];

    /** Kích thước board (từ config hoặc overridden by levelConfig) */
    this.rows = levelConfig?.board?.rows || App.config.board.rows;
    this.cols = levelConfig?.board?.cols || App.config.board.cols;

    /**
     * Allowed tile types for this level.
     * Levels can restrict the number of tile types for difficulty tuning.
     */
    let allowed = Config.tileColors.slice(
      0,
      levelConfig?.tileCount || Config.tileColors.length,
    );

    // Ensure the boss's weakness tile type is included in allowed tiles
    const weakness = levelConfig?.boss?.weakness;
    if (weakness && Config.tileColors.includes(weakness)) {
      if (!allowed.includes(weakness)) {
        // Replace the last tile type in the allowed list with the weakness tile type
        // But avoid replacing the level's own element if possible
        let replaceIndex = allowed.length - 1;
        if (
          allowed[replaceIndex] === levelConfig?.element &&
          replaceIndex > 0
        ) {
          replaceIndex--;
        }
        allowed[replaceIndex] = weakness;
      }
    }

    this.allowedTiles = customColors || allowed;

    /** Whether player input (tile clicks) is currently enabled */
    this.inputEnabled = true;

    // Tạo board
    this.create();

    // Căn giữa board trên canvas
    this.adjustPosition();
  }

  // =========================================================================
  // CORE METHODS (ORIGINAL)
  // =========================================================================

  /**
   * Tạo toàn bộ board: fields + tiles
   *
   * Thứ tự quan trọng:
   * 1. createFields() trước → tạo nền ô vuông
   * 2. createTiles() sau → đặt tiles lên mỗi ô
   */
  create() {
    this.createFields();
    this.createTiles();
  }

  /**
   * Tạo tất cả Fields (8x8 = 64 ô)
   *
   * === VÒNG LẶP LỒNG ===
   * Vòng ngoài: duyệt từng hàng (row = 0 → 7)
   * Vòng trong: duyệt từng cột (col = 0 → 7)
   *
   * Row 0: [0,0] [0,1] [0,2] ... [0,7]
   * Row 1: [1,0] [1,1] [1,2] ... [1,7]
   * ...
   * Row 7: [7,0] [7,1] [7,2] ... [7,7]
   */
  createFields() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.createField(row, col);
      }
    }
  }

  /**
   * Tạo 1 Field và thêm sprites vào container
   *
   * Thêm CẢ sprite nền VÀ sprite selected (viền vàng):
   * - sprite nền: luôn hiển thị
   * - sprite selected: ẩn mặc định, hiện khi player chọn tile
   */
  createField(row, col) {
    const field = new Field(row, col);
    this.fields.push(field);

    // Thêm sprites vào container (thứ tự addChild = thứ tự vẽ)
    this.container.addChild(field.sprite); // Nền ô vuông (vẽ trước)
    this.container.addChild(field.selected); // Viền vàng (vẽ sau, trên nền)
  }

  /**
   * Tạo tiles cho TẤT CẢ fields
   */
  createTiles() {
    this.fields.forEach((field) => this.createTile(field));
  }

  /**
   * Tạo 1 Tile mới trên 1 Field
   *
   * === QUY TRÌNH ===
   * 1. Random chọn màu từ danh sách allowedTiles
   * 2. Tạo Tile object với màu đó
   * 3. Thiết lập tham chiếu 2 chiều: field ↔ tile
   * 4. Đặt tile sprite ở vị trí pixel của field
   * 5. Thêm tile sprite vào container (hiển thị)
   * 6. Bật interactivity (cho phép click)
   *
   * === eventMode (PixiJS v8) ===
   * Thay vì `sprite.interactive = true` (v7 cũ), v8 dùng:
   *   sprite.eventMode = 'static'   → object không di chuyển, nhận click/touch
   *   sprite.eventMode = 'dynamic'  → object di chuyển, nhận click/touch
   *   sprite.eventMode = 'none'     → không nhận event
   *
   * Ta dùng 'static' vì tiles chỉ di chuyển khi swap (lúc đó board bị khóa)
   *
   * === EMIT CUSTOM EVENT ===
   * container.emit('tile-touch-start', tile)
   *   → Phát sự kiện 'tile-touch-start' lên container
   *   → Game.js lắng nghe sự kiện này để xử lý logic
   *
   * Đây là pattern "Event-driven": Board KHÔNG biết logic game,
   * nó chỉ thông báo "có ai đó click tile X". Game.js quyết định làm gì.
   *
   * @param {Field} field - Ô cần đặt tile
   * @returns {Tile} Tile vừa tạo
   */
  createTile(field, customColor = null, allowSpecial = false) {
    // 1. Random màu hoặc sử dụng màu được chỉ định
    const colors = this.allowedTiles;
    const color =
      customColor || colors[Math.floor(Math.random() * colors.length)];

    // 2. Tạo Tile
    const tile = new Tile(color);

    // Roll for random special tile drop
    if (allowSpecial && !customColor) {
      const rand = Math.random();
      if (rand < 0.04) {
        const typeRand = Math.random();
        if (typeRand < 0.4) {
          tile.isRune = true;
        } else if (typeRand < 0.7) {
          tile.isDrum = true;
        } else {
          tile.isRainbow = true;
        }
      }
    }

    // 3. Tham chiếu 2 chiều
    field.tile = tile; // Field → Tile
    tile.field = field; // Tile → Field

    // 4. Đặt vị trí pixel
    tile.setPosition(field.position);

    // 5. Thêm vào container (hiển thị)
    this.container.addChild(tile.sprite);

    // 5.5 Update state overlay if special tile was rolled
    if (tile.isRune || tile.isRainbow || tile.isDrum) {
      tile.updateStateOverlay();
    }

    // 6. Bật interactivity
    tile.sprite.eventMode = "static"; // Nhận click events
    tile.sprite.cursor = "pointer"; // Con trỏ hình bàn tay

    // 7. Lắng nghe click → emit event lên container
    tile.sprite.on("pointerdown", () => {
      if (!this.inputEnabled) return; // Skip if input is disabled
      this.container.emit("tile-touch-start", tile);
    });

    return tile;
  }

  /**
   * Tìm Field theo vị trí (row, col)
   *
   * === Array.find() ===
   * Duyệt qua mảng this.fields, trả về phần tử đầu tiên thỏa điều kiện.
   * Nếu không tìm thấy → trả về undefined.
   *
   * @param {number} row - Hàng cần tìm
   * @param {number} col - Cột cần tìm
   * @returns {Field|undefined} Field tại vị trí đó, hoặc undefined
   */
  getField(row, col) {
    return this.fields.find((field) => field.row === row && field.col === col);
  }

  /**
   * Đổi chỗ 2 tiles (cập nhật DỮ LIỆU, không phải vị trí sprite)
   *
   * === GIẢI THÍCH ===
   * Khi swap 2 tiles, animation đã di chuyển sprites đến vị trí mới.
   * Nhưng DỮ LIỆU (field ↔ tile references) vẫn chưa thay đổi!
   *
   * Method này cập nhật tham chiếu 2 chiều:
   *
   * TRƯỚC SWAP:
   *   Field_A.tile → Tile_1     Field_B.tile → Tile_2
   *   Tile_1.field → Field_A    Tile_2.field → Field_B
   *
   * SAU SWAP:
   *   Field_A.tile → Tile_2     Field_B.tile → Tile_1
   *   Tile_1.field → Field_B    Tile_2.field → Field_A
   *
   * @param {Tile} tile1 - Tile thứ nhất
   * @param {Tile} tile2 - Tile thứ hai
   */
  swap(tile1, tile2) {
    const tile1Field = tile1.field;
    const tile2Field = tile2.field;

    // Đổi chéo references
    tile1Field.tile = tile2;
    tile2.field = tile1Field;

    tile2Field.tile = tile1;
    tile1.field = tile2Field;
  }

  /**
   * Căn giữa board trên canvas, offset left to leave room for characters.
   *
   * Board is centered horizontally and vertically with a slight downward
   * offset to leave space for top UI elements (HP bars, turn indicator, etc.).
   */
  adjustPosition() {
    const canvasWidth = App.app.screen.width;
    const canvasHeight = App.app.screen.height;
    const baseTileSize = Config.tileSize || 70;
    const boardWidth = this.cols * baseTileSize;
    const boardHeight = this.rows * baseTileSize;

    // Kiểm tra xem có phải màn hình điện thoại xoay ngang (chiều rộng > chiều cao và chiều cao < 500)
    const isMobileLandscape = canvasWidth > canvasHeight && canvasHeight < 500;

    let maxBoardWidth, maxBoardHeight, topOffset;

    if (isMobileLandscape) {
      // Khi xoay ngang điện thoại: đặt HUD hai bên trái/phải bảng ngọc
      // Nên bảng ngọc có tối đa chiều ngang nhỏ hơn và chiều dọc rộng hơn (không bị HUD đè ở trên)
      maxBoardWidth = canvasWidth - 360; // Dành 180px mỗi bên cho HUD
      maxBoardHeight = canvasHeight - 40; // Chỉ chừa 40px lề dọc
      topOffset = 20;
    } else {
      // Màn hình bình thường hoặc màn hình dọc: HUD nằm ở trên cùng
      maxBoardWidth = canvasWidth - 24;
      maxBoardHeight = canvasHeight - 145; // Increased board vertical space to make icons larger
      topOffset = 115; // Adjusted top offset to center the board better and avoid overlapping top elements
    }

    const scaleX = maxBoardWidth / boardWidth;
    const scaleY = maxBoardHeight / boardHeight;

    // Chọn tỷ lệ nhỏ nhất để bảng ngọc nằm trọn trong cả 2 chiều
    const scale = Math.min(1.0, scaleX, scaleY);

    // Áp dụng scale
    this.container.scale.set(scale);

    // Tính toán lại kích thước sau scale
    const scaledWidth = boardWidth * scale;
    const scaledHeight = boardHeight * scale;

    // Căn giữa bảng theo chiều ngang
    this.container.x = canvasWidth / 2 - scaledWidth / 2;

    // Căn giữa bảng theo chiều dọc trong vùng khả dụng
    this.container.y = topOffset + (maxBoardHeight - scaledHeight) / 2;
  }

  // =========================================================================
  // UTILITY METHODS
  // =========================================================================

  /**
   * Get all fields with normal (non-frozen, non-stone, non-void, non-corrupt, non-poisoned) tiles.
   *
   * Used by boss/player skill methods to find eligible targets.
   *
   * @returns {Field[]} Array of fields containing normal, interactable tiles
   */
  getNormalTiles() {
    return this.fields.filter((field) => {
      if (!field.tile) return false; // Void field — no tile
      if (field.isVoid) return false; // Void field flag
      const tile = field.tile;
      if (tile.frozen) return false; // Already frozen
      if (tile.corrupt) return false; // Already corrupt
      if (tile.isStone) return false; // Stone tile
      if (tile.poisoned) return false; // Already poisoned
      if (tile.hidden) return false; // Hidden tile
      return true;
    });
  }

  /**
   * Fisher-Yates shuffle of an array (in-place).
   * @param {any[]} array
   * @returns {any[]} The same array, shuffled
   * @private
   */
  _shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  /**
   * Helper: change a tile's color and rebuild its sprite.
   *
   * Destroys the old sprite, creates a new one with the new color,
   * sets anchor, scale, and position correctly, adds to container,
   * and re-attaches the pointerdown event.
   *
   * @param {Tile} tile - The tile to recolor
   * @param {string} newColor - The new color/alias name
   * @private
   */
  _recolorTile(tile, newColor) {
    if (!tile || !tile.sprite) return;

    const field = tile.field;
    if (!field) return;

    // Remove old sprite from container and destroy
    this.container.removeChild(tile.sprite);
    tile.sprite.destroy();

    // Assign new color
    tile.color = newColor;

    // Create new sprite
    tile.sprite = App.sprite(newColor);
    tile.sprite.anchor.set(0.5);
    tile.resizeSprite();

    // Position
    tile.setPosition(field.position);

    // Add to container
    this.container.addChild(tile.sprite);

    // Re-attach interactivity
    tile.sprite.eventMode = "static";
    tile.sprite.cursor = "pointer";
    tile.sprite.on("pointerdown", () => {
      if (!this.inputEnabled) return;
      this.container.emit("tile-touch-start", tile);
    });
  }

  // =========================================================================
  // BOSS SKILL METHODS
  // =========================================================================

  /**
   * Freeze N random normal tiles for a given duration.
   *
   * Frozen tiles cannot be swapped or matched until the freeze wears off.
   * Visual: adds a semi-transparent ice overlay on the tile.
   *
   * @param {number} count - Number of tiles to freeze
   * @param {number} duration - Number of turns the freeze lasts
   * @returns {{row: number, col: number}[]} Array of affected positions
   */
  freezeRandom(count, duration) {
    const normals = this.getNormalTiles();
    this._shuffle(normals);
    const targets = normals.slice(0, Math.min(count, normals.length));
    const affected = [];

    for (const field of targets) {
      const tile = field.tile;
      tile.frozen = true;
      tile.frozenDuration = duration;

      // Visual: add ice overlay
      if (!tile._frozenOverlay) {
        const overlay = new Graphics();
        const ts = App.config.tileSize;
        overlay.roundRect(-ts / 2, -ts / 2, ts, ts, 10);
        overlay.fill({ color: 0x88ccff, alpha: 0.4 });
        overlay.x = tile.sprite.x;
        overlay.y = tile.sprite.y;
        overlay.zIndex = 5;
        this.container.addChild(overlay);
        tile._frozenOverlay = overlay;
      }

      affected.push({ row: field.row, col: field.col });
    }

    return affected;
  }

  /**
   * Mark N random normal tiles as corrupt.
   *
   * Corrupt tiles may have altered matching behavior. Visual: purple tint overlay.
   *
   * @param {number} count - Number of tiles to corrupt
   * @returns {{row: number, col: number}[]} Array of affected positions
   */
  corruptRandom(count) {
    const normals = this.getNormalTiles();
    this._shuffle(normals);
    const targets = normals.slice(0, Math.min(count, normals.length));
    const affected = [];

    for (const field of targets) {
      const tile = field.tile;
      tile.corrupt = true;

      // Visual: purple overlay
      if (!tile._corruptOverlay) {
        const overlay = new Graphics();
        const ts = App.config.tileSize;
        overlay.roundRect(-ts / 2, -ts / 2, ts, ts, 10);
        overlay.fill({ color: 0x8800aa, alpha: 0.35 });
        overlay.x = tile.sprite.x;
        overlay.y = tile.sprite.y;
        overlay.zIndex = 5;
        this.container.addChild(overlay);
        tile._corruptOverlay = overlay;
      }

      affected.push({ row: field.row, col: field.col });
    }

    return affected;
  }

  /**
   * Replace N random normal tiles with stone tiles.
   *
   * Stone tiles cannot be swapped or matched.
   * Visual: gray rounded rectangle.
   *
   * @param {number} count - Number of stone tiles to add
   * @returns {number} Number of stones actually placed
   */
  addStones(count) {
    const normals = this.getNormalTiles();
    this._shuffle(normals);
    const targets = normals.slice(0, Math.min(count, normals.length));
    let placed = 0;

    for (const field of targets) {
      const tile = field.tile;

      // Remove old sprite
      if (tile.sprite) {
        this.container.removeChild(tile.sprite);
        tile.sprite.destroy();
      }

      // Mark as stone
      tile.isStone = true;
      tile.color = "stone";

      // Create stone visual (gray rectangle)
      const ts = App.config.tileSize;
      const stoneGraphic = new Graphics();
      stoneGraphic.roundRect(-ts / 2, -ts / 2, ts, ts, 12);
      stoneGraphic.fill({ color: 0x666666, alpha: 0.9 });
      stoneGraphic.stroke({ color: 0x888888, width: 2, alpha: 0.6 });

      // Inner crack details
      stoneGraphic.moveTo(-ts * 0.2, -ts * 0.1);
      stoneGraphic.lineTo(ts * 0.1, ts * 0.15);
      stoneGraphic.moveTo(ts * 0.05, -ts * 0.2);
      stoneGraphic.lineTo(-ts * 0.1, ts * 0.1);
      stoneGraphic.stroke({ color: 0x555555, width: 1, alpha: 0.5 });

      const halfTile = ts / 2;
      stoneGraphic.x = field.position.x + halfTile;
      stoneGraphic.y = field.position.y + halfTile;
      stoneGraphic.zIndex = 1;

      // Replace sprite reference with the graphic
      tile.sprite = stoneGraphic;
      tile.sprite.eventMode = "none"; // Cannot interact

      this.container.addChild(tile.sprite);
      placed++;
    }

    return placed;
  }

  /**
   * Remove N random normal tiles permanently, making those fields void.
   *
   * Void fields have no tile and cannot be filled again.
   *
   * @param {number} count - Number of void fields to create
   * @returns {number} Number of voids actually created
   */
  addVoids(count) {
    const normals = this.getNormalTiles();
    this._shuffle(normals);
    const targets = normals.slice(0, Math.min(count, normals.length));
    let created = 0;

    for (const field of targets) {
      const tile = field.tile;

      // Remove tile entirely
      if (tile) {
        if (tile.sprite) {
          this.container.removeChild(tile.sprite);
          tile.sprite.destroy();
          tile.sprite = null;
        }
        tile.field = null;
      }

      field.tile = null;
      field.isVoid = true;

      // Dim the field background to indicate void
      if (field.sprite) {
        field.sprite.alpha = 0.3;
      }

      created++;
    }

    return created;
  }

  /**
   * Mark N random normal tiles as poisoned.
   *
   * Matching poisoned tiles causes the attacker to take 5 damage.
   * Visual: green tint overlay.
   *
   * @param {number} count - Number of tiles to poison
   * @returns {{row: number, col: number}[]} Array of affected positions
   */
  poisonRandom(count) {
    const normals = this.getNormalTiles();
    this._shuffle(normals);
    const targets = normals.slice(0, Math.min(count, normals.length));
    const affected = [];

    for (const field of targets) {
      const tile = field.tile;
      tile.poisoned = true;

      // Visual: green poison overlay
      if (!tile._poisonOverlay) {
        const overlay = new Graphics();
        const ts = App.config.tileSize;
        overlay.roundRect(-ts / 2, -ts / 2, ts, ts, 10);
        overlay.fill({ color: 0x33cc33, alpha: 0.3 });
        overlay.x = tile.sprite.x;
        overlay.y = tile.sprite.y;
        overlay.zIndex = 5;
        this.container.addChild(overlay);
        tile._poisonOverlay = overlay;
      }

      affected.push({ row: field.row, col: field.col });
    }

    return affected;
  }

  // =========================================================================
  // DESTRUCTION METHODS
  // =========================================================================

  /**
   * Destroy all tiles in a given row.
   *
   * @param {number} row - Row index (0-based)
   * @returns {number} Number of tiles destroyed
   */
  destroyRow(row) {
    const tiles = [];
    for (let col = 0; col < this.cols; col++) {
      const field = this.getField(row, col);
      if (field && field.tile && !field.isVoid) {
        tiles.push(field.tile);
        this._removeTileOverlays(field.tile);
        field.tile.remove();
      }
    }
    return tiles;
  }

  /**
   * Destroy all tiles in a given column.
   *
   * @param {number} col - Column index (0-based)
   * @returns {Tile[]} Array of actually destroyed Tile objects
   */
  destroyColumn(col) {
    const tiles = [];
    for (let row = 0; row < this.rows; row++) {
      const field = this.getField(row, col);
      if (field && field.tile && !field.isVoid) {
        tiles.push(field.tile);
        this._removeTileOverlays(field.tile);
        field.tile.remove();
      }
    }
    return tiles;
  }

  /**
   * Destroy all tiles in a 3x3 area centered at (centerRow, centerCol).
   *
   * @param {number} centerRow - Center row
   * @param {number} centerCol - Center column
   * @returns {Tile[]} Array of actually destroyed Tile objects
   */
  destroyArea3x3(centerRow, centerCol) {
    const tiles = [];
    for (let r = centerRow - 1; r <= centerRow + 1; r++) {
      for (let c = centerCol - 1; c <= centerCol + 1; c++) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
        const field = this.getField(r, c);
        if (field && field.tile && !field.isVoid) {
          tiles.push(field.tile);
          this._removeTileOverlays(field.tile);
          field.tile.remove();
        }
      }
    }
    return tiles;
  }

  /**
   * Destroy all tiles in a cross (+) centered at (row, col).
   * Used by Rune Tiles when matched.
   *
   * @param {number} row - Center row
   * @param {number} col - Center col
   * @returns {Tile[]} Array of actually destroyed Tile objects
   */
  destroyCross(row, col) {
    const destroyedFields = new Set();
    // Row
    for (let c = 0; c < this.cols; c++) {
      const field = this.getField(row, c);
      if (field && field.tile && !field.isVoid) {
        destroyedFields.add(field);
      }
    }
    // Column
    for (let r = 0; r < this.rows; r++) {
      const field = this.getField(r, col);
      if (field && field.tile && !field.isVoid) {
        destroyedFields.add(field);
      }
    }

    const tiles = [];
    destroyedFields.forEach((field) => {
      tiles.push(field.tile);
      this._removeTileOverlays(field.tile);
      field.tile.remove();
    });
    return tiles;
  }

  /**
   * Destroy all tiles on the board of a specific color X.
   * Used by Rainbow Gems.
   *
   * @param {string} color - The color/element name to clear
   * @returns {Tile[]} Array of actually destroyed Tile objects
   */
  destroyAllOfColor(color) {
    const tiles = [];
    this.fields.forEach((field) => {
      if (field.tile && !field.isVoid && field.tile.color === color) {
        tiles.push(field.tile);
        this._removeTileOverlays(field.tile);
        field.tile.remove();
      }
    });
    return tiles;
  }

  /**
   * Destroy all tiles in 3 rows and 3 columns centered at (row, col) (Super Cross Blast).
   * Used when a match of 4 or 5 containing a special tile triggers a Super Blast.
   */
  destroySuperCross(row, col) {
    const destroyedFields = new Set();
    // Rows r-1, r, r+1
    for (let r = row - 1; r <= row + 1; r++) {
      if (r < 0 || r >= this.rows) continue;
      for (let c = 0; c < this.cols; c++) {
        const field = this.getField(r, c);
        if (field && field.tile && !field.isVoid) {
          destroyedFields.add(field);
        }
      }
    }
    // Columns c-1, c, c+1
    for (let c = col - 1; c <= col + 1; c++) {
      if (c < 0 || c >= this.cols) continue;
      for (let r = 0; r < this.rows; r++) {
        const field = this.getField(r, c);
        if (field && field.tile && !field.isVoid) {
          destroyedFields.add(field);
        }
      }
    }

    const tiles = [];
    destroyedFields.forEach((field) => {
      tiles.push(field.tile);
      this._removeTileOverlays(field.tile);
      field.tile.remove();
    });
    return tiles;
  }

  /**
   * Clear all normal/special tiles from the entire board (Super Board Wipe).
   * Used when a Rainbow Gem is matched in a match-5 combo.
   */
  destroySuperRainbow() {
    const tiles = [];
    this.fields.forEach((field) => {
      if (field.tile && !field.isVoid && !field.tile.isStone) {
        tiles.push(field.tile);
        this._removeTileOverlays(field.tile);
        field.tile.remove();
      }
    });
    return tiles;
  }

  /**
   * Destroy all tiles in a 5x5 area centered at (centerRow, centerCol) (Super Drum Blast).
   * Used when a T/L-shape match containing a special tile triggers a Super Drum Blast.
   */
  destroyArea5x5(centerRow, centerCol) {
    const tiles = [];
    for (let r = centerRow - 2; r <= centerRow + 2; r++) {
      for (let c = centerCol - 2; c <= centerCol + 2; c++) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
        const field = this.getField(r, c);
        if (field && field.tile && !field.isVoid) {
          tiles.push(field.tile);
          this._removeTileOverlays(field.tile);
          field.tile.remove();
        }
      }
    }
    return tiles;
  }

  /**
   * Destroy random tiles of a specific color X.
   * Used by skills like Meteor Shower.
   *
   * @param {string} color - The color/element name to clear
   * @param {number} count - Maximum number of tiles to clear
   * @returns {Tile[]} Array of actually destroyed Tile objects
   */
  destroyRandomOfType(color, count) {
    const matchingFields = [];
    this.fields.forEach((field) => {
      if (
        field.tile &&
        !field.isVoid &&
        field.tile.color === color &&
        !field.tile.isStone
      ) {
        matchingFields.push(field);
      }
    });

    // Shuffle matchingFields and pick up to 'count'
    const chosenFields = matchingFields
      .sort(() => 0.5 - Math.random())
      .slice(0, count);

    const tiles = [];
    chosenFields.forEach((field) => {
      tiles.push(field.tile);
      this._removeTileOverlays(field.tile);
      field.tile.remove();
    });
    return tiles;
  }

  /**
   * Destroy all tiles in an NxN area centered at (centerRow, centerCol).
   *
   * @param {number} centerRow - Center row
   * @param {number} centerCol - Center column
   * @param {number} size - Area size (e.g., 3 = 3x3 area)
   * @returns {number} Number of tiles destroyed
   */
  destroyArea(centerRow, centerCol, size) {
    const halfSize = Math.floor(size / 2);
    let destroyed = 0;

    for (let r = centerRow - halfSize; r <= centerRow + halfSize; r++) {
      for (let c = centerCol - halfSize; c <= centerCol + halfSize; c++) {
        if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) continue;
        const field = this.getField(r, c);
        if (field && field.tile && !field.isVoid) {
          this._removeTileOverlays(field.tile);
          field.tile.remove();
          destroyed++;
        }
      }
    }

    return destroyed;
  }

  /**
   * Remove all visual overlays (frozen, corrupt, poison) from a tile.
   * @param {Tile} tile
   * @private
   */
  _removeTileOverlays(tile) {
    if (!tile) return;

    if (tile._frozenOverlay) {
      this.container.removeChild(tile._frozenOverlay);
      tile._frozenOverlay.destroy();
      tile._frozenOverlay = null;
    }
    if (tile._corruptOverlay) {
      this.container.removeChild(tile._corruptOverlay);
      tile._corruptOverlay.destroy();
      tile._corruptOverlay = null;
    }
    if (tile._poisonOverlay) {
      this.container.removeChild(tile._poisonOverlay);
      tile._poisonOverlay.destroy();
      tile._poisonOverlay = null;
    }
  }

  // =========================================================================
  // COLOR MANIPULATION METHODS
  // =========================================================================

  /**
   * Shuffle all tile colors randomly.
   *
   * Keeps tiles in their fields, but reassigns random colors and recreates sprites.
   * Uses the level's allowed tile types.
   */
  /**
   * Tráo đổi tất cả các viên ngọc hiện tại trên bảng bằng cách thay đổi tham chiếu,
   * đảm bảo không tạo ra cụm match-3 tự nhiên và có ít nhất một nước đi hợp lệ.
   *
   * @param {CombinationManager} combinationManager
   * @param {boolean} [animate=true] - Có chạy hoạt ảnh trượt hay không
   * @returns {Promise} Giải phóng khi hoàn thành hoạt ảnh
   */
  async shuffleAll(combinationManager, animate = true) {
    const fields = this.fields.filter((f) => !f.isVoid);
    const eligibleFields = fields.filter(
      (f) => f.tile !== null && !f.tile.isStone,
    );
    const tiles = eligibleFields.map((f) => f.tile);

    let safetyCounter = 0;
    while (safetyCounter < 100) {
      // Tráo đổi mảng tiles bằng Fisher-Yates
      for (let i = tiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
      }

      // Gán lại tham chiếu tile <-> field trong bộ nhớ
      for (let i = 0; i < eligibleFields.length; i++) {
        const field = eligibleFields[i];
        const tile = tiles[i];
        field.tile = tile;
        tile.field = field;
      }

      // Kiểm tra xem bảng sau khi tráo có hợp lệ (không match-3 và có nước đi)
      const matches = combinationManager.getMatches();
      if (matches.length === 0 && combinationManager.hasPossibleMoves()) {
        break;
      }

      safetyCounter++;
    }

    // Cập nhật vị trí hiển thị của Sprite
    if (animate) {
      const animPromises = [];
      for (let i = 0; i < eligibleFields.length; i++) {
        const field = eligibleFields[i];
        const tile = field.tile;
        // Chạy hoạt ảnh trượt mượt mà bằng GSAP
        animPromises.push(tile.moveTo(field.position, 0.6));
      }
      await Promise.all(animPromises);
    } else {
      for (let i = 0; i < eligibleFields.length; i++) {
        const field = eligibleFields[i];
        const tile = field.tile;
        tile.setPosition(field.position);
      }
    }
  }

  /**
   * Shuffle tiles in a single row.
   *
   * @param {number} row - Row index (0-based)
   */
  shuffleRow(row) {
    for (let col = 0; col < this.cols; col++) {
      const field = this.getField(row, col);
      if (!field || !field.tile || field.isVoid || field.tile.isStone) continue;
      const newColor =
        this.allowedTiles[Math.floor(Math.random() * this.allowedTiles.length)];
      this._recolorTile(field.tile, newColor);
    }
  }

  /**
   * Set all tiles in a row to the same random color.
   *
   * @param {number} row - Row index (0-based)
   * @returns {Tile[]} Array of affected tiles
   */
  cloneRow(row) {
    const cloneColor =
      this.allowedTiles[Math.floor(Math.random() * this.allowedTiles.length)];
    const affected = [];

    for (let col = 0; col < this.cols; col++) {
      const field = this.getField(row, col);
      if (!field || !field.tile || field.isVoid || field.tile.isStone) continue;
      this._recolorTile(field.tile, cloneColor);
      affected.push(field.tile);
    }

    return affected;
  }

  /**
   * Transform N random tiles to the same random color.
   *
   * Picks a random color from allowed tiles, then changes N random normal tiles
   * to that color.
   *
   * @param {number} count - Number of tiles to transform
   * @returns {{color: string, affected: {row: number, col: number}[]}}
   */
  rainbowTransform(count) {
    const targetColor =
      this.allowedTiles[Math.floor(Math.random() * this.allowedTiles.length)];
    const normals = this.getNormalTiles();
    this._shuffle(normals);
    const targets = normals.slice(0, Math.min(count, normals.length));
    const affected = [];

    for (const field of targets) {
      this._recolorTile(field.tile, targetColor);
      affected.push({ row: field.row, col: field.col });
    }

    return { color: targetColor, affected };
  }

  // =========================================================================
  // CLEANSE / PURIFY
  // =========================================================================

  /**
   * Remove all corrupt, poison, frozen, and stone states from the board.
   *
   * Stone tiles get replaced with new random normal tiles.
   * Overlays are removed.
   *
   * @returns {number} Number of tiles purified
   */
  purifyAll() {
    let purified = 0;

    for (const field of this.fields) {
      if (!field.tile || field.isVoid) continue;
      const tile = field.tile;
      let wasDirty = false;

      // Clear frozen
      if (tile.frozen) {
        tile.frozen = false;
        tile.frozenDuration = 0;
        wasDirty = true;
      }

      // Clear corrupt
      if (tile.corrupt) {
        tile.corrupt = false;
        wasDirty = true;
      }

      // Clear poison
      if (tile.poisoned) {
        tile.poisoned = false;
        wasDirty = true;
      }

      // Remove overlays
      this._removeTileOverlays(tile);

      // Replace stone tiles with new random tiles
      if (tile.isStone) {
        // Remove stone graphic
        if (tile.sprite) {
          this.container.removeChild(tile.sprite);
          tile.sprite.destroy();
          tile.sprite = null;
        }
        tile.field = null;
        field.tile = null;

        // Create a fresh tile
        this.createTile(field);
        wasDirty = true;
      }

      if (wasDirty) purified++;
    }

    return purified;
  }

  // =========================================================================
  // POSITIONAL MANIPULATION METHODS
  // =========================================================================

  /**
   * Shift tiles in a row by 1 position, with wrapping.
   *
   * @param {number} row - Row index (0-based)
   * @param {number} direction - Positive = shift right, Negative = shift left
   */
  shiftRow(row, direction) {
    // Collect tiles in order
    const tiles = [];
    for (let col = 0; col < this.cols; col++) {
      const field = this.getField(row, col);
      tiles.push(field ? field.tile : null);
    }

    // Rotate the array
    if (direction > 0) {
      // Shift right: last element goes to front
      const last = tiles.pop();
      tiles.unshift(last);
    } else {
      // Shift left: first element goes to end
      const first = tiles.shift();
      tiles.push(first);
    }

    // Reassign tiles to fields
    for (let col = 0; col < this.cols; col++) {
      const field = this.getField(row, col);
      if (!field) continue;

      const tile = tiles[col];
      field.tile = tile;

      if (tile) {
        tile.field = field;
        tile.setPosition(field.position);

        // Update overlay positions if they exist
        if (tile._frozenOverlay) {
          const halfTile = App.config.tileSize / 2;
          tile._frozenOverlay.x = field.position.x + halfTile;
          tile._frozenOverlay.y = field.position.y + halfTile;
        }
        if (tile._corruptOverlay) {
          const halfTile = App.config.tileSize / 2;
          tile._corruptOverlay.x = field.position.x + halfTile;
          tile._corruptOverlay.y = field.position.y + halfTile;
        }
        if (tile._poisonOverlay) {
          const halfTile = App.config.tileSize / 2;
          tile._poisonOverlay.x = field.position.x + halfTile;
          tile._poisonOverlay.y = field.position.y + halfTile;
        }
      }
    }
  }

  /**
   * Rotate tiles in an NxN area 90 degrees clockwise.
   *
   * Moves tile references (and their sprites) around the area.
   *
   * @param {number} startRow - Top-left row of the area
   * @param {number} startCol - Top-left col of the area
   * @param {number} size - Width/height of the area
   */
  rotateArea(startRow, startCol, size) {
    // Collect current tiles in a 2D grid
    const grid = [];
    for (let r = 0; r < size; r++) {
      grid[r] = [];
      for (let c = 0; c < size; c++) {
        const field = this.getField(startRow + r, startCol + c);
        grid[r][c] = field ? field.tile : null;
      }
    }

    // Assign rotated tiles: new[c][size-1-r] = old[r][c]
    // For 90° clockwise: newGrid[c][size-1-r] = grid[r][c]
    // Equivalently: destination row = c, destination col = size-1-r
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const destRow = startRow + c;
        const destCol = startCol + (size - 1 - r);

        if (destRow >= this.rows || destCol >= this.cols) continue;

        const destField = this.getField(destRow, destCol);
        if (!destField) continue;

        const tile = grid[r][c];
        destField.tile = tile;

        if (tile) {
          tile.field = destField;
          tile.setPosition(destField.position);

          // Update overlay positions
          const halfTile = App.config.tileSize / 2;
          if (tile._frozenOverlay) {
            tile._frozenOverlay.x = destField.position.x + halfTile;
            tile._frozenOverlay.y = destField.position.y + halfTile;
          }
          if (tile._corruptOverlay) {
            tile._corruptOverlay.x = destField.position.x + halfTile;
            tile._corruptOverlay.y = destField.position.y + halfTile;
          }
          if (tile._poisonOverlay) {
            tile._poisonOverlay.x = destField.position.x + halfTile;
            tile._poisonOverlay.y = destField.position.y + halfTile;
          }
        }
      }
    }
  }

  // =========================================================================
  // PER-TURN TICK METHODS
  // =========================================================================

  /**
   * Decrease frozenDuration of all frozen tiles by 1.
   * Unfreeze tiles that reach 0 and remove their ice overlay.
   *
   * Call this at the start/end of each turn.
   *
   * @returns {number} Number of tiles unfrozen this tick
   */
  tickFrozenTiles() {
    let unfrozen = 0;

    for (const field of this.fields) {
      if (!field.tile) continue;
      const tile = field.tile;

      if (tile.frozen && tile.frozenDuration > 0) {
        tile.frozenDuration--;

        if (tile.frozenDuration <= 0) {
          tile.frozen = false;
          tile.frozenDuration = 0;

          // Remove ice overlay
          if (tile._frozenOverlay) {
            this.container.removeChild(tile._frozenOverlay);
            tile._frozenOverlay.destroy();
            tile._frozenOverlay = null;
          }

          unfrozen++;
        }
      }
    }

    return unfrozen;
  }

  /**
   * Decrease hiddenDuration of all hidden tiles by 1.
   * Un-hide tiles that reach 0 and restore their sprite visibility.
   *
   * @returns {number} Number of tiles revealed this tick
   */
  tickHiddenTiles() {
    let revealed = 0;

    for (const field of this.fields) {
      if (!field.tile) continue;
      const tile = field.tile;

      if (tile.hidden && tile.hiddenDuration > 0) {
        tile.hiddenDuration--;

        if (tile.hiddenDuration <= 0) {
          tile.hidden = false;
          tile.hiddenDuration = 0;

          // Show sprite again
          if (tile.sprite) {
            tile.sprite.visible = true;
          }

          revealed++;
        }
      }
    }

    return revealed;
  }

  // =========================================================================
  // INPUT CONTROL
  // =========================================================================

  /**
   * Enable or disable tile click events on the board.
   *
   * Used to lock the board during boss turn, animations, etc.
   * When disabled, pointerdown events on tiles are ignored.
   *
   * @param {boolean} enabled - true to enable input, false to disable
   */
  setInputEnabled(enabled) {
    this.inputEnabled = enabled;

    // Also update cursor style for visual feedback
    for (const field of this.fields) {
      if (!field.tile || !field.tile.sprite) continue;
      if (field.tile.isStone) continue;

      field.tile.sprite.cursor = enabled ? "pointer" : "default";
      field.tile.sprite.eventMode = enabled ? "static" : "none";
    }
  }
}

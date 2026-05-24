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
 */

import { Container } from 'pixi.js';
import { Field } from './Field.js';
import { Tile } from './Tile.js';
import { App } from '../system/App.js';

export class Board {
    constructor() {
        /**
         * Container: "hộp chứa" tất cả sprites của board
         * 
         * Container giống như <div> trong HTML:
         * - Có thể chứa nhiều children (sprites)
         * - Có position (x, y) riêng
         * - Children được vẽ relative to container
         */
        this.container = new Container();
        this.container.sortableChildren = true;  // Cho phép sort theo zIndex

        /** Mảng chứa tất cả Field objects */
        this.fields = [];

        /** Kích thước board (từ config) */
        this.rows = App.config.board.rows;
        this.cols = App.config.board.cols;

        // Tạo board
        this.create();

        // Căn giữa board trên canvas
        this.adjustPosition();
    }

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
        this.container.addChild(field.sprite);     // Nền ô vuông (vẽ trước)
        this.container.addChild(field.selected);   // Viền vàng (vẽ sau, trên nền)
    }

    /**
     * Tạo tiles cho TẤT CẢ fields
     */
    createTiles() {
        this.fields.forEach(field => this.createTile(field));
    }

    /**
     * Tạo 1 Tile mới trên 1 Field
     * 
     * === QUY TRÌNH ===
     * 1. Random chọn màu từ danh sách tileColors
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
    createTile(field) {
        // 1. Random màu
        const colors = App.config.tileColors;
        const color = colors[Math.floor(Math.random() * colors.length)];

        // 2. Tạo Tile
        const tile = new Tile(color);

        // 3. Tham chiếu 2 chiều
        field.tile = tile;     // Field → Tile
        tile.field = field;    // Tile → Field

        // 4. Đặt vị trí pixel
        tile.setPosition(field.position);

        // 5. Thêm vào container (hiển thị)
        this.container.addChild(tile.sprite);

        // 6. Bật interactivity
        tile.sprite.eventMode = 'static';   // Nhận click events
        tile.sprite.cursor = 'pointer';     // Con trỏ hình bàn tay

        // 7. Lắng nghe click → emit event lên container
        tile.sprite.on('pointerdown', () => {
            this.container.emit('tile-touch-start', tile);
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
        return this.fields.find(field => field.row === row && field.col === col);
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
     * Căn giữa board trên canvas
     * 
     * === CÔNG THỨC CĂN GIỮA ===
     * offset_x = (canvasWidth - boardWidth) / 2
     * 
     * Ví dụ: canvas 800px, board 560px (8 ô × 70px)
     * → offset_x = (800 - 560) / 2 = 120px
     * 
     * Ta + thêm tileSize/2 vì anchor của sprites ở tâm (0.5)
     * → Sprite ở [0,0] cần thêm 35px để không bị cắt nửa
     */
    adjustPosition() {
        const boardWidth = this.cols * App.config.tileSize;
        const boardHeight = this.rows * App.config.tileSize;

        // Board container is positioned by top-left corner because
        // field backgrounds are drawn from top-left coordinates.
        this.container.x = (App.app.screen.width - boardWidth) / 2;
        this.container.y = (App.app.screen.height - boardHeight) / 2;
    }
}

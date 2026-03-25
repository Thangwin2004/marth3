/**
 * ===== src/config.js =====
 * 
 * File cấu hình game Match-3.
 * 
 * === GIẢI THÍCH CHI TIẾT ===
 * 
 * Config là nơi tập trung TẤT CẢ các hằng số và thiết lập của game.
 * Thay vì hardcode các giá trị (như "8 hàng", "6 màu") rải rác trong code,
 * ta đặt hết vào 1 file config → dễ thay đổi, dễ bảo trì.
 * 
 * Ví dụ: Muốn đổi board từ 8x8 thành 6x6? 
 *         → Chỉ cần sửa rows/cols ở đây, KHÔNG cần sửa code logic.
 */

export const Config = {
    /**
     * board: Kích thước bảng game
     * - rows: số hàng (trục Y, từ trên xuống)
     * - cols: số cột (trục X, từ trái sang)
     * 
     * Board 8x8 = 64 ô, mỗi ô chứa 1 tile
     */
    board: {
        rows: 8,
        cols: 8,
    },

    /**
     * tileSize: Kích thước mỗi ô (pixels)
     * Dùng để căn chỉnh vị trí tiles trên board
     */
    tileSize: 70,

    /**
     * tileColors: Danh sách các màu tile có trong game
     * Mỗi tên ở đây phải tương ứng với 1 file asset SVG
     * (ví dụ: 'blue' → /assets/blue.svg)
     */
    tileColors: ['blue', 'green', 'orange', 'red', 'purple', 'yellow'],

    /**
     * assets: Ánh xạ tên → đường dẫn file asset
     * 
     * PixiJS v8 sử dụng Assets.load() để tải texture.
     * Mỗi entry = { alias: tên, src: đường dẫn file }
     * 
     * Sau khi load, ta dùng alias để tạo sprite:
     *   Sprite.from('blue')  ← alias 'blue' → file '/assets/blue.svg'
     */
    assets: {
        field: '/assets/field.svg',
        'field-selected': '/assets/field-selected.svg',
        blue: '/assets/blue.svg',
        green: '/assets/green.svg',
        orange: '/assets/orange.svg',
        red: '/assets/red.svg',
        purple: '/assets/purple.svg',
        yellow: '/assets/yellow.svg',
    },

    /**
     * combinationRules: Luật phát hiện combo
     * 
     * Mỗi rule là 1 mảng các offset (vị trí tương đối) cần kiểm tra.
     * Thuật toán: Với mỗi ô [row, col] trên bảng:
     *   - Lấy tile ở ô đó
     *   - So sánh với tiles ở các ô offset
     *   - Nếu TẤT CẢ cùng màu → đó là combo!
     * 
     * Rule 1: [{col:1, row:0}, {col:2, row:0}]
     *   → Kiểm tra 3 ô NGANG liên tiếp: [r,c], [r,c+1], [r,c+2]
     * 
     * Rule 2: [{col:0, row:1}, {col:0, row:2}]
     *   → Kiểm tra 3 ô DỌC liên tiếp: [r,c], [r+1,c], [r+2,c]
     * 
     * (Sẽ dùng ở Tuần 5, nhưng khai báo sẵn ở đây)
     */
    combinationRules: [
        [{ col: 1, row: 0 }, { col: 2, row: 0 }],
        [{ col: 0, row: 1 }, { col: 0, row: 2 }],
    ],
};

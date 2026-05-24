/**
 * ===== src/config.js =====
 * 
 * File cấu hình game Match-3.
 * 
 * === GIẢI THÍCH CHI TIẾT ===
 * 
 * Config là nơi tập trung TẤT CẢ các hằng số và thiết lập của game.
 * Thay vì hardcode các giá trị rải rác trong code,
 * ta đặt hết vào 1 file config → dễ thay đổi, dễ bảo trì.
 * 
 * === THAY ĐỔI SO VỚI BẢN CŨ ===
 * 
 * 1. Board: 8×8 → 12×12 (144 ô, gấp 2.25 lần)
 * 2. TileSize: 70px → 45px (để vừa canvas 800×600)
 * 3. Xóa combinationRules — không cần nữa vì Line Scan
 *    tự phát hiện combo theo run-length, không cần offset rules
 */

export const Config = {
    /**
     * board: Kích thước bảng game
     * - rows: số hàng (trục Y, từ trên xuống)
     * - cols: số cột (trục X, từ trái sang)
     * 
     * Board 12×12 = 144 ô, mỗi ô chứa 1 tile
     * 
     * Tính toán kích thước phù hợp:
     *   Canvas: 800×600
     *   Board width:  12 × 45 = 540px (< 800 ✓)
     *   Board height: 12 × 45 = 540px (< 600, chừa 60px cho UI ✓)
     */
    board: {
        rows: 12,
        cols: 12,
    },

    /**
     * tileSize: Kích thước mỗi ô (pixels)
     * 
     * Bản cũ: 70px cho board 8×8 (70×8 = 560px)
     * Bản mới: 45px cho board 12×12 (45×12 = 540px)
     * 
     * 45px vẫn đủ lớn để nhìn rõ và click chính xác
     */
    tileSize: 45,

    /**
     * tileColors: Danh sách các loại tile hiện tại trong game
     * Mỗi tên ở đây phải tương ứng với 1 file asset SVG
     */
    tileColors: [
        'fire', 'water', 'nature', 'ice', 'lightning',
        'earth', 'wind-air', 'psychic-eye', 'sun', 'poison-death',
    ],

    /**
     * assets: Ánh xạ tên → đường dẫn file asset
     * 
     * PixiJS v8 sử dụng Assets.load() để tải texture.
     * Mỗi entry = { alias: tên, src: đường dẫn file }
     * 
     * Sau khi load, ta dùng alias để tạo sprite:
     *   Sprite.from('fire')  ← alias 'fire' → file '/assets/fire.svg'
     */
    assets: {
        fire: '/assets/fire.svg',
        water: '/assets/Water.svg',
        nature: '/assets/Nature.svg',
        ice: '/assets/Ice.svg',
        lightning: '/assets/Lightning.svg',
        earth: '/assets/Earth.svg',
        'wind-air': '/assets/Windy.svg',
        'psychic-eye': '/assets/Psychic.svg',
        sun: '/assets/Sun.svg',
        'poison-death': '/assets/Poison.svg',
    },

    /**
     * === combinationRules ĐÃ BỊ XÓA ===
     * 
     * Phiên bản cũ dùng offset rules:
     *   combinationRules: [
     *     [{ col: 1, row: 0 }, { col: 2, row: 0 }],  // ngang
     *     [{ col: 0, row: 1 }, { col: 0, row: 2 }],  // dọc
     *   ]
     * 
     * Phiên bản mới dùng Line Scan — tự phát hiện combo bằng
     * thuật toán run-length, KHÔNG cần rules offset nữa.
     * 
     * Lợi ích:
     *   - Tự động detect match-4, match-5, match-N
     *   - Không trùng lặp combo
     *   - Code CombinationManager sạch hơn
     */
};

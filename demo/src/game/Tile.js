/**
 * ===== src/game/Tile.js =====
 * 
 * Lớp Tile (Viên gạch màu)
 * 
 * === GIẢI THÍCH CHI TIẾT ===
 * 
 * Tile là viên gạch mà player di chuyển để tạo combo.
 * Mỗi tile có 1 MÀU (fire, water, nature, ice, lightning, earth, wind-air, psychic-eye, sun, poison-death)
 * và 1 SPRITE (hình ảnh).
 * 
 * Tile nằm trên Field (ô vuông). Khi swap, tile di chuyển từ Field này 
 * sang Field kia bằng animation.
 * 
 * === ANIMATION VỚI GSAP ===
 * 
 * GSAP (GreenSock Animation Platform) là thư viện animation mạnh nhất
 * cho JavaScript. Ta dùng GSAP để tạo các chuyển động mượt mà:
 * 
 *   gsap.to(sprite, { x: 100, duration: 0.3 })
 *     → Di chuyển sprite đến x=100 trong 0.3 giây
 * 
 * Easing functions: Kiểu chuyển động
 *   - 'power2.out'  : Nhanh rồi chậm dần (tự nhiên)
 *   - 'back.out'    : Đi quá rồi quay lại (bouncy)
 *   - 'bounce.out'  : Nảy lên nảy xuống (như quả bóng)
 *   - 'power2.in'   : Chậm rồi nhanh dần (tăng tốc)
 */

import { App } from '../system/App.js';
import gsap from 'gsap';

export class Tile {
    /**
     * Tạo 1 viên gạch màu
     * 
     * @param {string} color - Tên màu ('fire', 'water', 'leaf', ...)
     *                         Phải trùng với alias trong config.assets
     * 
     * === VÍ DỤ ===
     * new Tile('fire')   → tạo viên gạch lửa
     * new Tile('water')  → tạo viên giọt nước
     */
    constructor(color) {
        // === DỮ LIỆU ===
        this.color = color;      // Tên màu (dùng để so sánh combo)
        this.field = null;       // Field mà tile đang nằm trên (tham chiếu 2 chiều)

        // === SPRITE ===
        // Tạo sprite từ texture đã load (alias = tên màu)
        this.sprite = App.sprite(this.color);

        // anchor.set(0.5) → Điểm neo ở tâm sprite
        // Để tile nằm chính giữa ô field
        this.sprite.anchor.set(0.5);

        // Scale sprite theo kích thước ô của board
        this.resizeSprite();
    }

    resizeSprite() {
        const targetSize = App.config.tileSize;
        const texture = this.sprite.texture;
        const textureWidth = texture.orig.width;
        const textureHeight = texture.orig.height;
        const baseSize = Math.max(textureWidth, textureHeight);
        const scale = (targetSize / baseSize) * 0.92;
        this.sprite.scale.set(scale);
    }

    /**
     * Đặt tile ở vị trí cụ thể (KHÔNG có animation)
     * Dùng khi khởi tạo board (đặt tile ban đầu)
     * 
     * @param {{x: number, y: number}} position - Tọa độ pixel
     */
    setPosition(position) {
        const halfTile = App.config.tileSize / 2;
        this.sprite.x = position.x + halfTile;
        this.sprite.y = position.y + halfTile;
    }

    /**
     * Di chuyển tile đến vị trí mới VỚI animation
     * 
     * === QUAN TRỌNG: Trả về Promise ===
     * Vì animation mất thời gian (duration), ta cần biết KHI NÀO nó xong.
     * Promise cho phép dùng `await` hoặc `.then()`:
     * 
     *   await tile.moveTo({ x: 100, y: 200 }, 0.3);
     *   console.log('Animation xong rồi!');
     * 
     * === GSAP.to() ===
     * gsap.to(target, { properties, duration, ease, onComplete })
     *   - target:     Object cần animate (sprite)
     *   - x, y:       Giá trị đích muốn đến
     *   - duration:   Thời gian (giây)
     *   - ease:       Kiểu chuyển động
     *   - onComplete: Callback khi hoàn tất
     * 
     * @param {{x: number, y: number}} position - Vị trí đích
     * @param {number} duration - Thời gian (giây), ví dụ: 0.2
     * @returns {Promise} Resolve khi animation hoàn tất
     */
    moveTo(position, duration) {
        const halfTile = App.config.tileSize / 2;
        return new Promise(resolve => {
            gsap.to(this.sprite, {
                x: position.x + halfTile,
                y: position.y + halfTile,
                duration: duration,
                ease: 'back.out(1.2)',  // Hiệu ứng "đi quá rồi quay lại" nhẹ
                onComplete: () => resolve(),
            });
        });
    }

    /**
     * Animation rơi xuống (cho tiles mới hoặc tiles dịch chuyển)
     * 
     * Khác moveTo():
     *   - Chỉ thay đổi Y (rơi thẳng đứng)
     *   - Dùng ease 'bounce.out' (hiệu ứng nảy)
     *   - Có delay (trì hoãn) để tạo hiệu ứng "rơi lần lượt"
     * 
     * @param {{x: number, y: number}} position - Vị trí đích
     * @param {number} delay - Thời gian chờ trước khi bắt đầu rơi (giây)
     * @returns {Promise} Resolve khi animation hoàn tất
     */
    fallDownTo(position, delay = 0) {
        const halfTile = App.config.tileSize / 2;
        return new Promise(resolve => {
            gsap.to(this.sprite, {
                y: position.y + halfTile,
                duration: 0.5,
                delay: delay,
                ease: 'bounce.out',  // Hiệu ứng nảy như quả bóng
                onComplete: () => resolve(),
            });
        });
    }

    /**
     * Xóa tile khỏi game
     * 
     * === QUY TRÌNH XÓA ===
     * 1. Animation thu nhỏ + mờ dần (0.15 giây)
     * 2. Destroy sprite (giải phóng bộ nhớ GPU)
     * 3. Xóa tham chiếu 2 chiều (field ↔ tile)
     * 
     * === QUAN TRỌNG: Memory Management ===
     * Phải gọi sprite.destroy() để PixiJS giải phóng texture khỏi GPU.
     * Nếu chỉ set sprite = null, texture vẫn chiếm bộ nhớ GPU → memory leak!
     */
    remove() {
        if (!this.sprite) return;  // Đã bị xóa rồi (tránh xóa 2 lần)

        // Animation biến mất
        gsap.to(this.sprite.scale, {
            x: 0.1,                           // Thu nhỏ theo X
            y: 0.1,                           // Thu nhỏ theo Y
            duration: 0.15,
        });
        gsap.to(this.sprite, {
            alpha: 0,                         // Mờ dần
            duration: 0.15,
            ease: 'power2.in',               // Nhanh dần (tăng tốc)
            onComplete: () => {
                if (this.sprite) {
                    this.sprite.destroy();    // Giải phóng GPU memory
                    this.sprite = null;       // Xóa tham chiếu
                }
            },
        });

        // Xóa tham chiếu 2 chiều
        if (this.field) {
            this.field.tile = null;   // Field không còn tile
            this.field = null;        // Tile không còn field
        }
    }
}

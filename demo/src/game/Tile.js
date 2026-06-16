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
 * 
 * === BOSS BATTLE STATES ===
 * 
 * Tiles can have special states applied by boss abilities:
 *   - frozen: Cannot be swapped for N turns
 *   - corrupt: Matched but deals 0 damage
 *   - poisoned: Matching hurts the attacker
 *   - isStone: Cannot be swapped or matched at all
 *   - hidden: Color is hidden (shows '?')
 */

import { App } from '../system/App.js';
import { Graphics } from 'pixi.js';
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

        // === BOSS BATTLE STATES ===
        this.frozen = false;         // Cannot be swapped for N turns
        this.frozenDuration = 0;     // Turns remaining frozen
        this.corrupt = false;        // Matched but deals 0 damage
        this.poisoned = false;       // Matching hurts the attacker
        this.isStone = false;        // Cannot be swapped or matched
        this.isVoid = false;         // Permanent empty (not used on Tile, used on Field)
        this.hidden = false;         // Color hidden (shows '?')
        this.hiddenDuration = 0;     // Turns remaining hidden
        this.isRune = false;         // Ghép 4: Rune Tile phát nổ chữ thập
        this.isRainbow = false;      // Ghép 5: Rainbow Gem hút ngọc đồng màu

        // Overlay graphics for special states
        this.stateOverlay = null;

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
        const scale = (targetSize / baseSize) * 0.95;
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

    // ================================================================
    //  BOSS BATTLE STATE METHODS
    // ================================================================

    /**
     * Freeze tile — cannot be swapped for N turns
     * @param {number} duration - Number of turns to stay frozen
     */
    setFrozen(duration) {
        this.frozen = true;
        this.frozenDuration = duration;
        this.updateStateOverlay();
    }

    /**
     * Remove frozen state
     */
    unfreeze() {
        this.frozen = false;
        this.frozenDuration = 0;
        this.updateStateOverlay();
    }

    /**
     * Mark tile as corrupt — can be matched but deals 0 damage
     */
    setCorrupt() {
        this.corrupt = true;
        this.updateStateOverlay();
    }

    /**
     * Mark tile as poisoned — matching hurts the attacker
     */
    setPoisoned() {
        this.poisoned = true;
        this.updateStateOverlay();
    }

    /**
     * Hide tile color — shows '?' instead
     * @param {number} duration - Number of turns to stay hidden
     */
    setHidden(duration) {
        this.hidden = true;
        this.hiddenDuration = duration;
        this.updateStateOverlay();
    }

    /**
     * Remove hidden state — reveal tile color
     */
    unhide() {
        this.hidden = false;
        this.hiddenDuration = 0;
        this.updateStateOverlay();
    }

    /**
     * Change tile color (for shuffle, clone, rainbow abilities)
     * Replaces the sprite texture and resets corrupt/poisoned states.
     * 
     * @param {string} newColor - New color name (e.g. 'fire', 'water')
     */
    changeColor(newColor) {
        this.color = newColor;
        this.corrupt = false;
        this.poisoned = false;
        this.isRune = false;
        this.isRainbow = false;

        // Save current sprite state
        const oldX = this.sprite.x;
        const oldY = this.sprite.y;
        const parent = this.sprite.parent;
        const zIndex = this.sprite.zIndex;

        // Remove from parent before destroying (PixiJS v8 render group fix)
        if (parent) parent.removeChild(this.sprite);
        this.sprite.destroy();
        this.sprite = App.sprite(newColor);
        this.sprite.anchor.set(0.5);
        this.resizeSprite();
        this.sprite.x = oldX;
        this.sprite.y = oldY;
        this.sprite.zIndex = zIndex;
        this.sprite.eventMode = 'static';
        this.sprite.cursor = 'pointer';
        if (parent) parent.addChild(this.sprite);

        this.updateStateOverlay();
    }

    /**
     * Visual overlay for frozen/corrupt/poison/hidden states.
     * Uses PixiJS v8 Graphics API to draw tinted overlay on the sprite.
     */
    updateStateOverlay() {
        // Remove existing overlay — removeChild before destroy (PixiJS v8 fix)
        if (this.stateOverlay) {
            if (this.stateOverlay.parent) {
                this.stateOverlay.parent.removeChild(this.stateOverlay);
            }
            if (!this.stateOverlay.destroyed) {
                this.stateOverlay.destroy();
            }
            this.stateOverlay = null;
        }

        if (!this.sprite) return;

        const tileSize = App.config.tileSize;
        const overlay = new Graphics();

        if (this.frozen) {
            // Light blue tint for frozen
            overlay.rect(-tileSize / 2, -tileSize / 2, tileSize, tileSize);
            overlay.fill({ color: 0x80d8ff, alpha: 0.4 });
        } else if (this.corrupt) {
            // Dark purple tint for corrupt
            overlay.rect(-tileSize / 2, -tileSize / 2, tileSize, tileSize);
            overlay.fill({ color: 0x2a002a, alpha: 0.6 });
        } else if (this.poisoned) {
            // Green tint for poisoned
            overlay.rect(-tileSize / 2, -tileSize / 2, tileSize, tileSize);
            overlay.fill({ color: 0x00ff00, alpha: 0.25 });
        } else if (this.hidden) {
            // Full cover — hide tile color
            overlay.rect(-tileSize / 2, -tileSize / 2, tileSize, tileSize);
            overlay.fill({ color: 0x1a1a2e, alpha: 0.95 });
            // Draw '?' mark using simple shapes
            overlay.circle(0, -4, 6);
            overlay.fill({ color: 0xffffff, alpha: 0.5 });
            overlay.rect(-2, 6, 4, 4);
            overlay.fill({ color: 0xffffff, alpha: 0.5 });
        } else if (this.isRune) {
            // Gorgeous golden border + central core glowing symbol for Rune Tiles
            overlay.roundRect(-tileSize / 2 + 3, -tileSize / 2 + 3, tileSize - 6, tileSize - 6, 12);
            overlay.stroke({ color: 0xffdd57, width: 3, alpha: 0.9 });
            overlay.circle(0, 0, 10);
            overlay.stroke({ color: 0xffdd57, width: 2, alpha: 0.7 });
            overlay.circle(0, 0, 4);
            overlay.fill({ color: 0xffffff, alpha: 0.9 });
            gsap.to(overlay, { alpha: 0.6, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        } else if (this.isRainbow) {
            // Concentric rainbow spectrum rings + white hot core for Rainbow Gems!
            const rainbowColors = [0xff1744, 0xff9100, 0xffea00, 0x00e676, 0x2979ff, 0xd500f9];
            rainbowColors.forEach((c, idx) => {
                overlay.circle(0, 0, (tileSize / 2.2) * (1 - idx * 0.14));
                overlay.stroke({ color: c, width: 3.5, alpha: 0.95 });
            });
            overlay.circle(0, 0, 3);
            overlay.fill({ color: 0xffffff, alpha: 1.0 });
            // Pulsing animation
            overlay.scale.set(1.0);
            gsap.to(overlay.scale, {
                x: 1.12,
                y: 1.12,
                duration: 0.55,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }

        if (overlay.geometry && this.sprite.parent) {
            this.stateOverlay = overlay;
            overlay.x = this.sprite.x;
            overlay.y = this.sprite.y;
            overlay.zIndex = this.sprite.zIndex + 0.5;
            this.sprite.parent.addChild(overlay);
        }
    }



    /**
     * Xóa tile khỏi game
     * 
     * === QUY TRÌNH XÓA ===
     * 1. Animation thu nhỏ + mờ dần (0.15 giây)
     * 2. Destroy sprite (giải phóng bộ nhớ GPU)
     * 3. Destroy stateOverlay nếu có
     * 4. Xóa tham chiếu 2 chiều (field ↔ tile)
     * 
     * === QUAN TRỌNG: Memory Management ===
     * Phải gọi sprite.destroy() để PixiJS giải phóng texture khỏi GPU.
     * Nếu chỉ set sprite = null, texture vẫn chiếm bộ nhớ GPU → memory leak!
     */
    /**
     * Xóa tile khỏi game
     *
     * @param {boolean} immediate - If true, remove synchronously without animation
     *                              (used during board initialization)
     */
    remove(immediate = false) {
        if (!this.sprite) return;  // Đã bị xóa rồi (tránh xóa 2 lần)

        // Capture sprite reference for the async GSAP callback.
        // Prevents stale 'this.sprite' references if the tile is reused.
        const spriteRef = this.sprite;
        this.sprite = null;  // Clear immediately to prevent double-removal

        if (immediate) {
            // Synchronous removal — no animation (used during board init)
            if (spriteRef.parent) {
                spriteRef.parent.removeChild(spriteRef);
            }
            if (!spriteRef.destroyed) {
                spriteRef.destroy();
            }
        } else {
            // Animation biến mất
            gsap.to(spriteRef.scale, {
                x: 0.1,                           // Thu nhỏ theo X
                y: 0.1,                           // Thu nhỏ theo Y
                duration: 0.15,
            });
            gsap.to(spriteRef, {
                alpha: 0,                         // Mờ dần
                duration: 0.15,
                ease: 'power2.in',               // Nhanh dần (tăng tốc)
                onComplete: () => {
                    // PixiJS v8 fix: removeChild BEFORE destroy to prevent
                    // "updateRenderable" errors from stale render group refs
                    if (spriteRef.parent) {
                        spriteRef.parent.removeChild(spriteRef);
                    }
                    if (!spriteRef.destroyed) {
                        spriteRef.destroy();    // Giải phóng GPU memory
                    }
                },
            });
        }

        // Destroy state overlay (managed by Tile.updateStateOverlay)
        if (this.stateOverlay) {
            if (this.stateOverlay.parent) {
                this.stateOverlay.parent.removeChild(this.stateOverlay);
            }
            if (!this.stateOverlay.destroyed) {
                this.stateOverlay.destroy();
            }
            this.stateOverlay = null;
        }

        // Clean up board-managed overlays (frozen, corrupt, poison)
        this._cleanupBoardOverlays();

        // Xóa tham chiếu 2 chiều
        if (this.field) {
            this.field.tile = null;   // Field không còn tile
            this.field = null;        // Tile không còn field
        }
    }

    /**
     * Remove board-managed overlay Graphics (frozen, corrupt, poison).
     * These are created by Board.freezeRandom, Board.corruptRandom, Board.poisonRandom
     * and need explicit cleanup when a tile is removed via match/cascade.
     * @private
     */
    _cleanupBoardOverlays() {
        const overlayKeys = ['_frozenOverlay', '_corruptOverlay', '_poisonOverlay'];
        for (const key of overlayKeys) {
            if (this[key]) {
                if (this[key].parent) {
                    this[key].parent.removeChild(this[key]);
                }
                if (!this[key].destroyed) {
                    this[key].destroy();
                }
                this[key] = null;
            }
        }
    }
}

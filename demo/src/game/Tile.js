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

import { App } from "../system/App.js";
import { Container, Graphics, Sprite, Texture } from "pixi.js";
import gsap from "gsap";
import { soundManager } from "../system/SoundManager.js";

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
    this.color = color; // Tên màu (dùng để so sánh combo)
    this.field = null; // Field mà tile đang nằm trên (tham chiếu 2 chiều)
    this.isRemoving = false; // Trạng thái đang xóa

    // === BOSS BATTLE STATES ===
    this.frozen = false; // Cannot be swapped for N turns
    this.frozenDuration = 0; // Turns remaining frozen
    this.corrupt = false; // Matched but deals 0 damage
    this.poisoned = false; // Matching hurts the attacker
    this.isStone = false; // Cannot be swapped or matched
    this.isVoid = false; // Permanent empty (not used on Tile, used on Field)
    this.hidden = false; // Color hidden (shows '?')
    this.hiddenDuration = 0; // Turns remaining hidden
    this.isRune = false; // Ghép 4: Rune Tile phát nổ chữ thập
    this.isRainbow = false; // Ghép 5: Rainbow Gem hút ngọc đồng màu
    this.isDrum = false; // Ghép chữ T/L: Ngọc Trống Đồng phát nổ 3x3

    // Overlay graphics for special states
    this.stateOverlay = null;

    // === CONTAINER ===
    // We make this.sprite a Container so it holds the card background, crop mask, and sprite
    this.sprite = new Container();
    // Fake anchor object so it doesn't crash on this.sprite.anchor.set(0.5)
    this.sprite.anchor = {
      set: () => {},
    };

    // Getter for texture so it doesn't crash on external tile.sprite.texture calls
    Object.defineProperty(this.sprite, "texture", {
      get: () => (this.imageSprite ? this.imageSprite.texture : null),
      configurable: true,
    });

    // 1. Card Background Graphics
    this.cardBg = new Graphics();
    this.sprite.addChild(this.cardBg);

    // 2. Animal Image Sprite (100% colorful, bright, and clear)
    this.imageSprite = App.sprite(this.color);
    this.imageSprite.anchor.set(0.5);
    this.sprite.addChild(this.imageSprite);

    // 3. Crop Mask Graphics
    this.cardMask = new Graphics();
    this.sprite.addChild(this.cardMask);
    this.imageSprite.mask = this.cardMask;

    // Draw the card layout
    this.drawCardLayout();

    // Scale the image sprite
    this.resizeSprite();
  }

  drawCardLayout() {
    const maskSize = 90; // Enlarged from 76 to 90 for zoomed-in character display
    const maskRadius = 12;

    this.cardBg.clear();

    // Soft drop shadow under the tile
    this.cardBg.roundRect(
      -maskSize / 2,
      -maskSize / 2 + 3,
      maskSize,
      maskSize,
      maskRadius,
    );
    this.cardBg.fill({ color: 0x000000, alpha: 0.25 });

    // Thin elegant white frame around the tile image
    this.cardBg.roundRect(
      -maskSize / 2,
      -maskSize / 2,
      maskSize,
      maskSize,
      maskRadius,
    );
    this.cardBg.stroke({ color: 0xffffff, width: 2.2 });

    // Crop Mask to isolate the animal character (full rounded rectangle)
    this.cardMask.clear();
    this.cardMask.roundRect(
      -maskSize / 2,
      -maskSize / 2,
      maskSize,
      maskSize,
      maskRadius,
    );
    this.cardMask.fill({ color: 0xffffff });
  }

  resizeSprite() {
    const targetSize = App.config.tileSize;
    const texture = this.imageSprite.texture;
    const textureWidth = texture.orig.width;
    const textureHeight = texture.orig.height;
    const baseSize = Math.max(textureWidth, textureHeight);
    // Zoom in slightly (1.1x) to show mostly the character and crop the background,
    // but keep it small enough so the head/legs are not cut off by the mask.
    const scale = (targetSize / baseSize) * 1.1;
    this.imageSprite.scale.set(scale);
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
    return new Promise((resolve) => {
      gsap.to(this.sprite, {
        x: position.x + halfTile,
        y: position.y + halfTile,
        duration: duration,
        ease: "back.out(1.4)",
        onComplete: () => {
          if (this.sprite && !this.sprite.destroyed) {
            const baseScale = 1.0;

            gsap
              .timeline()
              .to(this.sprite.scale, {
                x: baseScale * 1.08,
                y: baseScale * 0.92,
                duration: 0.06,
              })
              .to(this.sprite.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.08,
              });
          }
          resolve();
        },
      });
      if (this.stateOverlay && !this.stateOverlay.destroyed) {
        gsap.to(this.stateOverlay, {
          x: position.x + halfTile,
          y: position.y + halfTile,
          duration: duration,
          ease: "back.out(1.4)",
        });
      }
    });
  }

  /**
   * Animation rơi xuống (cho tiles mới hoặc tiles dịch chuyển)
   *
   * Khác moveTo():
   *   - Chỉ thay đổi Y (rơi thẳng đứng)
   *   - Dùng ease 'power2.in' để rơi gia tốc
   *   - Thêm hiệu ứng nén (squash) và giãn (stretch) khi chạm đất
   *
   * @param {{x: number, y: number}} position - Vị trí đích
   * @param {number} delay - Thời gian chờ trước khi bắt đầu rơi (giây)
   * @returns {Promise} Resolve khi animation hoàn tất
   */
  fallDownTo(position, delay = 0) {
    const halfTile = App.config.tileSize / 2;
    return new Promise((resolve) => {
      gsap.to(this.sprite, {
        y: position.y + halfTile,
        duration: 0.45,
        delay: delay,
        ease: "power2.in",
        onComplete: () => {
          soundManager.playLand();
          if (this.sprite && !this.sprite.destroyed) {
            const baseScale = 1.0; // Standard container baseline scale

            gsap
              .timeline()
              .to(this.sprite.scale, {
                x: baseScale * 1.15,
                y: baseScale * 0.82,
                duration: 0.08,
                ease: "power1.out",
              })
              .to(this.sprite.scale, {
                x: baseScale * 0.9,
                y: baseScale * 1.08,
                duration: 0.08,
                ease: "power1.inOut",
              })
              .to(this.sprite.scale, {
                x: baseScale,
                y: baseScale,
                duration: 0.1,
                ease: "sine.out",
              });
          }
          resolve();
        },
      });
      if (this.stateOverlay && !this.stateOverlay.destroyed) {
        gsap.to(this.stateOverlay, {
          y: position.y + halfTile,
          duration: 0.45,
          delay: delay,
          ease: "power2.in",
        });
      }
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
   * Reset the tile to be reused from the pool
   * @param {string} color - The new color
   */
  reset(color) {
    this.color = color;
    if (this.imageSprite) {
      this.imageSprite.texture = Texture.from(color);
    }
    this.sprite.alpha = 1;
    this.sprite.scale.set(1, 1);
    this.sprite.visible = true;
    this.isRemoving = false;

    // Reset all states
    this.frozen = false;
    this.frozenDuration = 0;
    this.corrupt = false;
    this.poisoned = false;
    this.isStone = false;
    this.isVoid = false;
    this.hidden = false;
    this.hiddenDuration = 0;
    this.isRune = false;
    this.isRainbow = false;
    this.isDrum = false;

    this.resizeSprite();
    this.updateStateOverlay();
  }

  /**
   * Change tile color (for shuffle, clone, rainbow abilities)
   * Replaces the sprite texture and resets corrupt/poisoned states.
   *
   * @param {string} newColor - New color name (e.g. 'fire', 'water')
   */
  changeColor(newColor) {
    if (this.color === newColor) return;
    this.color = newColor;
    if (this.imageSprite) {
      this.imageSprite.texture = Texture.from(newColor);
    }
    this.drawCardLayout();
    this.resizeSprite();
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
      // Thick glowing golden border (Center left transparent to show avatar)
      overlay.roundRect(
        -tileSize / 2 + 4,
        -tileSize / 2 + 4,
        tileSize - 8,
        tileSize - 8,
        12,
      );
      overlay.stroke({ color: 0xffdd57, width: 4, alpha: 0.95 });

      overlay.roundRect(
        -tileSize / 2 + 7,
        -tileSize / 2 + 7,
        tileSize - 14,
        tileSize - 14,
        10,
      );
      overlay.stroke({ color: 0xffffff, width: 1.5, alpha: 0.5 });

      gsap.to(overlay, {
        alpha: 0.65,
        duration: 0.65,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    } else if (this.isRainbow) {
      // Glowing outer nested rainbow spectrum borders (Center left transparent to show avatar)
      const rainbowColors = [
        0xff1744, 0xff9100, 0xffea00, 0x00e676, 0x2979ff, 0xd500f9,
      ];
      rainbowColors.forEach((c, idx) => {
        const offset = 3 + idx * 2.8;
        overlay.roundRect(
          -tileSize / 2 + offset,
          -tileSize / 2 + offset,
          tileSize - offset * 2,
          tileSize - offset * 2,
          12 - idx,
        );
        overlay.stroke({ color: c, width: 2.2, alpha: 0.95 });
      });

      overlay.scale.set(1.0);
      gsap.to(overlay.scale, {
        x: 1.08,
        y: 1.08,
        duration: 0.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    } else if (this.isDrum) {
      // Draw a gorgeous Bronze Drum (Trống Đồng Đông Sơn) procedurally:
      // 1. Bronze colored circular base outline
      overlay.circle(0, 0, tileSize / 2 - 4);
      overlay.stroke({ color: 0xcd7f32, width: 4.5, alpha: 0.95 });

      // 2. Inner gold circle
      overlay.circle(0, 0, tileSize / 2 - 8);
      overlay.stroke({ color: 0xffa726, width: 1.8, alpha: 0.75 });

      // 3. Central Sunburst rays (Ngôi sao mặt trời 8 cánh ở tâm trống đồng)
      const rays = 8;
      for (let r = 0; r < rays; r++) {
        const angle = (r * Math.PI * 2) / rays;
        const outerX = Math.cos(angle) * 12;
        const outerY = Math.sin(angle) * 12;
        overlay.moveTo(0, 0);
        overlay.lineTo(outerX, outerY);
      }
      overlay.stroke({ color: 0xffe082, width: 2.2, alpha: 0.9 });

      // 4. Subtle rotation pulsing animation
      gsap.to(overlay, {
        rotation: Math.PI * 2,
        duration: 12,
        repeat: -1,
        ease: "none",
      });
    }

    if (
      this.sprite.parent &&
      (this.frozen ||
        this.corrupt ||
        this.poisoned ||
        this.hidden ||
        this.isRune ||
        this.isRainbow ||
        this.isDrum)
    ) {
      this.stateOverlay = overlay;
      overlay.x = this.sprite.x;
      overlay.y = this.sprite.y;
      overlay.zIndex = this.sprite.zIndex + 0.5;
      this.sprite.parent.addChild(overlay);
    } else {
      overlay.destroy();
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
    if (this.isRemoving || !this.sprite) return; // Đã bị xóa rồi
    this.isRemoving = true;

    // Xóa tham chiếu 2 chiều ngay lập tức để logic game không dính lỗi
    if (this.field) {
      this.field.tile = null;
      this.field = null;
    }

    if (immediate) {
      if (this.sprite.parent) {
        this.sprite.parent.removeChild(this.sprite);
      }
      this._cleanupAllOverlays();
      Tile.pool.push(this);
    } else {
      // Animation biến mất
      gsap.to(this.sprite.scale, {
        x: 0.1,
        y: 0.1,
        duration: 0.15,
      });
      gsap.to(this.sprite, {
        alpha: 0,
        duration: 0.15,
        ease: "power2.in",
        onComplete: () => {
          if (this.sprite && this.sprite.parent) {
            this.sprite.parent.removeChild(this.sprite);
          }
          this._cleanupAllOverlays();
          Tile.pool.push(this);
        },
      });
    }
  }

  _cleanupAllOverlays() {
    if (this.stateOverlay) {
      if (this.stateOverlay.parent) {
        this.stateOverlay.parent.removeChild(this.stateOverlay);
      }
      if (!this.stateOverlay.destroyed) {
        this.stateOverlay.destroy();
      }
      this.stateOverlay = null;
    }
    this._cleanupBoardOverlays();
  }

  /**
   * Remove board-managed overlay Graphics (frozen, corrupt, poison).
   * These are created by Board.freezeRandom, Board.corruptRandom, Board.poisonRandom
   * and need explicit cleanup when a tile is removed via match/cascade.
   * @private
   */
  _cleanupBoardOverlays() {
    const overlayKeys = ["_frozenOverlay", "_corruptOverlay", "_poisonOverlay"];
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

// Global Object Pool for Tiles
Tile.pool = [];

Tile.create = function (color) {
  if (Tile.pool.length > 0) {
    const tile = Tile.pool.pop();
    tile.reset(color);
    return tile;
  }
  return new Tile(color);
};

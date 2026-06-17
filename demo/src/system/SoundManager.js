/**
 * ===== src/system/SoundManager.js =====
 *
 * Quản lý nhạc nền và hiệu ứng âm thanh (SFX).
 * Sử dụng Web Audio API để tổng hợp trực tiếp hiệu ứng âm thanh (Synthesizer)
 * giúp giảm dung lượng game, không cần tải file ngoài và tránh lỗi CORS.
 */

class SoundManager {
    constructor() {
        this.ctx = null;
        this.bgm = null;
        this.enabled = true;
        this.lastLandTime = 0;
    }

    /**
     * Khởi tạo AudioContext khi có tương tác đầu tiên của người dùng
     */
    init() {
        if (this.ctx) {
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
            return;
        }
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            this.ctx = new AudioContextClass();
            if (this.ctx.state === 'suspended') {
                this.ctx.resume().catch(() => {});
            }
        }
    }

    /**
     * Phát nhạc nền chiptune lặp lại vô tận
     */
    playBGM() {
        if (!this.enabled) return;
        this.init();
        if (this.bgm) return;

        // Tải nhạc nền chiptune từ CDN Phaser chính thức
        this.bgm = new Audio("https://labs.phaser.io/assets/audio/CatAstroPhi_shmup_normal.mp3");
        this.bgm.loop = true;
        this.bgm.volume = 0.05; // Giảm nhạc nền nhỏ nhẹ hơn nữa để SFX nổi bật

        // Đồng bộ với trạng thái tắt tiếng của wink-bridge
        if (window.__GLOBAL_MUTE__) {
            this.bgm.muted = true;
        }

        this.bgm.play().catch(err => {
            console.log("Audio play deferred until user interaction:", err);
        });
    }

    /**
     * Dừng nhạc nền
     */
    stopBGM() {
        if (this.bgm) {
            try {
                this.bgm.pause();
            } catch (_) { }
            this.bgm = null;
        }
    }

    /**
     * Hiệu ứng âm thanh khi bấm chọn ngọc / di chuột qua nút
     */
    playClick() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(450, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(900, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    /**
     * Hiệu ứng âm thanh khi có cụm ngọc phát nổ thường (Match 3)
     */
    playMatch() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.16);

        gain.gain.setValueAtTime(0.35, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.16);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.16);
    }

    /**
     * Hiệu ứng âm thanh khi nổ liên hoàn (Combo).
     * Cao độ âm thanh (pitch) sẽ tăng tiến theo chỉ số combo.
     *
     * @param {number} comboNum - Số combo (2, 3, 4, ...)
     */
    playCombo(comboNum) {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;

        const baseFreq = 523.25; // Nốt Đồ (C5)
        const multiplier = 1 + (comboNum - 1) * 0.16;
        const freq = baseFreq * multiplier;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(freq * 1.4, this.ctx.currentTime + 0.22);

        gain.gain.setValueAtTime(0.28, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.22);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.22);
    }

    /**
     * Nhạc chiến thắng khi đạt kỷ lục mới
     */
    playVictory() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;

        const now = this.ctx.currentTime;
        const playTone = (freq, start, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + start);
            gain.gain.setValueAtTime(0.28, now + start);
            gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);
            osc.start(now + start);
            osc.stop(now + start + duration);
        };

        // Arpeggio Đô Trưởng: C5 -> E5 -> G5 -> C6 sáng rực rỡ
        playTone(523.25, 0, 0.12);
        playTone(659.25, 0.1, 0.12);
        playTone(783.99, 0.2, 0.12);
        playTone(1046.50, 0.3, 0.28);
    }

    /**
     * Nhạc buồn khi kết thúc ván chơi (Game Over)
     */
    playGameOver() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;

        const now = this.ctx.currentTime;
        const playTone = (freq, start, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now + start);
            gain.gain.setValueAtTime(0.22, now + start);
            gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);
            osc.start(now + start);
            osc.stop(now + start + duration);
        };

        // Đi xuống trầm buồn: G4 -> Eb4 -> C4
        playTone(392.00, 0, 0.18);
        playTone(311.13, 0.14, 0.18);
        playTone(261.63, 0.28, 0.35);
    }

    /**
     * Hiệu ứng âm thanh khi tráo đổi ngọc (Swap whoosh)
     */
    playSwap() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(150, this.ctx.currentTime + 0.15);

        gain.gain.setValueAtTime(0.22, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    /**
     * Hiệu ứng âm thanh khi ngọc tiếp đất (Wooden fall tap) - được throttle 100ms
     */
    playLand() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;

        const now = Date.now();
        if (now - this.lastLandTime < 100) return;
        this.lastLandTime = now;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.setValueAtTime(100, this.ctx.currentTime + 0.05);

        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    /**
     * Hiệu ứng âm thanh nổ chữ thập của ngọc Rune (Bass explosion)
     */
    playRuneExplosion() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;

        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(40, this.ctx.currentTime + 0.4);

        gain.gain.setValueAtTime(0.45, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.4);
    }

    /**
     * Hiệu ứng âm thanh nổ sắc cầu vồng (Rising sci-fi arpeggio)
     */
    playRainbowExplosion() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;

        const now = this.ctx.currentTime;
        const playTone = (freq, start, duration) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + start);
            osc.frequency.exponentialRampToValueAtTime(freq * 2, now + start + duration);
            gain.gain.setValueAtTime(0.25, now + start);
            gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);
            osc.start(now + start);
            osc.stop(now + start + duration);
        };

        playTone(300, 0, 0.15);
        playTone(450, 0.08, 0.15);
        playTone(600, 0.16, 0.25);
    }

    /**
     * Hiệu ứng siêu bão nổ (Super Blast SFX)
     */
    playSuperExplosion() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;

        const now = this.ctx.currentTime;
        
        // 1. Bass drop (Deep sawtooth)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(220, now);
        osc1.frequency.linearRampToValueAtTime(30, now + 0.6);
        gain1.gain.setValueAtTime(0.55, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        osc1.start();
        osc1.stop(now + 0.6);

        // 2. High-pitch chime sweep (Sine wave)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(600, now);
        osc2.frequency.exponentialRampToValueAtTime(1800, now + 0.4);
        gain2.gain.setValueAtTime(0.3, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc2.start();
        osc2.stop(now + 0.4);
    }

    /**
     * Hiệu ứng tiếng chiêng/trống đồng Đông Sơn trầm vang (Resounding low gong overtone)
     */
    playDrumExplosion() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;
        const now = this.ctx.currentTime;
        
        // Bass strike (Low-frequency drum body)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(130, now);
        osc1.frequency.linearRampToValueAtTime(40, now + 0.55);
        gain1.gain.setValueAtTime(0.5, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.55);
        osc1.start();
        osc1.stop(now + 0.55);
        
        // Metallic gong resonance (Muffled overtones)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(415, now); // G#4 gong overtone
        osc2.frequency.linearRampToValueAtTime(523, now + 0.45); // C5 gong sweep
        gain2.gain.setValueAtTime(0.25, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        osc2.start();
        osc2.stop(now + 0.45);
    }
}

export const soundManager = new SoundManager();

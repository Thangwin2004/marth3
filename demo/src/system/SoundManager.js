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
    }

    /**
     * Khởi tạo AudioContext khi có tương tác đầu tiên của người dùng
     */
    init() {
        if (this.ctx) return;
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (AudioContextClass) {
            this.ctx = new AudioContextClass();
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
        this.bgm.volume = 0.15; // Giữ nhạc nền nhỏ nhẹ dễ chịu

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
            } catch (_) {}
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

        gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
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

        gain.gain.setValueAtTime(0.16, this.ctx.currentTime);
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

        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
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
            gain.gain.setValueAtTime(0.12, now + start);
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
            gain.gain.setValueAtTime(0.08, now + start);
            gain.gain.exponentialRampToValueAtTime(0.01, now + start + duration);
            osc.start(now + start);
            osc.stop(now + start + duration);
        };

        // Đi xuống trầm buồn: G4 -> Eb4 -> C4
        playTone(392.00, 0, 0.18);
        playTone(311.13, 0.14, 0.18);
        playTone(261.63, 0.28, 0.35);
    }
}

export const soundManager = new SoundManager();

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

        const baseFreq = 261.63; // Nốt Đồ trung tâm (C4)
        const pitchStep = 1 + (comboNum - 1) * 0.12;
        const rootFreq = baseFreq * pitchStep;
        
        const now = this.ctx.currentTime;
        // Ascending major arpeggio sweep (Root -> Major 3rd -> Perfect 5th -> Octave)
        const notes = [rootFreq, rootFreq * 1.25, rootFreq * 1.5, rootFreq * 2];
        
        notes.forEach((freq, index) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'triangle'; // triangle waves create a warm, punchy arcade chime
            osc.frequency.setValueAtTime(freq, now + index * 0.04);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + index * 0.04 + 0.08);
            
            // Volume increases slightly with higher combos to feel more intense/satisfying
            const vol = 0.25 + Math.min(0.12, comboNum * 0.02);
            gain.gain.setValueAtTime(vol, now + index * 0.04);
            gain.gain.exponentialRampToValueAtTime(0.01, now + index * 0.04 + 0.08);
            
            osc.start(now + index * 0.04);
            osc.stop(now + index * 0.04 + 0.08);
        });
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
        if (now - this.lastLandTime < 65) return; // slightly lower throttle for snappy rolling cascades
        this.lastLandTime = now;

        const ctxTime = this.ctx.currentTime;

        // 1. High-frequency sharp impact click (Transient attack)
        const clickOsc = this.ctx.createOscillator();
        const clickGain = this.ctx.createGain();
        clickOsc.connect(clickGain);
        clickGain.connect(this.ctx.destination);
        
        clickOsc.type = 'sine';
        clickOsc.frequency.setValueAtTime(1800, ctxTime);
        clickOsc.frequency.exponentialRampToValueAtTime(800, ctxTime + 0.02);
        
        clickGain.gain.setValueAtTime(0.28, ctxTime);
        clickGain.gain.exponentialRampToValueAtTime(0.01, ctxTime + 0.02);
        
        clickOsc.start();
        clickOsc.stop(ctxTime + 0.02);

        // 2. Resonant woody/stone body thump (Decay)
        const bodyOsc = this.ctx.createOscillator();
        const bodyGain = this.ctx.createGain();
        bodyOsc.connect(bodyGain);
        bodyGain.connect(this.ctx.destination);
        
        bodyOsc.type = 'triangle';
        bodyOsc.frequency.setValueAtTime(360, ctxTime);
        bodyOsc.frequency.exponentialRampToValueAtTime(110, ctxTime + 0.1);
        
        bodyGain.gain.setValueAtTime(0.45, ctxTime); // Louder resonant body thump
        bodyGain.gain.exponentialRampToValueAtTime(0.01, ctxTime + 0.1);
        
        bodyOsc.start();
        bodyOsc.stop(ctxTime + 0.1);
    }

    /**
     * Hiệu ứng âm thanh nổ chữ thập của ngọc Rune (Bass explosion)
     */
    playRuneExplosion() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;
        const now = this.ctx.currentTime;

        // 1. Deep rumble punch
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(180, now);
        osc1.frequency.exponentialRampToValueAtTime(45, now + 0.35);
        gain1.gain.setValueAtTime(0.45, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        osc1.start();
        osc1.stop(now + 0.35);

        // 2. Bamboo snapping crackles (3 rapid high-pitched wood cracking sounds)
        const snaps = [880, 1150, 680];
        snaps.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + idx * 0.05);
            gain.gain.setValueAtTime(0.2, now + idx * 0.05);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.05 + 0.04);
            
            osc.start(now + idx * 0.05);
            osc.stop(now + idx * 0.05 + 0.04);
        });

        // 3. Bamboo leaf rustle sweep
        const oscLeaf = this.ctx.createOscillator();
        const gainLeaf = this.ctx.createGain();
        oscLeaf.connect(gainLeaf);
        gainLeaf.connect(this.ctx.destination);
        oscLeaf.type = 'sine';
        oscLeaf.frequency.setValueAtTime(1000, now);
        oscLeaf.frequency.exponentialRampToValueAtTime(250, now + 0.3);
        gainLeaf.gain.setValueAtTime(0.18, now);
        gainLeaf.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        oscLeaf.start();
        oscLeaf.stop(now + 0.3);
    }

    /**
     * Hiệu ứng âm thanh nổ sắc cầu vồng (Rising sci-fi arpeggio)
     */
    playRainbowExplosion() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;
        const now = this.ctx.currentTime;

        // 1. Warm base swell
        const baseOsc = this.ctx.createOscillator();
        const baseGain = this.ctx.createGain();
        baseOsc.connect(baseGain);
        baseGain.connect(this.ctx.destination);
        baseOsc.type = 'sine';
        baseOsc.frequency.setValueAtTime(220, now);
        baseOsc.frequency.exponentialRampToValueAtTime(650, now + 0.42);
        baseGain.gain.setValueAtTime(0.3, now);
        baseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.42);
        baseOsc.start();
        baseOsc.stop(now + 0.42);

        // 2. Magical pentatonic sparkle cascade (G4, A4, C5, D5, E5, G5, A5, C6)
        const scale = [392.00, 440.00, 523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
        scale.forEach((freq, idx) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + idx * 0.03);
            osc.frequency.exponentialRampToValueAtTime(freq * 1.15, now + idx * 0.03 + 0.08);
            
            gain.gain.setValueAtTime(0.24, now + idx * 0.03);
            gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.03 + 0.08);
            
            osc.start(now + idx * 0.03);
            osc.stop(now + idx * 0.03 + 0.08);
        });
    }

    /**
     * Hiệu ứng siêu bão nổ (Super Blast SFX)
     */
    playSuperExplosion() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;

        const now = this.ctx.currentTime;
        
        // 1. Massive deep rumble (Low-frequency triangle sweep)
        const osc1 = this.ctx.createOscillator();
        const gain1 = this.ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(this.ctx.destination);
        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(180, now);
        osc1.frequency.linearRampToValueAtTime(30, now + 0.85);
        gain1.gain.setValueAtTime(0.65, now);
        gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.85);
        osc1.start();
        osc1.stop(now + 0.85);

        // 2. Exploding crackle (Sawtooth burst)
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(240, now);
        osc2.frequency.exponentialRampToValueAtTime(60, now + 0.5);
        gain2.gain.setValueAtTime(0.38, now);
        gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc2.start();
        osc2.stop(now + 0.5);

        // 3. Shimmering sweep
        const osc3 = this.ctx.createOscillator();
        const gain3 = this.ctx.createGain();
        osc3.connect(gain3);
        gain3.connect(this.ctx.destination);
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(500, now);
        osc3.frequency.exponentialRampToValueAtTime(2200, now + 0.5);
        gain3.gain.setValueAtTime(0.38, now);
        gain3.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        osc3.start();
        osc3.stop(now + 0.5);
    }

    /**
     * Hiệu ứng tiếng chiêng/trống đồng Đông Sơn trầm vang (Resounding low gong overtone)
     */
    playDrumExplosion() {
        this.init();
        if (!this.ctx || !this.enabled || window.__GLOBAL_MUTE__) return;
        const now = this.ctx.currentTime;
        
        // 1. Initial Sharp Metallic Strike (the hammer hit)
        const strikeFreqs = [440, 660, 990, 1320];
        strikeFreqs.forEach(freq => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, now);
            gain.gain.setValueAtTime(0.2, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
            
            osc.start();
            osc.stop(now + 0.08);
        });

        // 2. Deep Drum Body Strike (Low-frequency impact)
        const drumOsc = this.ctx.createOscillator();
        const drumGain = this.ctx.createGain();
        drumOsc.connect(drumGain);
        drumGain.connect(this.ctx.destination);
        drumOsc.type = 'triangle';
        drumOsc.frequency.setValueAtTime(140, now);
        drumOsc.frequency.linearRampToValueAtTime(45, now + 0.5);
        drumGain.gain.setValueAtTime(0.6, now);
        drumGain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        drumOsc.start();
        drumOsc.stop(now + 0.5);
        
        // 3. Majestic Gong Resonance (Resounding ringing tone)
        // Three slightly detuned oscillators to create a natural, rich chorus/reverb ring
        const resonanceFreq = 220; // A3 (deep, powerful gong note)
        const detunes = [-4, 0, 5]; // cents
        detunes.forEach(detune => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(resonanceFreq, now);
            osc.detune.setValueAtTime(detune, now);
            
            gain.gain.setValueAtTime(0.4, now);
            // Let it ring out for 1.25 seconds!
            gain.gain.exponentialRampToValueAtTime(0.005, now + 1.25);
            
            osc.start();
            osc.stop(now + 1.25);
        });
    }
}

export const soundManager = new SoundManager();

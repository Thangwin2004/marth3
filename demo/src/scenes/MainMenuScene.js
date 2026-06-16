import { Container, Graphics, Sprite, Texture, Text, Assets } from 'pixi.js';
import gsap from 'gsap';
import { Config } from '../config.js';
import { App } from '../system/App.js';
import { sceneManager } from '../system/SceneManager.js';
import { saveManager } from '../system/SaveManager.js';
import { GameScene } from './GameScene.js';

const ALL_AVATAR_FILES = [
    '001_avatar_laclac.png', '002_avatar_cat_lick1.png', '003_avatar_duck.png', '004_avatar_turtle.png',
    '005_avatar_long.png', '006_avatar_horse.png', '007_avatar_tiguawhite.png', '008_avatar_husky.png',
    '009_avatar_doremonk.png', '010_avatar_echxanh1.png', '011_avatar_nudaeng.png', '012_avatar_hubcat.png',
    '013_avatar_unicorn.png', '014_avatar_zongbadou.png', '015_avatar_dauLan.png', '016_avatar_banhtung.png',
    '017_avatar_tiguayel.png', '018_avatar_megachard.png', '019_avatar_gigaboy.png', '020_avatar_cloudball.png',
    '021_avatar_culama.png', '022_avatar_poolpanda.png', '023_avatar_trollvn.png', '024_avatar_heothy.png',
    '025_avatar_zolype.png', '026_avatar_crick.png', '027_avatar_penguine.png', '028_avatar_timao.png',
    '029_avatar_caocal.png', '030_avatar_cowboy.png', '031_avatar_ninjadog.png', '032_avatar_petrocat.png',
    '033_avatar_richmonkey.png', '034_avatar_hazagi.png', '035_avatar_dogoin.png', '036_avatar_watermelon.png',
    '037_avatar_timone.png', '038_avatar_ronaldo.png', '039_avatar_hustmouse.png', '040_avatar_hitbear.png',
    '041_avatar_echxanh2.png', '042_avatar_zolype2.png', '043_avatar_cat_lick2.png', '044_avatar_poolpanda2.png'
];

export class MainMenuScene {
    constructor(data = {}) {
        this.container = new Container();
        this.container.sortableChildren = true;

        App.setBackgroundColor(0x0a0a1a);

        // === BACKGROUND ===
        const bg = new Sprite(Texture.WHITE);
        bg.width = Config.canvas.width;
        bg.height = Config.canvas.height;
        bg.tint = 0x0a0a1a; // dark fallback tint
        this.container.addChild(bg);

        // Load random background from the 3 new options
        const bgIndex = Math.floor(Math.random() * 3) + 1;
        const bgPath = `/assets/backgroud/vietnamese_cultural_landscape_background_${bgIndex}/screen.png`;
        Assets.load(bgPath).then(texture => {
            if (bg.destroyed) return;
            bg.texture = texture;
            bg.tint = 0x444444; // dim background for higher contrast
        }).catch(err => {
            console.error("Failed to load Main Menu background:", err);
        });

        // === PARTICLES ===
        const tempParticle = new Graphics();
        tempParticle.circle(8, 8, 8);
        tempParticle.fill({ color: 0xffffff });
        const particleTexture = App.app.renderer.generateTexture({ target: tempParticle });
        tempParticle.destroy();

        // Spawn 30 drifting particles
        this.particles = [];
        for (let i = 0; i < 30; i++) {
            const size = 1 + Math.random() * 3;
            const p = new Sprite(particleTexture);
            p.anchor.set(0.5);
            p.width = size * 2;
            p.height = size * 2;
            p.alpha = 0.1 + Math.random() * 0.2;
            p.x = Math.random() * Config.canvas.width;
            p.y = Math.random() * Config.canvas.height;
            this.container.addChild(p);
            this.particles.push(p);

            // Animate upward drift
            gsap.to(p, {
                y: -20,
                x: p.x + (Math.random() - 0.5) * 100,
                alpha: 0,
                duration: 5 + Math.random() * 8,
                repeat: -1,
                delay: Math.random() * 5,
                onRepeat: () => {
                    p.y = Config.canvas.height + 20;
                    p.x = Math.random() * Config.canvas.width;
                    p.alpha = 0.1 + Math.random() * 0.2;
                },
            });
        }

        // === TITLE ===
        const titleContainer = new Container();
        titleContainer.x = Config.canvas.width / 2;
        titleContainer.y = 200;
        this.container.addChild(titleContainer);

        // Glow behind title (Sprite-based)
        const tempGlow = new Graphics();
        tempGlow.circle(120, 120, 120);
        tempGlow.fill({ color: 0xffffff });
        const glowTexture = App.app.renderer.generateTexture({ target: tempGlow });
        tempGlow.destroy();
        const glow = new Sprite(glowTexture);
        glow.anchor.set(0.5);
        glow.y = -100; // Positioned behind the logo
        glow.tint = 0xffe082; // Warm golden glow to match the new logo
        glow.alpha = 0.15;
        titleContainer.addChild(glow);

        gsap.to(glow, { alpha: 0.25, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        gsap.to(glow.scale, { x: 1.3, y: 1.3, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' });

        // Load and add the new logo
        Assets.load('/logo.png').then(texture => {
            if (titleContainer.destroyed) return;
            const logo = new Sprite(texture);
            logo.anchor.set(0.5);
            logo.y = -100; // Position above title text
            logo.width = 140; // Increased size from 120 to 140 for better visibility
            logo.height = 140;
            titleContainer.addChild(logo);

            // Subtle pulsing animation for the logo
            gsap.to(logo.scale, {
                x: logo.scale.x * 1.06,
                y: logo.scale.y * 1.06,
                duration: 2.5,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }).catch(err => {
            console.error("Failed to load logo.png on main menu:", err);
        });

        // Main title
        const title = new Text({
            text: '🐾 ANIMAL CRUSH',
            style: {
                fontFamily: 'Arial', fontSize: 48, fontWeight: 'bold',
                fill: '#ffffff',
                stroke: { color: '#000000', width: 8 },
                dropShadow: { color: '#000000', blur: 6, distance: 3, alpha: 0.8 },
            },
        });
        title.anchor.set(0.5);
        titleContainer.addChild(title);

        const subtitle = new Text({
            text: 'DỄ THƯƠNG MATCH-3',
            style: {
                fontFamily: 'Arial', fontSize: 22, fontWeight: 'bold',
                fill: '#ffb300', // golden color to match animal theme
                stroke: { color: '#000000', width: 5 },
                letterSpacing: 6,
                dropShadow: { color: '#000000', blur: 4, distance: 2, alpha: 0.8 },
            },
        });
        subtitle.anchor.set(0.5);
        subtitle.y = 44;
        titleContainer.addChild(subtitle);

        // Decorative line
        const line = new Sprite(Texture.WHITE);
        line.anchor.set(0.5);
        line.width = 320;
        line.height = 3;
        line.tint = 0xffb300;
        line.alpha = 0.8;
        line.y = 74;
        titleContainer.addChild(line);

        // === HIGHEST SCORE DISPLAY ===
        const leaderboard = saveManager.getLeaderboard();
        const topScore = leaderboard.length > 0 ? leaderboard[0].score : 0;

        const infoText = new Text({
            text: topScore > 0 ? `🏆 KỶ LỤC ĐIỂM: ${topScore}` : `🎯 Hãy thiết lập kỷ lục điểm số ngay hôm nay!`,
            style: {
                fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold',
                fill: '#ffdd57',
                stroke: { color: '#000000', width: 4 },
                dropShadow: { color: '#000000', blur: 4, distance: 2, alpha: 0.9 }
            },
        });
        infoText.anchor.set(0.5);
        infoText.x = Config.canvas.width / 2;
        infoText.y = 315;
        this.container.addChild(infoText);

        // === MENU BUTTONS ===
        const btnStartY = 370;

        // Button 1: Start Game
        this.createMenuButton(
            '🎮 CHƠI NGAY',
            Config.canvas.width / 2, btnStartY,
            0x4fc3f7, 260,
            async () => {
                await sceneManager.switchTo(GameScene);
            }
        );

        // Button 2: Leaderboard
        this.createMenuButton(
            '🏆 BẢNG THÀNH TÍCH',
            Config.canvas.width / 2, btnStartY + 70,
            0xffb300, 260,
            () => {
                this.showLeaderboard();
            }
        );

        // Button 3: Reset Data
        this.createMenuButton(
            '🗑️ XÓA DỮ LIỆU',
            Config.canvas.width / 2, btnStartY + 140,
            0x8b0000, 260,
            async () => {
                saveManager.reset();
                // Reload main menu
                await sceneManager.switchTo(MainMenuScene);
            }
        );

        // === BOTTOM INFO ===
        const versionText = new Text({
            text: '💎 Pure Match-3 v1.0 | PixiJS v8 | 6 Tile Colors | 8x8 Board',
            style: {
                fontFamily: 'Arial', fontSize: 12, fontWeight: 'bold',
                fill: '#ffffff',
                stroke: { color: '#000000', width: 3 }
            },
        });
        versionText.anchor.set(0.5);
        versionText.x = Config.canvas.width / 2;
        versionText.y = Config.canvas.height - 30;
        this.container.addChild(versionText);

        // === ANIMAL SCROLLING BANNER (PARADE) ===
        const paradeContainer = new Container();
        paradeContainer.y = Config.canvas.height - 75;
        this.container.addChild(paradeContainer);

        // Pick 16 random animal avatars for the scrolling bottom banner
        const paradeFiles = [...ALL_AVATAR_FILES].sort(() => 0.5 - Math.random()).slice(0, 16);
        const paradeSprites = [];
        const spacing = 90;

        const paradePromises = paradeFiles.map((file, idx) => {
            const alias = `menu_parade_${idx}`;
            const src = `/assets/imagebldp/${file}`;
            return Assets.load({ alias, src });
        });

        Promise.all(paradePromises).then(() => {
            if (paradeContainer.destroyed) return;

            paradeFiles.forEach((file, idx) => {
                const alias = `menu_parade_${idx}`;
                const sprite = Sprite.from(alias);
                sprite.anchor.set(0.5);
                sprite.width = 44;
                sprite.height = 44;
                // Place them spaced out horizontally
                sprite.x = idx * spacing;
                paradeContainer.addChild(sprite);
                paradeSprites.push(sprite);
            });

            // Smooth horizontal scrolling ticker
            this.tickerFn = () => {
                const speed = 0.8; // pixels per frame
                paradeSprites.forEach(sprite => {
                    sprite.x -= speed;
                    // Wrap if scrolled off the left edge
                    if (sprite.x < -50) {
                        let maxX = -9999;
                        paradeSprites.forEach(s => {
                            if (s.x > maxX) maxX = s.x;
                        });
                        sprite.x = maxX + spacing;
                    }
                });
            };
            App.app.ticker.add(this.tickerFn);
        });

        // Entrance animation
        titleContainer.alpha = 0;
        titleContainer.y = 170;
        gsap.to(titleContainer, {
            alpha: 1,
            y: 200,
            duration: 0.8,
            ease: 'power2.out',
            delay: 0.2,
            onComplete: () => {
                // Hoạt ảnh bay bồng bềnh nhẹ nhàng
                gsap.to(titleContainer, {
                    y: 208,
                    duration: 2.2,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut'
                });
            }
        });
    }

    createMenuButton(label, x, y, color, width = 220, onClick) {
        const btn = new Container();
        btn.x = x;
        btn.y = y;
        this.container.addChild(btn);

        // Generate rounded rect texture for bg
        const tempBg = new Graphics();
        tempBg.roundRect(0, 0, width, 48, 12);
        tempBg.fill({ color: 0xffffff });
        const bgTexture = App.app.renderer.generateTexture({ target: tempBg });
        tempBg.destroy();

        const bg = new Sprite(bgTexture);
        bg.anchor.set(0.5);
        bg.tint = color;
        bg.alpha = 0.85;
        bg.eventMode = 'static';
        bg.cursor = 'pointer';
        btn.addChild(bg);

        // Generate rounded rect texture for shine
        const tempShine = new Graphics();
        tempShine.roundRect(0, 0, width, 24, 12);
        tempShine.fill({ color: 0xffffff });
        const shineTexture = App.app.renderer.generateTexture({ target: tempShine });
        tempShine.destroy();

        const shine = new Sprite(shineTexture);
        shine.anchor.set(0.5);
        shine.y = -12;
        shine.alpha = 0.08;
        btn.addChild(shine);

        const text = new Text({
            text: label,
            style: { fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold', fill: '#ffffff' },
        });
        text.anchor.set(0.5);
        btn.addChild(text);

        bg.on('pointerover', () => {
            gsap.to(btn.scale, { x: 1.05, y: 1.05, duration: 0.15 });
            gsap.to(bg, { alpha: 1, duration: 0.15 });
        });
        bg.on('pointerout', () => {
            gsap.to(btn.scale, { x: 1, y: 1, duration: 0.15 });
            gsap.to(bg, { alpha: 0.85, duration: 0.15 });
        });
        bg.on('pointerdown', () => {
            onClick();
        });

        // Entrance animation
        btn.alpha = 0;
        btn.y = y + 20;
        gsap.to(btn, { alpha: 1, y, duration: 0.5, delay: 0.4 + (y - 300) * 0.002, ease: 'power2.out' });
    }

    /**
     * Show high score leaderboard modal.
     */
    showLeaderboard() {
        if (this.leaderboardPopup) return;

        const popup = new Container();
        popup.zIndex = 200;
        this.container.addChild(popup);
        this.leaderboardPopup = popup;

        // Dark modal overlay to capture clicks
        const overlay = new Graphics();
        overlay.rect(0, 0, Config.canvas.width, Config.canvas.height);
        overlay.fill({ color: 0x000000, alpha: 0.75 });
        overlay.eventMode = 'static';
        popup.addChild(overlay);

        const modal = new Container();
        modal.x = Config.canvas.width / 2;
        modal.y = Config.canvas.height / 2;
        popup.addChild(modal);

        // Modal bg
        const modalBg = new Graphics();
        modalBg.roundRect(-240, -200, 480, 400, 24);
        modalBg.fill({ color: 0x121a2e, alpha: 0.96 });
        modalBg.stroke({ color: 0xffb300, width: 3, alpha: 0.95 });
        modal.addChild(modalBg);

        // Header Title
        const titleText = new Text({
            text: '🏆 BẢNG THÀNH TÍCH',
            style: {
                fontFamily: 'Arial', fontSize: 32, fontWeight: 'bold',
                fill: '#ffdd57',
                dropShadow: { color: '#000000', blur: 6, distance: 3 }
            },
        });
        titleText.anchor.set(0.5);
        titleText.y = -140;
        modal.addChild(titleText);

        // Fetch top scores
        const list = saveManager.getLeaderboard();

        if (list.length === 0) {
            const emptyText = new Text({
                text: 'Chưa có thành tích nào.\nHãy chơi game để thiết lập kỷ lục nhé! 🚀',
                style: {
                    fontFamily: 'Arial', fontSize: 18, fill: '#aaaaaa', align: 'center', lineHeight: 28
                },
            });
            emptyText.anchor.set(0.5);
            emptyText.y = -10;
            modal.addChild(emptyText);
        } else {
            // Draw list items
            const startY = -80;
            const rowHeight = 42;

            list.forEach((entry, idx) => {
                const rowY = startY + idx * rowHeight;
                const rankIcons = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣'];
                const rankIcon = rankIcons[idx] || '';

                // Rank and Score
                const scoreText = new Text({
                    text: `${rankIcon}  HẠNG ${idx + 1}:   ${entry.score}`,
                    style: {
                        fontFamily: 'Arial', fontSize: 20, fontWeight: 'bold',
                        fill: idx === 0 ? '#ffdd57' : idx === 1 ? '#e0e0e0' : idx === 2 ? '#cd7f32' : '#ffffff'
                    },
                });
                scoreText.anchor.set(0, 0.5);
                scoreText.x = -190;
                scoreText.y = rowY;
                modal.addChild(scoreText);

                // Date stamp
                const dateText = new Text({
                    text: entry.date,
                    style: {
                        fontFamily: 'Arial', fontSize: 14, fill: '#8892b0'
                    },
                });
                dateText.anchor.set(1, 0.5);
                dateText.x = 190;
                dateText.y = rowY;
                modal.addChild(dateText);

                // Divider line (except for last row)
                if (idx < list.length - 1) {
                    const divider = new Graphics();
                    divider.moveTo(-190, rowY + rowHeight / 2);
                    divider.lineTo(190, rowY + rowHeight / 2);
                    divider.stroke({ color: 0x324b8b, width: 1, alpha: 0.3 });
                    modal.addChild(divider);
                }
            });
        }

        // CLOSE Button
        const closeBtn = new Container();
        closeBtn.x = 0;
        closeBtn.y = 145;
        modal.addChild(closeBtn);

        const btnWidth = 160;
        const btnHeight = 44;

        const btnBg = new Graphics();
        btnBg.roundRect(-btnWidth / 2, -btnHeight / 2, btnWidth, btnHeight, 12);
        btnBg.fill({ color: 0x324b8b });
        btnBg.alpha = 0.9;
        btnBg.eventMode = 'static';
        btnBg.cursor = 'pointer';
        closeBtn.addChild(btnBg);

        const btnText = new Text({
            text: 'ĐÓNG',
            style: { fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold', fill: '#ffffff' }
        });
        btnText.anchor.set(0.5);
        closeBtn.addChild(btnText);

        const closePopup = () => {
            gsap.to(modal.scale, { x: 0.7, y: 0.7, duration: 0.25 });
            gsap.to(popup, {
                alpha: 0,
                duration: 0.25,
                onComplete: () => {
                    popup.destroy({ children: true });
                    this.leaderboardPopup = null;
                }
            });
        };

        btnBg.on('pointerover', () => {
            gsap.to(closeBtn.scale, { x: 1.05, y: 1.05, duration: 0.15 });
            btnBg.alpha = 1.0;
        });
        btnBg.on('pointerout', () => {
            gsap.to(closeBtn.scale, { x: 1, y: 1, duration: 0.15 });
            btnBg.alpha = 0.9;
        });
        btnBg.on('pointerdown', () => {
            closePopup();
        });

        // Entrance animation
        popup.alpha = 0;
        gsap.to(popup, { alpha: 1, duration: 0.3 });
        modal.scale.set(0.7);
        gsap.to(modal.scale, { x: 1, y: 1, duration: 0.35, ease: 'back.out(1.8)' });
    }

    destroy() {
        // Stop ticker function on destroy to avoid memory leak
        if (this.tickerFn && App.app && App.app.ticker) {
            App.app.ticker.remove(this.tickerFn);
        }

        const killTweensRecursive = (obj) => {
            gsap.killTweensOf(obj);
            if (obj.scale) gsap.killTweensOf(obj.scale);
            if (obj.children) {
                obj.children.forEach(killTweensRecursive);
            }
        };
        killTweensRecursive(this.container);

        this.particles.forEach(p => {
            gsap.killTweensOf(p);
        });

        this.container.destroy({ children: true });
    }
}

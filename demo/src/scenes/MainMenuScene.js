import { Container, Graphics, Sprite, Texture, Text } from 'pixi.js';
import gsap from 'gsap';
import { Config } from '../config.js';
import { App } from '../system/App.js';
import { sceneManager } from '../system/SceneManager.js';
import { saveManager } from '../system/SaveManager.js';

export class MainMenuScene {
    constructor(data = {}) {
        this.container = new Container();
        this.container.sortableChildren = true;

        App.setBackgroundColor(0x0a0a1a);

        // === BACKGROUND ===
        // Use a solid-color Sprite (Texture.WHITE) instead of Graphics to be 100% immune to PixiJS v8 RenderGroup bugs
        const bg = new Sprite(Texture.WHITE);
        bg.width = Config.canvas.width;
        bg.height = Config.canvas.height;
        bg.tint = 0x0a0a1a;
        this.container.addChild(bg);

        // === PARTICLES ===
        // Draw a circular particle shape ONCE and convert it to a texture for high-performance Sprite rendering
        const tempParticle = new Graphics();
        tempParticle.circle(8, 8, 8);
        tempParticle.fill({ color: 0xffffff });
        const particleTexture = App.app.renderer.generateTexture({ target: tempParticle });
        tempParticle.destroy();

        // Spawn 30 drifting Sprite-based particles
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
        // Game title with glow effect
        const titleContainer = new Container();
        titleContainer.x = Config.canvas.width / 2;
        titleContainer.y = 160;
        this.container.addChild(titleContainer);

        // Generate circular texture for glow once to use a Sprite
        const tempGlow = new Graphics();
        tempGlow.circle(120, 120, 120);
        tempGlow.fill({ color: 0xffffff });
        const glowTexture = App.app.renderer.generateTexture({ target: tempGlow });
        tempGlow.destroy();

        // Glow behind title (Sprite-based)
        const glow = new Sprite(glowTexture);
        glow.anchor.set(0.5);
        glow.tint = 0x4fc3f7;
        glow.alpha = 0.08;
        titleContainer.addChild(glow);
        
        gsap.to(glow, { alpha: 0.15, duration: 2, yoyo: true, repeat: -1, ease: 'sine.inOut' });
        gsap.to(glow.scale, { x: 1.2, y: 1.2, duration: 3, yoyo: true, repeat: -1, ease: 'sine.inOut' });

        // Main title
        const title = new Text({
            text: '⚔️ MATCH-3',
            style: {
                fontFamily: 'Arial', fontSize: 56, fontWeight: 'bold',
                fill: '#ffffff',
                dropShadow: { color: '#4fc3f7', blur: 12, distance: 0, alpha: 0.8 },
            },
        });
        title.anchor.set(0.5);
        titleContainer.addChild(title);

        const subtitle = new Text({
            text: 'BOSS BATTLE RPG',
            style: {
                fontFamily: 'Arial', fontSize: 28, fontWeight: 'bold',
                fill: '#4fc3f7',
                letterSpacing: 8,
            },
        });
        subtitle.anchor.set(0.5);
        subtitle.y = 45;
        titleContainer.addChild(subtitle);

        // Decorative line (Sprite-based using Texture.WHITE)
        const line = new Sprite(Texture.WHITE);
        line.anchor.set(0.5);
        line.width = 300;
        line.height = 2;
        line.tint = 0x4fc3f7;
        line.alpha = 0.4;
        line.y = 75;
        titleContainer.addChild(line);

        // === SAVE INFO ===
        const save = saveManager.load();
        const currentLevel = save.currentLevel || 1;
        const skillCount = save.unlockedSkills?.length || 0;

        const infoText = new Text({
            text: `📂 Level ${currentLevel} | Hero Lvl ${save.heroLevel || 1} | Vàng: ${save.gold || 0}g`,
            style: { fontFamily: 'Arial', fontSize: 16, fill: '#888888' },
        });
        infoText.anchor.set(0.5);
        infoText.x = Config.canvas.width / 2;
        infoText.y = 280;
        this.container.addChild(infoText);

        // === BUTTONS ===
        const btnStartY = 340;

        // Continue button (if save exists)
        if (currentLevel > 1) {
            this.createMenuButton(
                `▶ Continue (Level ${currentLevel})`,
                Config.canvas.width / 2, btnStartY,
                0x4fc3f7, 260,
                async () => {
                    const { LevelSelectScene } = await import('./LevelSelectScene.js');
                    await sceneManager.switchTo(LevelSelectScene);
                }
            );
        }

        // New Game / Play button
        this.createMenuButton(
            currentLevel > 1 ? '🗺️ Level Select' : '⚔️ START GAME',
            Config.canvas.width / 2, btnStartY + (currentLevel > 1 ? 65 : 0),
            currentLevel > 1 ? 0x666666 : 0x4fc3f7, 260,
            async () => {
                if (currentLevel > 1) {
                    const { LevelSelectScene } = await import('./LevelSelectScene.js');
                    await sceneManager.switchTo(LevelSelectScene);
                } else {
                    const { BattleScene } = await import('../battle/BattleScene.js');
                    await sceneManager.switchTo(BattleScene, { level: 1 });
                }
            }
        );

        // Hero Sanctuary button (Anh Hùng Điện)
        this.createMenuButton(
            '🧙 Hero Sanctuary',
            Config.canvas.width / 2, btnStartY + (currentLevel > 1 ? 130 : 65),
            0xffb300, 260,
            async () => {
                const { HeroSanctuaryScene } = await import('./HeroSanctuaryScene.js');
                await sceneManager.switchTo(HeroSanctuaryScene);
            }
        );

        // Unified Reset save button (always visible so players can wipe gold, elements, gear, level progress, etc.)
        this.createMenuButton(
            '🗑️ Reset Toàn Bộ Dữ Liệu',
            Config.canvas.width / 2, btnStartY + (currentLevel > 1 ? 195 : 130),
            0x8b0000, 260,
            async () => {
                saveManager.reset();
                // Refresh menu
                const { MainMenuScene } = await import('./MainMenuScene.js');
                await sceneManager.switchTo(MainMenuScene);
            }
        );

        // === BOTTOM INFO ===
        const versionText = new Text({
            text: 'v1.0 | PixiJS v8 | 10 Levels | 9 Skills',
            style: { fontFamily: 'Arial', fontSize: 12, fill: '#444444' },
        });
        versionText.anchor.set(0.5);
        versionText.x = Config.canvas.width / 2;
        versionText.y = Config.canvas.height - 30;
        this.container.addChild(versionText);

        // === BOSS PARADE (decorative boss emojis along bottom) ===
        const bossEmojis = '🌱 🔥 🧊 ⚡ 🌊 💀 🌋 🌑 🏔️ 👑';
        const parade = new Text({
            text: bossEmojis,
            style: { fontSize: 24, letterSpacing: 12 },
        });
        parade.anchor.set(0.5);
        parade.x = Config.canvas.width / 2;
        parade.y = Config.canvas.height - 70;
        parade.alpha = 0.4;
        this.container.addChild(parade);

        // Subtle drift animation on parade
        gsap.to(parade, { x: Config.canvas.width / 2 + 15, duration: 4, yoyo: true, repeat: -1, ease: 'sine.inOut' });

        // === ENTRANCE ANIMATION ===
        titleContainer.alpha = 0;
        titleContainer.y = 130;
        gsap.to(titleContainer, { alpha: 1, y: 160, duration: 0.8, ease: 'power2.out', delay: 0.2 });
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
        shine.y = -12; // Position it at the top half
        shine.alpha = 0.08;
        btn.addChild(shine);

        const text = new Text({
            text: label,
            style: { fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: '#ffffff' },
        });
        text.anchor.set(0.5);
        btn.addChild(text);

        // Hover
        bg.on('pointerover', () => {
            gsap.to(btn.scale, { x: 1.05, y: 1.05, duration: 0.15 });
            gsap.to(bg, { alpha: 1, duration: 0.15 });
        });
        bg.on('pointerout', () => {
            gsap.to(btn.scale, { x: 1, y: 1, duration: 0.15 });
            gsap.to(bg, { alpha: 0.85, duration: 0.15 });
        });
        bg.on('pointerdown', () => {
            this.container.eventMode = 'none';
            this.container.interactiveChildren = false;
            onClick();
        });

        // Entrance animation
        btn.alpha = 0;
        btn.y = y + 20;
        gsap.to(btn, { alpha: 1, y, duration: 0.5, delay: 0.4 + (y - 300) * 0.002, ease: 'power2.out' });
    }

    destroy() {
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
            if (p.texture && p.texture !== Texture.WHITE) {
                // Keep the shared texture intact but clean up the Sprite
            }
        });
        this.container.destroy({ children: true });
    }
}

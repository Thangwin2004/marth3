import { Container, Graphics, Text } from 'pixi.js';
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
        // Dark gradient background with subtle animated particles
        const bg = new Graphics();
        bg.rect(0, 0, Config.canvas.width, Config.canvas.height);
        bg.fill({ color: 0x0a0a1a });
        this.container.addChild(bg);

        // Floating particles (small circles that drift upward slowly)
        this.particles = [];
        for (let i = 0; i < 30; i++) {
            const p = new Graphics();
            const size = 1 + Math.random() * 3;
            p.circle(0, 0, size);
            p.fill({ color: 0xffffff, alpha: 0.1 + Math.random() * 0.2 });
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

        // Glow behind title
        const glow = new Graphics();
        glow.circle(0, 0, 120);
        glow.fill({ color: 0x4fc3f7, alpha: 0.08 });
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

        // Decorative line
        const line = new Graphics();
        line.rect(-150, 0, 300, 2);
        line.fill({ color: 0x4fc3f7, alpha: 0.4 });
        line.y = 75;
        titleContainer.addChild(line);

        // === SAVE INFO ===
        const save = saveManager.load();
        const currentLevel = save.currentLevel || 1;
        const skillCount = save.unlockedSkills?.length || 0;

        const infoText = new Text({
            text: `📂 Level ${currentLevel} | Skills: ${skillCount}/9`,
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

        // Reset save button
        if (currentLevel > 1) {
            this.createMenuButton(
                '🗑️ Reset Progress',
                Config.canvas.width / 2, btnStartY + 130,
                0x8b0000, 200,
                async () => {
                    saveManager.reset();
                    // Refresh menu
                    const { MainMenuScene } = await import('./MainMenuScene.js');
                    await sceneManager.switchTo(MainMenuScene);
                }
            );
        }

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

        const halfW = width / 2;
        const bg = new Graphics();
        bg.roundRect(-halfW, -24, width, 48, 12);
        bg.fill({ color, alpha: 0.85 });
        bg.stroke({ color: 0xffffff, width: 1, alpha: 0.2 });
        bg.eventMode = 'static';
        bg.cursor = 'pointer';
        btn.addChild(bg);

        // Subtle shine
        const shine = new Graphics();
        shine.roundRect(-halfW, -24, width, 24, 12);
        shine.fill({ color: 0xffffff, alpha: 0.08 });
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
        bg.on('pointerdown', onClick);

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

        this.particles.forEach(p => gsap.killTweensOf(p));
        this.container.destroy({ children: true });
    }
}

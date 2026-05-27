import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { Config } from '../config.js';
import { App } from '../system/App.js';
import { sceneManager } from '../system/SceneManager.js';
import { saveManager } from '../system/SaveManager.js';
import { LEVELS } from '../data/LevelData.js';
import { SKILLS } from '../data/SkillData.js';
import { BattleScene } from '../battle/BattleScene.js';
import { MainMenuScene } from './MainMenuScene.js';

export class LevelSelectScene {
    constructor(data = {}) {
        this.container = new Container();
        this.container.sortableChildren = true;

        App.setBackgroundColor(0x0a0a1a);

        // Background
        const bg = new Graphics();
        bg.rect(0, 0, Config.canvas.width, Config.canvas.height);
        bg.fill({ color: 0x0a0a1a });
        this.container.addChild(bg);

        // Title
        const title = new Text({
            text: '🗺️ SELECT LEVEL',
            style: {
                fontFamily: 'Arial', fontSize: 36, fontWeight: 'bold',
                fill: '#ffffff',
                dropShadow: { color: '#000000', blur: 6, distance: 3 },
            },
        });
        title.anchor.set(0.5);
        title.x = Config.canvas.width / 2;
        title.y = 50;
        this.container.addChild(title);

        // Load save
        const save = saveManager.load();
        const unlockedLevels = save.unlockedLevels || [1];

        // Level cards grid: 5 columns x 2 rows
        const cols = 5;
        const cardW = 170;
        const cardH = 230;
        const gapX = 20;
        const gapY = 25;
        const totalW = cols * cardW + (cols - 1) * gapX;
        const startX = (Config.canvas.width - totalW) / 2;
        const startY = 105;

        for (let i = 1; i <= 10; i++) {
            const levelConfig = LEVELS[i];
            if (!levelConfig) continue;

            const col = (i - 1) % cols;
            const row = Math.floor((i - 1) / cols);
            const x = startX + col * (cardW + gapX);
            const y = startY + row * (cardH + gapY);
            const isUnlocked = unlockedLevels.includes(i);

            this.createLevelCard(x, y, cardW, cardH, levelConfig, isUnlocked, i);
        }

        // Back button
        const backBtn = new Container();
        backBtn.x = 80;
        backBtn.y = Config.canvas.height - 40;
        this.container.addChild(backBtn);

        const backBg = new Graphics();
        backBg.roundRect(-60, -18, 120, 36, 8);
        backBg.fill({ color: 0x444444 });
        backBg.stroke({ color: 0xffffff, width: 1, alpha: 0.2 });
        backBg.eventMode = 'static';
        backBg.cursor = 'pointer';
        backBtn.addChild(backBg);

        const backText = new Text({
            text: '← Back',
            style: { fontFamily: 'Arial', fontSize: 15, fontWeight: 'bold', fill: '#ffffff' },
        });
        backText.anchor.set(0.5);
        backBtn.addChild(backText);

        backBg.on('pointerover', () => gsap.to(backBtn.scale, { x: 1.05, y: 1.05, duration: 0.15 }));
        backBg.on('pointerout', () => gsap.to(backBtn.scale, { x: 1, y: 1, duration: 0.15 }));
        backBg.on('pointerdown', () => {
            sceneManager.switchTo(MainMenuScene);
        });

        // Unlocked skills info
        const skills = save.unlockedSkills || [];
        if (skills.length > 0) {
            const skillIcons = skills.map(id => SKILLS[id]?.icon || '?').join(' ');
            const skillInfo = new Text({
                text: `🎒 Skills: ${skillIcons}`,
                style: { fontFamily: 'Arial', fontSize: 14, fill: '#888888' },
            });
            skillInfo.anchor.set(0.5);
            skillInfo.x = Config.canvas.width / 2;
            skillInfo.y = Config.canvas.height - 40;
            this.container.addChild(skillInfo);
        }
    }

    createLevelCard(x, y, w, h, levelConfig, isUnlocked, levelNum) {
        const card = new Container();
        card.x = x;
        card.y = y;
        this.container.addChild(card);

        // Card background
        const cardBg = new Graphics();
        cardBg.roundRect(0, 0, w, h, 12);

        if (isUnlocked) {
            cardBg.fill({ color: levelConfig.terrain.background || 0x1a1a2e, alpha: 0.9 });
            cardBg.stroke({ color: 0xffffff, width: 2, alpha: 0.2 });
        } else {
            cardBg.fill({ color: 0x1a1a1a, alpha: 0.8 });
            cardBg.stroke({ color: 0x333333, width: 1 });
        }
        card.addChild(cardBg);

        // Level number badge
        const badge = new Graphics();
        badge.circle(w - 20, 20, 16);
        badge.fill({ color: isUnlocked ? 0x4fc3f7 : 0x333333 });
        card.addChild(badge);

        const numText = new Text({
            text: `${levelNum}`,
            style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#ffffff' },
        });
        numText.anchor.set(0.5);
        numText.x = w - 20;
        numText.y = 20;
        card.addChild(numText);

        // Boss emoji (large)
        const bossEmoji = new Text({
            text: isUnlocked ? levelConfig.bossEmoji : '🔒',
            style: { fontSize: isUnlocked ? 42 : 32 },
        });
        bossEmoji.anchor.set(0.5);
        bossEmoji.x = w / 2;
        bossEmoji.y = 65;
        card.addChild(bossEmoji);

        // Boss name
        const nameText = new Text({
            text: isUnlocked ? levelConfig.bossName : 'Locked',
            style: {
                fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold',
                fill: isUnlocked ? '#ffffff' : '#666666',
            },
        });
        nameText.anchor.set(0.5);
        nameText.x = w / 2;
        nameText.y = 105;
        card.addChild(nameText);

        if (isUnlocked) {
            // Terrain info
            const terrainText = new Text({
                text: `${levelConfig.terrain.emoji} ${levelConfig.terrain.name}`,
                style: { fontFamily: 'Arial', fontSize: 11, fill: '#aaaaaa' },
            });
            terrainText.anchor.set(0.5);
            terrainText.x = w / 2;
            terrainText.y = 128;
            card.addChild(terrainText);

            // Boss HP
            const hpText = new Text({
                text: `❤️ ${levelConfig.boss.maxHP} HP`,
                style: { fontFamily: 'Arial', fontSize: 12, fill: '#ff6b6b' },
            });
            hpText.anchor.set(0.5);
            hpText.x = w / 2;
            hpText.y = 150;
            card.addChild(hpText);

            // Weakness/Resistance
            const weakStr = levelConfig.boss.weakness ? `⬇${levelConfig.boss.weakness}` : '';
            const resStr = levelConfig.boss.resistance ? `⬆${levelConfig.boss.resistance}` : '';
            if (weakStr || resStr) {
                const wrText = new Text({
                    text: `${weakStr} ${resStr}`.trim(),
                    style: { fontFamily: 'Arial', fontSize: 10, fill: '#888888' },
                });
                wrText.anchor.set(0.5);
                wrText.x = w / 2;
                wrText.y = 170;
                card.addChild(wrText);
            }

            // Skill reward
            if (levelConfig.skillReward) {
                const skill = SKILLS[levelConfig.skillReward];
                if (skill) {
                    const rewardText = new Text({
                        text: `🎁 ${skill.icon} ${skill.name}`,
                        style: { fontFamily: 'Arial', fontSize: 10, fill: '#4fc3f7' },
                    });
                    rewardText.anchor.set(0.5);
                    rewardText.x = w / 2;
                    rewardText.y = 190;
                    card.addChild(rewardText);
                }
            }

            // Make clickable
            cardBg.eventMode = 'static';
            cardBg.cursor = 'pointer';
            cardBg.on('pointerover', () => {
                gsap.to(card.scale, { x: 1.05, y: 1.05, duration: 0.15 });
                gsap.to(cardBg, { alpha: 1, duration: 0.15 });
            });
            cardBg.on('pointerout', () => {
                gsap.to(card.scale, { x: 1, y: 1, duration: 0.15 });
                gsap.to(cardBg, { alpha: 0.9, duration: 0.15 });
            });
            cardBg.on('pointerdown', () => {
                sceneManager.switchTo(BattleScene, { level: levelNum });
            });
        }

        // Entrance animation
        card.alpha = 0;
        card.y = y + 30;
        gsap.to(card, {
            alpha: 1, y,
            duration: 0.4,
            delay: 0.1 + levelNum * 0.06,
            ease: 'power2.out',
        });
    }

    destroy() {
        this.container.destroy({ children: true });
    }
}

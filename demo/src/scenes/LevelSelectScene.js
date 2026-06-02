import { Container, Graphics, Sprite, Texture, Text, Assets } from 'pixi.js';
import gsap from 'gsap';
import { Config } from '../config.js';
import { App } from '../system/App.js';
import { sceneManager } from '../system/SceneManager.js';
import { saveManager } from '../system/SaveManager.js';
import { LEVELS } from '../data/LevelData.js';
import { SKILLS } from '../data/SkillData.js';

export class LevelSelectScene {
    constructor(data = {}) {
        this.container = new Container();
        this.container.sortableChildren = true;

        App.setBackgroundColor(0x0a0a1a);

        // Background
        const bg = new Sprite(Texture.WHITE);
        bg.width = Config.canvas.width;
        bg.height = Config.canvas.height;
        bg.tint = 0x0a0a1a; // dark fallback tint
        this.container.addChild(bg);

        // Load premium custom background design
        Assets.load('/assets/backgroud/screen.png').then(texture => {
            if (bg.destroyed) return;
            bg.texture = texture;
            bg.tint = 0x555555; // dim background to 33% brightness for high contrast
        }).catch(err => {
            console.error("Failed to load Level Select background:", err);
        });

        // Title
        const title = new Text({
            text: '🗺️ SELECT LEVEL',
            style: {
                fontFamily: 'Arial', fontSize: 36, fontWeight: 'bold',
                fill: '#ffffff',
                stroke: '#000000', strokeThickness: 5,
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

        const backBgWrapper = new Container();
        backBgWrapper.addChild(backBg);
        backBtn.addChild(backBgWrapper);

        const backText = new Text({
            text: '← Back',
            style: { fontFamily: 'Arial', fontSize: 15, fontWeight: 'bold', fill: '#ffffff' },
        });
        backText.anchor.set(0.5);
        backBtn.addChild(backText);

        backBg.on('pointerover', () => gsap.to(backBtn.scale, { x: 1.05, y: 1.05, duration: 0.15 }));
        backBg.on('pointerout', () => gsap.to(backBtn.scale, { x: 1, y: 1, duration: 0.15 }));
        backBg.on('pointerdown', async () => {
            const { MainMenuScene } = await import('./MainMenuScene.js');
            await sceneManager.switchTo(MainMenuScene);
        });

        // Unlocked skills info
        const skills = save.unlockedSkills || [];
        if (skills.length > 0) {
            const skillIcons = skills.map(id => SKILLS[id]?.icon || '?').join(' ');
            const skillInfo = new Text({
                text: `🎒 Skills: ${skillIcons}`,
                style: {
                    fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold',
                    fill: '#ffffff',
                    stroke: '#000000', strokeThickness: 3
                },
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
        const cardBgWrapper = new Container();
        cardBgWrapper.addChild(cardBg);
        card.addChild(cardBgWrapper);

        // Level number badge
        const badge = new Graphics();
        badge.circle(w - 20, 20, 16);
        badge.fill({ color: isUnlocked ? 0x4fc3f7 : 0x333333 });
        
        const badgeWrapper = new Container();
        badgeWrapper.addChild(badge);
        card.addChild(badgeWrapper);

        const numText = new Text({
            text: `${levelNum}`,
            style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#ffffff' },
        });
        numText.anchor.set(0.5);
        numText.x = w - 20;
        numText.y = 20;
        card.addChild(numText);

        // Boss image / emoji (large)
        if (isUnlocked && levelConfig.bossImage) {
            const bossSprite = new Sprite();
            bossSprite.anchor.set(0.5);
            bossSprite.x = w / 2;
            bossSprite.y = 65;

            const bMask = new Graphics();
            bMask.circle(w / 2, 65, 36);
            bMask.fill({ color: 0xffffff });
            card.addChild(bMask);
            bossSprite.mask = bMask;
            card.addChild(bossSprite);

            const border = new Graphics();
            border.circle(w / 2, 65, 37);
            border.stroke({ color: 0xffb300, width: 2, alpha: 0.8 });
            card.addChild(border);

            Assets.load(levelConfig.bossImage).then((texture) => {
                if (card.destroyed || bossSprite.destroyed) return;
                bossSprite.texture = texture;
                bossSprite.width = 72;
                bossSprite.height = 72;
            }).catch(err => {
                console.error("Failed to load boss image in level select:", levelConfig.bossImage, err);
            });
        } else {
            const bossEmoji = new Text({
                text: isUnlocked ? levelConfig.bossEmoji : '🔒',
                style: { fontSize: isUnlocked ? 42 : 32 },
            });
            bossEmoji.anchor.set(0.5);
            bossEmoji.x = w / 2;
            bossEmoji.y = 65;
            card.addChild(bossEmoji);
        }

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

            // Weakness/Resistance Beautiful Display
            const ELEMENT_STYLES = {
                fire: { name: 'Fire', emoji: '🔥', color: '#ff7043' },
                water: { name: 'Water', emoji: '💧', color: '#29b6f6' },
                nature: { name: 'Nature', emoji: '🌿', color: '#66bb6a' },
                ice: { name: 'Ice', emoji: '❄️', color: '#80d8ff' },
                lightning: { name: 'Lightning', emoji: '⚡', color: '#ffd54f' },
                earth: { name: 'Earth', emoji: '⛰️', color: '#a1887f' },
                'wind-air': { name: 'Wind', emoji: '💨', color: '#e0e0e0' },
                'psychic-eye': { name: 'Psychic', emoji: '👁️', color: '#ea80fc' },
                sun: { name: 'Sun', emoji: '☀️', color: '#ffb74d' },
                'poison-death': { name: 'Poison', emoji: '☠️', color: '#b388ff' }
            };

            const wrContainer = new Container();
            wrContainer.y = 170;
            card.addChild(wrContainer);

            const items = [];

            if (levelConfig.boss.weakness) {
                const el = levelConfig.boss.weakness;
                const style = ELEMENT_STYLES[el] || { name: el, emoji: '', color: '#ffffff' };
                
                const item = new Container();
                
                // Down arrow (Weakness) -> Green color for bonus damage!
                const arrow = new Text({
                    text: '⬇',
                    style: { fontFamily: 'Arial', fontSize: 12, fontWeight: 'bold', fill: '#00ff66' }
                });
                arrow.anchor.set(0, 0.5);
                item.addChild(arrow);
                
                const elTxt = new Text({
                    text: `${style.emoji}${style.name}`,
                    style: { fontFamily: 'Arial', fontSize: 10, fontWeight: 'bold', fill: style.color }
                });
                elTxt.anchor.set(0, 0.5);
                elTxt.x = 12;
                item.addChild(elTxt);
                
                items.push(item);
            }

            if (levelConfig.boss.resistance) {
                const el = levelConfig.boss.resistance;
                const style = ELEMENT_STYLES[el] || { name: el, emoji: '', color: '#ffffff' };
                
                const item = new Container();
                
                // Up arrow (Resistance) -> Red color for reduced damage!
                const arrow = new Text({
                    text: '⬆',
                    style: { fontFamily: 'Arial', fontSize: 12, fontWeight: 'bold', fill: '#ff3333' }
                });
                arrow.anchor.set(0, 0.5);
                item.addChild(arrow);
                
                const elTxt = new Text({
                    text: `${style.emoji}${style.name}`,
                    style: { fontFamily: 'Arial', fontSize: 10, fontWeight: 'bold', fill: style.color }
                });
                elTxt.anchor.set(0, 0.5);
                elTxt.x = 12;
                item.addChild(elTxt);
                
                items.push(item);
            }

            // Align items horizontally within the card (w = 170)
            if (items.length === 2) {
                items[0].x = 12;
                items[1].x = w / 2 + 6;
                wrContainer.addChild(items[0]);
                wrContainer.addChild(items[1]);
            } else if (items.length === 1) {
                items[0].x = w / 2;
                items[0].pivot.x = items[0].width / 2;
                wrContainer.addChild(items[0]);
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
            card.eventMode = 'static';
            card.cursor = 'pointer';
            card.on('pointerover', () => {
                gsap.to(card.scale, { x: 1.05, y: 1.05, duration: 0.15 });
                gsap.to(cardBg, { alpha: 1, duration: 0.15 });
            });
            card.on('pointerout', () => {
                gsap.to(card.scale, { x: 1, y: 1, duration: 0.15 });
                gsap.to(cardBg, { alpha: 0.9, duration: 0.15 });
            });
            card.on('pointerdown', async () => {
                // Disable all interaction immediately to prevent hover/out events from starting new tweens during fadeout
                this.container.eventMode = 'none';
                this.container.interactiveChildren = false;

                const { BattleScene } = await import('../battle/BattleScene.js');
                await sceneManager.switchTo(BattleScene, { level: levelNum });
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
        const killTweensRecursive = (obj) => {
            gsap.killTweensOf(obj);
            if (obj.scale) gsap.killTweensOf(obj.scale);
            if (obj.children) {
                obj.children.forEach(killTweensRecursive);
            }
        };
        killTweensRecursive(this.container);

        this.container.destroy({ children: true });
    }
}

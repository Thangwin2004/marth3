import { Container, Graphics, Sprite, Texture, Text } from 'pixi.js';
import gsap from 'gsap';
import { Config } from '../config';
import { App } from '../system/App';
import { sceneManager } from '../system/SceneManager';
import { saveManager } from '../system/SaveManager';

export class HeroSanctuaryScene {
    constructor(data = {}) {
        this.container = new Container();
        this.container.sortableChildren = true;

        App.setBackgroundColor(0x070b19);

        // === 1. MONOLITHIC BACKGROUND & PARTICLES ===
        const bg = new Sprite(Texture.WHITE);
        bg.width = Config.canvas.width;
        bg.height = Config.canvas.height;
        bg.tint = 0x070b19;
        this.container.addChild(bg);

        // Drifting stars/dust
        this.particles = [];
        const particleG = new Graphics();
        particleG.circle(4, 4, 4);
        particleG.fill({ color: 0xffffff });
        const pTexture = App.app.renderer.generateTexture({ target: particleG });
        particleG.destroy();

        for (let i = 0; i < 25; i++) {
            const size = 1 + Math.random() * 2.5;
            const p = new Sprite(pTexture);
            p.anchor.set(0.5);
            p.width = size * 2;
            p.height = size * 2;
            p.alpha = 0.08 + Math.random() * 0.15;
            p.x = Math.random() * Config.canvas.width;
            p.y = Math.random() * Config.canvas.height;
            p.tint = 0xffd54f; // golden stars
            this.container.addChild(p);
            this.particles.push(p);

            gsap.to(p, {
                y: -10,
                x: p.x + (Math.random() - 0.5) * 80,
                alpha: 0,
                duration: 6 + Math.random() * 6,
                repeat: -1,
                delay: Math.random() * 4,
                onRepeat: () => {
                    p.y = Config.canvas.height + 10;
                    p.x = Math.random() * Config.canvas.width;
                    p.alpha = 0.08 + Math.random() * 0.15;
                }
            });
        }

        // === 2. TITLE BAR ===
        const titleContainer = new Container();
        titleContainer.x = Config.canvas.width / 2;
        titleContainer.y = 50;
        this.container.addChild(titleContainer);

        const titleText = new Text({
            text: '🧙 HERO SANCTUARY 🧙',
            style: {
                fontFamily: 'Arial', fontSize: 38, fontWeight: 'bold', fill: '#ffffff',
                dropShadow: { color: '#ffb300', blur: 10, distance: 0, alpha: 0.6 }
            }
        });
        titleText.anchor.set(0.5);
        titleContainer.addChild(titleText);

        const subtitleText = new Text({
            text: 'Thăng Cấp Chỉ Số & Tinh Thông Nguyên Tố',
            style: { fontFamily: 'Arial', fontSize: 15, fill: '#ffb300', letterSpacing: 2 }
        });
        subtitleText.anchor.set(0.5);
        subtitleText.y = 40;
        titleContainer.addChild(subtitleText);

        // Core containers for panels
        this.statsPanel = new Container();
        this.masteryPanel = new Container();
        this.container.addChild(this.statsPanel);
        this.container.addChild(this.masteryPanel);

        // Draw initial content
        this.renderAll();

        // === 3. BACK TO MENU BUTTON ===
        const backBtn = new Container();
        backBtn.x = 90;
        backBtn.y = Config.canvas.height - 40;
        this.container.addChild(backBtn);

        const backBg = new Graphics();
        backBg.roundRect(-60, -18, 120, 36, 10);
        backBg.fill({ color: 0x1f293d });
        backBg.stroke({ color: 0xffffff, width: 1.5, alpha: 0.25 });
        backBg.eventMode = 'static';
        backBg.cursor = 'pointer';
        backBtn.addChild(backBg);

        const backText = new Text({
            text: '← Back',
            style: { fontFamily: 'Arial', fontSize: 15, fontWeight: 'bold', fill: '#ffffff' }
        });
        backText.anchor.set(0.5);
        backBtn.addChild(backText);

        backBg.on('pointerover', () => gsap.to(backBtn.scale, { x: 1.05, y: 1.05, duration: 0.15 }));
        backBg.on('pointerout', () => gsap.to(backBtn.scale, { x: 1, y: 1, duration: 0.15 }));
        backBg.on('pointerdown', async () => {
            const { MainMenuScene } = await import('./MainMenuScene');
            await sceneManager.switchTo(MainMenuScene);
        });
    }

    renderAll() {
        this.statsPanel.removeChildren();
        this.masteryPanel.removeChildren();

        const save = saveManager.load();
        const gold = save.gold || 0;
        const heroLvl = save.heroLevel || 1;
        const heroExp = save.heroExp || 0;
        const expNeeded = heroLvl * 100;
        const maxHP = 100 + (heroLvl - 1) * 15;
        const dmgBonusPercent = (heroLvl - 1) * 10;

        // =========================================================================
        // ⚔️ LEFT PANEL: HERO STATS
        // =========================================================================
        const sx = 60;
        const sy = 140;
        const sw = 310;
        const sh = 460;

        // Glassmorphism card background
        const cardBg = new Graphics();
        cardBg.roundRect(sx, sy, sw, sh, 18);
        cardBg.fill({ color: 0x11162d, alpha: 0.85 });
        cardBg.stroke({ color: 0x4fc3f7, width: 2, alpha: 0.45 });
        this.statsPanel.addChild(cardBg);

        // Header
        const header = new Text({
            text: '🛡️ HERO STATS',
            style: { fontFamily: 'Arial', fontSize: 22, fontWeight: 'bold', fill: '#ffffff' }
        });
        header.x = sx + 30;
        header.y = sy + 30;
        this.statsPanel.addChild(header);

        // Stats Lines
        const statsConfig = [
            { text: `🧙 Hero Level: ${heroLvl}`, color: '#ffffff', y: 90 },
            { text: `✨ EXP: ${heroExp} / ${expNeeded}`, color: '#e0e0e0', y: 130 },
            { text: `💚 Max HP: ${maxHP}`, color: '#81c784', y: 180 },
            { text: `⚔️ Base ATK: +${dmgBonusPercent}%`, color: '#ffb300', y: 220 },
            { text: `💰 Gold: ${gold}`, color: '#ffd54f', y: 270 }
        ];

        // Draw EXP bar
        const expBarBg = new Graphics();
        expBarBg.roundRect(sx + 30, sy + 155, sw - 60, 8, 4);
        expBarBg.fill({ color: 0x1a237e, alpha: 0.6 });
        this.statsPanel.addChild(expBarBg);

        const expPercent = Math.min(1.0, heroExp / expNeeded);
        if (expPercent > 0) {
            const expBarFill = new Graphics();
            expBarFill.roundRect(sx + 30, sy + 155, (sw - 60) * expPercent, 8, 4);
            expBarFill.fill({ color: 0x29b6f6 });
            this.statsPanel.addChild(expBarFill);
        }

        statsConfig.forEach(cfg => {
            const txt = new Text({
                text: cfg.text,
                style: { fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold', fill: cfg.color }
            });
            txt.x = sx + 30;
            txt.y = sy + cfg.y;
            this.statsPanel.addChild(txt);
        });

        // Upgrade button using Gold
        const upCost = heroLvl * 80;
        const canUpgrade = gold >= upCost;

        const upBtn = new Container();
        upBtn.x = sx + sw / 2;
        upBtn.y = sy + 380;
        this.statsPanel.addChild(upBtn);

        const upBg = new Graphics();
        upBg.roundRect(-100, -22, 200, 44, 12);
        upBg.fill({ color: canUpgrade ? 0xffb300 : 0x3d3521 });
        upBg.stroke({ color: 0xffffff, width: 1.5, alpha: canUpgrade ? 0.35 : 0.1 });
        upBg.eventMode = canUpgrade ? 'static' : 'none';
        upBg.cursor = canUpgrade ? 'pointer' : 'default';
        upBtn.addChild(upBg);

        const upText = new Text({
            text: `Thăng Cấp (${upCost} Vàng)`,
            style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: canUpgrade ? '#ffffff' : '#888888' }
        });
        upText.anchor.set(0.5);
        upBtn.addChild(upText);

        if (canUpgrade) {
            upBg.on('pointerover', () => gsap.to(upBtn.scale, { x: 1.05, y: 1.05, duration: 0.12 }));
            upBg.on('pointerout', () => gsap.to(upBtn.scale, { x: 1, y: 1, duration: 0.12 }));
            upBg.on('pointerdown', () => {
                if (saveManager.upgradeHeroLevelWithGold()) {
                    this.playSparkleEffect(upBtn.x, upBtn.y);
                    this.renderAll();
                }
            });
        }

        // =========================================================================
        // 🔮 RIGHT PANEL: ELEMENT MASTERY
        // =========================================================================
        const mx = 400;
        const my = 140;
        const mw = 640;
        const mh = 460;

        const masteryBg = new Graphics();
        masteryBg.roundRect(mx, my, mw, mh, 18);
        masteryBg.fill({ color: 0x11162d, alpha: 0.85 });
        masteryBg.stroke({ color: 0xffb300, width: 2, alpha: 0.3 });
        this.masteryPanel.addChild(masteryBg);

        // Header right
        const masteryHeader = new Text({
            text: '🔥 TINH THÔNG NGUYÊN TỐ',
            style: { fontFamily: 'Arial', fontSize: 22, fontWeight: 'bold', fill: '#ffffff' }
        });
        masteryHeader.x = mx + 30;
        masteryHeader.y = my + 30;
        this.masteryPanel.addChild(masteryHeader);

        // Grid parameters: 5 columns x 2 rows
        const elements = [
            { id: 'fire', name: 'Hỏa', emoji: '🔥', color: 0xff5252 },
            { id: 'water', name: 'Thủy', emoji: '💧', color: 0x40c4ff },
            { id: 'nature', name: 'Mộc', emoji: '🌿', color: 0x69f0ae },
            { id: 'ice', name: 'Băng', emoji: '❄️', color: 0x80d8ff },
            { id: 'lightning', name: 'Lôi', emoji: '⚡', color: 0xffd740 },
            { id: 'earth', name: 'Thổ', emoji: '⛰️', color: 0xbcaaa4 },
            { id: 'wind-air', name: 'Phong', emoji: '💨', color: 0x90caf9 },
            { id: 'psychic-eye', name: 'Linh', emoji: '👁️', color: 0xe040fb },
            { id: 'sun', name: 'Quang', emoji: '☀️', color: 0xffff00 },
            { id: 'poison-death', name: 'Độc', emoji: '☠️', color: 0xb388ff }
        ];

        const cardW = 105;
        const cardH = 160;
        const gapX = 14;
        const gapY = 20;
        const startGridX = mx + 28;
        const startGridY = my + 85;

        elements.forEach((el, index) => {
            const col = index % 5;
            const row = Math.floor(index / 5);
            const cx = startGridX + col * (cardW + gapX);
            const cy = startGridY + row * (cardH + gapY);

            const mLevel = save.masteryLevels ? (save.masteryLevels[el.id] || 0) : 0;
            const mShards = save.elementShards ? (save.elementShards[el.id] || 0) : 0;
            const shardCost = (mLevel + 1) * 5;
            const canAfford = mShards >= shardCost;

            // Element Card container
            const elCard = new Container();
            elCard.x = cx;
            elCard.y = cy;
            this.masteryPanel.addChild(elCard);

            // Card background
            const elBg = new Graphics();
            elBg.roundRect(0, 0, cardW, cardH, 12);
            elBg.fill({ color: 0x1f293d, alpha: 0.65 });
            elBg.stroke({ color: el.color, width: 1.5, alpha: canAfford ? 0.6 : 0.2 });
            elCard.addChild(elBg);

            // Emoji
            const emojiText = new Text({
                text: el.emoji,
                style: { fontSize: 24 }
            });
            emojiText.anchor.set(0.5);
            emojiText.x = cardW / 2;
            emojiText.y = 30;
            elCard.addChild(emojiText);

            // Element name & level
            const nameText = new Text({
                text: `${el.name} Lvl ${mLevel}`,
                style: { fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: '#ffffff' }
            });
            nameText.anchor.set(0.5);
            nameText.x = cardW / 2;
            nameText.y = 65;
            elCard.addChild(nameText);

            // Mastery bonus text
            const bonusText = new Text({
                text: `+${mLevel * 5}% Dame`,
                style: { fontFamily: 'Arial', fontSize: 11, fill: '#888888' }
            });
            bonusText.anchor.set(0.5);
            bonusText.x = cardW / 2;
            bonusText.y = 85;
            elCard.addChild(bonusText);

            // Shards count vs cost
            const shardText = new Text({
                text: `💎 ${mShards}/${shardCost}`,
                style: { fontFamily: 'Arial', fontSize: 11, fontWeight: 'bold', fill: canAfford ? '#69f0ae' : '#ff5252' }
            });
            shardText.anchor.set(0.5);
            shardText.x = cardW / 2;
            shardText.y = 110;
            elCard.addChild(shardText);

            // Upgrade icon (+)
            const plusBtn = new Container();
            plusBtn.x = cardW / 2;
            plusBtn.y = 138;
            elCard.addChild(plusBtn);

            const plusBg = new Graphics();
            plusBg.circle(0, 0, 13);
            plusBg.fill({ color: canAfford ? el.color : 0x444444 });
            plusBg.eventMode = canAfford ? 'static' : 'none';
            plusBg.cursor = canAfford ? 'pointer' : 'default';
            plusBtn.addChild(plusBg);

            const plusText = new Text({
                text: '+',
                style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#ffffff' }
            });
            plusText.anchor.set(0.5);
            plusBtn.addChild(plusText);

            if (canAfford) {
                plusBg.on('pointerover', () => gsap.to(plusBtn.scale, { x: 1.2, y: 1.2, duration: 0.12 }));
                plusBg.on('pointerout', () => gsap.to(plusBtn.scale, { x: 1, y: 1, duration: 0.12 }));
                plusBg.on('pointerdown', () => {
                    if (saveManager.upgradeMastery(el.id)) {
                        this.playSparkleEffect(cx + cardW / 2, cy + cardH / 2);
                        this.renderAll();
                    }
                });
            }
        });
    }

    playSparkleEffect(x, y) {
        const particleCount = 10;
        const g = new Graphics();
        g.circle(3, 3, 3);
        g.fill({ color: 0xffea00 });
        const sparkleTexture = App.app.renderer.generateTexture({ target: g });
        g.destroy();

        for (let i = 0; i < particleCount; i++) {
            const sp = new Sprite(sparkleTexture);
            sp.anchor.set(0.5);
            sp.x = x;
            sp.y = y;
            sp.zIndex = 500;
            this.container.addChild(sp);

            const angle = Math.random() * Math.PI * 2;
            const dist = 30 + Math.random() * 50;

            gsap.to(sp, {
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.4,
                ease: 'power2.out',
                onComplete: () => {
                    if (sp && !sp.destroyed) {
                        try { sp.destroy(); } catch (e) {}
                    }
                }
            });
        }
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
        });

        this.statsPanel.destroy({ children: true });
        this.masteryPanel.destroy({ children: true });
        this.container.destroy({ children: true });
    }
}

import { Container, Graphics, Sprite, Texture, Text } from 'pixi.js';
import gsap from 'gsap';
import { Config } from '../config';
import { App } from '../system/App';
import { sceneManager } from '../system/SceneManager';
import { saveManager } from '../system/SaveManager';
import { GEAR_DATABASE, getGearItemById } from '../data/GearData';
import { SKILLS, PASSIVE_SKILLS } from '../data/SkillData';

export class HeroSanctuaryScene {
    constructor(data = {}) {
        this.container = new Container();
        this.container.sortableChildren = true;

        App.setBackgroundColor(0x070b19);

        // Active tab state: 'mastery', 'gear', or 'talent'
        this.activeTab = 'mastery';

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

        // Apply equipment HP bonus
        const equipped = save.equippedItems || {};
        let finalMaxHP = maxHP;
        let finalShield = 0;
        
        if (equipped.armor === 'stone_plate') {
            finalMaxHP += 50;
            finalShield += 20;
        }

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

        // Active Loadout display on Stats Panel
        const currentEquippedSkillId = save.equippedSkills ? (save.equippedSkills.active || 'fireball') : 'fireball';
        const activeSkillObj = SKILLS[currentEquippedSkillId] || SKILLS.fireball;
        const passiveCount = save.equippedSkills && save.equippedSkills.passives ? save.equippedSkills.passives.length : 0;

        // Stats Lines
        const statsConfig = [
            { text: `🧙 Hero Level: ${heroLvl}`, color: '#ffffff', y: 80 },
            { text: `✨ EXP: ${heroExp} / ${expNeeded}`, color: '#e0e0e0', y: 115 },
            { text: `💚 Max HP: ${finalMaxHP}` + (finalMaxHP > maxHP ? ` (+50)` : ''), color: '#81c784', y: 155 },
            { text: `🛡️ Giáp Khởi Đầu: ${finalShield}`, color: '#80d8ff', y: 195 },
            { text: `⚔️ Base ATK: +${dmgBonusPercent}%` + (equipped.weapon === 'magic_sword' ? ` (+15 Lôi)` : ''), color: '#ffb300', y: 235 },
            { text: `☄️ Active: ${activeSkillObj.icon} ${activeSkillObj.name}`, color: '#00e5ff', y: 275 },
            { text: `📜 Passives: ${passiveCount} / 2`, color: '#69f0ae', y: 310 },
            { text: `💰 Gold: ${gold}`, color: '#ffd54f', y: 350 }
        ];

        // Draw EXP bar
        const expBarBg = new Graphics();
        expBarBg.roundRect(sx + 30, sy + 138, sw - 60, 6, 3);
        expBarBg.fill({ color: 0x1a237e, alpha: 0.6 });
        this.statsPanel.addChild(expBarBg);

        const expPercent = Math.min(1.0, heroExp / expNeeded);
        if (expPercent > 0) {
            const expBarFill = new Graphics();
            expBarFill.roundRect(sx + 30, sy + 138, (sw - 60) * expPercent, 6, 3);
            expBarFill.fill({ color: 0x29b6f6 });
            this.statsPanel.addChild(expBarFill);
        }

        statsConfig.forEach(cfg => {
            const txt = new Text({
                text: cfg.text,
                style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: cfg.color }
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
        upBtn.y = sy + 415;
        this.statsPanel.addChild(upBtn);

        const upBg = new Graphics();
        upBg.roundRect(-100, -20, 200, 40, 10);
        upBg.fill({ color: canUpgrade ? 0xffb300 : 0x3d3521 });
        upBg.stroke({ color: 0xffffff, width: 1.5, alpha: canUpgrade ? 0.35 : 0.1 });
        upBg.eventMode = canUpgrade ? 'static' : 'none';
        upBg.cursor = canUpgrade ? 'pointer' : 'default';
        upBtn.addChild(upBg);

        const upText = new Text({
            text: `Thăng Cấp (${upCost} Vàng)`,
            style: { fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: canUpgrade ? '#ffffff' : '#888888' }
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
        // 🔮 RIGHT PANEL: CONTAINING TABS & CONTENT
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

        // --- DRAW THREE TABS AT THE TOP ---
        const tab1 = new Container();
        tab1.x = mx + 25;
        tab1.y = my + 25;
        this.masteryPanel.addChild(tab1);

        const isMastery = this.activeTab === 'mastery';
        const tab1Bg = new Graphics();
        tab1Bg.roundRect(0, 0, 180, 36, 8);
        tab1Bg.fill({ color: isMastery ? 0x2c385e : 0x141a29, alpha: 0.8 });
        tab1Bg.stroke({ color: isMastery ? 0xffb300 : 0xffffff, width: 1.5, alpha: isMastery ? 0.8 : 0.2 });
        tab1Bg.eventMode = 'static';
        tab1Bg.cursor = 'pointer';
        tab1.addChild(tab1Bg);

        const tab1Text = new Text({
            text: '🔮 Tinh Thông',
            style: { fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: '#ffffff' }
        });
        tab1Text.anchor.set(0.5);
        tab1Text.x = 90;
        tab1Text.y = 18;
        tab1.addChild(tab1Text);

        tab1Bg.on('pointerover', () => gsap.to(tab1.scale, { x: 1.03, y: 1.03, duration: 0.1 }));
        tab1Bg.on('pointerout', () => gsap.to(tab1.scale, { x: 1, y: 1, duration: 0.1 }));
        tab1Bg.on('pointerdown', () => {
            this.activeTab = 'mastery';
            this.renderAll();
        });

        const tab2 = new Container();
        tab2.x = mx + 220;
        tab2.y = my + 25;
        this.masteryPanel.addChild(tab2);

        const isGear = this.activeTab === 'gear';
        const tab2Bg = new Graphics();
        tab2Bg.roundRect(0, 0, 185, 36, 8);
        tab2Bg.fill({ color: isGear ? 0x2c385e : 0x141a29, alpha: 0.8 });
        tab2Bg.stroke({ color: isGear ? 0xffb300 : 0xffffff, width: 1.5, alpha: isGear ? 0.8 : 0.2 });
        tab2Bg.eventMode = 'static';
        tab2Bg.cursor = 'pointer';
        tab2.addChild(tab2Bg);

        const tab2Text = new Text({
            text: '🎒 Cổ Vật & Trang Bị',
            style: { fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: '#ffffff' }
        });
        tab2Text.anchor.set(0.5);
        tab2Text.x = 92.5;
        tab2Text.y = 18;
        tab2.addChild(tab2Text);

        tab2Bg.on('pointerover', () => gsap.to(tab2.scale, { x: 1.03, y: 1.03, duration: 0.1 }));
        tab2Bg.on('pointerout', () => gsap.to(tab2.scale, { x: 1, y: 1, duration: 0.1 }));
        tab2Bg.on('pointerdown', () => {
            this.activeTab = 'gear';
            this.renderAll();
        });

        const tab3 = new Container();
        tab3.x = mx + 420;
        tab3.y = my + 25;
        this.masteryPanel.addChild(tab3);

        const isTalent = this.activeTab === 'talent';
        const tab3Bg = new Graphics();
        tab3Bg.roundRect(0, 0, 195, 36, 8);
        tab3Bg.fill({ color: isTalent ? 0x2c385e : 0x141a29, alpha: 0.8 });
        tab3Bg.stroke({ color: isTalent ? 0xffb300 : 0xffffff, width: 1.5, alpha: isTalent ? 0.8 : 0.2 });
        tab3Bg.eventMode = 'static';
        tab3Bg.cursor = 'pointer';
        tab3.addChild(tab3Bg);

        const tab3Text = new Text({
            text: '📜 Thiên Phú Loadout',
            style: { fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: '#ffffff' }
        });
        tab3Text.anchor.set(0.5);
        tab3Text.x = 97.5;
        tab3Text.y = 18;
        tab3.addChild(tab3Text);

        tab3Bg.on('pointerover', () => gsap.to(tab3.scale, { x: 1.03, y: 1.03, duration: 0.1 }));
        tab3Bg.on('pointerout', () => gsap.to(tab3.scale, { x: 1, y: 1, duration: 0.1 }));
        tab3Bg.on('pointerdown', () => {
            this.activeTab = 'talent';
            this.renderAll();
        });


        if (isMastery) {
            // ==========================================
            // TAB 1: ELEMENT MASTERY CONTENT
            // ==========================================
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

                const elCard = new Container();
                elCard.x = cx;
                elCard.y = cy;
                this.masteryPanel.addChild(elCard);

                const elBg = new Graphics();
                elBg.roundRect(0, 0, cardW, cardH, 12);
                elBg.fill({ color: 0x1f293d, alpha: 0.65 });
                elBg.stroke({ color: el.color, width: 1.5, alpha: canAfford ? 0.6 : 0.2 });
                elCard.addChild(elBg);

                const emojiText = new Text({
                    text: el.emoji,
                    style: { fontSize: 24 }
                });
                emojiText.anchor.set(0.5);
                emojiText.x = cardW / 2;
                emojiText.y = 30;
                elCard.addChild(emojiText);

                const nameText = new Text({
                    text: `${el.name} Lvl ${mLevel}`,
                    style: { fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: '#ffffff' }
                });
                nameText.anchor.set(0.5);
                nameText.x = cardW / 2;
                nameText.y = 65;
                elCard.addChild(nameText);

                const bonusText = new Text({
                    text: `+${mLevel * 5}% Dame`,
                    style: { fontFamily: 'Arial', fontSize: 11, fill: '#888888' }
                });
                bonusText.anchor.set(0.5);
                bonusText.x = cardW / 2;
                bonusText.y = 85;
                elCard.addChild(bonusText);

                const shardText = new Text({
                    text: `💎 ${mShards}/${shardCost}`,
                    style: { fontFamily: 'Arial', fontSize: 11, fontWeight: 'bold', fill: canAfford ? '#69f0ae' : '#ff5252' }
                });
                shardText.anchor.set(0.5);
                shardText.x = cardW / 2;
                shardText.y = 110;
                elCard.addChild(shardText);

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
        } else if (isGear) {
            // ==========================================
            // TAB 2: COV AT & TRANG BI (GEAR) CONTENT
            // ==========================================
            const eqHeader = new Text({
                text: '🛡️ ĐANG TRANG BỊ',
                style: { fontFamily: 'Arial', fontSize: 15, fontWeight: 'bold', fill: '#80d8ff' }
            });
            eqHeader.x = mx + 28;
            eqHeader.y = my + 82;
            this.masteryPanel.addChild(eqHeader);

            const slots = [
                { key: 'weapon', label: 'Vũ Khí (Weapon)', defaultEmoji: '⚔️' },
                { key: 'armor', label: 'Giáp (Armor)', defaultEmoji: '🛡️' },
                { key: 'relic', label: 'Cổ Vật (Relic)', defaultEmoji: '🔮' }
            ];

            slots.forEach((slot, index) => {
                const sxGrid = mx + 28;
                const syGrid = my + 112 + index * 108;
                const slotW = 210;
                const slotH = 96;

                const slotContainer = new Container();
                slotContainer.x = sxGrid;
                slotContainer.y = syGrid;
                this.masteryPanel.addChild(slotContainer);

                const itemId = equipped[slot.key];
                const item = getGearItemById(itemId);

                const slotBg = new Graphics();
                slotBg.roundRect(0, 0, slotW, slotH, 10);
                
                if (item) {
                    slotBg.fill({ color: 0x1f293d, alpha: 0.8 });
                    slotBg.stroke({ color: item.color || 0xffb300, width: 1.5, alpha: 0.75 });
                } else {
                    slotBg.fill({ color: 0x141a29, alpha: 0.4 });
                    slotBg.stroke({ color: 0xffffff, width: 1.5, alpha: 0.15, dash: [4, 4] });
                }
                slotContainer.addChild(slotBg);

                if (item) {
                    const itemText = new Text({
                        text: `${item.emoji} ${item.name}`,
                        style: { fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: '#ffffff' }
                    });
                    itemText.x = 10;
                    itemText.y = 12;
                    slotContainer.addChild(itemText);

                    const labelText = new Text({
                        text: slot.label,
                        style: { fontFamily: 'Arial', fontSize: 10, fill: '#ffb300' }
                    });
                    labelText.x = 10;
                    labelText.y = 32;
                    slotContainer.addChild(labelText);

                    const descText = new Text({
                        text: item.description,
                        style: { fontFamily: 'Arial', fontSize: 9, fill: '#cccccc', wordWrap: true, wordWrapWidth: 190 }
                    });
                    descText.x = 10;
                    descText.y = 48;
                    slotContainer.addChild(descText);

                    const unBtn = new Container();
                    unBtn.x = slotW - 35;
                    unBtn.y = 20;
                    slotContainer.addChild(unBtn);

                    const unBg = new Graphics();
                    unBg.roundRect(-25, -10, 50, 20, 6);
                    unBg.fill({ color: 0xe53935 });
                    unBg.eventMode = 'static';
                    unBg.cursor = 'pointer';
                    unBtn.addChild(unBg);

                    const unTxt = new Text({
                        text: 'Tháo',
                        style: { fontFamily: 'Arial', fontSize: 10, fontWeight: 'bold', fill: '#ffffff' }
                    });
                    unTxt.anchor.set(0.5);
                    unBtn.addChild(unTxt);

                    unBg.on('pointerover', () => gsap.to(unBtn.scale, { x: 1.05, y: 1.05, duration: 0.1 }));
                    unBg.on('pointerout', () => gsap.to(unBtn.scale, { x: 1, y: 1, duration: 0.1 }));
                    unBg.on('pointerdown', () => {
                        if (saveManager.unequipGear(slot.key)) {
                            this.playSparkleEffect(sxGrid + slotW / 2, syGrid + slotH / 2);
                            this.renderAll();
                        }
                    });
                } else {
                    const emptyEmojiText = new Text({
                        text: slot.defaultEmoji,
                        style: { fontSize: 24 }
                    });
                    emptyEmojiText.anchor.set(0.5);
                    emptyEmojiText.x = 35;
                    emptyEmojiText.y = slotH / 2;
                    emptyEmojiText.alpha = 0.2;
                    slotContainer.addChild(emptyEmojiText);

                    const emptyText = new Text({
                        text: `Trống\n[${slot.label}]`,
                        style: { fontFamily: 'Arial', fontSize: 11, fontWeight: 'bold', fill: '#888888', align: 'left' }
                    });
                    emptyText.x = 65;
                    emptyText.y = slotH / 2 - 14;
                    slotContainer.addChild(emptyText);
                }
            });

            const shopHeader = new Text({
                text: '🎒 CỬA HÀNG TRANG BỊ & HÀNH TRANG',
                style: { fontFamily: 'Arial', fontSize: 15, fontWeight: 'bold', fill: '#ffd54f' }
            });
            shopHeader.x = mx + 270;
            shopHeader.y = my + 82;
            this.masteryPanel.addChild(shopHeader);

            const shopItems = [
                ...GEAR_DATABASE.weapons,
                ...GEAR_DATABASE.armor,
                ...GEAR_DATABASE.relics
            ];

            shopItems.forEach((item, index) => {
                const cxGrid = mx + 270;
                const cyGrid = my + 112 + index * 66;
                const itemW = 340;
                const itemH = 60;

                const itemContainer = new Container();
                itemContainer.x = cxGrid;
                itemContainer.y = cyGrid;
                this.masteryPanel.addChild(itemContainer);

                const isOwned = save.inventory ? save.inventory.includes(item.id) : false;
                const isEquipped = equipped[item.slot] === item.id;

                const itemBg = new Graphics();
                itemBg.roundRect(0, 0, itemW, itemH, 10);
                itemBg.fill({ color: 0x1f293d, alpha: 0.6 });
                itemBg.stroke({ color: item.color, width: 1.5, alpha: isEquipped ? 0.8 : 0.25 });
                itemContainer.addChild(itemBg);

                const itemEmoji = new Text({
                    text: item.emoji,
                    style: { fontSize: 20 }
                });
                itemEmoji.x = 10;
                itemEmoji.y = 12;
                itemContainer.addChild(itemEmoji);

                const nameText = new Text({
                    text: `${item.name}`,
                    style: { fontFamily: 'Arial', fontSize: 12, fontWeight: 'bold', fill: '#ffffff' }
                });
                nameText.x = 42;
                nameText.y = 8;
                itemContainer.addChild(nameText);

                const slotText = new Text({
                    text: `${item.slot.toUpperCase()}`,
                    style: { fontFamily: 'Arial', fontSize: 8, fontWeight: 'bold', fill: item.color }
                });
                slotText.x = 42;
                slotText.y = 24;
                itemContainer.addChild(slotText);

                const descText = new Text({
                    text: item.description,
                    style: { fontFamily: 'Arial', fontSize: 9, fill: '#aaaaaa', wordWrap: true, wordWrapWidth: 195 }
                });
                descText.x = 42;
                descText.y = 35;
                itemContainer.addChild(descText);

                const actionBtn = new Container();
                actionBtn.x = itemW - 55;
                actionBtn.y = itemH / 2;
                itemContainer.addChild(actionBtn);

                const btnW = 85;
                const btnH = 26;

                const btnBg = new Graphics();
                btnBg.roundRect(-btnW/2, -btnH/2, btnW, btnH, 6);

                let btnLabel = '';
                let btnColor = 0xffb300;
                let active = false;

                if (isEquipped) {
                    btnLabel = 'Đang Dùng';
                    btnColor = 0x4caf50;
                    active = false;
                } else if (isOwned) {
                    btnLabel = 'Trang Bị';
                    btnColor = 0x2196f3;
                    active = true;
                } else {
                    btnLabel = `${item.price}g Mua`;
                    btnColor = gold >= item.price ? 0xffb300 : 0x444444;
                    active = gold >= item.price;
                }

                btnBg.fill({ color: btnColor });
                btnBg.eventMode = active ? 'static' : 'none';
                btnBg.cursor = active ? 'pointer' : 'default';
                actionBtn.addChild(btnBg);

                const btnText = new Text({
                    text: btnLabel,
                    style: { fontFamily: 'Arial', fontSize: 10, fontWeight: 'bold', fill: '#ffffff' }
                });
                btnText.anchor.set(0.5);
                actionBtn.addChild(btnText);

                if (active) {
                    btnBg.on('pointerover', () => gsap.to(actionBtn.scale, { x: 1.05, y: 1.05, duration: 0.1 }));
                    btnBg.on('pointerout', () => gsap.to(actionBtn.scale, { x: 1, y: 1, duration: 0.1 }));
                    btnBg.on('pointerdown', () => {
                        if (isOwned) {
                            if (saveManager.equipGear(item.id, item.slot)) {
                                this.playSparkleEffect(cxGrid + itemW / 2, cyGrid + itemH / 2);
                                this.renderAll();
                            }
                        } else {
                            if (saveManager.buyGearItem(item.id, item.price)) {
                                this.playSparkleEffect(cxGrid + itemW / 2, cyGrid + itemH / 2);
                                this.renderAll();
                            }
                        }
                    });
                }
            });
        } else {
            // ==========================================
            // TAB 3: THIEN PHU CONTENT (TALENTS)
            // ==========================================
            // Left Column: Active Skills Selection
            const actHeader = new Text({
                text: '☄️ KỸ NĂNG CHỦ ĐỘNG',
                style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#00e5ff' }
            });
            actHeader.x = mx + 28;
            actHeader.y = my + 82;
            this.masteryPanel.addChild(actHeader);

            const actSub = new Text({
                text: 'Di chuyển chuột qua để xem mô tả. Click để Trang Bị.',
                style: { fontFamily: 'Arial', fontSize: 10, fill: '#aaaaaa' }
            });
            actSub.x = mx + 28;
            actSub.y = my + 102;
            this.masteryPanel.addChild(actSub);

            const activeSkillGrid = new Container();
            activeSkillGrid.x = mx + 28;
            activeSkillGrid.y = my + 122;
            this.masteryPanel.addChild(activeSkillGrid);

            const allSkills = Object.values(SKILLS);
            const cardSize = 54;
            const gap = 12;
            const colsCount = 4; // 4 columns grid is super clean!

            allSkills.forEach((skill, index) => {
                const col = index % colsCount;
                const row = Math.floor(index / colsCount);
                const kx = col * (cardSize + gap);
                const ky = row * (cardSize + gap);

                const isUnlocked = heroLvl >= skill.unlockedAtLevel;
                const isEquipped = save.equippedSkills ? (save.equippedSkills.active === skill.id) : (skill.id === 'fireball');

                const skillCard = new Container();
                skillCard.x = kx;
                skillCard.y = ky;
                activeSkillGrid.addChild(skillCard);

                const skBg = new Graphics();
                skBg.roundRect(0, 0, cardSize, cardSize, 10);
                
                if (isUnlocked) {
                    skBg.fill({ color: isEquipped ? 0x2c385e : 0x1f293d, alpha: 0.8 });
                    skBg.stroke({ color: isEquipped ? 0x00e5ff : skill.color, width: isEquipped ? 2.5 : 1.5, alpha: isEquipped ? 1.0 : 0.4 });
                    skBg.eventMode = 'static';
                    skBg.cursor = 'pointer';
                } else {
                    skBg.fill({ color: 0x141a29, alpha: 0.5 });
                    skBg.stroke({ color: 0xffffff, width: 1, alpha: 0.1 });
                }
                skillCard.addChild(skBg);

                // Skill Icon (Emoji)
                const iconTxt = new Text({
                    text: isUnlocked ? skill.icon : '🔒',
                    style: { fontSize: 20 }
                });
                iconTxt.anchor.set(0.5);
                iconTxt.x = cardSize / 2;
                iconTxt.y = cardSize / 2 - (isUnlocked ? 0 : 2);
                skillCard.addChild(iconTxt);

                // Locked Level Label
                if (!isUnlocked) {
                    const lockLbl = new Text({
                        text: `Lvl ${skill.unlockedAtLevel}`,
                        style: { fontFamily: 'Arial', fontSize: 9, fill: '#888888', fontWeight: 'bold' }
                    });
                    lockLbl.anchor.set(0.5);
                    lockLbl.x = cardSize / 2;
                    lockLbl.y = cardSize - 10;
                    skillCard.addChild(lockLbl);
                } else {
                    skBg.on('pointerover', () => {
                        gsap.to(skillCard.scale, { x: 1.08, y: 1.08, duration: 0.1 });
                        if (this.tooltipText) {
                            this.tooltipText.text = `⚡ [${skill.name}]: ${skill.description}`;
                        }
                    });
                    skBg.on('pointerout', () => {
                        gsap.to(skillCard.scale, { x: 1, y: 1, duration: 0.1 });
                    });
                    skBg.on('pointerdown', () => {
                        if (saveManager.equipActiveSkill(skill.id)) {
                            this.playSparkleEffect(mx + 28 + kx + cardSize / 2, my + 122 + ky + cardSize / 2);
                            this.renderAll();
                        }
                    });
                }
            });

            // Dynamic Tooltip label under Active skills
            const tooltipBox = new Graphics();
            tooltipBox.roundRect(mx + 28, my + 382, 260, 52, 6);
            tooltipBox.fill({ color: 0x141a29, alpha: 0.5 });
            tooltipBox.stroke({ color: 0xffffff, width: 1, alpha: 0.1 });
            this.masteryPanel.addChild(tooltipBox);

            // Default tooltip text
            const currentEquippedSkillId = save.equippedSkills ? (save.equippedSkills.active || 'fireball') : 'fireball';
            const currSkill = SKILLS[currentEquippedSkillId] || SKILLS.fireball;

            this.tooltipText = new Text({
                text: `⚡ [${currSkill.name}]: ${currSkill.description}`,
                style: { fontFamily: 'Arial', fontSize: 9, fill: '#ffb300', wordWrap: true, wordWrapWidth: 240 }
            });
            this.tooltipText.x = mx + 38;
            this.tooltipText.y = my + 390;
            this.masteryPanel.addChild(this.tooltipText);

            // Right Column: Passive Skills Selection
            const pasHeader = new Text({
                text: '📜 KỸ NĂNG BỊ ĐỘNG (Tối đa 2)',
                style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#69f0ae' }
            });
            pasHeader.x = mx + 325;
            pasHeader.y = my + 82;
            this.masteryPanel.addChild(pasHeader);

            const pasSub = new Text({
                text: 'Được kích hoạt vĩnh viễn trong suốt trận đấu',
                style: { fontFamily: 'Arial', fontSize: 10, fill: '#aaaaaa' }
            });
            pasSub.x = mx + 325;
            pasSub.y = my + 102;
            this.masteryPanel.addChild(pasSub);

            const allPassives = Object.values(PASSIVE_SKILLS);
            allPassives.forEach((passive, index) => {
                const px = mx + 325;
                const py = my + 122 + index * 125;
                const pW = 285;
                const pH = 110;

                const passCard = new Container();
                passCard.x = px;
                passCard.y = py;
                this.masteryPanel.addChild(passCard);

                const isEquipped = save.equippedSkills && save.equippedSkills.passives ? save.equippedSkills.passives.includes(passive.id) : false;

                const passBg = new Graphics();
                passBg.roundRect(0, 0, pW, pH, 12);
                passBg.fill({ color: 0x1f293d, alpha: 0.6 });
                passBg.stroke({ color: isEquipped ? 0x69f0ae : 0xffffff, width: 1.5, alpha: isEquipped ? 0.9 : 0.15 });
                passCard.addChild(passBg);

                const pName = new Text({
                    text: `${passive.icon} ${passive.name}`,
                    style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#ffffff' }
                });
                pName.x = 15;
                pName.y = 15;
                passCard.addChild(pName);

                const pDesc = new Text({
                    text: passive.description,
                    style: { fontFamily: 'Arial', fontSize: 10, fill: '#cccccc', wordWrap: true, wordWrapWidth: 255 }
                });
                pDesc.x = 15;
                pDesc.y = 38;
                passCard.addChild(pDesc);

                const actBtn = new Container();
                actBtn.x = pW / 2;
                actBtn.y = pH - 24;
                passCard.addChild(actBtn);

                const btnW = 120;
                const btnH = 26;

                const abg = new Graphics();
                abg.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
                abg.fill({ color: isEquipped ? 0x4caf50 : 0x2196f3 });
                abg.eventMode = 'static';
                abg.cursor = 'pointer';
                actBtn.addChild(abg);

                const abgTxt = new Text({
                    text: isEquipped ? 'Đang Kích Hoạt' : 'Kích Hoạt',
                    style: { fontFamily: 'Arial', fontSize: 10, fontWeight: 'bold', fill: '#ffffff' }
                });
                abgTxt.anchor.set(0.5);
                actBtn.addChild(abgTxt);

                abg.on('pointerover', () => gsap.to(actBtn.scale, { x: 1.05, y: 1.05, duration: 0.1 }));
                abg.on('pointerout', () => gsap.to(actBtn.scale, { x: 1, y: 1, duration: 0.1 }));
                abg.on('pointerdown', () => {
                    if (saveManager.togglePassiveSkill(passive.id)) {
                        this.playSparkleEffect(px + pW / 2, py + pH / 2);
                        this.renderAll();
                    }
                });
            });
        }
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

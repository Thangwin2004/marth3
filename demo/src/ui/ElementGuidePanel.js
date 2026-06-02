import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { Config } from '../config.js';
import gsap from 'gsap';

const ELEMENT_DETAILS = {
    fire: { name: 'Fire', emoji: '🔥', color: '#ff7043', dmg: 12, effect: 'Burn 3 dmg (2 turns)', weak: ['nature', 'ice'], resist: ['water', 'earth'] },
    water: { name: 'Water', emoji: '💧', color: '#29b6f6', dmg: 10, effect: 'Cleanse all debuffs', weak: ['fire', 'earth'], resist: ['nature', 'lightning'] },
    nature: { name: 'Nature', emoji: '🌿', color: '#66bb6a', dmg: 6, effect: 'Heal 8 HP', weak: ['water', 'earth', 'poison-death'], resist: ['fire', 'wind-air'] },
    ice: { name: 'Ice', emoji: '❄️', color: '#80d8ff', dmg: 8, effect: 'Shield 8 + Freeze 15% (1t)', weak: ['nature', 'wind-air'], resist: ['fire', 'water'] },
    lightning: { name: 'Lightning', emoji: '⚡', color: '#ffd54f', dmg: 15, effect: 'Stun 10% (1 turn)', weak: ['water', 'wind-air'], resist: ['earth', 'lightning'] },
    earth: { name: 'Earth', emoji: '⛰️', color: '#a1887f', dmg: 5, effect: 'Shield 12', weak: ['fire', 'lightning', 'poison-death'], resist: ['nature', 'wind-air'] },
    'wind-air': { name: 'Wind', emoji: '💨', color: '#e0e0e0', dmg: 11, effect: 'Pierce 50% enemy shield', weak: ['nature', 'lightning'], resist: ['earth', 'ice'] },
    'psychic-eye': { name: 'Psychic', emoji: '👁️', color: '#ea80fc', dmg: 9, effect: 'Curse -30% dmg (2 turns)', weak: ['poison-death', 'sun'], resist: ['psychic-eye'] },
    sun: { name: 'Sun', emoji: '☀️', color: '#ffb74d', dmg: 7, effect: 'Heal 12 HP', weak: ['poison-death', 'ice'], resist: ['fire', 'sun'] },
    'poison-death': { name: 'Poison', emoji: '☠️', color: '#b388ff', dmg: 8, effect: 'Poison 4 dmg (3 turns)', weak: ['sun', 'nature'], resist: ['earth', 'poison-death'] }
};

export class ElementGuidePanel {
    /**
     * Show the element guide panel as an overlay.
     * @param {Container} parent - BattleScene container
     * @returns {Promise<void>} Resolves when the panel is closed
     */
    static show(parent) {
        return new Promise(resolve => {
            const overlay = new Container();
            overlay.zIndex = 500; // High z-index, above almost everything
            overlay.x = Config.canvas.width / 2;
            overlay.y = Config.canvas.height / 2;
            overlay.scale.set(0.5);
            overlay.alpha = 0;
            parent.addChild(overlay);

            // Override destroy to clean up all tweens on overlay and scale
            const originalDestroy = overlay.destroy.bind(overlay);
            overlay.destroy = (options) => {
                gsap.killTweensOf(overlay);
                gsap.killTweensOf(overlay.scale);
                originalDestroy(options);
            };

            // SLEEK COMPACT MODAL BOUNDARIES
            const width = 660;
            const height = 460;

            // --- Dark Modal Background ---
            const bg = new Graphics();
            
            // Outer semi-translucent backdrop blocking the game board
            bg.rect(-Config.canvas.width / 2, -Config.canvas.height / 2, Config.canvas.width, Config.canvas.height);
            bg.fill({ color: 0x000000, alpha: 0.75 });

            // Main Glassmorphic Guide Card
            bg.roundRect(-width / 2, -height / 2, width, height, 16);
            bg.fill({ color: 0x070d1a, alpha: 0.95 });
            bg.stroke({ color: 0x00d2ff, width: 2, alpha: 0.8 }); // neon cyan border
            
            // Inner decorative glass line border
            bg.roundRect(-width / 2 + 5, -height / 2 + 5, width - 10, height - 10, 12);
            bg.stroke({ color: 0xffffff, width: 1, alpha: 0.05 });
            
            const bgWrapper = new Container();
            bgWrapper.addChild(bg);
            overlay.addChild(bgWrapper);

            // --- Header Title ---
            const title = new Text({
                text: '📖 ELEMENT GUIDE & TYPE COUNTERS',
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 16,
                    fontWeight: 'bold',
                    fill: '#ffd54f',
                    stroke: '#000000',
                    strokeThickness: 3,
                    dropShadow: { color: '#ff6f00', blur: 3, distance: 0, alpha: 0.6 }
                }
            });
            title.anchor.set(0.5);
            title.y = -height / 2 + 25;
            overlay.addChild(title);

            // --- Description ---
            const subtitle = new Text({
                text: '💥 Super Effective = 2.0x Damage (Green) | 🛡️ Resistant = 0.5x Damage (Red)',
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 10,
                    fill: '#b0bec5'
                }
            });
            subtitle.anchor.set(0.5);
            subtitle.y = -height / 2 + 48;
            overlay.addChild(subtitle);

            // Make backdrop interactive
            bg.eventMode = 'static';
            bg.cursor = 'default';

            // --- 2-Column Grid Layout of Elements ---
            const gridContainer = new Container();
            gridContainer.y = -5;
            overlay.addChild(gridContainer);

            const keys = Object.keys(ELEMENT_DETAILS);
            const cardW = 300;
            const cardH = 56;
            const gapX = 20;
            const gapY = 8;

            keys.forEach((key, index) => {
                const col = index < 5 ? 0 : 1;
                const row = index % 5;
                const detail = ELEMENT_DETAILS[key];

                const card = new Container();
                card.pivot.set(cardW / 2, cardH / 2);
                
                const posX = col === 0 ? -(cardW + gapX / 2) : gapX / 2;
                const posY = row * (cardH + gapY) - 135;
                
                card.x = posX + cardW / 2;
                card.y = posY + cardH / 2;
                gridContainer.addChild(card);

                // Card background
                const cBg = new Graphics();
                cBg.roundRect(0, 0, cardW, cardH, 8);
                cBg.fill({ color: 0x0f172a, alpha: 0.85 });
                cBg.stroke({ color: detail.color, width: 1.2, alpha: 0.35 });
                
                // Pill accent bar
                cBg.roundRect(4, 4, 3, cardH - 8, 1.5);
                cBg.fill({ color: detail.color, alpha: 0.9 });
                
                const cBgWrapper = new Container();
                cBgWrapper.addChild(cBg);
                card.addChild(cBgWrapper);

                // Element Icon + Name
                const nameTxt = new Text({
                    text: `${detail.emoji} ${detail.name}`,
                    style: {
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 12,
                        fontWeight: 'bold',
                        fill: detail.color
                    }
                });
                nameTxt.x = 14;
                nameTxt.y = 4;
                card.addChild(nameTxt);

                // Stats: Base Dmg + Special Effect
                const statsTxt = new Text({
                    text: `Dmg: ${detail.dmg}  |  Effect: ${detail.effect}`,
                    style: {
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 9,
                        fontWeight: '500',
                        fill: '#94a3b8'
                    }
                });
                statsTxt.x = 14;
                statsTxt.y = 20;
                card.addChild(statsTxt);

                // Strengths and Weaknesses
                const strongEmojis = detail.weak.map(k => ELEMENT_DETAILS[k]?.emoji || '').join(' ');
                const weakEmojis = detail.resist.map(k => ELEMENT_DETAILS[k]?.emoji || '').join(' ');

                const countersTxt = new Text({
                    text: `⚔️ vs: ${strongEmojis} (x2)  |  🛡️ vs: ${weakEmojis} (x0.5)`,
                    style: {
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 8.5,
                        fill: '#cbd5e1'
                    }
                });
                countersTxt.x = 14;
                countersTxt.y = 35;
                card.addChild(countersTxt);

                // Interactive Hover Micro-animations
                card.eventMode = 'static';
                card.cursor = 'pointer';
                card.on('pointerover', () => {
                    gsap.to(card.scale, { x: 1.03, y: 1.03, duration: 0.15, ease: 'power1.out' });
                    gsap.to(cBg, { alpha: 1, duration: 0.15 });
                });
                card.on('pointerout', () => {
                    gsap.to(card.scale, { x: 1, y: 1, duration: 0.15, ease: 'power1.out' });
                    gsap.to(cBg, { alpha: 0.85, duration: 0.15 });
                });
            });

            // --- Elegant Sleek Close Button ---
            const closeBtn = new Container();
            closeBtn.x = 0;
            closeBtn.y = height / 2 - 25;
            overlay.addChild(closeBtn);

            const btnBg = new Graphics();
            btnBg.roundRect(-50, -13, 100, 26, 6);
            btnBg.fill({ color: 0xef4444 });
            btnBg.stroke({ color: 0xffffff, width: 1, alpha: 0.2 });
            btnBg.eventMode = 'static';
            btnBg.cursor = 'pointer';
            
            const btnBgWrapper = new Container();
            btnBgWrapper.addChild(btnBg);
            closeBtn.addChild(btnBgWrapper);

            const btnText = new Text({
                text: '❌ Close',
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 11,
                    fontWeight: 'bold',
                    fill: '#ffffff'
                }
            });
            btnText.anchor.set(0.5);
            closeBtn.addChild(btnText);

            const dismiss = () => {
                bg.off('pointerdown');
                btnBg.off('pointerdown');
                gsap.to(overlay, { alpha: 0, duration: 0.22 });
                gsap.to(overlay.scale, {
                    x: 0.5, y: 0.5, duration: 0.22, onComplete: () => {
                        gsap.killTweensOf(overlay);
                        gsap.killTweensOf(overlay.scale);
                        overlay.destroy({ children: true });
                        resolve();
                    }
                });
            };

            // Setup click bindings
            btnBg.on('pointerdown', dismiss);
            btnBg.on('pointerover', () => gsap.to(closeBtn.scale, { x: 1.05, y: 1.05, duration: 0.1 }));
            btnBg.on('pointerout', () => gsap.to(closeBtn.scale, { x: 1, y: 1, duration: 0.1 }));

            // DETECT OUTSIDE BACKDROP CLICK (WITH EXTREME ROBUST GLOBAL MATH)
            bg.on('pointerdown', (e) => {
                const localPos = overlay.toLocal(e.global);
                const isInsideCard = (
                    localPos.x >= -width / 2 && localPos.x <= width / 2 &&
                    localPos.y >= -height / 2 && localPos.y <= height / 2
                );

                if (!isInsideCard) {
                    dismiss();
                }
            });

            // --- Entrance Animation ---
            gsap.to(overlay, { alpha: 1, duration: 0.28 });
            gsap.to(overlay.scale, { x: 1, y: 1, duration: 0.28, ease: 'back.out(1.2)' });
        });
    }
}

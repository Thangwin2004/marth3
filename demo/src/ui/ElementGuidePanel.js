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

            const width = 860;
            const height = 620;

            // --- Dark Modal Background ---
            const bg = new Graphics();
            
            // Outer semi-translucent backdrop blocking the game board
            bg.rect(-Config.canvas.width / 2, -Config.canvas.height / 2, Config.canvas.width, Config.canvas.height);
            bg.fill({ color: 0x000000, alpha: 0.75 });

            // Main Glassmorphic Guide Card
            bg.roundRect(-width / 2, -height / 2, width, height, 20);
            bg.fill({ color: 0x0a1124, alpha: 0.96 });
            bg.stroke({ color: 0x00d2ff, width: 2, alpha: 0.8 }); // neon cyan border
            
            // Inner decorative glass line border
            bg.roundRect(-width / 2 + 6, -height / 2 + 6, width - 12, height - 12, 16);
            bg.stroke({ color: 0xffffff, width: 1, alpha: 0.08 });
            overlay.addChild(bg);

            // --- Header Title ---
            const title = new Text({
                text: '📖 ELEMENT GUIDE & TYPE COUNTERS',
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 26,
                    fontWeight: 'bold',
                    fill: '#ffd54f',
                    dropShadow: { color: '#ff6f00', blur: 6, distance: 0, alpha: 0.6 }
                }
            });
            title.anchor.set(0.5);
            title.y = -height / 2 + 42;
            overlay.addChild(title);

            // --- Description ---
            const subtitle = new Text({
                text: '💥 Super Effective = 2.0x Damage (Green) | 🛡️ Resistant = 0.5x Damage (Red)',
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 13,
                    fill: '#b0bec5'
                }
            });
            subtitle.anchor.set(0.5);
            subtitle.y = -height / 2 + 78;
            overlay.addChild(subtitle);

            // --- Close Click on Backdrop ---
            bg.eventMode = 'static';
            bg.cursor = 'default'; // keep default for backdrop

            // --- 2-Column Grid Layout of Elements ---
            const gridContainer = new Container();
            gridContainer.y = 8;
            overlay.addChild(gridContainer);

            const keys = Object.keys(ELEMENT_DETAILS);
            const cardW = 390;
            const cardH = 75;
            const gapX = 24;
            const gapY = 12;

            keys.forEach((key, index) => {
                const col = index < 5 ? 0 : 1;
                const row = index % 5;
                const detail = ELEMENT_DETAILS[key];

                const card = new Container();
                card.pivot.set(cardW / 2, cardH / 2);
                
                const posX = col === 0 ? -(cardW + gapX / 2) : gapX / 2;
                const posY = row * (cardH + gapY) - 210;
                
                card.x = posX + cardW / 2;
                card.y = posY + cardH / 2;
                gridContainer.addChild(card);

                // Card background
                const cBg = new Graphics();
                cBg.roundRect(0, 0, cardW, cardH, 12);
                cBg.fill({ color: 0x0f172a, alpha: 0.85 });
                cBg.stroke({ color: detail.color, width: 1.5, alpha: 0.45 });
                
                // Pill accent bar
                cBg.roundRect(8, 8, 4, cardH - 16, 2);
                cBg.fill({ color: detail.color, alpha: 0.95 });
                card.addChild(cBg);

                // Element Icon + Name
                const nameTxt = new Text({
                    text: `${detail.emoji} ${detail.name}`,
                    style: {
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 15,
                        fontWeight: 'bold',
                        fill: detail.color
                    }
                });
                nameTxt.x = 20;
                nameTxt.y = 8;
                card.addChild(nameTxt);

                // Stats: Base Dmg + Special Effect
                const statsTxt = new Text({
                    text: `Dmg: ${detail.dmg} | Effect: ${detail.effect}`,
                    style: {
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 11,
                        fill: '#b0bec5'
                    }
                });
                statsTxt.x = 20;
                statsTxt.y = 28;
                card.addChild(statsTxt);

                // Strengths and Weaknesses
                const strongEmojis = detail.weak.map(k => ELEMENT_DETAILS[k]?.emoji || '').join(' ');
                const weakEmojis = detail.resist.map(k => ELEMENT_DETAILS[k]?.emoji || '').join(' ');

                const countersTxt = new Text({
                    text: `⚔️ Deals 2.0x vs: ${strongEmojis}  |  🛡️ Deals 0.5x vs: ${weakEmojis}`,
                    style: {
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 10,
                        fill: '#90a4ae'
                    }
                });
                countersTxt.x = 20;
                countersTxt.y = 48;
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

            // --- Elegant Close Button ---
            const closeBtn = new Container();
            closeBtn.x = 0;
            closeBtn.y = height / 2 - 35;
            overlay.addChild(closeBtn);

            const btnBg = new Graphics();
            btnBg.roundRect(-80, -20, 160, 40, 10);
            btnBg.fill({ color: 0xff7043 });
            btnBg.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
            btnBg.eventMode = 'static';
            btnBg.cursor = 'pointer';
            closeBtn.addChild(btnBg);

            const btnText = new Text({
                text: '❌ Close',
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 15,
                    fontWeight: 'bold',
                    fill: '#ffffff'
                }
            });
            btnText.anchor.set(0.5);
            closeBtn.addChild(btnText);

            const dismiss = () => {
                btnBg.off('pointerdown', dismiss);
                gsap.to(overlay, { alpha: 0, duration: 0.25 });
                gsap.to(overlay.scale, {
                    x: 0.5, y: 0.5, duration: 0.25, onComplete: () => {
                        gsap.killTweensOf(overlay);
                        gsap.killTweensOf(overlay.scale);
                        overlay.destroy({ children: true });
                        resolve();
                    }
                });
            };

            btnBg.on('pointerdown', dismiss);
            btnBg.on('pointerover', () => gsap.to(closeBtn.scale, { x: 1.05, y: 1.05, duration: 0.1 }));
            btnBg.on('pointerout', () => gsap.to(closeBtn.scale, { x: 1, y: 1, duration: 0.1 }));

            // --- Entrance Animation ---
            gsap.to(overlay, { alpha: 1, duration: 0.3 });
            gsap.to(overlay.scale, { x: 1, y: 1, duration: 0.3, ease: 'back.out(1.5)' });
        });
    }
}

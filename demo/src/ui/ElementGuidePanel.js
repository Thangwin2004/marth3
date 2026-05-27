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

            const width = 840;
            const height = 580;

            // --- Dark Modal Background ---
            const bg = new Graphics();
            
            // Outer semi-translucent backdrop blocking the game board
            bg.rect(-Config.canvas.width / 2, -Config.canvas.height / 2, Config.canvas.width, Config.canvas.height);
            bg.fill({ color: 0x000000, alpha: 0.75 });

            // Main Glassmorphic Guide Card
            bg.roundRect(-width / 2, -height / 2, width, height, 20);
            bg.fill({ color: 0x0a1020, alpha: 0.95 });
            bg.stroke({ color: 0x4fc3f7, width: 2, alpha: 0.7 });
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
            title.y = -height / 2 + 40;
            overlay.addChild(title);

            // --- Description ---
            const subtitle = new Text({
                text: '💥 Super Effective = 2.0x Damage (Green) | 🛡️ Resistant = 0.5x Damage (Red)',
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 13,
                    fill: '#888888'
                }
            });
            subtitle.anchor.set(0.5);
            subtitle.y = -height / 2 + 75;
            overlay.addChild(subtitle);

            // --- Close Click on Backdrop ---
            bg.eventMode = 'static';
            bg.cursor = 'default'; // keep default for backdrop

            // --- 2-Column Grid Layout of Elements ---
            const gridContainer = new Container();
            gridContainer.y = -35;
            overlay.addChild(gridContainer);

            const keys = Object.keys(ELEMENT_DETAILS);
            const cardW = 380;
            const cardH = 80;
            const gapX = 30;
            const gapY = 15;

            keys.forEach((key, index) => {
                const col = index < 5 ? 0 : 1;
                const row = index % 5;
                const detail = ELEMENT_DETAILS[key];

                const card = new Container();
                card.x = col === 0 ? -(cardW + gapX / 2) : gapX / 2;
                card.y = row * (cardH + gapY) - 180;
                gridContainer.addChild(card);

                // Card background
                const cBg = new Graphics();
                cBg.roundRect(0, 0, cardW, cardH, 10);
                cBg.fill({ color: 0x11172a, alpha: 0.9 });
                cBg.stroke({ color: detail.color, width: 1.5, alpha: 0.5 });
                card.addChild(cBg);

                // Element Icon + Name
                const nameTxt = new Text({
                    text: `${detail.emoji} ${detail.name}`,
                    style: {
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 16,
                        fontWeight: 'bold',
                        fill: detail.color
                    }
                });
                nameTxt.x = 12;
                nameTxt.y = 10;
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
                statsTxt.x = 12;
                statsTxt.y = 32;
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
                countersTxt.x = 12;
                countersTxt.y = 54;
                card.addChild(countersTxt);
            });

            // --- Elegant Close Button ---
            const closeBtn = new Container();
            closeBtn.x = 0;
            closeBtn.y = height / 2 - 40;
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

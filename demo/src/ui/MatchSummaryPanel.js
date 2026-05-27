import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { App } from '../system/App.js';
import { Config } from '../config.js';
import gsap from 'gsap';

export class MatchSummaryPanel {
    /**
     * Show the match summary panel.
     * @param {Container} parent - BattleScene container
     * @param {object} colorCounts - { fire: 6, water: 3 } mapping
     * @param {number} comboCount - Total combo count
     * @returns {Promise<void>} Resolves when the panel has finished showing
     */
    static show(parent, colorCounts, comboCount) {
        return new Promise(resolve => {
            const container = new Container();
            container.zIndex = 400; // Above HUD, below CoinFlip
            container.x = Config.canvas.width / 2;
            container.y = Config.canvas.height / 2 - 120; // Float above the board
            container.scale.set(0.5);
            container.alpha = 0;
            parent.addChild(container);

            // --- Panel Dimensions ---
            const matchedColors = Object.keys(colorCounts);
            const itemWidth = 85;
            const itemsW = matchedColors.length * itemWidth;
            const width = Math.max(320, itemsW + 60);
            const height = 140;

            // --- Background Card (Glassmorphism + Glow) ---
            const bg = new Graphics();
            
            // Glow behind panel
            bg.roundRect(-width / 2, -height / 2, width, height, 16);
            bg.fill({ color: 0x4fc3f7, alpha: 0.1 });
            
            // Inner dark card
            bg.roundRect(-width / 2, -height / 2, width, height, 16);
            bg.fill({ color: 0x070b19, alpha: 0.95 });
            bg.stroke({ color: 0x4fc3f7, width: 2, alpha: 0.7 });
            container.addChild(bg);

            // --- Title: COMBO COUNT ---
            const comboText = new Text({
                text: `${comboCount}x COMBO!`,
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 34,
                    fontWeight: 'bold',
                    fill: '#ffd54f', // premium gold color
                    dropShadow: { color: '#ff6f00', blur: 8, distance: 0, alpha: 0.8 },
                },
            });
            comboText.anchor.set(0.5);
            comboText.y = -height / 2 + 35;
            container.addChild(comboText);

            // Pulsing effect on combo text scale
            gsap.to(comboText.scale, { x: 1.1, y: 1.1, duration: 0.4, yoyo: true, repeat: -1, ease: 'sine.inOut' });

            // --- Matched Elements Row ---
            const rowContainer = new Container();
            rowContainer.y = 25;
            container.addChild(rowContainer);

            const startX = -(itemsW - itemWidth) / 2;

            matchedColors.forEach((color, index) => {
                const count = colorCounts[color];
                const item = new Container();
                item.x = startX + index * itemWidth;
                rowContainer.addChild(item);

                // actual tile sprite!
                const tileSprite = App.sprite(color);
                tileSprite.anchor.set(0.5);
                tileSprite.x = -15;
                tileSprite.y = 0;
                
                // resize sprite to be slightly smaller (e.g. 36px base)
                const baseSize = Math.max(tileSprite.texture.orig.width, tileSprite.texture.orig.height);
                const scale = 36 / baseSize;
                tileSprite.scale.set(scale);
                item.addChild(tileSprite);

                // count text next to it
                const countText = new Text({
                    text: `x${count}`,
                    style: {
                        fontFamily: 'Arial, sans-serif',
                        fontSize: 20,
                        fontWeight: 'bold',
                        fill: '#ffffff',
                    },
                });
                countText.anchor.set(0, 0.5);
                countText.x = 12;
                countText.y = 0;
                item.addChild(countText);
            });

            // --- ANIMATIONS ---
            // Enter: scale up & fade in
            gsap.to(container, { alpha: 1, duration: 0.3 });
            gsap.to(container.scale, { x: 1, y: 1, duration: 0.4, ease: 'back.out(2)' });

            let timerId = null;
            let dismissed = false;

            const dismiss = () => {
                if (dismissed) return;
                dismissed = true;

                if (timerId) {
                    clearTimeout(timerId);
                    timerId = null;
                }

                // Cleanup event listeners
                bg.off('pointerdown', dismiss);
                parent.off('pointerdown', dismiss);

                // Exit animation: fade out and slide upwards quickly
                gsap.to(container, {
                    alpha: 0,
                    y: container.y - 40,
                    duration: 0.3,
                    ease: 'power2.in',
                    onComplete: () => {
                        // Kill all tweens before destroying to prevent GSAP null-property crash
                        gsap.killTweensOf(comboText.scale);
                        gsap.killTweensOf(container.scale);
                        gsap.killTweensOf(container);
                        container.destroy({ children: true });
                        resolve();
                    },
                });
            };

            // Allow click on panel to dismiss instantly
            bg.eventMode = 'static';
            bg.cursor = 'pointer';
            bg.on('pointerdown', dismiss);

            // Also dismiss on clicking anywhere else on the scene
            parent.eventMode = 'static';
            parent.on('pointerdown', dismiss);

            // Auto dismiss after 1.2 seconds (snappy and automatic)
            timerId = setTimeout(dismiss, 1200);
        });
    }
}

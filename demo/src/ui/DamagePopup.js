import { Text } from 'pixi.js';
import gsap from 'gsap';

export class DamagePopup {
    /**
     * Show a floating damage/heal number.
     * @param {Container} parent - Container to add the popup to
     * @param {number} x - x position
     * @param {number} y - y position
     * @param {number|string} amount - damage/heal amount
     * @param {'damage'|'heal'|'shield'|'critical'|'poison'|'combo'} type
     */
    static show(parent, x, y, amount, type = 'damage') {
        const configs = {
            damage:    { text: `-${amount}`, color: '#ff5252', size: 22, prefix: '' },
            heal:      { text: `+${amount}`, color: '#69f0ae', size: 20, prefix: '' },
            shield:    { text: `+${amount}🛡`, color: '#64b5f6', size: 18, prefix: '' },
            critical:  { text: `CRIT -${amount}!`, color: '#ffd740', size: 28, prefix: '' },
            poison:    { text: `-${amount}☠`, color: '#b388ff', size: 18, prefix: '' },
            combo:     { text: `COMBO x${amount}!`, color: '#ff9800', size: 24, prefix: '🔥 ' },
            effective: { text: `💥 KHẮC HỆ -${amount}!`, color: '#aeea00', size: 26, prefix: '' },
            resisted:  { text: `🛡️ KHÁNG -${amount}`, color: '#cfd8dc', size: 18, prefix: '' },
            sleep:     { text: `💤 GIẢ BỘ NGỦ...`, color: '#81d4fa', size: 22, prefix: '' },
        };
        
        const cfg = configs[type] || configs.damage;
        
        const popup = new Text({
            text: cfg.prefix + cfg.text,
            style: {
                fontFamily: 'Arial',
                fontSize: cfg.size,
                fontWeight: 'bold',
                fill: cfg.color,
                dropShadow: { color: '#000000', blur: 4, distance: 2, alpha: 0.8 },
            },
        });
        
        popup.anchor.set(0.5);
        popup.x = x + (Math.random() - 0.5) * 20; // slight random offset
        popup.y = y;
        popup.zIndex = 999;
        popup.scale.set(0);
        
        parent.addChild(popup);

        // Override destroy to clean up all active GSAP tweens on this popup
        const originalDestroy = popup.destroy.bind(popup);
        popup.destroy = (options) => {
            gsap.killTweensOf(popup);
            gsap.killTweensOf(popup.scale);
            originalDestroy(options);
        };
        
        // Animate: scale up -> float up -> fade out
        gsap.to(popup.scale, { x: 1, y: 1, duration: 0.2, ease: 'back.out(3)' });
        gsap.to(popup, { y: y - 60, duration: 1.0, ease: 'power2.out' });
        gsap.to(popup, {
            alpha: 0,
            duration: 0.4,
            delay: 0.7,
            onComplete: () => popup.destroy(),
        });
    }
}

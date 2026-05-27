import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';

export class Projectile {
    /**
     * Fire a projectile from start to end position.
     * @param {Container} parent
     * @param {{ x:number, y:number }} start
     * @param {{ x:number, y:number }} end
     * @param {number} color
     * @returns {Promise<void>}
     */
    static async fire(parent, start, end, color = 0xff6240) {
        if (!parent || parent.destroyed) return;
        const container = new Container();
        container.zIndex = 150;
        parent.addChild(container);
        
        // Main projectile
        const proj = new Graphics();
        proj.circle(0, 0, 10);
        proj.fill({ color, alpha: 0.9 });
        // Glow
        proj.circle(0, 0, 18);
        proj.fill({ color, alpha: 0.3 });
        proj.x = start.x;
        proj.y = start.y;
        container.addChild(proj);
        
        // Trail particles
        const trailCount = 8;
        for (let i = 0; i < trailCount; i++) {
            const trail = new Graphics();
            trail.circle(0, 0, 4 + Math.random() * 4);
            trail.fill({ color, alpha: 0.4 });
            trail.x = start.x;
            trail.y = start.y;
            container.addChild(trail);
            
            // Each trail particle follows with delay
            gsap.to(trail, {
                x: end.x + (Math.random() - 0.5) * 20,
                y: end.y + (Math.random() - 0.5) * 20,
                alpha: 0,
                duration: 0.5,
                delay: i * 0.03,
                ease: 'power2.in',
            });
        }
        
        // Main projectile movement
        try {
            await gsap.to(proj, {
                x: end.x,
                y: end.y,
                duration: 0.4,
                ease: 'power2.in',
            });
        } catch (e) {}
        
        // Safety check after async movement
        if (parent.destroyed || container.destroyed) return;
        
        // Impact burst
        Projectile.burst(container, end.x, end.y, color);
        
        // Fade out projectile
        gsap.to(proj, { alpha: 0, duration: 0.2 });
        
        // Wait for particles then destroy
        await new Promise(r => setTimeout(r, 600));
        
        if (!container.destroyed) {
            // Kill all running tweens on any of its children before destroying
            gsap.killTweensOf(container);
            container.children.forEach(child => {
                gsap.killTweensOf(child);
                if (child.scale) gsap.killTweensOf(child.scale);
            });
            container.destroy({ children: true });
        }
    }
    
    /**
     * Create a burst of particles at a position.
     * @param {Container} parent
     * @param {number} x
     * @param {number} y
     * @param {number} color
     */
    static burst(parent, x, y, color) {
        if (!parent || parent.destroyed) return;
        const count = 12;
        for (let i = 0; i < count; i++) {
            const p = new Graphics();
            const size = 3 + Math.random() * 5;
            p.circle(0, 0, size);
            p.fill({ color, alpha: 0.8 });
            p.x = x;
            p.y = y;
            parent.addChild(p);
            
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const dist = 30 + Math.random() * 40;
            
            gsap.to(p, {
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    if (p && !p.destroyed) {
                        try { p.destroy(); } catch (e) {}
                    }
                },
            });
        }
    }
    
    /**
     * Heal sparkle effect rising from target.
     * @param {Container} parent
     * @param {number} x
     * @param {number} y
     */
    static async heal(parent, x, y) {
        if (!parent || parent.destroyed) return;
        const count = 10;
        for (let i = 0; i < count; i++) {
            const p = new Graphics();
            p.circle(0, 0, 3 + Math.random() * 3);
            p.fill({ color: 0x69f0ae, alpha: 0.8 });
            p.x = x + (Math.random() - 0.5) * 40;
            p.y = y + 20;
            parent.addChild(p);
            
            gsap.to(p, {
                y: y - 40 - Math.random() * 30,
                alpha: 0,
                duration: 0.6 + Math.random() * 0.4,
                delay: i * 0.05,
                ease: 'power2.out',
                onComplete: () => {
                    if (p && !p.destroyed) {
                        try { p.destroy(); } catch (e) {}
                    }
                },
            });
        }
        await new Promise(r => setTimeout(r, 800));
    }
    
    /**
     * Shield effect around target.
     */
    static async shield(parent, x, y) {
        if (!parent || parent.destroyed) return;
        const shield = new Graphics();
        shield.circle(0, 0, 45);
        shield.stroke({ color: 0x42a5f5, width: 3 });
        shield.fill({ color: 0x42a5f5, alpha: 0.15 });
        shield.x = x;
        shield.y = y;
        shield.scale.set(0);
        parent.addChild(shield);
        
        gsap.to(shield.scale, { x: 1.2, y: 1.2, duration: 0.3, ease: 'back.out(2)' });
        gsap.to(shield, {
            alpha: 0,
            duration: 0.8,
            delay: 0.4,
            onComplete: () => {
                if (shield && !shield.destroyed) {
                    try { shield.destroy(); } catch (e) {}
                }
            }
        });
        await new Promise(r => setTimeout(r, 800));
    }
    
    /**
     * Poison splash.
     */
    static async poison(parent, start, end) {
        await Projectile.fire(parent, start, end, 0xb388ff);
    }
}

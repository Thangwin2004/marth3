import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';

export class Projectile {
    /**
     * Fire an elemental-themed projectile from start to end position.
     * @param {Container} parent - Parent container
     * @param {{ x:number, y:number }} start - Starting coordinates
     * @param {{ x:number, y:number }} end - Target coordinates
     * @param {number} color - Fallback hex color
     * @param {string} tileType - Element type ('fire', 'water', 'nature', 'ice', 'lightning', 'earth', 'wind-air', 'psychic-eye', 'sun', 'poison-death')
     * @returns {Promise<void>}
     */
    static async fire(parent, start, end, color = 0xff6240, tileType = 'fire') {
        if (!parent || parent.destroyed) return;
        const container = new Container();
        container.zIndex = 150;
        parent.addChild(container);
        
        // Calculate angle of travel for orienting directional projectiles
        const dx = end.x - start.x;
        const dy = end.y - start.y;
        const travelAngle = Math.atan2(dy, dx);
        
        // Main projectile Graphics
        const proj = new Graphics();
        
        // Draw distinct, premium shapes based on tile type
        if (tileType === 'fire') {
            // Blazing Fireball: overlapping glowing fiery layers
            proj.circle(0, 0, 12);
            proj.fill({ color: 0xff3d00, alpha: 0.9 });
            proj.circle(-4, 0, 8);
            proj.fill({ color: 0xff9100, alpha: 0.95 });
            proj.circle(-8, 0, 5);
            proj.fill({ color: 0xffea00, alpha: 1.0 });
        } else if (tileType === 'water') {
            // Aerodynamic Water Droplet
            proj.moveTo(12, 0);
            proj.quadraticCurveTo(-2, 7, -8, 7);
            proj.quadraticCurveTo(-14, 7, -14, 0);
            proj.quadraticCurveTo(-14, -7, -8, -7);
            proj.quadraticCurveTo(-2, -7, 12, 0);
            proj.fill({ color: 0x29b6f6 });
            // Glassy glare highlight
            proj.circle(-4, -2, 3);
            proj.fill({ color: 0xffffff, alpha: 0.65 });
            proj.rotation = travelAngle;
        } else if (tileType === 'nature') {
            // Swirling green leaf blade
            proj.moveTo(0, -12);
            proj.quadraticCurveTo(7, -5, 0, 12);
            proj.quadraticCurveTo(-7, -5, 0, -12);
            proj.fill({ color: 0x66bb6a });
            // Leaf vein line
            proj.moveTo(0, -12);
            proj.lineTo(0, 10);
            proj.stroke({ color: 0x2e7d32, width: 1.5 });
            
            // Continuous spinning animation
            gsap.to(proj, { rotation: Math.PI * 6, duration: 0.4, ease: 'none' });
        } else if (tileType === 'ice') {
            // Aligned diamond icicle
            proj.moveTo(15, 0);
            proj.lineTo(0, 6);
            proj.lineTo(-15, 0);
            proj.lineTo(0, -6);
            proj.closePath();
            proj.fill({ color: 0x80d8ff });
            // Glowing white core
            proj.moveTo(10, 0);
            proj.lineTo(0, 3);
            proj.lineTo(-10, 0);
            proj.lineTo(0, -3);
            proj.closePath();
            proj.fill({ color: 0xffffff, alpha: 0.8 });
            proj.rotation = travelAngle;
        } else if (tileType === 'lightning') {
            // Jagged crackling electric bolt
            proj.moveTo(12, -4);
            proj.lineTo(2, -2);
            proj.lineTo(0, -8);
            proj.lineTo(-12, 4);
            proj.lineTo(-2, 2);
            proj.lineTo(0, 8);
            proj.closePath();
            proj.fill({ color: 0xffeb3b });
            proj.rotation = travelAngle;
        } else if (tileType === 'earth') {
            // Jagged, rotating rocky boulder
            proj.moveTo(-10, -5);
            proj.lineTo(-3, -12);
            proj.lineTo(8, -8);
            proj.lineTo(12, 3);
            proj.lineTo(4, 12);
            proj.lineTo(-8, 9);
            proj.closePath();
            proj.fill({ color: 0x8d6e63 });
            proj.stroke({ color: 0x5d4037, width: 2 });
            // Continuous tumbling animation
            gsap.to(proj, { rotation: -Math.PI * 4, duration: 0.4, ease: 'none' });
        } else if (tileType === 'wind-air') {
            // Razor wind crescent slicing forward
            proj.moveTo(14, 0);
            proj.quadraticCurveTo(0, 10, -14, 0);
            proj.quadraticCurveTo(0, 4, 14, 0);
            proj.fill({ color: 0xb2ebf2, alpha: 0.85 });
            proj.rotation = travelAngle;
        } else if (tileType === 'psychic-eye') {
            // Glowing cosmic psychic eye
            proj.moveTo(-14, 0);
            proj.quadraticCurveTo(0, -9, 14, 0);
            proj.quadraticCurveTo(0, 9, -14, 0);
            proj.fill({ color: 0xce93d8 });
            proj.circle(0, 0, 5);
            proj.fill({ color: 0x4a148c });
            proj.circle(0, 0, 2);
            proj.fill({ color: 0xffffff });
            proj.rotation = travelAngle;
        } else if (tileType === 'sun') {
            // Dazzling solar sphere with shining rays
            proj.circle(0, 0, 9);
            proj.fill({ color: 0xffb300 });
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI / 4) * i;
                proj.moveTo(Math.cos(a) * 8, Math.sin(a) * 8);
                proj.lineTo(Math.cos(a) * 14, Math.sin(a) * 14);
                proj.lineTo(Math.cos(a + 0.25) * 8, Math.sin(a + 0.25) * 8);
            }
            proj.fill({ color: 0xffe082 });
            gsap.to(proj, { rotation: Math.PI * 2, duration: 0.4, ease: 'none' });
        } else if (tileType === 'poison-death') {
            // Venomous bubbling acid globule
            proj.circle(0, 0, 11);
            proj.fill({ color: 0x9c27b0 });
            proj.circle(-4, -4, 4);
            proj.fill({ color: 0x00e676, alpha: 0.8 }); // glowing green acid bubble
        } else {
            // Default generic glowing orb (fallback)
            proj.circle(0, 0, 10);
            proj.fill({ color, alpha: 0.9 });
            proj.circle(0, 0, 18);
            proj.fill({ color, alpha: 0.3 });
        }
        
        proj.x = start.x;
        proj.y = start.y;
        container.addChild(proj);
        
        // Continuous element-themed trail particle emitter
        const spawnTrailParticle = () => {
            if (container.destroyed || proj.destroyed) return;
            const trail = new Graphics();
            let pSize = 3 + Math.random() * 4;
            
            if (tileType === 'fire') {
                trail.circle(0, 0, pSize);
                trail.fill({ color: Math.random() > 0.5 ? 0xff9100 : 0xff3d00, alpha: 0.85 });
            } else if (tileType === 'lightning') {
                trail.rect(-1, -4, 2, 8);
                trail.fill({ color: 0xfff59d, alpha: 0.9 });
                trail.rotation = Math.random() * Math.PI;
            } else if (tileType === 'nature') {
                trail.ellipse(0, 0, pSize, pSize / 2);
                trail.fill({ color: 0x81c784, alpha: 0.75 });
                trail.rotation = Math.random() * Math.PI;
            } else if (tileType === 'ice') {
                trail.rect(-2, -2, 4, 4);
                trail.fill({ color: 0xb3e5fc, alpha: 0.85 });
                trail.rotation = Math.random() * Math.PI;
            } else if (tileType === 'water') {
                trail.circle(0, 0, pSize - 1);
                trail.fill({ color: 0x80d8ff, alpha: 0.75 });
            } else if (tileType === 'poison-death') {
                trail.circle(0, 0, pSize - 1);
                trail.fill({ color: 0xe040fb, alpha: 0.75 });
            } else {
                trail.circle(0, 0, pSize);
                trail.fill({ color, alpha: 0.6 });
            }
            
            trail.x = proj.x + (Math.random() - 0.5) * 8;
            trail.y = proj.y + (Math.random() - 0.5) * 8;
            container.addChild(trail);
            
            gsap.to(trail, {
                x: trail.x - (end.x - start.x) * 0.12 + (Math.random() - 0.5) * 15,
                y: trail.y - (end.y - start.y) * 0.12 + (Math.random() - 0.5) * 15,
                alpha: 0,
                duration: 0.35 + Math.random() * 0.2,
                onComplete: () => {
                    if (trail && !trail.destroyed) {
                        try { trail.destroy(); } catch (e) {}
                    }
                }
            });
        };

        // Spawn a trail particle every 20ms during flight
        const emitterInterval = setInterval(spawnTrailParticle, 20);
        
        // Main projectile motion
        try {
            await gsap.to(proj, {
                x: end.x,
                y: end.y,
                duration: 0.4,
                ease: 'power2.in',
            });
        } catch (e) {}
        
        // Stop trailing
        clearInterval(emitterInterval);
        
        // Safety check after async movement
        if (parent.destroyed || container.destroyed) return;
        
        // Unique elemental impact burst
        Projectile.burst(container, end.x, end.y, color, tileType);
        
        // Fade out projectile
        gsap.to(proj, { alpha: 0, duration: 0.15 });
        
        // Wait for final particles to clear and destroy container
        await new Promise(r => setTimeout(r, 600));
        
        if (!container.destroyed) {
            gsap.killTweensOf(container);
            container.children.forEach(child => {
                gsap.killTweensOf(child);
                if (child.scale) gsap.killTweensOf(child.scale);
            });
            container.destroy({ children: true });
        }
    }
    
    /**
     * Create a gorgeous element-themed explosion burst of particles at impact.
     * @param {Container} parent
     * @param {number} x
     * @param {number} y
     * @param {number} color
     * @param {string} tileType
     */
    static burst(parent, x, y, color, tileType = 'fire') {
        if (!parent || parent.destroyed) return;
        const count = 16; // dense particle explosion
        
        for (let i = 0; i < count; i++) {
            const p = new Graphics();
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
            const dist = 42 + Math.random() * 45;
            let duration = 0.5 + Math.random() * 0.3;
            
            // Customize particle layouts and colors based on element
            if (tileType === 'fire') {
                p.circle(0, 0, 4 + Math.random() * 4);
                const fireColors = [0xff3d00, 0xff9100, 0xffea00];
                p.fill({ color: fireColors[Math.floor(Math.random() * fireColors.length)], alpha: 0.9 });
            } else if (tileType === 'water') {
                // Water splash drops
                p.moveTo(0, -6);
                p.quadraticCurveTo(4, 0, 0, 6);
                p.quadraticCurveTo(-4, 0, 0, -6);
                p.fill({ color: 0x00b0ff, alpha: 0.85 });
                p.rotation = angle + Math.PI / 2;
            } else if (tileType === 'nature') {
                // Floating green leaves
                p.moveTo(0, -5);
                p.quadraticCurveTo(3, -2, 0, 5);
                p.quadraticCurveTo(-3, -2, 0, -5);
                p.fill({ color: 0x4caf50, alpha: 0.85 });
                p.rotation = angle + Math.PI / 2 + Math.random() * 2;
            } else if (tileType === 'ice') {
                // Shattered frost diamonds
                p.moveTo(0, -5);
                p.lineTo(3, 0);
                p.lineTo(0, 5);
                p.lineTo(-3, 0);
                p.closePath();
                p.fill({ color: Math.random() > 0.5 ? 0xffffff : 0xb3e5fc, alpha: 0.9 });
                p.rotation = Math.random() * Math.PI;
            } else if (tileType === 'lightning') {
                // Electric spark arcs
                p.rect(-1, -6, 2, 12);
                p.fill({ color: 0xffeb3b, alpha: 0.95 });
                p.rotation = angle;
            } else if (tileType === 'earth') {
                // Crumbling brown boulders falling with gravity
                p.moveTo(-4, -2);
                p.lineTo(2, -4);
                p.lineTo(5, 2);
                p.lineTo(-2, 4);
                p.closePath();
                p.fill({ color: 0x5d4037, alpha: 0.85 });
                p.rotation = Math.random() * Math.PI;
            } else if (tileType === 'wind-air') {
                // expanding wind sparks
                p.circle(0, 0, 3 + Math.random() * 2);
                p.fill({ color: 0xe0f7fa, alpha: 0.8 });
            } else if (tileType === 'psychic-eye') {
                // magic violet sparks
                p.circle(0, 0, 3);
                p.fill({ color: 0xe040fb, alpha: 0.9 });
            } else if (tileType === 'sun') {
                // solar flares
                p.circle(0, 0, 4);
                p.fill({ color: 0xffd54f, alpha: 0.9 });
            } else if (tileType === 'poison-death') {
                // venomous acid splatters sinking down
                p.circle(0, 0, 4);
                p.fill({ color: 0xaa00ff, alpha: 0.85 });
            } else {
                p.circle(0, 0, 3 + Math.random() * 4);
                p.fill({ color, alpha: 0.8 });
            }
            
            p.x = x;
            p.y = y;
            parent.addChild(p);
            
            // Scatter trajectory calculations
            const targetX = x + Math.cos(angle) * dist;
            let targetY = y + Math.sin(angle) * dist;
            
            // Introduce gravity effect to Earth and Poison particles
            if (tileType === 'earth' || tileType === 'poison-death') {
                targetY += 22;
            }
            
            gsap.to(p, {
                x: targetX,
                y: targetY,
                alpha: 0,
                duration: duration,
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
        const count = 12;
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
     * Poison splash (backwards compatibility).
     */
    static async poison(parent, start, end) {
        await Projectile.fire(parent, start, end, 0xb388ff, 'poison-death');
    }
}

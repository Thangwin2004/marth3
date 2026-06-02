import { Container, Graphics } from 'pixi.js';
import gsap from 'gsap';

export class Projectile {
    /**
     * Fire an elemental-themed projectile from start to end position.
     * @param {Container} parent - Parent container
     * @param {{ x:number, y:number }} start - Starting coordinates
     * @param {{ x:number, y:number }} end - Target coordinates
     * @param {number} color - Fallback hex color
     * @param {string} tileType - Element type
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
        
        // Main projectile Container to hold projectile and optional orbits
        const projContainer = new Container();
        projContainer.x = start.x;
        projContainer.y = start.y;
        projContainer.scale.set(2.3); // Massive base scale of 2.3x!
        container.addChild(projContainer);

        // Main projectile Graphics
        const proj = new Graphics();
        projContainer.addChild(proj);
        
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

        // --- PREMIUM 1: GSAP Projectile Scale Pulsing Tween ---
        // Pulsing between 2.3x and 2.7x for epic prominence!
        gsap.to(projContainer.scale, { x: 2.7, y: 2.7, duration: 0.15, yoyo: true, repeat: -1, ease: 'sine.inOut' });

        // --- PREMIUM 2: Swirling Secondary Elemental Orbit ---
        if (tileType === 'fire' || tileType === 'psychic-eye' || tileType === 'sun' || tileType === 'lightning') {
            const orb = new Graphics();
            orb.circle(0, 0, 4);
            let orbCol = 0xffea00;
            if (tileType === 'fire') orbCol = 0xff9100;
            else if (tileType === 'psychic-eye') orbCol = 0xe040fb;
            else if (tileType === 'lightning') orbCol = 0xffffff;
            orb.fill({ color: orbCol });
            projContainer.addChild(orb);
            
            gsap.to(orb, {
                x: 16,
                y: 16,
                duration: 0.22,
                repeat: -1,
                ease: 'none',
                onUpdate: function() {
                    const ratio = this.targets()[0] ? this.progress() : 0;
                    const time = ratio * Math.PI * 2;
                    orb.x = Math.cos(time) * 16;
                    orb.y = Math.sin(time) * 16;
                }
            });
        }
        
        // Continuous element-themed trail particle emitter
        const spawnTrailParticle = () => {
            if (container.destroyed || projContainer.destroyed || proj.destroyed) return;
            const trail = new Graphics();
            let pSize = 4 + Math.random() * 5; // Upscaled trail particles to match the large orb
            
            // --- PREMIUM 3: Extremely Detailed Element Trails ---
            if (tileType === 'fire') {
                if (Math.random() > 0.4) {
                    // Fiery ember spark
                    trail.circle(0, 0, pSize);
                    trail.fill({ color: Math.random() > 0.5 ? 0xff9100 : 0xff3d00, alpha: 0.9 });
                } else {
                    // Charcoal drifting smoke
                    pSize *= 1.5;
                    trail.circle(0, 0, pSize);
                    trail.fill({ color: 0x3e2723, alpha: 0.45 });
                }
            } else if (tileType === 'lightning') {
                // Crackling Jagged Electric Arc
                const length = 14 + Math.random() * 14;
                const angle = Math.random() * Math.PI * 2;
                trail.moveTo(0, 0);
                trail.lineTo(Math.cos(angle) * (length / 2) + (Math.random() - 0.5) * 6, Math.sin(angle) * (length / 2) + (Math.random() - 0.5) * 6);
                trail.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
                trail.stroke({ color: 0xffffff, width: 2 });
            } else if (tileType === 'nature') {
                // Swirling nature leaf
                trail.moveTo(0, -pSize);
                trail.quadraticCurveTo(pSize / 2, -pSize / 2, 0, pSize);
                trail.quadraticCurveTo(-pSize / 2, -pSize / 2, 0, -pSize);
                trail.fill({ color: 0x81c784, alpha: 0.8 });
                trail.rotation = Math.random() * Math.PI;
            } else if (tileType === 'ice') {
                // Hexagonal Star snowflake
                trail.moveTo(0, -pSize);
                trail.lineTo(pSize, -pSize / 2);
                trail.lineTo(pSize, pSize / 2);
                trail.lineTo(0, pSize);
                trail.lineTo(-pSize, pSize / 2);
                trail.lineTo(-pSize, -pSize / 2);
                trail.closePath();
                trail.fill({ color: Math.random() > 0.5 ? 0xffffff : 0xb3e5fc, alpha: 0.85 });
                trail.rotation = Math.random() * Math.PI;
            } else if (tileType === 'water') {
                if (Math.random() > 0.5) {
                    // Translucent bubble
                    trail.circle(0, 0, pSize - 1);
                    trail.stroke({ color: 0x80d8ff, width: 1 });
                    trail.fill({ color: 0x80d8ff, alpha: 0.25 });
                } else {
                    // Liquid droplet
                    trail.circle(0, 0, pSize - 1);
                    trail.fill({ color: 0x29b6f6, alpha: 0.75 });
                }
            } else if (tileType === 'poison-death') {
                // Bubbling acid globule
                trail.circle(0, 0, pSize - 1);
                trail.fill({ color: Math.random() > 0.5 ? 0xe040fb : 0x00e676, alpha: 0.8 });
            } else if (tileType === 'wind-air') {
                // Wind Vortex Ring
                trail.circle(0, 0, pSize * 1.5);
                trail.stroke({ color: 0xe0f7fa, width: 1.5, alpha: 0.7 });
            } else if (tileType === 'sun') {
                // Golden solar flare star
                trail.moveTo(0, -pSize * 1.2);
                trail.lineTo(pSize * 0.3, -pSize * 0.3);
                trail.lineTo(pSize * 1.2, 0);
                trail.lineTo(pSize * 0.3, pSize * 0.3);
                trail.lineTo(0, pSize * 1.2);
                trail.lineTo(-pSize * 0.3, pSize * 0.3);
                trail.lineTo(-pSize * 1.2, 0);
                trail.lineTo(-pSize * 0.3, -pSize * 0.3);
                trail.closePath();
                trail.fill({ color: 0xffd54f, alpha: 0.85 });
            } else {
                trail.circle(0, 0, pSize);
                trail.fill({ color, alpha: 0.6 });
            }
            
            trail.x = projContainer.x + (Math.random() - 0.5) * 8;
            trail.y = projContainer.y + (Math.random() - 0.5) * 8;
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
            await gsap.to(projContainer, {
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
        
        // Unique elemental impact burst (shockwave and particles)
        Projectile.burst(container, end.x, end.y, color, tileType);
        
        // Fade out projectile
        gsap.to(projContainer, { alpha: 0, duration: 0.15 });
        
        // Wait for final particles to clear and destroy container
        await new Promise(r => setTimeout(r, 600));
        
        // --- PREMIUM 5: Recursively Kill All Active Tweens on Destruction to Avoid GSAP 'Cannot set properties of null' Crashes! ---
        if (!container.destroyed) {
            const killAllTweens = (obj) => {
                gsap.killTweensOf(obj);
                if (obj.scale) gsap.killTweensOf(obj.scale);
                if (obj.children) {
                    obj.children.forEach(killAllTweens);
                }
            };
            killAllTweens(container);
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

        // --- PREMIUM 4: Cinematic Shockwave Rings / Cracks at Impact (Upscaled!) ---
        if (tileType === 'fire') {
            const ring = new Graphics();
            ring.circle(0, 0, 5);
            ring.stroke({ color: 0xff3d00, width: 3 });
            ring.x = x; ring.y = y;
            parent.addChild(ring);
            gsap.to(ring.scale, { x: 13, y: 13, duration: 0.45, ease: 'power2.out' });
            gsap.to(ring, { alpha: 0, duration: 0.45, onComplete: () => ring.destroy() });
        } else if (tileType === 'water') {
            const ring = new Graphics();
            ring.circle(0, 0, 5);
            ring.stroke({ color: 0x00b0ff, width: 2.5 });
            ring.x = x; ring.y = y;
            parent.addChild(ring);
            gsap.to(ring.scale, { x: 12, y: 12, duration: 0.5, ease: 'power1.out' });
            gsap.to(ring, { alpha: 0, duration: 0.5, onComplete: () => ring.destroy() });
        } else if (tileType === 'lightning') {
            const arcs = new Graphics();
            arcs.x = x; arcs.y = y;
            parent.addChild(arcs);
            // Draw 5 crackling lightning lines shooting outward
            for (let k = 0; k < 5; k++) {
                const a = (Math.PI * 2 * k) / 5 + (Math.random() - 0.5) * 0.5;
                const len = 68 + Math.random() * 42;
                arcs.moveTo(0, 0);
                arcs.lineTo(Math.cos(a) * (len / 2) + (Math.random() - 0.5) * 10, Math.sin(a) * (len / 2) + (Math.random() - 0.5) * 10);
                arcs.lineTo(Math.cos(a) * len, Math.sin(a) * len);
            }
            arcs.stroke({ color: 0xffffff, width: 3 });
            gsap.to(arcs, { alpha: 0, duration: 0.35, ease: 'power2.in', onComplete: () => arcs.destroy() });
        } else if (tileType === 'earth') {
            const cracks = new Graphics();
            cracks.x = x; cracks.y = y;
            parent.addChild(cracks);
            // Draw jagged cracks spreading
            for (let k = 0; k < 4; k++) {
                const a = (Math.PI / 2) * k + (Math.random() - 0.5) * 0.4;
                const len = 48 + Math.random() * 32;
                cracks.moveTo(0, 0);
                cracks.lineTo(Math.cos(a) * (len * 0.6) + (Math.random() - 0.5) * 5, Math.sin(a) * (len * 0.6) + (Math.random() - 0.5) * 5);
                cracks.lineTo(Math.cos(a) * len, Math.sin(a) * len);
            }
            cracks.stroke({ color: 0x5d4037, width: 2.5 });
            gsap.to(cracks, { alpha: 0, duration: 0.6, delay: 0.15, onComplete: () => cracks.destroy() });
        } else if (tileType === 'wind-air') {
            const windRing = new Graphics();
            windRing.circle(0, 0, 5);
            windRing.stroke({ color: 0xb2ebf2, width: 2 });
            windRing.x = x; windRing.y = y;
            parent.addChild(windRing);
            gsap.to(windRing.scale, { x: 14, y: 14, duration: 0.4, ease: 'power2.out' });
            gsap.to(windRing, { alpha: 0, duration: 0.4, onComplete: () => windRing.destroy() });
        } else if (tileType === 'psychic-eye') {
            const ripple = new Graphics();
            ripple.circle(0, 0, 5);
            ripple.stroke({ color: 0xe040fb, width: 2.5 });
            ripple.x = x; ripple.y = y;
            parent.addChild(ripple);
            gsap.to(ripple.scale, { x: 13, y: 13, duration: 0.45, ease: 'sine.out' });
            gsap.to(ripple, { alpha: 0, duration: 0.45, onComplete: () => ripple.destroy() });
        } else if (tileType === 'sun') {
            const nova = new Graphics();
            nova.circle(0, 0, 5);
            nova.fill({ color: 0xffd54f, alpha: 0.8 });
            nova.x = x; nova.y = y;
            parent.addChild(nova);
            gsap.to(nova.scale, { x: 14, y: 14, duration: 0.35, ease: 'back.out(2)' });
            gsap.to(nova, { alpha: 0, duration: 0.35, onComplete: () => nova.destroy() });
        }

        const count = 18; // dense particle explosion
        
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

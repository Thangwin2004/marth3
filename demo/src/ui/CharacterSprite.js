import { Container, Graphics, Sprite, Text, Assets } from 'pixi.js';
import gsap from 'gsap';
import { App } from '../system/App.js';

export class CharacterSprite {
    constructor(config = {}) {
        // config: { side: 'left'|'right', name: string, emoji: string, color: hex, scale: number, isPlayer: boolean, imagePath: string }
        this.container = new Container();
        this.side = config.side || 'left';
        this.name = config.name || 'Character';
        this.emoji = config.emoji || '⚔️';
        this.color = config.color || 0x4fc3f7;
        this.scale = config.scale || 1.0;
        this.isPlayer = config.isPlayer !== false;
        this.imagePath = config.imagePath || null;
        
        this.body = new Container();
        this.bodyGraphics = new Graphics();
        this.body.addChild(this.bodyGraphics);
        this.statusContainer = new Container();
        this.nameText = null;
        this.isEnraged = false;
        
        this.draw();
        this.playIdle();

        // 2D Character Card Interactive Hover Scaling
        this.container.eventMode = 'static';
        this.container.cursor = 'pointer';
        this.container.on('pointerover', () => {
            if (this.isEnraged) return;
            gsap.to(this.body.scale, { x: 1.05, y: 1.05, duration: 0.2, ease: 'power1.out' });
        });
        this.container.on('pointerout', () => {
            if (this.isEnraged) return;
            gsap.to(this.body.scale, { x: 1, y: 1, duration: 0.2, ease: 'power1.out' });
        });
    }

    setEnraged(enraged) {
        if (this.isEnraged === enraged) return;
        this.isEnraged = enraged;
        if (enraged) {
            gsap.killTweensOf(this.body);
            // Pulse y position more violently
            gsap.to(this.body, {
                y: -6, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut'
            });
            // Pulse scale
            gsap.to(this.body.scale, {
                x: 1.08, y: 1.08, duration: 0.6, yoyo: true, repeat: -1, ease: 'sine.inOut'
            });
            // Tint body red/orange to make it glow red
            this.body.tint = 0xff5555;
        } else {
            this.body.tint = 0xffffff;
            if (this.body.scale) {
                this.body.scale.set(1);
            }
            this.playIdle();
        }
    }

    
    draw() {
        // Remove any old children to avoid duplicate sprites/graphics on re-draw
        this.body.removeChildren();
        
        const g = this.bodyGraphics;
        g.clear();
        this.body.addChild(g);
        
        const s = this.scale;
        
        if (this.imagePath) {
            // PREMIUM COMBAT CARD RENDERING FOR CUSTOM IMAGES
            const cardW = 110 * s;
            const cardH = 150 * s;

            // 1. Shadow background
            const shadow = new Graphics();
            shadow.roundRect(-cardW/2 + 4, -cardH/2 + 4, cardW, cardH, 12 * s);
            shadow.fill({ color: 0x000000, alpha: 0.55 });
            this.body.addChild(shadow);

            // 2. Glow Border
            const glow = new Graphics();
            glow.roundRect(-cardW/2 - 2, -cardH/2 - 2, cardW + 4, cardH + 4, 14 * s);
            glow.fill({ color: this.color, alpha: 0.35 });
            this.body.addChild(glow);

            // 3. Image Sprite
            const img = new Sprite();
            img.anchor.set(0.5);
            this.body.addChild(img);

            // Mask
            const mask = new Graphics();
            mask.roundRect(-cardW/2 + 3, -cardH/2 + 3, cardW - 6, cardH - 6, 10 * s);
            mask.fill({ color: 0xffffff });
            this.body.addChild(mask);
            img.mask = mask;

            Assets.load(this.imagePath).then((texture) => {
                if (this.container.destroyed || img.destroyed) return;
                img.texture = texture;
                img.width = cardW - 6;
                img.height = cardH - 6;
            }).catch(err => {
                console.error("Failed to load combat card image:", this.imagePath, err);
            });

            // 4. Solid Border
            const border = new Graphics();
            border.roundRect(-cardW/2, -cardH/2, cardW, cardH, 12 * s);
            border.stroke({ color: this.color, width: 2.5 });
            this.body.addChild(border);
        } else if (this.isPlayer) {
            // PLAYER: Warrior
            // Body (rectangle with rounded top)
            g.roundRect(-25*s, -10*s, 50*s, 60*s, 8*s);
            g.fill({ color: 0x1565c0 }); // blue armor
            
            // Head (circle)
            g.circle(0, -25*s, 18*s);
            g.fill({ color: 0xffcc80 }); // skin tone
            
            // Helmet
            g.roundRect(-20*s, -42*s, 40*s, 20*s, 6*s);
            g.fill({ color: 0x78909c }); // gray helmet
            
            // Eyes
            g.circle(-6*s, -26*s, 3*s);
            g.fill({ color: 0x263238 });
            g.circle(6*s, -26*s, 3*s);
            g.fill({ color: 0x263238 });
            
            // Sword (right side)
            g.rect(25*s, -20*s, 6*s, 50*s);
            g.fill({ color: 0xbdbdbd }); // blade
            g.rect(20*s, -22*s, 16*s, 6*s);
            g.fill({ color: 0x8d6e63 }); // crossguard
            
            // Shield (left side)
            g.roundRect(-38*s, -10*s, 16*s, 30*s, 4*s);
            g.fill({ color: 0x1976d2 });
            g.roundRect(-36*s, -6*s, 12*s, 12*s, 2*s);
            g.fill({ color: 0xffd54f }); // emblem
            
            // Legs
            g.rect(-18*s, 50*s, 14*s, 20*s);
            g.fill({ color: 0x4e342e });
            g.rect(4*s, 50*s, 14*s, 20*s);
            g.fill({ color: 0x4e342e });
        } else {
            // BOSS: Monster shape (scales with this.scale)
            const c = this.color;
            
            // Body (large oval/irregular shape)
            g.roundRect(-30*s, -15*s, 60*s, 70*s, 12*s);
            g.fill({ color: c });
            
            // Head
            g.circle(0, -30*s, 22*s);
            g.fill({ color: c });
            
            // Eyes (menacing, red)
            g.circle(-10*s, -32*s, 5*s);
            g.fill({ color: 0xff1744 });
            g.circle(10*s, -32*s, 5*s);
            g.fill({ color: 0xff1744 });
            
            // Pupils
            g.circle(-10*s, -32*s, 2.5*s);
            g.fill({ color: 0x000000 });
            g.circle(10*s, -32*s, 2.5*s);
            g.fill({ color: 0x000000 });
            
            // Horns/spikes
            g.moveTo(-18*s, -48*s);
            g.lineTo(-12*s, -65*s);
            g.lineTo(-6*s, -48*s);
            g.fill({ color: c });
            g.moveTo(6*s, -48*s);
            g.lineTo(12*s, -65*s);
            g.lineTo(18*s, -48*s);
            g.fill({ color: c });
            
            // Arms/claws
            g.rect(-45*s, 0*s, 18*s, 10*s);
            g.fill({ color: c });
            g.rect(27*s, 0*s, 18*s, 10*s);
            g.fill({ color: c });
            
            // Feet
            g.roundRect(-25*s, 55*s, 20*s, 15*s, 5*s);
            g.fill({ color: c });
            g.roundRect(5*s, 55*s, 20*s, 15*s, 5*s);
            g.fill({ color: c });
        }
        
        this.container.addChild(this.body);
        
        // Name text below
        this.nameText = new Text({
            text: `${this.emoji} ${this.name}`,
            style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#ffffff', align: 'center' },
        });
        this.nameText.anchor.set(0.5, 0);
        this.nameText.y = 80 * this.scale;
        this.container.addChild(this.nameText);
        
        // Status icons container
        this.statusContainer.y = -75 * this.scale;
        this.container.addChild(this.statusContainer);
    }
    
    // === ANIMATION STATES ===
    
    playIdle() {
        gsap.killTweensOf(this.body);
        gsap.to(this.body, {
            y: -3, duration: 1.2, yoyo: true, repeat: -1, ease: 'sine.inOut'
        });
    }
    
    playAttack() {
        return new Promise(resolve => {
            if (this.container.destroyed) { resolve(); return; }
            const dir = this.side === 'left' ? 1 : -1;
            gsap.killTweensOf(this.body);
            const tl = gsap.timeline({ onComplete: () => { if (!this.container.destroyed) this.playIdle(); resolve(); } });
            tl.to(this.body, { x: 40 * dir, duration: 0.15, ease: 'power2.out' })
              .to(this.body, { x: 0, duration: 0.3, ease: 'back.out(2)' });
            // Flash white
            const flash = new Graphics();
            flash.roundRect(-35 * this.scale, -50 * this.scale, 70 * this.scale, 120 * this.scale, 10);
            flash.fill({ color: 0xffffff, alpha: 0.6 });
            this.container.addChild(flash);
            gsap.to(flash, {
                alpha: 0,
                duration: 0.3,
                onComplete: () => {
                    if (flash && !flash.destroyed) {
                        try { flash.destroy(); } catch (e) {}
                    }
                }
            });
        });
    }
    
    playHurt(type = 'damage') {
        return new Promise(resolve => {
            if (this.container.destroyed) { resolve(); return; }
            gsap.killTweensOf(this.body);
            const tl = gsap.timeline({ onComplete: () => { if (!this.container.destroyed) this.playIdle(); resolve(); } });
            // Shake
            tl.to(this.body, { x: -8, duration: 0.05 })
              .to(this.body, { x: 8, duration: 0.05 })
              .to(this.body, { x: -6, duration: 0.05 })
              .to(this.body, { x: 6, duration: 0.05 })
              .to(this.body, { x: 0, duration: 0.1 });
            
            // Map damage/match type to visual colors
            const flashColors = {
                damage: 0xff0000,      // Standard Red
                effective: 0xffea00,   // Bright Gold/Yellow
                resisted: 0x90a4ae,    // Grayish Blue
                poison: 0xb388ff       // Toxic Purple
            };
            const flashColor = flashColors[type] || 0xff0000;

            // Flash overlay animation
            const flash = new Graphics();
            flash.roundRect(-35 * this.scale, -50 * this.scale, 70 * this.scale, 120 * this.scale, 10);
            flash.fill({ color: flashColor, alpha: type === 'effective' ? 0.65 : 0.5 });
            this.container.addChild(flash);
            gsap.to(flash, {
                alpha: 0,
                duration: 0.4,
                onComplete: () => {
                    if (flash && !flash.destroyed) {
                        try { flash.destroy(); } catch (e) {}
                    }
                }
            });

            // Burst matching premium sparkles
            this.playSparkles(type);
        });
    }

    playSparkles(type = 'damage') {
        if (this.container.destroyed) return;
        
        // Custom configs for each damage type
        const config = {
            damage: {
                color: 0xff1744, // Crimson Red
                count: 14,
                speed: 1.0,
                scale: 3.5,
                shape: 'circle'
            },
            effective: {
                color: 0xffea00, // Vibrant Gold
                count: 24, // Extra sparks
                speed: 1.4, // Faster eruption
                scale: 4.5,
                shape: 'star'
            },
            resisted: {
                color: 0x78909c, // Dull Gray-Blue
                count: 8, // Fewer fragments
                speed: 0.7,
                scale: 3.0,
                shape: 'square'
            },
            poison: {
                color: 0xb388ff, // Deep Purple
                count: 16,
                speed: 1.1,
                scale: 3.8,
                shape: 'circle'
            }
        };
        
        const typeCfg = config[type] || config.damage;
        
        // Generate a high performance particle texture using Pixi
        const g = new Graphics();
        if (typeCfg.shape === 'star') {
            // Draw a beautiful 4-pointed star-like energy burst
            g.moveTo(0, -typeCfg.scale);
            g.lineTo(typeCfg.scale * 0.3, -typeCfg.scale * 0.3);
            g.lineTo(typeCfg.scale, 0);
            g.lineTo(typeCfg.scale * 0.3, typeCfg.scale * 0.3);
            g.lineTo(0, typeCfg.scale);
            g.lineTo(-typeCfg.scale * 0.3, typeCfg.scale * 0.3);
            g.lineTo(-typeCfg.scale, 0);
            g.lineTo(-typeCfg.scale * 0.3, -typeCfg.scale * 0.3);
            g.closePath();
        } else if (typeCfg.shape === 'square') {
            g.rect(-typeCfg.scale/2, -typeCfg.scale/2, typeCfg.scale, typeCfg.scale);
        } else {
            // Circle
            g.circle(0, 0, typeCfg.scale);
        }
        g.fill({ color: typeCfg.color });
        
        if (type === 'effective') {
            g.stroke({ color: 0xffffff, width: 1.5, alpha: 0.8 });
        }
        
        const texture = App.app.renderer.generateTexture({ target: g });
        g.destroy();

        // Spawn particles
        for (let i = 0; i < typeCfg.count; i++) {
            const sp = new Sprite(texture);
            sp.anchor.set(0.5);
            
            // Random start position around the card center
            sp.x = (Math.random() - 0.5) * 50 * this.scale;
            sp.y = (Math.random() - 0.5) * 70 * this.scale;
            this.container.addChild(sp);

            const angle = Math.random() * Math.PI * 2;
            const dist = (35 + Math.random() * 65) * typeCfg.speed;

            // Animate sparkle outward
            gsap.to(sp, {
                x: sp.x + Math.cos(angle) * dist * this.scale,
                y: sp.y + Math.sin(angle) * dist * this.scale,
                alpha: 0,
                rotation: Math.random() * Math.PI * 4,
                duration: 0.5 + Math.random() * 0.5,
                ease: 'power2.out',
                onComplete: () => {
                    if (sp && !sp.destroyed) {
                        try { sp.destroy(); } catch (e) {}
                    }
                }
            });
        }

        // Add an expanding shockwave circle for super effective hits
        if (type === 'effective') {
            const ring = new Graphics();
            ring.circle(0, 0, 10);
            ring.stroke({ color: 0xffea00, width: 3, alpha: 0.8 });
            this.container.addChild(ring);
            
            gsap.to(ring.scale, {
                x: 8 * this.scale,
                y: 8 * this.scale,
                duration: 0.4,
                ease: 'power1.out'
            });
            gsap.to(ring, {
                alpha: 0,
                duration: 0.4,
                ease: 'power1.out',
                onComplete: () => {
                    if (ring && !ring.destroyed) {
                        try { ring.destroy(); } catch (e) {}
                    }
                }
            });
        }
    }
    
    playHeal() {
        return new Promise(resolve => {
            if (this.container.destroyed) { resolve(); return; }
            const flash = new Graphics();
            flash.roundRect(-35 * this.scale, -50 * this.scale, 70 * this.scale, 120 * this.scale, 10);
            flash.fill({ color: 0x4caf50, alpha: 0.5 });
            this.container.addChild(flash);
            gsap.to(flash, {
                alpha: 0,
                duration: 0.6,
                onComplete: () => {
                    if (flash && !flash.destroyed) {
                        try { flash.destroy(); } catch (e) {}
                    }
                    resolve();
                }
            });
        });
    }
    
    playShield() {
        return new Promise(resolve => {
            if (this.container.destroyed) { resolve(); return; }
            const shield = new Graphics();
            shield.circle(0, 0, 50 * this.scale);
            shield.stroke({ color: 0x42a5f5, width: 4, alpha: 0.8 });
            shield.fill({ color: 0x42a5f5, alpha: 0.15 });
            this.container.addChild(shield);
            shield.scale.set(0);
            gsap.to(shield.scale, { x: 1, y: 1, duration: 0.3, ease: 'back.out(2)' });
            gsap.to(shield, {
                alpha: 0,
                duration: 0.8,
                delay: 0.5,
                onComplete: () => {
                    if (shield && !shield.destroyed) {
                        try { shield.destroy(); } catch (e) {}
                    }
                    resolve();
                }
            });
        });
    }
    
    playSkillCast() {
        return new Promise(resolve => {
            if (this.container.destroyed) { resolve(); return; }
            const glow = new Graphics();
            glow.circle(0, 0, 45 * this.scale);
            glow.fill({ color: 0xffd54f, alpha: 0.6 });
            this.container.addChild(glow);
            glow.scale.set(0.5);
            gsap.to(glow.scale, { x: 1.5, y: 1.5, duration: 0.4 });
            gsap.to(glow, {
                alpha: 0,
                duration: 0.6,
                onComplete: () => {
                    if (glow && !glow.destroyed) {
                        try { glow.destroy(); } catch (e) {}
                    }
                    resolve();
                }
            });
        });
    }
    
    playDefeated() {
        return new Promise(resolve => {
            if (this.container.destroyed) { resolve(); return; }
            this.container.eventMode = 'none'; // Disable pointer events on defeat
            gsap.killTweensOf(this.body);
            gsap.to(this.container, {
                rotation: this.side === 'left' ? -1.5 : 1.5,
                y: this.container.y + 50,
                alpha: 0,
                duration: 1.0,
                ease: 'power2.in',
                onComplete: resolve
            });
        });
    }
    
    // Show status effect icons above character
    showStatusIcons(effects) {
        if (this.container.destroyed) return;
        this.statusContainer.removeChildren();
        const icons = {
            burn: '🔥', poison: '☠️', freeze: '❄️', stun: '💫', curse: '👁', shield: '🛡'
        };
        effects.forEach((effect, i) => {
            const icon = new Text({
                text: icons[effect.type] || '⚡',
                style: { fontSize: 16 },
            });
            icon.x = i * 22 - (effects.length * 11);
            icon.anchor.set(0.5);
            this.statusContainer.addChild(icon);
        });
    }
    
    destroy() {
        if (this.container) {
            gsap.killTweensOf(this.body);
            gsap.killTweensOf(this.container);
            if (this.container.scale) gsap.killTweensOf(this.container.scale);
            
            // Safely kill all tweens on all children before destroying
            this.container.children.forEach(child => {
                gsap.killTweensOf(child);
                if (child.scale) gsap.killTweensOf(child.scale);
            });
            
            this.container.destroy({ children: true });
        }
    }
}

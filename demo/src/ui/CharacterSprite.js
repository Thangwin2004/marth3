import { Container, Graphics, Sprite, Text, Assets } from 'pixi.js';
import gsap from 'gsap';
import { App } from '../system/App.js';

export class CharacterSprite {
    constructor(config = {}) {
        // config: { side: 'left'|'right', name: string, emoji: string, color: hex, scale: number, isPlayer: boolean, imagePath: string }
        this.container = new Container();
        this.container.sortableChildren = true;
        this.side = config.side || 'left';
        this.name = config.name || 'Character';
        this.emoji = config.emoji || '⚔️';
        this.color = config.color || 0x4fc3f7;
        this.scale = config.scale || 1.0;
        this.isPlayer = config.isPlayer !== false;
        this.imagePath = config.imagePath || null;
        
        this.body = new Container();
        this.body.zIndex = 1;
        this.bodyGraphics = new Graphics();
        this.body.addChild(this.bodyGraphics);
        
        this.statusContainer = new Container();
        this.statusContainer.zIndex = 5;
        
        this.nameText = null;
        this.isEnraged = false;
        
        // Floating Tooltip for Status Effects
        this.tooltipContainer = new Container();
        this.tooltipContainer.zIndex = 100;
        this.tooltipContainer.visible = false;
        this.tooltipContainer.alpha = 0;
        this.container.addChild(this.tooltipContainer);
        this.tooltipTimeout = null;
        
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
        
        this.body.zIndex = 1;
        this.container.addChild(this.body);
        
        // Name text below
        this.nameText = new Text({
            text: `${this.emoji} ${this.name}`,
            style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#ffffff', align: 'center' },
        });
        this.nameText.anchor.set(0.5, 0);
        this.nameText.y = 80 * this.scale;
        this.nameText.zIndex = 2;
        this.container.addChild(this.nameText);
        
        // Status icons container
        this.statusContainer.y = -75 * this.scale;
        this.statusContainer.zIndex = 5;
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
    
    showTooltip(effect) {
        if (this.container.destroyed || !this.tooltipContainer) return;
        this.tooltipContainer.removeChildren();
        
        const width = 200;
        const height = 65;
        
        // Draw background
        const bg = new Graphics();
        bg.roundRect(-width / 2, -height, width, height, 8);
        bg.fill({ color: 0x070c1a, alpha: 0.98 });
        
        // Stroke color based on type
        const colors = {
            burn: 0xff5722,
            poison: 0xb388ff,
            freeze: 0x00e5ff,
            stun: 0xffd54f,
            curse: 0xe91e63,
            shield: 0x2196f3
        };
        const strokeColor = colors[effect.type] || 0xffffff;
        bg.stroke({ color: strokeColor, width: 1.5 });
        this.tooltipContainer.addChild(bg);
        
        // Little triangle pointer at the bottom of the tooltip
        const tri = new Graphics();
        tri.moveTo(-6, 0);
        tri.lineTo(6, 0);
        tri.lineTo(0, 6);
        tri.closePath();
        tri.fill({ color: strokeColor });
        tri.y = 0;
        this.tooltipContainer.addChild(tri);
        
        // Title (Emoji + Name)
        const titles = {
            burn: '🔥 THIÊU RỤI',
            poison: '☠️ NHIỄM ĐỘC',
            freeze: '❄️ ĐÓNG BĂNG',
            stun: '💫 CHOÁNG VÁNG',
            curse: '👁️ NGUYỀN RỦA',
            shield: '🛡️ LÁ CHẮN'
        };
        
        const titleText = new Text({
            text: titles[effect.type] || '⚡ HIỆU ỨNG',
            style: {
                fontFamily: 'Arial',
                fontSize: 12,
                fontWeight: 'bold',
                fill: strokeColor
            }
        });
        titleText.anchor.set(0.5, 0);
        titleText.x = 0;
        titleText.y = -height + 8;
        this.tooltipContainer.addChild(titleText);
        
        // Duration text
        let durStr = '';
        if (effect.type === 'shield') {
            durStr = 'Bền vững';
        } else {
            durStr = `${effect.duration} lượt`;
        }
        
        const durText = new Text({
            text: `Thời gian: ${durStr}`,
            style: {
                fontFamily: 'Arial',
                fontSize: 9.5,
                fill: '#b0bec5'
            }
        });
        durText.anchor.set(0.5, 0);
        durText.x = 0;
        durText.y = -height + 23;
        this.tooltipContainer.addChild(durText);
        
        // Description text
        const descs = {
            burn: `Mất ${effect.damage || 0} HP mỗi đầu lượt.`,
            poison: `Mất ${effect.damage || 0} HP mỗi đầu lượt. Có cộng dồn.`,
            freeze: `Khóa các ô ngọc đóng băng trên bảng đấu.`,
            stun: `Không thể dùng chiêu hoặc di chuyển lượt này.`,
            curse: `Giảm 30% sát thương tấn công gây ra.`,
            shield: `Lá chắn hấp thụ sát thương: ${effect.damage || 0} HP.`
        };
        
        const descText = new Text({
            text: descs[effect.type] || 'Hiệu ứng tác động.',
            style: {
                fontFamily: 'Arial',
                fontSize: 9,
                fill: '#ffffff',
                wordWrap: true,
                wordWrapWidth: width - 16,
                align: 'center'
            }
        });
        descText.anchor.set(0.5, 0);
        descText.x = 0;
        descText.y = -height + 36;
        this.tooltipContainer.addChild(descText);
        
        // Position relative to scale
        this.tooltipContainer.y = -85 * this.scale - 12;
        
        // Animate show
        this.tooltipContainer.visible = true;
        gsap.killTweensOf(this.tooltipContainer);
        gsap.to(this.tooltipContainer, { alpha: 1, duration: 0.18, ease: 'power1.out' });
    }
    
    hideTooltip() {
        if (!this.tooltipContainer) return;
        gsap.killTweensOf(this.tooltipContainer);
        gsap.to(this.tooltipContainer, {
            alpha: 0,
            duration: 0.12,
            ease: 'power1.in',
            onComplete: () => {
                if (this.tooltipContainer) this.tooltipContainer.visible = false;
            }
        });
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = null;
        }
    }
    
    // Show status effect icons above character
    showStatusIcons(effects) {
        if (this.container.destroyed) return;
        this.statusContainer.removeChildren();
        
        const icons = {
            burn: '🔥', poison: '☠️', freeze: '❄️', stun: '💫', curse: '👁', shield: '🛡'
        };
        const colors = {
            burn: 0xff5722, poison: 0xb388ff, freeze: 0x00e5ff, stun: 0xffd54f, curse: 0xe91e63, shield: 0x2196f3
        };
        
        const size = 26;
        const spacing = 32;
        const offset = (effects.length - 1) * (spacing / 2);
        
        effects.forEach((effect, i) => {
            const iconContainer = new Container();
            iconContainer.x = i * spacing - offset;
            
            const strokeColor = colors[effect.type] || 0xffffff;
            
            // Draw background
            const iconBg = new Graphics();
            iconBg.roundRect(-size/2, -size/2, size, size, 5);
            iconBg.fill({ color: 0x0b1326, alpha: 0.9 });
            iconBg.stroke({ color: strokeColor, width: 2, alpha: 0.95 });
            iconContainer.addChild(iconBg);
            
            // Emoji
            const emojiText = new Text({
                text: icons[effect.type] || '⚡',
                style: { fontSize: 13 }
            });
            emojiText.anchor.set(0.5);
            emojiText.y = -0.5; // slight visual centering
            iconContainer.addChild(emojiText);
            
            // Duration overlay (bottom right)
            if (effect.duration !== null && effect.duration !== undefined) {
                const durVal = new Text({
                    text: `${effect.duration}`,
                    style: {
                        fontFamily: 'Arial',
                        fontSize: 8.5,
                        fontWeight: 'bold',
                        fill: '#ffffff',
                        dropShadow: { color: '#000000', blur: 2, distance: 1 }
                    }
                });
                durVal.anchor.set(1, 1);
                durVal.x = size/2 - 1.5;
                durVal.y = size/2 - 0.5;
                iconContainer.addChild(durVal);
            }
            
            // Interactivity
            iconContainer.eventMode = 'static';
            iconContainer.cursor = 'pointer';
            
            iconContainer.on('pointerover', () => {
                this.showTooltip(effect);
                gsap.to(iconContainer.scale, { x: 1.15, y: 1.15, duration: 0.15 });
            });
            
            iconContainer.on('pointerout', () => {
                this.hideTooltip();
                gsap.to(iconContainer.scale, { x: 1.0, y: 1.0, duration: 0.15 });
            });
            
            iconContainer.on('pointertap', (e) => {
                e.stopPropagation();
                this.showTooltip(effect);
                
                if (this.tooltipTimeout) clearTimeout(this.tooltipTimeout);
                this.tooltipTimeout = setTimeout(() => {
                    this.hideTooltip();
                }, 3000);
            });
            
            this.statusContainer.addChild(iconContainer);
        });
    }
    
    destroy() {
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = null;
        }
        if (this.tooltipContainer) {
            gsap.killTweensOf(this.tooltipContainer);
        }
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

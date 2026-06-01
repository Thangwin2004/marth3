import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';

export class CharacterSprite {
    constructor(config = {}) {
        // config: { side: 'left'|'right', name: string, emoji: string, color: hex, scale: number, isPlayer: boolean }
        this.container = new Container();
        this.side = config.side || 'left';
        this.name = config.name || 'Character';
        this.emoji = config.emoji || '⚔️';
        this.color = config.color || 0x4fc3f7;
        this.scale = config.scale || 1.0;
        this.isPlayer = config.isPlayer !== false;
        
        this.body = new Graphics();
        this.statusContainer = new Container();
        this.nameText = null;
        this.isEnraged = false;
        
        this.draw();
        this.playIdle();
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
        // Draw character using Graphics primitives
        // Player: warrior style (helmet, body, sword)
        // Boss: depends on config but generic monster shape
        const g = this.body;
        g.clear();
        
        const s = this.scale;
        
        if (this.isPlayer) {
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
    
    playHurt() {
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
            // Flash red
            const flash = new Graphics();
            flash.roundRect(-35 * this.scale, -50 * this.scale, 70 * this.scale, 120 * this.scale, 10);
            flash.fill({ color: 0xff0000, alpha: 0.5 });
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
        });
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

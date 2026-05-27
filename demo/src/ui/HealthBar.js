import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';

export class HealthBar {
    constructor(config = {}) {
        // config: { width, height, color, showText, side }
        this.container = new Container();
        this.maxWidth = config.width || 180;
        this.barHeight = config.height || 18;
        this.color = config.color || 0x4caf50;
        this.showText = config.showText !== false;
        this.side = config.side || 'left';
        
        this.currentPercent = 1;
        this.shieldPercent = 0;
        
        // Background bar
        this.bgBar = new Graphics();
        this.bgBar.roundRect(0, 0, this.maxWidth, this.barHeight, 6);
        this.bgBar.fill({ color: 0x1a1a2e });
        this.bgBar.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
        this.container.addChild(this.bgBar);
        
        // Damage flash bar (shows red briefly when taking damage)
        this.flashBar = new Graphics();
        this.container.addChild(this.flashBar);
        
        // HP fill bar
        this.fillBar = new Graphics();
        this.container.addChild(this.fillBar);
        
        // Shield overlay bar
        this.shieldBar = new Graphics();
        this.container.addChild(this.shieldBar);
        
        // Text
        if (this.showText) {
            this.hpText = new Text({
                text: '100/100',
                style: { fontFamily: 'Arial', fontSize: 12, fontWeight: 'bold', fill: '#ffffff' },
            });
            this.hpText.anchor.set(0.5);
            this.hpText.x = this.maxWidth / 2;
            this.hpText.y = this.barHeight / 2;
            this.container.addChild(this.hpText);
        }
        
        this.drawFill(1);
    }
    
    drawFill(percent) {
        const w = Math.max(0, Math.min(1, percent)) * this.maxWidth;
        this.fillBar.clear();
        if (w > 0) {
            // Color based on HP: green > yellow > red
            let color = this.color;
            if (percent < 0.25) color = 0xf44336;
            else if (percent < 0.5) color = 0xff9800;
            else if (percent < 0.75) color = 0xffc107;
            
            this.fillBar.roundRect(0, 0, w, this.barHeight, 6);
            this.fillBar.fill({ color });
            
            // Shine effect
            this.fillBar.roundRect(0, 0, w, this.barHeight / 2, 6);
            this.fillBar.fill({ color: 0xffffff, alpha: 0.15 });
        }
    }
    
    drawShield(shieldPercent) {
        this.shieldBar.clear();
        if (shieldPercent > 0) {
            const w = Math.min(shieldPercent, 1) * this.maxWidth;
            this.shieldBar.roundRect(0, 0, w, this.barHeight, 6);
            this.shieldBar.fill({ color: 0x42a5f5, alpha: 0.35 });
        }
    }
    
    update(currentHP, maxHP, shield = 0) {
        const newPercent = currentHP / maxHP;
        
        // Flash effect for damage
        if (newPercent < this.currentPercent) {
            const oldWidth = this.currentPercent * this.maxWidth;
            this.flashBar.clear();
            this.flashBar.roundRect(0, 0, oldWidth, this.barHeight, 6);
            this.flashBar.fill({ color: 0xff0000, alpha: 0.7 });
            gsap.to(this.flashBar, { alpha: 0, duration: 0.5, delay: 0.2 });
        }
        
        this.currentPercent = newPercent;
        
        // Animate HP bar
        const targetWidth = newPercent * this.maxWidth;
        gsap.to(this, {
            duration: 0.4,
            ease: 'power2.out',
            onUpdate: () => this.drawFill(this.currentPercent),
        });
        
        this.drawFill(newPercent);
        
        // Shield
        this.shieldPercent = shield / maxHP;
        this.drawShield(this.shieldPercent);
        
        // Text
        if (this.hpText) {
            this.hpText.text = `${currentHP}/${maxHP}${shield > 0 ? ` +${shield}🛡` : ''}`;
        }
    }
    
    destroy() {
        this.container.destroy({ children: true });
    }
}

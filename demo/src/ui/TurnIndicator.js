import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { Config } from '../config.js';

export class TurnIndicator {
    constructor() {
        this.container = new Container();
        this.container.zIndex = 200;
        this.container.visible = false;
    }
    
    async show(text, color = '#ffdd57') {
        this.container.visible = true;
        this.container.removeChildren();
        
        // Semi-transparent background strip
        const bg = new Graphics();
        bg.rect(0, Config.canvas.height / 2 - 40, Config.canvas.width, 80);
        bg.fill({ color: 0x000000, alpha: 0.6 });
        this.container.addChild(bg);
        bg.alpha = 0;
        
        const label = new Text({
            text,
            style: {
                fontFamily: 'Arial',
                fontSize: 42,
                fontWeight: 'bold',
                fill: color,
                dropShadow: { color: '#000000', blur: 8, distance: 4 },
            },
        });
        label.anchor.set(0.5);
        label.x = Config.canvas.width / 2;
        label.y = Config.canvas.height / 2;
        this.container.addChild(label);
        
        // Animate in
        label.scale.set(0.3);
        label.alpha = 0;
        gsap.to(bg, { alpha: 1, duration: 0.2 });
        gsap.to(label.scale, { x: 1.1, y: 1.1, duration: 0.3, ease: 'back.out(3)' });
        gsap.to(label, { alpha: 1, duration: 0.2 });
        
        await new Promise(r => setTimeout(r, 1200));
        
        // Animate out
        gsap.to(label, { alpha: 0, duration: 0.3 });
        gsap.to(bg, { alpha: 0, duration: 0.3 });
        gsap.to(label.scale, { x: 1.5, y: 1.5, duration: 0.3 });
        
        await new Promise(r => setTimeout(r, 350));
        this.container.visible = false;
    }
    
    destroy() {
        if (this.container) {
            // Kill all running tweens on the container itself
            gsap.killTweensOf(this.container);
            // Kill all running tweens on any of its children (such as bg or label)
            this.container.children.forEach(child => {
                gsap.killTweensOf(child);
                if (child.scale) {
                    gsap.killTweensOf(child.scale);
                }
            });
            this.container.destroy({ children: true });
        }
    }
}

import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { SKILLS } from '../data/SkillData.js';

export class SkillBar {
    constructor(onSkillSelect) {
        this.container = new Container();
        this.buttons = [];
        this.onSkillSelect = onSkillSelect; // callback(skillId)
        this.selectedSkill = null;
        this.enabled = true;
    }
    
    render(skillStates) {
        // skillStates: [{ id, cooldown, ready }]
        // Clear old buttons
        this.container.removeChildren();
        this.buttons = [];
        
        const btnSize = 42;
        const gap = 6;
        const totalWidth = skillStates.length * (btnSize + gap) - gap;
        const startX = -totalWidth / 2;
        
        skillStates.forEach((state, i) => {
            const skill = SKILLS[state.id];
            if (!skill) return;
            
            const btn = new Container();
            btn.x = startX + i * (btnSize + gap);
            
            // Background
            const bg = new Graphics();
            bg.roundRect(0, 0, btnSize, btnSize, 8);
            
            if (state.ready && this.enabled) {
                bg.fill({ color: skill.color, alpha: 0.85 });
                bg.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
                bg.eventMode = 'static';
                bg.cursor = 'pointer';
                bg.on('pointerdown', () => {
                    if (this.onSkillSelect) this.onSkillSelect(state.id);
                });
                bg.on('pointerover', () => gsap.to(btn.scale, { x: 1.1, y: 1.1, duration: 0.15 }));
                bg.on('pointerout', () => gsap.to(btn.scale, { x: 1, y: 1, duration: 0.15 }));
            } else {
                bg.fill({ color: 0x2a2a3e, alpha: 0.8 });
                bg.stroke({ color: 0x555555, width: 1 });
            }
            const bgWrapper = new Container();
            bgWrapper.addChild(bg);
            btn.addChild(bgWrapper);
            
            // Icon
            const icon = new Text({
                text: skill.icon,
                style: { fontSize: 20 },
            });
            icon.anchor.set(0.5);
            icon.x = btnSize / 2;
            icon.y = state.ready ? btnSize / 2 : btnSize / 2 - 4;
            if (!state.ready) icon.alpha = 0.4;
            btn.addChild(icon);
            
            // Cooldown text
            if (!state.ready) {
                const cdText = new Text({
                    text: `${state.cooldown}t`,
                    style: { fontFamily: 'Arial', fontSize: 11, fontWeight: 'bold', fill: '#ff9800' },
                });
                cdText.anchor.set(0.5);
                cdText.x = btnSize / 2;
                cdText.y = btnSize - 8;
                btn.addChild(cdText);
            }
            
            this.container.addChild(btn);
            this.buttons.push({ btn, state, skill });
        });
    }
    
    setEnabled(enabled) {
        this.enabled = enabled;
    }
    
    destroy() {
        this.container.destroy({ children: true });
    }
}

import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { Config } from '../config.js';

export class CoinFlip {
    /**
     * Play coin flip animation and return result.
     * @param {Container} parent
     * @returns {Promise<'player'|'boss'>}
     */
    static async play(parent) {
        const result = Math.random() < 0.5 ? 'player' : 'boss';
        
        const overlay = new Container();
        overlay.zIndex = 500;
        parent.addChild(overlay);
        
        // Dark background
        const bg = new Graphics();
        bg.rect(0, 0, Config.canvas.width, Config.canvas.height);
        bg.fill({ color: 0x000000, alpha: 0.75 });
        overlay.addChild(bg);
        bg.alpha = 0;
        
        // "COIN TOSS!" title
        const title = new Text({
            text: '🪙 COIN TOSS!',
            style: { fontFamily: 'Arial', fontSize: 36, fontWeight: 'bold', fill: '#ffd54f',
                     dropShadow: { color: '#000000', blur: 6, distance: 3 } },
        });
        title.anchor.set(0.5);
        title.x = Config.canvas.width / 2;
        title.y = 120;
        title.alpha = 0;
        overlay.addChild(title);
        
        // Coin
        const coinContainer = new Container();
        coinContainer.x = Config.canvas.width / 2;
        coinContainer.y = Config.canvas.height + 50; // start off screen
        overlay.addChild(coinContainer);
        
        // Coin face (player side = gold, boss side = dark red)
        const coinRadius = 60;
        const playerFace = new Graphics();
        playerFace.circle(0, 0, coinRadius);
        playerFace.fill({ color: 0xffd54f });
        playerFace.stroke({ color: 0xffb300, width: 4 });
        coinContainer.addChild(playerFace);
        
        const playerIcon = new Text({ text: '⚔️', style: { fontSize: 40 } });
        playerIcon.anchor.set(0.5);
        coinContainer.addChild(playerIcon);
        
        const bossFace = new Graphics();
        bossFace.circle(0, 0, coinRadius);
        bossFace.fill({ color: 0xd32f2f });
        bossFace.stroke({ color: 0xb71c1c, width: 4 });
        bossFace.visible = false;
        coinContainer.addChild(bossFace);
        
        const bossIcon = new Text({ text: '💀', style: { fontSize: 40 } });
        bossIcon.anchor.set(0.5);
        bossIcon.visible = false;
        coinContainer.addChild(bossIcon);
        
        // Fade in
        gsap.to(bg, { alpha: 1, duration: 0.3 });
        gsap.to(title, { alpha: 1, duration: 0.3 });
        
        // Coin flies up
        await gsap.to(coinContainer, { y: Config.canvas.height / 2, duration: 0.5, ease: 'power2.out' });
        
        // Flip animation (simulate 3D by scaling Y)
        const flipCount = 8;
        let showPlayer = true;
        
        for (let i = 0; i < flipCount; i++) {
            const speed = 0.08 + i * 0.02; // slows down
            
            // Scale to 0 (edge view)
            await gsap.to(coinContainer.scale, { y: 0, duration: speed / 2, ease: 'sine.in' });
            
            // Swap face
            showPlayer = !showPlayer;
            playerFace.visible = showPlayer;
            playerIcon.visible = showPlayer;
            bossFace.visible = !showPlayer;
            bossIcon.visible = !showPlayer;
            
            // Scale back to 1
            await gsap.to(coinContainer.scale, { y: 1, duration: speed / 2, ease: 'sine.out' });
        }
        
        // Final flip to show the result
        await gsap.to(coinContainer.scale, { y: 0, duration: 0.1, ease: 'sine.in' });
        const isPlayerResult = result === 'player';
        playerFace.visible = isPlayerResult;
        playerIcon.visible = isPlayerResult;
        bossFace.visible = !isPlayerResult;
        bossIcon.visible = !isPlayerResult;
        await gsap.to(coinContainer.scale, { y: 1, duration: 0.15, ease: 'bounce.out' });
        
        // Zoom in
        await gsap.to(coinContainer.scale, { x: 1.5, y: 1.5, duration: 0.4, ease: 'back.out(2)' });
        
        // Result text
        const resultText = new Text({
            text: result === 'player' ? '⚔️ YOU GO FIRST!' : '💀 BOSS GOES FIRST!',
            style: { fontFamily: 'Arial', fontSize: 32, fontWeight: 'bold',
                     fill: result === 'player' ? '#ffd54f' : '#ff5252',
                     dropShadow: { color: '#000000', blur: 6, distance: 3 } },
        });
        resultText.anchor.set(0.5);
        resultText.x = Config.canvas.width / 2;
        resultText.y = Config.canvas.height / 2 + 120;
        resultText.alpha = 0;
        resultText.scale.set(0.5);
        overlay.addChild(resultText);
        
        gsap.to(resultText, { alpha: 1, duration: 0.3 });
        gsap.to(resultText.scale, { x: 1, y: 1, duration: 0.3, ease: 'back.out(2)' });
        
        // Hold
        await new Promise(r => setTimeout(r, 1800));
        
        // Fade out everything
        gsap.to(overlay, { alpha: 0, duration: 0.5, onComplete: () => overlay.destroy() });
        await new Promise(r => setTimeout(r, 500));
        
        return result;
    }
}

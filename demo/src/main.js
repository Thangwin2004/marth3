/**
 * ===== src/main.js =====
 * 
 * Entry point for Match-3 Boss Battle RPG.
 * Initializes PixiJS, loads assets, and starts the battle.
 */

import { App } from './system/App.js';
import { Config } from './config.js';
import { BattleScene } from './battle/BattleScene.js';
import { saveManager } from './system/SaveManager.js';

async function startGame() {
    try {
        console.log('🚀 Starting Match-3 Boss Battle...');

        // Step 1: Initialize PixiJS + Load assets
        await App.init(Config);

        // Step 2: Load save data
        const save = saveManager.load();
        const startLevel = save.currentLevel || 1;

        console.log(`📂 Save loaded: Level ${startLevel}, Skills: [${save.unlockedSkills.join(', ')}]`);

        // Step 3: Start battle at current level
        const battleScene = new BattleScene({ level: startLevel });
        App.stage.addChild(battleScene.container);

        console.log('✅ Game is ready!');
        console.log('💡 Match tiles to attack the boss. Take turns with the AI!');

    } catch (error) {
        console.error('❌ Failed to start game:', error);
    }
}

startGame();

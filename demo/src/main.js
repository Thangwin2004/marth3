/**
 * ===== src/main.js =====
 * 
 * Entry point for Match-3 Boss Battle RPG.
 * Initializes PixiJS, loads assets, and starts the main menu.
 */

import { App } from './system/App.js';
import { Config } from './config.js';
import { sceneManager } from './system/SceneManager.js';
import { saveManager } from './system/SaveManager.js';

async function startGame() {
    try {
        console.log('🚀 Starting Match-3 Boss Battle RPG...');

        // Step 1: Initialize PixiJS + Load assets
        await App.init(Config);

        // Step 2: Init scene manager
        sceneManager.init(App.app);

        // Step 3: Load save data
        const save = saveManager.load();
        console.log(`📂 Save loaded: Level ${save.currentLevel}, Skills: [${save.unlockedSkills.join(', ')}]`);

        // Step 4: Start with Main Menu
        const { MainMenuScene } = await import('./scenes/MainMenuScene.js');
        await sceneManager.switchTo(MainMenuScene);

        console.log('✅ Game is ready!');

    } catch (error) {
        console.error('❌ Failed to start game:', error);

        // Fallback: start battle directly if menu fails
        try {
            const { BattleScene } = await import('./battle/BattleScene.js');
            const save = saveManager.load();
            const scene = new BattleScene({ level: save.currentLevel || 1 });
            App.stage.addChild(scene.container);
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
        }
    }
}

startGame();

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
        console.log('🚀 Starting Pure Match-3 Game...');

        // Step 1: Initialize PixiJS + Load assets
        await App.init(Config);

        // Step 2: Init scene manager
        sceneManager.init(App.app);

        // Step 3: Load save data
        const save = saveManager.load();
        console.log(`📂 Leaderboard entries loaded: ${save.leaderboard?.length || 0}`);

        // Step 4: Start with Main Menu
        const { MainMenuScene } = await import('./scenes/MainMenuScene.js');
        await sceneManager.switchTo(MainMenuScene);

        console.log('✅ Game is ready!');

    } catch (error) {
        console.error('❌ Failed to start game:', error);

        // Fallback: start game directly if menu fails
        try {
            const { GameScene } = await import('./scenes/GameScene.js');
            await sceneManager.switchTo(GameScene);
        } catch (fallbackError) {
            console.error('❌ Fallback also failed:', fallbackError);
        }
    }
}

startGame();

/**
 * ===== src/main.js =====
 *
 * Entry point for Match-3 Boss Battle RPG.
 * Initializes PixiJS, loads assets, and starts the main menu.
 */

import { App } from "./system/App.js";
import { Config } from "./config.js";
import { sceneManager } from "./system/SceneManager.js";
import { saveManager } from "./system/SaveManager.js";

async function startGame() {
  try {
    console.log("🚀 Starting Pure Match-3 Game...");

    // Step 1: Initialize PixiJS + Load assets
    await App.init(Config);

    // Step 2: Init scene manager
    sceneManager.init(App.app);

    // Step 3: Load save data
    const save = saveManager.load();
    console.log(
      `📂 Leaderboard entries loaded: ${save.leaderboard?.length || 0}`,
    );

    // Step 4: Start with Main Menu
    const { MainMenuScene } = await import("./scenes/MainMenuScene.js");
    await sceneManager.switchTo(MainMenuScene);

    // Hide Splash Screen smoothly with fake progress
    const splash = document.getElementById("splash-screen");
    const splashProgress = document.getElementById("splash-progress");
    const splashText = document.getElementById("splash-text");
    if (splash && splashProgress && splashText) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.floor(Math.random() * 15) + 5;
        if (progress > 90) progress = 90;
        splashProgress.style.width = progress + "%";
        splashText.innerText = `Loading ${progress}%`;
      }, 50);

      setTimeout(() => {
        clearInterval(interval);
        splashProgress.style.width = "100%";
        splashText.innerText = `Loading 100%`;
        setTimeout(() => {
          splash.style.opacity = "0";
          setTimeout(() => {
            splash.style.display = "none";
          }, 500);
        }, 200);
      }, 600);
    } else if (splash) {
      splash.style.opacity = "0";
      setTimeout(() => {
        splash.style.display = "none";
      }, 500);
    }

    console.log("🔥 Game is ready!");
  } catch (error) {
    console.error("❌ Failed to start game:", error);

    // Fallback: start game directly if menu fails
    try {
      const { GameScene } = await import("./scenes/GameScene.js");
      await sceneManager.switchTo(GameScene);
    } catch (fallbackError) {
      console.error("❌ Fallback also failed:", fallbackError);
    }
  }
}

startGame();

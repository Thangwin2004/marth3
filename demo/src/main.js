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
import { soundManager } from "./system/SoundManager.js";
import { winkGame } from "./integrations/wink/wink-adapter.js";
import { waitForGameFonts } from "./utils/fontLoader.js";
import { installFocusPause } from "./utils/focusPause.js";
import { installInteractionGuard } from "./utils/interactionGuard.js";

installInteractionGuard();

async function startGame() {
  try {
    console.log("🚀 Starting Pure Match-3 Game...");

    await waitForGameFonts([
      "400 1em 'Be Vietnam Pro'",
      "500 1em 'Be Vietnam Pro'",
      "600 1em 'Be Vietnam Pro'",
      "700 1em 'Be Vietnam Pro'",
      "800 1em 'Be Vietnam Pro'",
      "900 1em 'Be Vietnam Pro'",
      "700 1em 'Baloo 2'",
      "800 1em 'Baloo 2'",
    ]);

    // Step 1: Initialize PixiJS + Load assets
    await App.init(Config);

    // Step 2: Init scene manager
    sceneManager.init(App.app);

    const focusPause = installFocusPause({
      isRunning: () => Boolean(App.app?.ticker.started),
      pause: () => App.app?.ticker.stop(),
      resume: () => App.app?.ticker.start(),
      pauseAudio: () => soundManager.pauseForFocus(),
      resumeAudio: () => soundManager.resumeFromFocus(),
    });

    winkGame.bindLifecycle({
      onPause: focusPause.pauseFromHost,
      onResume: focusPause.resumeFromHost,
      onMute: () => {
        window.__GLOBAL_MUTE__ = true;
        soundManager.syncMuteState();
      },
      onUnmute: () => {
        window.__GLOBAL_MUTE__ = false;
        soundManager.syncMuteState();
      },
    });

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

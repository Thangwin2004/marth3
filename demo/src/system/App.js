/**
 * ===== src/system/App.js =====
 *
 * Application wrapper — Singleton PixiJS wrapper.
 * Canvas: 1100×750 for Boss Battle RPG layout.
 */

import { Application, Assets, Sprite } from "pixi.js";

class GameApp {
  constructor() {
    /** @type {Application|null} PixiJS Application instance */
    this.app = null;
    /** @type {object|null} Game config object */
    this.config = null;
  }

  /**
   * Initialize PixiJS Application + load all assets.
   * @param {object} config - Config object from config.js
   */
  async init(config) {
    this.config = config;

    this.app = new Application();
    const container =
      document.getElementById("pixi-container") || document.body;

    await this.app.init({
      resizeTo: container,
      backgroundColor: 0x0a0a1a,
      resolution: Math.max(window.devicePixelRatio || 1, 2),
      autoDensity: true,
      preference: "webgl",
    });

    if (container.id === "pixi-container") {
      container.innerHTML = "";
      container.appendChild(this.app.canvas);
    } else {
      document.body.appendChild(this.app.canvas);
    }

    await this.loadAssets(config.assets);

    console.log("✅ PixiJS Application initialized!");
    console.log(
      `   Canvas: ${this.app.screen.width}x${this.app.screen.height}`,
    );
  }

  /**
   * Load all assets (textures) into memory.
   * @param {object} assets - { alias: path } mapping
   */
  async loadAssets(assets) {
    const assetList = Object.entries(assets).map(([alias, src]) => ({
      alias,
      src,
    }));

    await Assets.load(assetList);
    console.log(`📦 Loaded ${assetList.length} assets`);
  }

  /**
   * Create a Sprite from a loaded texture.
   * @param {string} name - Texture alias
   * @returns {Sprite}
   */
  sprite(name) {
    return Sprite.from(name);
  }

  /**
   * Set the background color dynamically (for terrain themes).
   * @param {number} color - Hex color value
   */
  setBackgroundColor(color) {
    if (this.app && this.app.renderer) {
      this.app.renderer.background.color = color;
    }
  }

  /** @returns {import('pixi.js').Container} Root stage container */
  get stage() {
    return this.app.stage;
  }
}

// Singleton
export const App = new GameApp();

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

    const devicePixelRatio = window.devicePixelRatio || 1;
    const isCompactScreen = window.matchMedia("(max-width: 768px)").matches;
    // Never force mobile to a 1x backing buffer: most phones have a DPR of
    // 2-3, so a 1x canvas is stretched by the browser and makes every Pixi
    // text, vector edge and icon look soft. Cap DPR to protect fill-rate and
    // memory while retaining a visibly sharp UI on compact devices.
    const resolutionCap = 2;
    const minimumResolution = isCompactScreen ? 2 : 1;
    const renderResolution = Math.min(
      resolutionCap,
      Math.max(minimumResolution, devicePixelRatio),
    );

    await this.app.init({
      resizeTo: container,
      backgroundColor: 0x0a0a1a,
      antialias: true,
      resolution: renderResolution,
      autoDensity: true,
      roundPixels: true,
      preference: "webgl",
      powerPreference: "high-performance",
    });

    if (container.id === "pixi-container") {
      container.innerHTML = "";
      container.appendChild(this.app.canvas);
    } else {
      document.body.appendChild(this.app.canvas);
    }

    // Snap scene transforms to physical pixels. This is especially important
    // for odd phone widths where width / 2 otherwise lands on a half pixel.
    this.app.stage.roundPixels = true;

    await this.loadAssets(config.assets);

    console.log("✅ PixiJS Application initialized!");
    console.log(
      `   Canvas: ${this.app.screen.width}x${this.app.screen.height}`,
    );
    console.log(
      `   Render resolution: ${renderResolution}x (device DPR ${devicePixelRatio})`,
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

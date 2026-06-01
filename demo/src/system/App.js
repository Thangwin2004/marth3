/**
 * ===== src/system/App.js =====
 * 
 * Application wrapper — Singleton PixiJS wrapper.
 * Canvas: 1100×750 for Boss Battle RPG layout.
 */

import { Application, Assets, Sprite } from 'pixi.js';

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

        await this.app.init({
            width: config.canvas.width,
            height: config.canvas.height,
            backgroundColor: 0x0a0a1a,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            preference: 'webgl',
        });

        document.getElementById('pixi-container').appendChild(this.app.canvas);

        await this.loadAssets(config.assets);

        console.log('✅ PixiJS Application initialized!');
        console.log(`   Canvas: ${this.app.screen.width}x${this.app.screen.height}`);
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

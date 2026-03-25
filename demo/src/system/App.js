/**
 * ===== src/system/App.js =====
 * 
 * Application wrapper - "trái tim" của game.
 * 
 * === GIẢI THÍCH CHI TIẾT ===
 * 
 * Đây là module trung tâm, đóng vai trò như "cầu nối" giữa
 * PixiJS engine và game logic của ta.
 * 
 * === TẠI SAO CẦN WRAPPER? ===
 * Thay vì import PixiJS trực tiếp ở mỗi file game (Game.js, Board.js, ...)
 * ta chỉ cần import App wrapper này. Lợi ích:
 * 1. Chỉ tạo 1 Application duy nhất (Singleton pattern)
 * 2. Tập trung logic init + asset loading vào 1 chỗ
 * 3. Các module game chỉ cần gọi App.sprite('tên') để tạo sprite
 * 
 * === SINGLETON PATTERN ===
 * Cuối file, ta export `new GameApp()` — chỉ có DUY NHẤT 1 instance.
 * Mọi file khác import App đều dùng chung instance này.
 */

import { Application, Assets, Sprite } from 'pixi.js';

class GameApp {
    constructor() {
        /** @type {Application|null} PixiJS Application instance */
        this.app = null;
        
        /** @type {object|null} Game config object (from config.js) */
        this.config = null;
    }

    /**
     * Khởi tạo PixiJS Application + Load toàn bộ assets
     * 
     * === QUAN TRỌNG: PixiJS v8 khác v5/v6/v7 ===
     * 
     * - v5/v6: `new PIXI.Application({ width, height, ... })` ← ĐỒNG BỘ
     * - v8:    `app = new Application(); await app.init({...})` ← BẤT ĐỒNG BỘ
     * 
     * Lý do: v8 cần thời gian để detect WebGPU/WebGL support,
     * nên việc init phải là async.
     * 
     * @param {object} config - Config object từ config.js
     */
    async init(config) {
        this.config = config;

        // Bước 1: Tạo Application (chưa có gì trên màn hình)
        this.app = new Application();

        // Bước 2: Khởi tạo renderer (async - chờ detect GPU)
        await this.app.init({
            width: 800,
            height: 600,
            backgroundColor: 0x1a1a2e,   // Màu nền tối (hex color)
            resolution: window.devicePixelRatio || 1,  // Hỗ trợ Retina/HiDPI
            autoDensity: true,
        });

        // Bước 3: Gắn canvas vào DOM
        // PixiJS v8 dùng `app.canvas` (v7 dùng `app.view`)
        document.getElementById('pixi-container').appendChild(this.app.canvas);

        // Bước 4: Load tất cả assets (textures)
        await this.loadAssets(config.assets);

        console.log('✅ PixiJS Application initialized!');
        console.log(`   Canvas: ${this.app.screen.width}x${this.app.screen.height}`);
        console.log(`   Renderer: ${this.app.renderer.type === 0x02 ? 'WebGPU' : 'WebGL'}`);
    }

    /**
     * Load tất cả assets (textures) vào bộ nhớ
     * 
     * === PixiJS v8: Assets.load ===
     * 
     * Cách CŨ (v5/v6): 
     *   app.loader.add('name', 'path').load(callback)  ← callback hell
     * 
     * Cách MỚI (v8):
     *   await Assets.load({ alias: 'name', src: 'path' })  ← async/await, sạch hơn
     * 
     * Sau khi load, texture được cache với alias.
     * Ta có thể tạo sprite bằng: Sprite.from('alias')
     */
    async loadAssets(assets) {
        // Chuyển object { name: path } thành array [{ alias, src }]
        const assetList = Object.entries(assets).map(([alias, src]) => ({
            alias,
            src,
        }));

        // Load TẤT CẢ assets cùng lúc (parallel loading)
        await Assets.load(assetList);
        
        console.log(`📦 Loaded ${assetList.length} assets`);
    }

    /**
     * Tạo một Sprite từ texture đã load
     * 
     * Đây là helper method giúp code ngắn gọn:
     *   App.sprite('blue')  thay vì  Sprite.from('blue')
     * 
     * @param {string} name - Alias của texture (đã load)
     * @returns {Sprite} PixiJS Sprite object
     */
    sprite(name) {
        return Sprite.from(name);
    }

    /**
     * Getter trả về stage (root container)
     * 
     * Stage là Container gốc - TẤT CẢ objects muốn hiển thị 
     * đều phải được addChild vào stage (hoặc child của stage).
     * 
     * Hệ thống phân cấp:
     *   Stage (root)
     *     └── Board Container
     *           ├── Field sprites
     *           ├── Selected sprites  
     *           └── Tile sprites
     */
    get stage() {
        return this.app.stage;
    }
}

// === SINGLETON: Chỉ tạo 1 instance duy nhất ===
export const App = new GameApp();

/**
 * ===== src/main.js =====
 * 
 * Entry point (điểm khởi đầu) của game Match-3
 * 
 * === GIẢI THÍCH CHI TIẾT ===
 * 
 * Đây là file JavaScript đầu tiên được trình duyệt chạy
 * (được gọi bởi <script src="/src/main.js"> trong index.html)
 * 
 * === LUỒNG KHỞI ĐỘNG ===
 * 
 * 1. Import App (PixiJS wrapper) và Config (cài đặt)
 * 2. Gọi App.init(Config) → tạo canvas, load textures
 * 3. Tạo Game object → tạo Board, Fields, Tiles
 * 4. Game sẵn sàng!
 * 
 * === ASYNC/AWAIT ===
 * 
 * PixiJS v8 yêu cầu init bất đồng bộ (async):
 * - Detect WebGPU/WebGL    → mất thời gian
 * - Load texture files      → mất thời gian  
 * 
 * Nên ta phải dùng async function + await:
 *   await App.init(Config);   ← Chờ cho đến khi init xong
 *   new Game();                ← Chỉ chạy SAU KHI init xong
 * 
 * Nếu không await, Game sẽ tạo Sprites khi textures chưa load xong → CRASH!
 */

import { App } from './system/App.js';
import { Config } from './config.js';
import { Game } from './game/Game.js';

/**
 * Hàm khởi động game
 * 
 * async function: Cho phép dùng await bên trong
 * Bọc trong try-catch để bắt lỗi (ví dụ: file asset bị thiếu)
 */
async function startGame() {
    try {
        console.log('🚀 Starting Match-3 Game...');

        // Bước 1: Khởi tạo PixiJS + Load assets
        // (Chờ cho đến khi TẤT CẢ assets được load xong)
        await App.init(Config);

        // Bước 2: Tạo Game (Board, Fields, Tiles, Input handling)
        const game = new Game();

        console.log('✅ Game is ready! Try clicking on tiles.');
        console.log('💡 Tip: Click a tile to select, then click an adjacent tile to swap.');

    } catch (error) {
        console.error('❌ Failed to start game:', error);
    }
}

// Gọi hàm khởi động
startGame();

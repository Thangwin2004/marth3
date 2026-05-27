/**
 * ===== src/game/Game.js =====
 * 
 * Lớp Game (Controller chính) — PHIÊN BẢN ĐẦY ĐỦ
 * 
 * Bao gồm tất cả tính năng từ Tuần 4 đến Tuần 8:
 * - Tuần 4: Input handling, tile selection, swap
 * - Tuần 5: Combo detection, reverse swap
 * - Tuần 6: Combo processing (remove, fall, add new tiles, chain combo)
 * - Tuần 7: Remove start matches, scoring, UI (score, moves, game over)
 * - Tuần 8: Effects (particles, screen shake), start screen
 * 
 * === LUỒNG GAME HOÀN CHỈNH ===
 * 
 * [Khởi tạo]
 *   → Tạo Board (64 tiles ngẫu nhiên)
 *   → removeStartMatches() (xóa combo ban đầu)
 *   → Hiển thị Start Screen
 *   → Player click "START" → bắt đầu chơi
 * 
 * [Gameplay Loop]
 *   → Player click tile 1 → selectTile (viền vàng)
 *   → Player click tile 2 (kề cạnh) → swap()
 *     → Kiểm tra combo (getMatches)
 *       → CÓ combo → processMatches (xóa → rơi → thêm → kiểm tra chain)
 *       → KHÔNG combo → reverse swap (đổi lại)
 *   → Giảm số lượt (moves--)
 *   → Nếu moves === 0 → Game Over
 */

import { Container, Text, Graphics } from 'pixi.js';
import { Board } from './Board.js';
import { CombinationManager } from './CombinationManager.js';
import { App } from '../system/App.js';
import gsap from 'gsap';

export class Game {
    constructor() {
        // === TẠO GAME CONTAINER ===
        this.gameContainer = new Container();
        App.stage.addChild(this.gameContainer);

        // === TẠO BOARD ===
        this.board = new Board();
        this.createBoardBackground();
        this.gameContainer.addChild(this.boardBg);
        this.gameContainer.addChild(this.board.container);

        // === TẠO COMBINATION MANAGER ===
        this.combinationManager = new CombinationManager(this.board);

        // === GAME STATE ===
        this.selectedTile = null;
        this.disabled = false;
        this.score = 0;
        this.moves = 40;          // Số lượt chơi (tăng cho board 12×12)
        this.comboCount = 0;      // Đếm combo liên tiếp trong 1 lượt
        this.isGameOver = false;

        // === XÓA COMBO BAN ĐẦU ===
        this.removeStartMatches();

        // === TẠO UI ===
        this.createUI();

        // === TẠO START SCREEN ===
        this.createStartScreen();

        // === LẮNG NGHE SỰ KIỆN ===
        this.board.container.on('tile-touch-start', this.onTileClick.bind(this));
    }

    createBoardBackground() {
        const boardWidth = this.board.cols * App.config.tileSize;
        const boardHeight = this.board.rows * App.config.tileSize;
        const padding = 16;

        this.boardBg = new Graphics();
        this.boardBg.roundRect(0, 0, boardWidth + padding * 2, boardHeight + padding * 2, 24);
        this.boardBg.fill({ color: 0x121925, alpha: 0.96 });
        this.boardBg.stroke({ color: 0x324b8b, width: 3, alpha: 0.45 });
        this.boardBg.x = this.board.container.x - padding;
        this.boardBg.y = this.board.container.y - padding;
    }

    // ============================================================
    //  TUẦN 7: UI (Giao diện người dùng)
    // ============================================================

    /**
     * Tạo UI hiển thị điểm số và số lượt
     */
    createUI() {
        this.uiContainer = new Container();
        App.stage.addChild(this.uiContainer);

        // === SCORE TEXT ===
        this.scoreText = new Text({
            text: 'SCORE: 0',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 28,
                fontWeight: 'bold',
                fill: '#ffdd57',
                dropShadow: {
                    color: '#000000',
                    blur: 4,
                    distance: 2,
                },
            },
        });
        this.scoreText.x = 20;
        this.scoreText.y = 12;
        this.uiContainer.addChild(this.scoreText);

        // === MOVES TEXT ===
        this.movesText = new Text({
            text: `MOVES: ${this.moves}`,

            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 28,
                fontWeight: 'bold',
                fill: '#4fc3f7',
                dropShadow: {
                    color: '#000000',
                    blur: 4,
                    distance: 2,
                },
            },
        });
        this.movesText.x = App.app.screen.width - 200;
        this.movesText.y = 12;
        this.uiContainer.addChild(this.movesText);

        // === COMBO TEXT (ẩn mặc định) ===
        this.comboText = new Text({
            text: '',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 40,
                fontWeight: 'bold',
                fill: '#ff6b6b',
                dropShadow: {
                    color: '#000000',
                    blur: 6,
                    distance: 3,
                },
            },
        });
        this.comboText.anchor.set(0.5);
        this.comboText.x = App.app.screen.width / 2;
        this.comboText.y = App.app.screen.height / 2;
        this.comboText.visible = false;
        this.uiContainer.addChild(this.comboText);
    }

    /**
     * Cập nhật hiển thị UI
     */
    updateUI() {
        this.scoreText.text = `SCORE: ${this.score}`;
        this.movesText.text = `MOVES: ${this.moves}`;
    }

    /**
     * Hiệu ứng combo text bay lên
     */
    showComboText(comboNum) {
        if (comboNum < 2) return;
        this.comboText.text = `COMBO x${comboNum}! 🔥`;
        this.comboText.visible = true;
        this.comboText.alpha = 1;
        this.comboText.scale.set(0.5);
        this.comboText.y = App.app.screen.height / 2;

        gsap.to(this.comboText.scale, { x: 1.2, y: 1.2, duration: 0.3, ease: 'back.out(2)' });
        gsap.to(this.comboText, {
            alpha: 0,
            y: App.app.screen.height / 2 - 80,
            duration: 1.2,
            delay: 0.3,
            ease: 'power2.out',
            onComplete: () => { this.comboText.visible = false; },
        });
    }

    // ============================================================
    //  TUẦN 8: START SCREEN & GAME OVER SCREEN
    // ============================================================

    /**
     * Tạo màn hình bắt đầu
     */
    createStartScreen() {
        this.disabled = true; // khóa input

        this.startScreen = new Container();
        App.stage.addChild(this.startScreen);

        // Nền mờ
        const overlay = new Graphics();
        overlay.rect(0, 0, App.app.screen.width, App.app.screen.height);
        overlay.fill({ color: 0x000000, alpha: 0.7 });
        this.startScreen.addChild(overlay);

        // Tiêu đề
        const title = new Text({
            text: '💎 MATCH 3',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 60,
                fontWeight: 'bold',
                fill: '#ffdd57',
                dropShadow: { color: '#000000', blur: 8, distance: 4 },
            },
        });
        title.anchor.set(0.5);
        title.x = App.app.screen.width / 2;
        title.y = App.app.screen.height / 2 - 80;
        this.startScreen.addChild(title);

        // Nút Start
        const btnBg = new Graphics();
        btnBg.roundRect(-100, -30, 200, 60, 15);
        btnBg.fill({ color: 0x4fc3f7 });
        btnBg.x = App.app.screen.width / 2;
        btnBg.y = App.app.screen.height / 2 + 30;
        btnBg.eventMode = 'static';
        btnBg.cursor = 'pointer';
        this.startScreen.addChild(btnBg);

        const btnText = new Text({
            text: '▶ START',
            style: { fontFamily: 'Arial', fontSize: 28, fontWeight: 'bold', fill: '#ffffff' },
        });
        btnText.anchor.set(0.5);
        btnText.x = App.app.screen.width / 2;
        btnText.y = App.app.screen.height / 2 + 30;
        this.startScreen.addChild(btnText);

        // Mô tả
        const desc = new Text({
            text: 'Match 3 or more tiles to score!\n30 moves — Can you get a high score?',
            style: { fontFamily: 'Arial', fontSize: 16, fill: '#aaaaaa', align: 'center' },
        });
        desc.anchor.set(0.5);
        desc.x = App.app.screen.width / 2;
        desc.y = App.app.screen.height / 2 + 110;
        this.startScreen.addChild(desc);

        // Animation entrance
        title.alpha = 0;
        gsap.from(title, { y: title.y - 50, duration: 0.8, ease: 'back.out(1.5)' });
        gsap.to(title, { alpha: 1, duration: 0.8 });

        // Click handler
        btnBg.on('pointerdown', () => {
            gsap.to(this.startScreen, {
                alpha: 0,
                duration: 0.4,
                onComplete: () => {
                    this.startScreen.destroy();
                    this.startScreen = null;
                    this.disabled = false;
                },
            });
        });
    }

    /**
     * Hiển thị màn hình Game Over
     */
    showGameOver() {
        this.isGameOver = true;
        this.disabled = true;

        const screen = new Container();
        App.stage.addChild(screen);

        // Nền mờ
        const overlay = new Graphics();
        overlay.rect(0, 0, App.app.screen.width, App.app.screen.height);
        overlay.fill({ color: 0x000000, alpha: 0.75 });
        screen.addChild(overlay);

        // Game Over text
        const goText = new Text({
            text: 'GAME OVER',
            style: {
                fontFamily: 'Arial', fontSize: 56, fontWeight: 'bold',
                fill: '#ff6b6b',
                dropShadow: { color: '#000000', blur: 8, distance: 4 },
            },
        });
        goText.anchor.set(0.5);
        goText.x = App.app.screen.width / 2;
        goText.y = App.app.screen.height / 2 - 80;
        screen.addChild(goText);

        // Final score
        const scoreLabel = new Text({
            text: `Final Score: ${this.score}`,
            style: {
                fontFamily: 'Arial', fontSize: 36, fontWeight: 'bold',
                fill: '#ffdd57',
            },
        });
        scoreLabel.anchor.set(0.5);
        scoreLabel.x = App.app.screen.width / 2;
        scoreLabel.y = App.app.screen.height / 2;
        screen.addChild(scoreLabel);

        // Restart button
        const btnBg = new Graphics();
        btnBg.roundRect(-110, -30, 220, 60, 15);
        btnBg.fill({ color: 0x81c784 });
        btnBg.x = App.app.screen.width / 2;
        btnBg.y = App.app.screen.height / 2 + 80;
        btnBg.eventMode = 'static';
        btnBg.cursor = 'pointer';
        screen.addChild(btnBg);

        const btnText = new Text({
            text: '🔄 PLAY AGAIN',
            style: { fontFamily: 'Arial', fontSize: 24, fontWeight: 'bold', fill: '#ffffff' },
        });
        btnText.anchor.set(0.5);
        btnText.x = App.app.screen.width / 2;
        btnText.y = App.app.screen.height / 2 + 80;
        screen.addChild(btnText);

        // Entrance animation
        screen.alpha = 0;
        gsap.to(screen, { alpha: 1, duration: 0.5 });
        goText.scale.set(0.3);
        gsap.to(goText.scale, { x: 1, y: 1, duration: 0.6, ease: 'back.out(2)', delay: 0.2 });

        // Restart handler
        btnBg.on('pointerdown', () => {
            screen.destroy({ children: true });
            this.restartGame();
        });
    }

    /**
     * Restart game
     */
    restartGame() {
        // Xóa board cũ
        this.gameContainer.destroy({ children: true });
        this.uiContainer.destroy({ children: true });

        // Reset state
        this.score = 0;
        this.moves = 40;
        this.comboCount = 0;
        this.isGameOver = false;
        this.selectedTile = null;
        this.disabled = false;

        // Tạo lại
        this.gameContainer = new Container();
        App.stage.addChild(this.gameContainer);

        this.board = new Board();
        this.createBoardBackground();
        this.gameContainer.addChild(this.boardBg);
        this.gameContainer.addChild(this.board.container);
        this.combinationManager = new CombinationManager(this.board);

        this.removeStartMatches();
        this.createUI();

        this.board.container.on('tile-touch-start', this.onTileClick.bind(this));
    }

    // ============================================================
    //  TUẦN 4: INPUT HANDLING
    // ============================================================

    onTileClick(tile) {
        if (this.disabled || this.isGameOver) return;

        if (this.selectedTile) {
            if (this.selectedTile === tile) {
                this.clearSelection();
            } else if (!this.isNeighbour(this.selectedTile, tile)) {
                this.clearSelection();
                this.selectTile(tile);
            } else {
                this.swap(this.selectedTile, tile);
            }
        } else {
            this.selectTile(tile);
        }
    }

    selectTile(tile) {
        this.selectedTile = tile;
        this.selectedTile.field.select();
    }

    clearSelection() {
        if (this.selectedTile) {
            this.selectedTile.field.unselect();
            this.selectedTile = null;
        }
    }

    isNeighbour(tile1, tile2) {
        const rowDiff = Math.abs(tile1.field.row - tile2.field.row);
        const colDiff = Math.abs(tile1.field.col - tile2.field.col);
        return (rowDiff + colDiff) === 1;
    }

    // ============================================================
    //  TUẦN 5: SWAP + COMBO DETECTION + REVERSE SWAP
    // ============================================================

    /**
     * Swap 2 tiles — BẢN ĐẦY ĐỦ VỚI DIRTY REGION
     * 
     * Sau swap animation:
     *   → Kiểm tra combo CHỈ trong vùng bị ảnh hưởng (dirty region)
     *   → CÓ combo → processMatches() (xóa, rơi, thêm mới, chain)
     *   → KHÔNG combo → reverse swap (đổi lại vị trí cũ)
     * 
     * === DIRTY REGION OPTIMIZATION ===
     * Thay vì quét toàn bộ board (144 ô cho 12×12),
     * chỉ quét hàng + cột của 2 tile bị swap (~48 ô)
     */
    swap(selectedTile, tile, reverse = false) {
        this.disabled = true;
        this.clearSelection();
        selectedTile.sprite.zIndex = 2;

        selectedTile.moveTo(tile.field.position, 0.2);
        tile.moveTo(selectedTile.field.position, 0.2).then(() => {
            selectedTile.sprite.zIndex = 1;
            this.board.swap(selectedTile, tile);

            if (!reverse) {
                // SWAP CHÍNH → kiểm tra combo CHỈ trong dirty region
                const { dirtyRows, dirtyCols } =
                    this.combinationManager.getDirtyRegionAfterSwap(selectedTile, tile);
                const matches = this.combinationManager.getMatchesInRegion(dirtyRows, dirtyCols);

                if (matches.length) {
                    // Có combo → trừ lượt + xử lý
                    this.moves--;
                    this.comboCount = 0;
                    // Lưu lại affected cols để dirty region cascade
                    this.lastAffectedCols = [...dirtyCols];
                    this.updateUI();
                    this.processMatches(matches);
                } else {
                    // Không có combo → reverse swap
                    this.swap(tile, selectedTile, true);
                }
            } else {
                // REVERSE SWAP → mở khóa
                this.disabled = false;
            }
        });
    }

    // ============================================================
    //  TUẦN 6: PROCESSING COMBOS
    // ============================================================

    /**
     * Xử lý combo hoàn chỉnh (pipeline)
     * 
     * Quy trình:
     * 1. removeMatches → xóa tiles combo (animation)
     * 2. Tính điểm
     * 3. processFallDown → tiles rơi xuống lấp trống
     * 4. addTiles → sinh tiles mới từ trên
     * 5. Kiểm tra chain combo → nếu có → lặp lại
     * 6. Kiểm tra game over → kết thúc nếu hết lượt
     */
    async processMatches(matches) {
        // 1. Tính điểm + hiệu ứng
        this.comboCount++;
        this.calculateScore(matches);
        this.showComboText(this.comboCount);

        // 2. Hiệu ứng screen shake cho combo lớn
        if (this.comboCount >= 2) {
            this.screenShake();
        }

        // 3. Hiệu ứng particle trên mỗi tile bị xóa
        //    + Thu thập affected cols để dirty region cascade
        const affectedCols = new Set(this.lastAffectedCols || []);
        matches.forEach(match => {
            match.tiles.forEach(tile => {
                if (tile.sprite) {
                    this.spawnParticles(tile.sprite.x + this.board.container.x,
                                        tile.sprite.y + this.board.container.y,
                                        tile.color);
                }
                if (tile.field) {
                    affectedCols.add(tile.field.col);
                }
            });
        });

        // 4. Xóa tiles
        this.removeMatches(matches);

        // 5. Chờ animation xóa xong
        await this.delay(200);

        // 6. Rơi tiles xuống
        await this.processFallDown();

        // 7. Thêm tiles mới
        await this.addTiles();

        // 8. Kiểm tra chain combo — CHỈ trong dirty region (affected cols)
        const { dirtyRows, dirtyCols } =
            this.combinationManager.getDirtyRegionAfterCascade([...affectedCols]);
        this.lastAffectedCols = dirtyCols;
        const newMatches = this.combinationManager.getMatchesInRegion(dirtyRows, dirtyCols);
        if (newMatches.length) {
            await this.processMatches(newMatches);
            return;
        }

        // 9. Xử lý xong → kiểm tra game over
        if (this.moves <= 0) {
            this.showGameOver();
        } else {
            this.disabled = false;
        }
    }

    /**
     * Tính điểm — CẬP NHẬT CHO LINE SCAN
     * 
     * Công thức mới:
     *   - Mỗi tile = 10 điểm
     *   - Match-4: bonus x1.5
     *   - Match-5+: bonus x2.0
     *   - Combo chain: +50% mỗi combo liên tiếp
     */
    calculateScore(matches) {
        let points = 0;
        matches.forEach(match => {
            let base = match.tiles.length * 10;

            // Bonus cho match dài
            if (match.length >= 5) {
                base *= 2.0;   // Match-5+: x2
            } else if (match.length >= 4) {
                base *= 1.5;   // Match-4: x1.5
            }

            points += base;
        });

        // Combo multiplier
        const multiplier = 1 + (this.comboCount - 1) * 0.5;
        points = Math.floor(points * multiplier);

        this.score += points;
        this.updateUI();
    }

    /**
     * Xóa tiles trong combo — CẬP NHẬT CHO LINE SCAN
     * 
     * matches giờ là [{tiles: [...], length: N}, ...]
     * nên truy cập qua match.tiles thay vì match trực tiếp
     */
    removeMatches(matches) {
        const removed = new Set();
        matches.forEach(match => {
            match.tiles.forEach(tile => {
                if (!removed.has(tile)) {
                    removed.add(tile);
                    tile.remove();
                }
            });
        });
    }

    /**
     * Rơi tiles xuống lấp ô trống
     * 
     * Duyệt từ hàng dưới lên:
     *   - Nếu ô trống → tìm tile gần nhất phía trên → kéo xuống
     */
    processFallDown() {
        return new Promise(resolve => {
            let started = 0;
            let completed = 0;

            for (let row = this.board.rows - 1; row >= 0; row--) {
                for (let col = this.board.cols - 1; col >= 0; col--) {
                    const field = this.board.getField(row, col);
                    if (!field.tile) {
                        ++started;
                        this.fallDownTo(field).then(() => {
                            ++completed;
                            if (completed >= started) resolve();
                        });
                    }
                }
            }

            if (started === 0) resolve();
        });
    }

    /**
     * Tìm tile gần nhất phía trên ô trống và kéo xuống
     */
    fallDownTo(emptyField) {
        for (let row = emptyField.row - 1; row >= 0; row--) {
            const upperField = this.board.getField(row, emptyField.col);
            if (upperField.tile) {
                const tile = upperField.tile;
                upperField.tile = null;
                emptyField.tile = tile;
                tile.field = emptyField;
                return tile.fallDownTo(emptyField.position);
            }
        }
        return Promise.resolve();
    }

    /**
     * Sinh tiles mới cho các ô trống (rơi từ trên xuống)
     */
    addTiles() {
        return new Promise(resolve => {
            const emptyFields = this.board.fields.filter(f => f.tile === null);
            let total = emptyFields.length;
            let completed = 0;

            if (total === 0) { resolve(); return; }

            emptyFields.forEach(field => {
                const tile = this.board.createTile(field);
                // Đặt tile phía trên màn hình
                tile.sprite.y = -App.config.tileSize * 2;

                const delay = Math.random() * 0.2 + 0.3 / (field.row + 1);
                tile.fallDownTo(field.position, delay).then(() => {
                    ++completed;
                    if (completed >= total) resolve();
                });
            });
        });
    }

    // ============================================================
    //  TUẦN 7: REMOVE START MATCHES
    // ============================================================

    /**
     * Xóa tất cả combo tình cờ khi khởi tạo board
     * 
     * Thuật toán while-loop:
     *   1. Tìm combo
     *   2. Nếu có → xóa tiles + tạo tiles mới ngẫu nhiên
     *   3. Kiểm tra lại → nếu vẫn có combo → lặp lại
     *   4. Khi không còn combo → bảng sạch, game bắt đầu
     */
    removeStartMatches() {
        let matches = this.combinationManager.getMatches();

        while (matches.length) {
            this.removeMatches(matches);

            const emptyFields = this.board.fields.filter(f => f.tile === null);
            emptyFields.forEach(field => {
                this.board.createTile(field);
            });

            matches = this.combinationManager.getMatches();
        }
    }

    // ============================================================
    //  TUẦN 8: EFFECTS (Particle, Screen Shake)
    // ============================================================

    /**
     * Hiệu ứng particle khi xóa tile
     * Tạo 8 hạt nhỏ bay ra từ vị trí tile
     */
    spawnParticles(x, y, color) {
        const colors = {
            fire: 0xff6240,
            water: 0x4fc3f7,
            nature: 0x81c784,
            ice: 0x8fd8ff,
            lightning: 0xfff176,
            earth: 0xb0723e,
            'wind-air': 0x51c6c1,
            'psychic-eye': 0xba68c8,
            sun: 0xffd54f,
            'poison-death': 0x8adf5b,
        };
        const particleColor = colors[color] || 0xffffff;

        for (let i = 0; i < 8; i++) {
            const particle = new Graphics();
            particle.circle(0, 0, 4 + Math.random() * 3);
            particle.fill({ color: particleColor });
            particle.x = x;
            particle.y = y;
            App.stage.addChild(particle);

            const angle = (Math.PI * 2 * i) / 8;
            const distance = 30 + Math.random() * 40;

            gsap.to(particle, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.3,
                ease: 'power2.out',
                onComplete: () => particle.destroy(),
            });

            gsap.to(particle.scale, {
                x: 0, y: 0,
                duration: 0.5,
                delay: 0.2,
            });
        }
    }

    /**
     * Hiệu ứng rung màn hình khi combo lớn
     */
    screenShake() {
        const intensity = Math.min(this.comboCount * 2, 10);
        gsap.to(this.gameContainer, {
            x: intensity,
            duration: 0.05,
            yoyo: true,
            repeat: 5,
            ease: 'power2.inOut',
            onComplete: () => { this.gameContainer.x = 0; },
        });
    }

    /**
     * Helper: delay (dùng await)
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

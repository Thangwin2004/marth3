import { Container, Text, Graphics, Texture, Sprite, Assets } from 'pixi.js';
import { Board } from '../game/Board.js';
import { CombinationManager } from '../game/CombinationManager.js';
import { App } from '../system/App.js';
import { saveManager } from '../system/SaveManager.js';
import { sceneManager } from '../system/SceneManager.js';
import { soundManager } from '../system/SoundManager.js';
import gsap from 'gsap';

const ALL_AVATAR_FILES = [
    '001_avatar_laclac.png', '002_avatar_cat_lick1.png', '003_avatar_duck.png', '004_avatar_turtle.png',
    '005_avatar_long.png', '006_avatar_horse.png', '007_avatar_tiguawhite.png', '008_avatar_husky.png',
    '009_avatar_doremonk.png', '010_avatar_echxanh1.png', '011_avatar_nudaeng.png', '012_avatar_hubcat.png',
    '013_avatar_unicorn.png', '014_avatar_zongbadou.png', '015_avatar_dauLan.png', '016_avatar_banhtung.png',
    '017_avatar_tiguayel.png', '018_avatar_megachard.png', '019_avatar_gigaboy.png', '020_avatar_cloudball.png',
    '021_avatar_culama.png', '022_avatar_poolpanda.png', '023_avatar_trollvn.png', '024_avatar_heothy.png',
    '025_avatar_zolype.png', '026_avatar_crick.png', '027_avatar_penguine.png', '028_avatar_timao.png',
    '029_avatar_caocal.png', '030_avatar_cowboy.png', '031_avatar_ninjadog.png', '032_avatar_petrocat.png',
    '033_avatar_richmonkey.png', '034_avatar_hazagi.png', '035_avatar_dogoin.png', '036_avatar_watermelon.png',
    '037_avatar_timone.png', '038_avatar_ronaldo.png', '039_avatar_hustmouse.png', '040_avatar_hitbear.png',
    '041_avatar_echxanh2.png', '042_avatar_zolype2.png', '043_avatar_cat_lick2.png', '044_avatar_poolpanda2.png'
];

export class GameScene {
    constructor(data = {}) {
        this.container = new Container();
        this.container.sortableChildren = true;

        App.setBackgroundColor(0x0a0a1a);

        // === SHOW LOADING OVERLAY ===
        this.loadingText = new Text({
            text: 'ĐANG TẢI HÌNH ẢNH NGẪU NHIÊN...',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 28,
                fontWeight: 'bold',
                fill: '#ffdd57',
                dropShadow: { color: '#000000', blur: 4, distance: 2 }
            }
        });
        this.loadingText.anchor.set(0.5);
        this.loadingText.x = App.app.screen.width / 2;
        this.loadingText.y = App.app.screen.height / 2;
        this.container.addChild(this.loadingText);

        // Load background and avatars, then start
        this.loadResources().then(() => {
            this.initGame();
        });
    }

    async loadResources() {
        try {
            // 1. Randomize and select a background
            const bgIndex = Math.floor(Math.random() * 3) + 1;
            const bgPath = `/assets/backgroud/vietnamese_cultural_landscape_background_${bgIndex}/screen.png`;
            this.bgTexture = await Assets.load(bgPath);

            // 2. Randomize and select 6 distinct avatars from the 44
            const chosenFiles = [...ALL_AVATAR_FILES].sort(() => 0.5 - Math.random()).slice(0, 6);
            this.sessionColors = chosenFiles.map(file => {
                const parts = file.replace('.png', '').split('_');
                return parts.slice(2).join('_');
            });

            // 3. Load the 6 chosen avatars dynamically in parallel
            const loadPromises = chosenFiles.map((file, idx) => {
                const alias = this.sessionColors[idx];
                const src = `/assets/imagebldp/${file}`;
                return Assets.load({ alias, src });
            });
            await Promise.all(loadPromises);

        } catch (err) {
            console.error("Failed to load GameScene dynamic assets:", err);
        }
    }

    initGame() {
        // Destroy loading text
        if (this.loadingText) {
            this.loadingText.destroy();
            this.loadingText = null;
        }

        // === CREATE BACKGROUND ===
        this.bg = new Sprite(this.bgTexture);
        this.bg.width = App.app.screen.width;
        this.bg.height = App.app.screen.height;
        this.bg.tint = 0x333333; // dim background for higher contrast
        this.container.addChild(this.bg);

        // === CREATE AMBIENT PARTICLES ===
        this.createAmbientParticles();

        // === CREATE BOARD ===
        // Pass session colors so the board uses them
        this.board = new Board(null, this.sessionColors);
        this.createBoardBackground();

        // Add board and bg outlines
        this.container.addChild(this.boardBg);
        this.container.addChild(this.board.container);

        // === CREATE COMBINATION MANAGER ===
        this.combinationManager = new CombinationManager(this.board);

        // === GAME STATE ===
        this.selectedTile = null;
        this.disabled = false;
        this.score = 0;
        this.moves = 30;
        this.comboCount = 0;
        this.isGameOver = false;

        // === REMOVE INITIAL MATCHES ===
        this.removeStartMatches();

        // Check if there is at least one possible move at start
        if (!this.combinationManager.hasPossibleMoves()) {
            this.board.shuffleAll(this.combinationManager, false);
        }

        // === CREATE UI ===
        this.createUI();

        // === LISTEN FOR GRID EVENTS ===
        this.board.container.on('tile-touch-start', this.onTileClick.bind(this));

        // Adjust all components positions and scaling
        this.resize();

        // Entrance animation
        this.container.alpha = 0;
        gsap.to(this.container, { alpha: 1, duration: 0.5 });
    }

    /**
     * Create the dark background outline for the board.
     */
    createBoardBackground() {
        const boardWidth = this.board.cols * App.config.tileSize;
        const boardHeight = this.board.rows * App.config.tileSize;
        const padding = 16;

        this.boardBg = new Graphics();
        this.boardBg.roundRect(0, 0, boardWidth + padding * 2, boardHeight + padding * 2, 24);
        this.boardBg.fill({ color: 0x121925, alpha: 0.96 });
        this.boardBg.stroke({ color: 0x324b8b, width: 3, alpha: 0.45 });
        
        // Scale background with the board container
        const scale = this.board.container.scale.x;
        this.boardBg.scale.set(scale);

        // Align background with board
        this.boardBg.x = this.board.container.x - padding * scale;
        this.boardBg.y = this.board.container.y - padding * scale;
    }

    createAmbientParticles() {
        const tempParticle = new Graphics();
        tempParticle.circle(8, 8, 8);
        tempParticle.fill({ color: 0xffffff });
        const particleTexture = App.app.renderer.generateTexture({ target: tempParticle });
        tempParticle.destroy();

        this.ambientParticles = [];
        for (let i = 0; i < 25; i++) {
            const size = 1.2 + Math.random() * 3.5;
            const p = new Sprite(particleTexture);
            p.anchor.set(0.5);
            p.width = size * 2;
            p.height = size * 2;
            const colors = [0x4fc3f7, 0xffeb3b, 0x00e676, 0xff5252, 0xd500f9];
            p.tint = colors[Math.floor(Math.random() * colors.length)];
            p.alpha = 0.08 + Math.random() * 0.18;
            p.x = Math.random() * App.app.screen.width;
            p.y = Math.random() * App.app.screen.height;
            this.container.addChild(p);
            this.ambientParticles.push(p);

            gsap.to(p, {
                y: -20,
                x: p.x + (Math.random() - 0.5) * 120,
                alpha: 0,
                duration: 6 + Math.random() * 10,
                repeat: -1,
                delay: Math.random() * 6,
                onRepeat: () => {
                    p.y = App.app.screen.height + 20;
                    p.x = Math.random() * App.app.screen.width;
                    p.alpha = 0.08 + Math.random() * 0.18;
                }
            });
        }
    }

    spawnFloatingScore(x, y, textString) {
        const floatText = new Text({
            text: textString,
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 26,
                fontWeight: 'bold',
                fill: '#ffdd57',
                stroke: { color: '#000000', width: 4 },
                dropShadow: { color: '#000000', blur: 4, distance: 2 }
            }
        });
        floatText.anchor.set(0.5);
        floatText.x = x;
        floatText.y = y;
        floatText.zIndex = 80;
        this.container.addChild(floatText);

        gsap.to(floatText, {
            y: y - 70,
            alpha: 0,
            duration: 0.9,
            ease: 'power2.out',
            onComplete: () => floatText.destroy()
        });

        floatText.scale.set(0.4);
        gsap.to(floatText.scale, {
            x: 1.15,
            y: 1.15,
            duration: 0.25,
            ease: 'back.out(2.5)'
        });
    }

    /**
     * Create top HUD elements (Score, Moves).
     */
    createUI() {
        this.uiContainer = new Container();
        this.container.addChild(this.uiContainer);

        // === SCORE PANEL BACKGROUND ===
        this.scorePanel = new Graphics();
        this.uiContainer.addChild(this.scorePanel);

        // === SCORE LABEL ===
        this.scoreText = new Text({
            text: 'SCORE: 0',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 24,
                fontWeight: 'bold',
                fill: '#ffdd57',
                dropShadow: { color: '#000000', blur: 4, distance: 2 },
            },
        });
        this.scoreText.anchor.set(0.5);
        this.uiContainer.addChild(this.scoreText);

        // === MOVES PANEL BACKGROUND ===
        this.movesPanel = new Graphics();
        this.uiContainer.addChild(this.movesPanel);

        // === MOVES LABEL ===
        this.movesText = new Text({
            text: `MOVES: ${this.moves}`,
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 24,
                fontWeight: 'bold',
                fill: '#4fc3f7',
                dropShadow: { color: '#000000', blur: 4, distance: 2 },
            },
        });
        this.movesText.anchor.set(0.5);
        this.uiContainer.addChild(this.movesText);

        // === COMBO TEXT (Hidden by default) ===
        this.comboText = new Text({
            text: '',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 42,
                fontWeight: 'bold',
                fill: '#ff5252',
                stroke: { color: '#000000', width: 6 },
                dropShadow: { color: '#000000', blur: 6, distance: 3 },
            },
        });
        this.comboText.anchor.set(0.5);
        this.comboText.visible = false;
        this.uiContainer.addChild(this.comboText);
    }

    /**
     * Update HUD texts with scale pulsing effects.
     */
    updateUI() {
        const newScoreStr = `SCORE: ${this.score}`;
        const newMovesStr = `MOVES: ${this.moves}`;

        if (this.scoreText.text !== newScoreStr) {
            this.scoreText.text = newScoreStr;
            gsap.killTweensOf(this.scoreText.scale);
            this.scoreText.scale.set(1);
            gsap.to(this.scoreText.scale, { x: 1.18, y: 1.18, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' });
        }

        if (this.movesText.text !== newMovesStr) {
            this.movesText.text = newMovesStr;
            gsap.killTweensOf(this.movesText.scale);
            this.movesText.scale.set(1);
            gsap.to(this.movesText.scale, { x: 1.18, y: 1.18, duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' });
        }
    }

    /**
     * Pop combo text with animations.
     */
    showComboText(comboNum) {
        if (comboNum < 2) return;
        this.comboText.text = `COMBO x${comboNum}! 🔥`;
        this.comboText.visible = true;
        this.comboText.alpha = 1;
        this.comboText.scale.set(0.5);
        this.comboText.y = App.app.screen.height / 2 - 100;

        // Kill active tweens on comboText
        gsap.killTweensOf(this.comboText);
        gsap.killTweensOf(this.comboText.scale);

        gsap.to(this.comboText.scale, { x: 1.3, y: 1.3, duration: 0.25, ease: 'back.out(2.5)' });
        gsap.to(this.comboText, {
            alpha: 0,
            y: App.app.screen.height / 2 - 180,
            duration: 1.0,
            delay: 0.4,
            ease: 'power2.out',
            onComplete: () => { this.comboText.visible = false; },
        });
    }

    // ============================================================
    //  INPUT HANDLING
    // ============================================================

    onTileClick(tile) {
        if (this.disabled || this.isGameOver) return;

        soundManager.playClick();

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
    //  SWAP & MATCH LOGIC
    // ============================================================

    swap(selectedTile, tile, reverse = false) {
        this.disabled = true;
        this.clearSelection();
        selectedTile.sprite.zIndex = 2;

        selectedTile.moveTo(tile.field.position, 0.2);
        tile.moveTo(selectedTile.field.position, 0.2).then(() => {
            selectedTile.sprite.zIndex = 1;
            this.board.swap(selectedTile, tile);

            if (!reverse) {
                // Find matches in the affected rows and cols
                const { dirtyRows, dirtyCols } =
                    this.combinationManager.getDirtyRegionAfterSwap(selectedTile, tile);
                const matches = this.combinationManager.getMatchesInRegion(dirtyRows, dirtyCols);

                if (matches.length) {
                    this.moves--;
                    this.comboCount = 0;
                    this.lastAffectedCols = [...dirtyCols];
                    this.updateUI();
                    this.processMatches(matches);
                } else {
                    // No matches -> Swap back
                    this.swap(tile, selectedTile, true);
                }
            } else {
                // Unlock input
                this.disabled = false;
            }
        });
    }

    async processMatches(matches) {
        this.comboCount++;
        this.calculateScore(matches);
        this.showComboText(this.comboCount);

        if (this.comboCount >= 2) {
            this.screenShake();
        }

        // Collect cols affected by cascade and spawn particles
        const affectedCols = new Set(this.lastAffectedCols || []);
        matches.forEach(match => {
            match.tiles.forEach(tile => {
                if (tile.sprite) {
                    // Get global pixel positions
                    const pX = tile.sprite.x * this.board.container.scale.x + this.board.container.x;
                    const pY = tile.sprite.y * this.board.container.scale.y + this.board.container.y;
                    this.spawnParticles(pX, pY, tile.color);
                }
                if (tile.field) {
                    affectedCols.add(tile.field.col);
                }
            });
        });

        // Visually remove matches
        this.removeMatches(matches);

        // Wait for pop/fade animation
        await this.delay(180);

        // Fall down existing tiles
        await this.processFallDown();

        // Spawn new tiles
        await this.addTiles();

        // Check for cascade chains
        const { dirtyRows, dirtyCols } =
            this.combinationManager.getDirtyRegionAfterCascade([...affectedCols]);
        this.lastAffectedCols = dirtyCols;
        const newMatches = this.combinationManager.getMatchesInRegion(dirtyRows, dirtyCols);

        if (newMatches.length) {
            await this.delay(150);
            await this.processMatches(newMatches);
            return;
        }

        // Gameplay settled. Check game over
        if (this.moves <= 0) {
            this.showGameOver();
        } else {
            if (!this.combinationManager.hasPossibleMoves()) {
                await this.handleDeadlock();
            } else {
                this.disabled = false;
            }
        }
    }

    calculateScore(matches) {
        if (matches.length > 0) {
            if (this.comboCount >= 2) {
                soundManager.playCombo(this.comboCount);
            } else {
                soundManager.playMatch();
            }
        }
        let totalAdded = 0;
        const multiplier = Math.max(1, this.comboCount);

        matches.forEach(match => {
            let basePoints = 0;
            if (match.length === 3) {
                basePoints = 10;
            } else if (match.length === 4) {
                basePoints = 25;
            } else if (match.length >= 5) {
                basePoints = 50;
            }

            const pointsForThisMatch = basePoints * multiplier;
            totalAdded += pointsForThisMatch;

            // Tính vị trí trung tâm của cụm ngọc bị phá
            let sumX = 0;
            let sumY = 0;
            let count = 0;

            match.tiles.forEach(tile => {
                if (tile.sprite) {
                    const pX = tile.sprite.x * this.board.container.scale.x + this.board.container.x;
                    const pY = tile.sprite.y * this.board.container.scale.y + this.board.container.y;
                    sumX += pX;
                    sumY += pY;
                    count++;
                }
            });

            if (count > 0) {
                const avgX = sumX / count;
                const avgY = sumY / count;
                // Hiển thị text bay như "+20" hoặc "+50 (x2)"
                const textStr = `+${pointsForThisMatch}${multiplier > 1 ? ` (x${multiplier})` : ''}`;
                this.spawnFloatingScore(avgX, avgY, textStr);
            }
        });

        this.score += totalAdded;
        this.updateUI();
    }

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

    addTiles() {
        return new Promise(resolve => {
            const emptyFields = this.board.fields.filter(f => f.tile === null);
            let total = emptyFields.length;
            let completed = 0;

            if (total === 0) { resolve(); return; }

            emptyFields.forEach(field => {
                const tile = this.board.createTile(field);
                // Set spawning position above the grid
                tile.sprite.y = -App.config.tileSize * 2;

                const delay = Math.random() * 0.15 + 0.2 / (field.row + 1);
                tile.fallDownTo(field.position, delay).then(() => {
                    ++completed;
                    if (completed >= total) resolve();
                });
            });
        });
    }

    /**
     * Loops to shuffle the board until there are no initial match-3 clusters.
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
    //  EFFECTS
    // ============================================================

    spawnParticles(x, y, color) {
        const slotIndex = this.sessionColors.indexOf(color);
        const palette = [
            0xff3d00, // Đỏ cam rực rỡ
            0x00e5ff, // Xanh Cyan điện tử
            0x2979ff, // Xanh biển Hoàng gia
            0x00e676, // Xanh lá Neon
            0xffd600, // Vàng kim sáng
            0xd500f9  // Hồng Neon rực
        ];
        const particleColor = slotIndex !== -1 ? palette[slotIndex] : 0xffffff;

        for (let i = 0; i < 8; i++) {
            const p = new Graphics();
            p.circle(0, 0, 4 + Math.random() * 4);
            p.fill({ color: particleColor });
            p.x = x;
            p.y = y;
            p.alpha = 0.9;
            this.container.addChild(p);

            const angle = (Math.PI * 2 * i) / 8;
            const distance = 40 + Math.random() * 40;

            gsap.to(p, {
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                alpha: 0,
                duration: 0.6,
                ease: 'power2.out',
                onComplete: () => p.destroy(),
            });

            gsap.to(p.scale, {
                x: 0, y: 0,
                duration: 0.5,
                delay: 0.1,
            });
        }
    }

    screenShake() {
        const intensity = Math.min(this.comboCount * 3, 12);
        // Shake the board container itself for visual feedback
        gsap.killTweensOf(this.board.container);
        const originalX = this.board.container.x;
        gsap.to(this.board.container, {
            x: originalX + intensity,
            duration: 0.05,
            yoyo: true,
            repeat: 5,
            ease: 'power2.inOut',
            onComplete: () => { this.board.container.x = originalX; },
        });
    }

    // ============================================================
    //  GAME OVER OVERLAY
    // ============================================================

    showGameOver() {
        this.isGameOver = true;
        this.disabled = true;

        // Dừng nhạc nền và phát nhạc kết quả tương ứng
        soundManager.stopBGM();
        const rank = saveManager.addScore(this.score);
        if (rank) {
            soundManager.playVictory();
        } else {
            soundManager.playGameOver();
        }

        this.gameOverScreen = new Container();
        this.gameOverScreen.zIndex = 100;
        this.container.addChild(this.gameOverScreen);

        // Overlay transparent background
        this.gameOverOverlay = new Graphics();
        this.gameOverOverlay.rect(0, 0, App.app.screen.width, App.app.screen.height);
        this.gameOverOverlay.fill({ color: 0x000000, alpha: 0.8 });
        this.gameOverScreen.addChild(this.gameOverOverlay);

        // Premium modal container
        this.gameOverModal = new Container();
        this.gameOverModal.x = App.app.screen.width / 2;
        this.gameOverModal.y = App.app.screen.height / 2;
        this.gameOverScreen.addChild(this.gameOverModal);

        // Hào quang vàng xoay nhẹ đằng sau modal Game Over
        const starburst = new Graphics();
        const rays = 12;
        for (let i = 0; i < rays; i++) {
            const angle1 = (i * Math.PI * 2) / rays - 0.1;
            const angle2 = (i * Math.PI * 2) / rays + 0.1;
            starburst.moveTo(0, 0);
            starburst.arc(0, 0, 420, angle1, angle2);
            starburst.fill({ color: 0xffdd57, alpha: 0.05 });
        }
        this.gameOverModal.addChild(starburst);
        gsap.to(starburst, { rotation: Math.PI * 2, duration: 25, repeat: -1, ease: 'none' });

        const modalBg = new Graphics();
        modalBg.roundRect(-240, -180, 480, 360, 24);
        modalBg.fill({ color: 0x121a2e, alpha: 0.95 });
        modalBg.stroke({ color: rank ? 0xffdd57 : 0x4fc3f7, width: 4 });
        this.gameOverModal.addChild(modalBg);

        // Game Over Text
        const titleText = new Text({
            text: 'GAME OVER',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 44,
                fontWeight: 'bold',
                fill: '#ff5252',
                dropShadow: { color: '#000000', blur: 6, distance: 3 },
            },
        });
        titleText.anchor.set(0.5);
        titleText.y = -110;
        this.gameOverModal.addChild(titleText);

        // Score Label
        const scoreLabel = new Text({
            text: `ĐIỂM SỐ: ${this.score}`,
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 32,
                fontWeight: 'bold',
                fill: '#ffffff',
            },
        });
        scoreLabel.anchor.set(0.5);
        scoreLabel.y = -40;
        this.gameOverModal.addChild(scoreLabel);

        // Rank Display
        if (rank) {
            const rankLabel = new Text({
                text: `🏆 KỶ LỤC MỚI! HẠNG #${rank} 🏆`,
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 22,
                    fontWeight: 'bold',
                    fill: '#ffdd57',
                    dropShadow: { color: '#000000', blur: 4, distance: 2 },
                },
            });
            rankLabel.anchor.set(0.5);
            rankLabel.y = 10;
            this.gameOverModal.addChild(rankLabel);

            // Subtle scale pulsing on rank text
            rankLabel.scale.set(1.0);
            gsap.to(rankLabel.scale, { x: 1.06, y: 1.06, duration: 0.6, repeat: -1, yoyo: true, ease: 'sine.inOut' });
        } else {
            const normalLabel = new Text({
                text: 'Hãy cố gắng hơn ở lượt chơi kế tiếp nhé!',
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 16,
                    fill: '#aaaaaa',
                },
            });
            normalLabel.anchor.set(0.5);
            normalLabel.y = 10;
            this.gameOverModal.addChild(normalLabel);
        }

        // PLAY AGAIN Button
        this.createModalButton(this.gameOverModal, '🔄 CHƠI LẠI', -115, 80, 0x4caf50, async () => {
            await sceneManager.switchTo(GameScene);
        });

        // MAIN MENU Button
        this.createModalButton(this.gameOverModal, '🏠 TRANG CHỦ', 115, 80, 0xe0e0e0, async () => {
            const { MainMenuScene } = await import('./MainMenuScene.js');
            await sceneManager.switchTo(MainMenuScene);
        }, 0x333333);

        // Apply responsive layout immediately to compute target scale
        this.resize();

        const targetScale = this.gameOverModal.scale.x;
        this.gameOverModal.scale.set(targetScale * 0.7);

        // Entrance animation
        this.gameOverScreen.alpha = 0;
        gsap.to(this.gameOverScreen, { alpha: 1, duration: 0.4 });
        gsap.to(this.gameOverModal.scale, { x: targetScale, y: targetScale, duration: 0.5, ease: 'back.out(1.8)' });
    }

    async handleDeadlock() {
        this.disabled = true;

        this.deadlockOverlayContainer = new Container();
        this.deadlockOverlayContainer.zIndex = 90;
        this.container.addChild(this.deadlockOverlayContainer);

        // Dark glassmorphic background overlay
        this.deadlockOverlayBg = new Graphics();
        this.deadlockOverlayBg.rect(0, 0, App.app.screen.width, App.app.screen.height);
        this.deadlockOverlayBg.fill({ color: 0x000000, alpha: 0.75 });
        this.deadlockOverlayContainer.addChild(this.deadlockOverlayBg);

        // Center notification container
        this.deadlockModal = new Container();
        this.deadlockModal.x = App.app.screen.width / 2;
        this.deadlockModal.y = App.app.screen.height / 2;
        this.deadlockOverlayContainer.addChild(this.deadlockModal);

        // Hào quang cam xoay đằng sau modal thông báo bế tắc
        const starburst = new Graphics();
        const rays = 8;
        for (let i = 0; i < rays; i++) {
            const angle1 = (i * Math.PI * 2) / rays - 0.12;
            const angle2 = (i * Math.PI * 2) / rays + 0.12;
            starburst.moveTo(0, 0);
            starburst.arc(0, 0, 320, angle1, angle2);
            starburst.fill({ color: 0xffaa00, alpha: 0.05 });
        }
        this.deadlockModal.addChild(starburst);
        gsap.to(starburst, { rotation: Math.PI * 2, duration: 18, repeat: -1, ease: 'none' });

        const modalBg = new Graphics();
        modalBg.roundRect(-220, -70, 440, 140, 16);
        modalBg.fill({ color: 0x121925, alpha: 0.95 });
        modalBg.stroke({ color: 0xffaa00, width: 3, alpha: 0.85 });
        this.deadlockModal.addChild(modalBg);

        const text = new Text({
            text: 'HẾT NƯỚC ĐI!\nĐANG TRÁO BÀN NGỌC...',
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 24,
                fontWeight: 'bold',
                fill: '#ffaa00',
                align: 'center',
                dropShadow: { color: '#000000', blur: 4, distance: 2 }
            }
        });
        text.anchor.set(0.5);
        this.deadlockModal.addChild(text);

        // Apply responsive layout immediately
        this.resize();

        const targetScale = this.deadlockModal.scale.x;
        this.deadlockModal.scale.set(targetScale * 0.7);

        // Show overlay with animation
        this.deadlockOverlayContainer.alpha = 0;
        gsap.to(this.deadlockOverlayContainer, { alpha: 1, duration: 0.3 });
        gsap.to(this.deadlockModal.scale, { x: targetScale, y: targetScale, duration: 0.4, ease: 'back.out(1.5)' });

        // Wait for player to notice
        await this.delay(1200);

        // Shuffle the board with slider animation
        await this.board.shuffleAll(this.combinationManager, true);

        // Add a small extra delay for satisfying resolution
        await this.delay(400);

        // Fade out overlay
        await new Promise(resolve => {
            gsap.to(this.deadlockOverlayContainer, {
                alpha: 0,
                duration: 0.3,
                onComplete: () => {
                    this.deadlockOverlayContainer.destroy({ children: true });
                    this.deadlockOverlayContainer = null;
                    this.deadlockOverlayBg = null;
                    this.deadlockModal = null;
                    resolve();
                }
            });
        });

        this.disabled = false;
    }

    createModalButton(parent, label, x, y, color, onClick, textColor = 0xffffff) {
        const btn = new Container();
        btn.x = x;
        btn.y = y;
        parent.addChild(btn);

        const width = 180;
        const height = 48;

        const bg = new Graphics();
        bg.roundRect(-width / 2, -height / 2, width, height, 12);
        bg.fill({ color });
        bg.alpha = 0.9;
        bg.eventMode = 'static';
        bg.cursor = 'pointer';
        btn.addChild(bg);

        const text = new Text({
            text: label,
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 16,
                fontWeight: 'bold',
                fill: textColor,
            },
        });
        text.anchor.set(0.5);
        btn.addChild(text);

        bg.on('pointerover', () => {
            gsap.to(btn.scale, { x: 1.05, y: 1.05, duration: 0.15 });
            bg.alpha = 1.0;
        });
        bg.on('pointerout', () => {
            gsap.to(btn.scale, { x: 1, y: 1, duration: 0.15 });
            bg.alpha = 0.9;
        });
        bg.on('pointerdown', () => {
            onClick();
        });
    }

    resize() {
        const width = App.app.screen.width;
        const height = App.app.screen.height;

        // 1. Resize Background
        if (this.bg) {
            this.bg.width = width;
            this.bg.height = height;
        }

        // 2. Adjust Board Position and Scale
        if (this.board) {
            this.board.adjustPosition();
        }

        // 3. Adjust Board Outline Background
        if (this.boardBg && this.board) {
            const scale = this.board.container.scale.x;
            this.boardBg.scale.set(scale);
            const padding = 16;
            this.boardBg.x = this.board.container.x - padding * scale;
            this.boardBg.y = this.board.container.y - padding * scale;
        }

        // 4. Position and scale HUD panels
        if (this.scorePanel && this.movesPanel && this.scoreText && this.movesText) {
            const isMobile = width < 600 || height > width;

            let panelWidth = 240;
            let panelHeight = 60;
            let margin = 40;
            let topY = 25;
            let fontSize = 24;

            if (isMobile) {
                panelWidth = Math.min(200, (width - 40) / 2);
                panelHeight = 50;
                margin = 15;
                topY = 15;
                fontSize = 18;
            }

            // Reposition and redraw score panel
            this.scorePanel.clear();
            this.scorePanel.roundRect(0, 0, panelWidth, panelHeight, 12);
            this.scorePanel.fill({ color: 0x1a233a, alpha: 0.85 });
            this.scorePanel.stroke({ color: 0x4fc3f7, width: 2, alpha: 0.5 });
            this.scorePanel.x = margin;
            this.scorePanel.y = topY;

            // Reposition score text
            this.scoreText.style.fontSize = fontSize;
            this.scoreText.x = this.scorePanel.x + panelWidth / 2;
            this.scoreText.y = this.scorePanel.y + panelHeight / 2;

            // Reposition and redraw moves panel
            this.movesPanel.clear();
            this.movesPanel.roundRect(0, 0, panelWidth, panelHeight, 12);
            this.movesPanel.fill({ color: 0x1a233a, alpha: 0.85 });
            this.movesPanel.stroke({ color: 0x4fc3f7, width: 2, alpha: 0.5 });
            this.movesPanel.x = width - margin - panelWidth;
            this.movesPanel.y = topY;

            // Reposition moves text
            this.movesText.style.fontSize = fontSize;
            this.movesText.x = this.movesPanel.x + panelWidth / 2;
            this.movesText.y = this.movesPanel.y + panelHeight / 2;
        }

        // 5. Position Combo Text
        if (this.comboText) {
            this.comboText.x = width / 2;
            this.comboText.y = height / 2 - 100;
        }

        // 6. Handle Game Over Screen
        if (this.gameOverScreen && !this.gameOverScreen.destroyed) {
            if (this.gameOverOverlay) {
                this.gameOverOverlay.clear();
                this.gameOverOverlay.rect(0, 0, width, height);
                this.gameOverOverlay.fill({ color: 0x000000, alpha: 0.8 });
            }
            if (this.gameOverModal) {
                this.gameOverModal.x = width / 2;
                this.gameOverModal.y = height / 2;
                const modalScale = width < 600 || height > width ? Math.min(1.0, (width - 40) / 480) : 1.0;
                this.gameOverModal.scale.set(modalScale);
            }
        }

        // 7. Handle Deadlock Overlay
        if (this.deadlockOverlayContainer && !this.deadlockOverlayContainer.destroyed) {
            if (this.deadlockOverlayBg) {
                this.deadlockOverlayBg.clear();
                this.deadlockOverlayBg.rect(0, 0, width, height);
                this.deadlockOverlayBg.fill({ color: 0x000000, alpha: 0.75 });
            }
            if (this.deadlockModal) {
                this.deadlockModal.x = width / 2;
                this.deadlockModal.y = height / 2;
                const modalScale = width < 600 || height > width ? Math.min(1.0, (width - 40) / 440) : 1.0;
                this.deadlockModal.scale.set(modalScale);
            }
        }
    }

    // ============================================================
    //  CLEANUP
    // ============================================================

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    destroy() {
        // Kill all GSAP animations inside this scene
        gsap.killTweensOf(this.container);
        gsap.killTweensOf(this.comboText);
        gsap.killTweensOf(this.comboText.scale);
        if (this.board && this.board.container) {
            gsap.killTweensOf(this.board.container);
        }
        if (this.ambientParticles) {
            this.ambientParticles.forEach(p => gsap.killTweensOf(p));
        }

        // Clean up board
        if (this.board) {
            this.board.fields.forEach(field => {
                if (field.tile) {
                    field.tile._cleanupBoardOverlays();
                }
            });
            this.board.container.destroy({ children: true });
        }

        this.container.destroy({ children: true });
    }
}

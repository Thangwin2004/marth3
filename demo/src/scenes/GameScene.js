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

        // Lower BGM volume during gameplay so explosion SFX pop out
        soundManager.setBGMVolume(0.25);

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

            // 2. Randomize and select 6 distinct avatars from the 44, avoiding duplicates (e.g., cat_lick1 and cat_lick2)
            const getBaseName = (filename) => {
                const name = filename.replace('.png', '').split('_').slice(2).join('_');
                return name.replace(/\d+$/, ''); // Remove trailing numbers
            };

            const chosenFiles = [];
            const chosenBases = new Set();
            const shuffledFiles = [...ALL_AVATAR_FILES].sort(() => 0.5 - Math.random());

            for (const file of shuffledFiles) {
                const base = getBaseName(file);
                if (!chosenBases.has(base)) {
                    chosenFiles.push(file);
                    chosenBases.add(base);
                }
                if (chosenFiles.length === 6) break;
            }

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
        this.bg.tint = 0x888888; // brighter background for clearer landscape
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

        // === MUSIC TOGGLE BUTTON ===
        this.musicBtn = new Container();
        this.musicBtn.eventMode = 'static';
        this.musicBtn.cursor = 'pointer';
        this.uiContainer.addChild(this.musicBtn);

        const musicBg = new Graphics();
        musicBg.circle(0, 0, 20);
        musicBg.fill({ color: 0xffffff, alpha: 0.15 });
        musicBg.stroke({ color: 0xffffff, width: 1.5, alpha: 0.5 });
        this.musicBtn.addChild(musicBg);

        this.musicIcon = new Text({
            text: soundManager.musicEnabled ? '🎵' : '🔇',
            style: { fontFamily: 'Arial', fontSize: 16, fill: '#ffffff' }
        });
        this.musicIcon.anchor.set(0.5);
        this.musicBtn.addChild(this.musicIcon);

        this.musicBtn.on('pointerover', () => {
            gsap.to(this.musicBtn.scale, { x: 1.1, y: 1.1, duration: 0.15 });
            gsap.to(musicBg, { alpha: 0.35, duration: 0.15 });
            soundManager.playClick();
        });
        this.musicBtn.on('pointerout', () => {
            gsap.to(this.musicBtn.scale, { x: 1, y: 1, duration: 0.15 });
            gsap.to(musicBg, { alpha: 0.15, duration: 0.15 });
        });
        this.musicBtn.on('pointerdown', () => {
            soundManager.playClick();
            const enabled = soundManager.toggleMusic();
            this.musicIcon.text = enabled ? '🎵' : '🔇';
            gsap.timeline()
                .to(musicBg, { alpha: 0.6, duration: 0.08 })
                .to(musicBg, { alpha: 0.15, duration: 0.15 });
        });
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

        // Wobble and pulse the selected tile scale
        if (tile.sprite && !tile.sprite.destroyed) {
            gsap.killTweensOf(tile.sprite.scale);
            const targetSize = App.config.tileSize;
            const texture = tile.sprite.texture;
            const baseScale = (targetSize / Math.max(texture.orig.width, texture.orig.height)) * 0.95;

            gsap.to(tile.sprite.scale, {
                x: baseScale * 1.12,
                y: baseScale * 1.12,
                duration: 0.22,
                yoyo: true,
                repeat: -1,
                ease: 'sine.inOut'
            });
        }
    }

    clearSelection() {
        if (this.selectedTile) {
            this.selectedTile.field.unselect();

            // Restore scale of selection
            const tile = this.selectedTile;
            if (tile.sprite && !tile.sprite.destroyed) {
                gsap.killTweensOf(tile.sprite.scale);
                const targetSize = App.config.tileSize;
                const texture = tile.sprite.texture;
                const baseScale = (targetSize / Math.max(texture.orig.width, texture.orig.height)) * 0.95;
                gsap.to(tile.sprite.scale, { x: baseScale, y: baseScale, duration: 0.15 });
            }

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

        if (!reverse) {
            soundManager.playSwap();
            this.lastSwappedTile1 = selectedTile;
            this.lastSwappedTile2 = tile;
        }

        selectedTile.moveTo(tile.field.position, 0.2);
        tile.moveTo(selectedTile.field.position, 0.2).then(() => {
            selectedTile.sprite.zIndex = 1;
            this.board.swap(selectedTile, tile);

            if (!reverse) {
                // Find matches in the affected rows and cols first
                const { dirtyRows, dirtyCols } =
                    this.combinationManager.getDirtyRegionAfterSwap(selectedTile, tile);
                const matches = this.combinationManager.getMatchesInRegion(dirtyRows, dirtyCols);

                if (matches.length) {
                    this.moves--;
                    this.comboCount = 0;
                    this.lastAffectedCols = [...dirtyCols];
                    this.updateUI();
                    
                    // Check if BOTH swapped tiles are special
                    const isTile1Special = selectedTile.isRune || selectedTile.isRainbow || selectedTile.isDrum;
                    const isTile2Special = tile.isRune || tile.isRainbow || tile.isDrum;
                    
                    if (isTile1Special && isTile2Special) {
                        this.processSpecialCombo(selectedTile, tile);
                    } else {
                        this.processMatches(matches);
                    }
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

    async processSpecialCombo(tile1, tile2) {
        this.disabled = true;

        const row = tile2.field ? tile2.field.row : 0;
        const col = tile2.field ? tile2.field.col : 0;
        const pX = tile2.sprite ? (tile2.sprite.x * this.board.container.scale.x + this.board.container.x) : 0;
        const pY = tile2.sprite ? (tile2.sprite.y * this.board.container.scale.y + this.board.container.y) : 0;

        let totalAdded = 0;
        const multiplier = Math.max(1, this.comboCount);

        let destroyedTiles = [];
        let comboTextStr = "";
        let soundType = "super";
        let shakeIntensity = 20;

        // Identify types
        const isRainbow1 = tile1.isRainbow;
        const isRainbow2 = tile2.isRainbow;
        const isDrum1 = tile1.isDrum;
        const isDrum2 = tile2.isDrum;
        const isRune1 = tile1.isRune;
        const isRune2 = tile2.isRune;

        // Capture columns before removing tiles
        const col1 = tile1.field ? tile1.field.col : col;
        const col2 = tile2.field ? tile2.field.col : col;

        // Remove the two swapped tiles first (so they don't get processed again)
        tile1.remove(true);
        tile2.remove(true);

        if (isRainbow1 && isRainbow2) {
            // 1. Rainbow + Rainbow: Clear board
            comboTextStr = "SIÊU BÃO CẦU VỒNG! 🌈";
            soundType = "super";
            shakeIntensity = 30;
            
            // Multicolored expanding rainbow ripples
            const rainbowColors = [0xff1744, 0xff9100, 0xffea00, 0x00e676, 0x2979ff, 0xd500f9];
            rainbowColors.forEach((color, index) => {
                gsap.delayedCall(index * 0.08, () => {
                    this.spawnRipple(pX, pY, color);
                    this.screenShake(25 - index * 2);
                });
            });
            
            // Wipe board
            destroyedTiles = this.board.destroySuperRainbow();
            totalAdded += (500 + destroyedTiles.length * 15) * multiplier;
            
        } else if ((isRainbow1 && (isDrum2 || isRune2)) || (isRainbow2 && (isDrum1 || isRune1))) {
            // 2. Rainbow + Drum or Rainbow + Rune
            const specialType = (isDrum1 || isDrum2) ? 'drum' : 'rune';
            const otherTile = isRainbow1 ? tile2 : tile1;
            const targetColor = (otherTile.color !== 'rainbow' && otherTile.color !== 'stone') ? otherTile.color : this.sessionColors[Math.floor(Math.random() * this.sessionColors.length)];
            
            comboTextStr = specialType === 'drum' ? "CƠN MƯA TRỐNG ĐỒNG! 🥁" : "BÃO CHỮ THẬP RUNE! ⚡";
            soundType = specialType === 'drum' ? "drum" : "rune";
            shakeIntensity = 25;
            
            this.spawnRipple(pX, pY, 0x00ffff);
            soundManager.playRainbowExplosion();

            // Find all tiles of targetColor
            const targetFields = [];
            this.board.fields.forEach(field => {
                if (field.tile && !field.isVoid && field.tile.color === targetColor && !field.tile.isStone) {
                    targetFields.push(field);
                }
            });

            // Shoot rainbow laser beams to all target positions
            const targetPositions = targetFields.map(field => {
                const t = field.tile;
                const tX = t.sprite.x * this.board.container.scale.x + this.board.container.x;
                const tY = t.sprite.y * this.board.container.scale.y + this.board.container.y;
                return { x: tX, y: tY, color: targetColor };
            });
            this.spawnRainbowBlast(pX, pY, targetPositions);

            // Convert them to special tiles
            targetFields.forEach(field => {
                const t = field.tile;
                if (specialType === 'drum') {
                    t.isDrum = true;
                    t.isRune = false;
                    t.isRainbow = false;
                } else {
                    t.isRune = true;
                    t.isDrum = false;
                    t.isRainbow = false;
                }
                t.updateStateOverlay();
            });

            // Wait a brief moment for the visual conversion and laser travel
            await this.delay(450);

            // Now detonate all of them sequentially
            const listToExplode = targetFields.map(f => f.tile);
            for (const t of listToExplode) {
                if (!t || !t.field) continue;
                const r = t.field.row;
                const c = t.field.col;
                const tX = t.sprite.x * this.board.container.scale.x + this.board.container.x;
                const tY = t.sprite.y * this.board.container.scale.y + this.board.container.y;
                
                let extra = [];
                if (specialType === 'drum') {
                    soundManager.playDrumExplosion();
                    this.spawnDrumVFX(tX, tY, false);
                    extra = this.board.destroyArea3x3(r, c);
                } else {
                    soundManager.playRuneExplosion();
                    this.spawnCrossLeaves(tX, tY);
                    extra = this.board.destroyCross(r, c);
                }
                
                destroyedTiles.push(t, ...extra);
                totalAdded += (40 + extra.length * 10) * multiplier;
                this.spawnParticles(tX, tY, t.color);
                await this.delay(100); // satisfying waterfall delay
            }

        } else if (isDrum1 && isDrum2) {
            // 3. Drum + Drum: Giant 5x5 area explosion
            comboTextStr = "ĐẠI TRỐNG ĐỒNG PHÁT NỔ! 💥";
            soundType = "super";
            shakeIntensity = 28;
            
            // Dual expanding bronze drums for cultural resonance
            this.spawnDrumVFX(pX, pY, true);
            gsap.delayedCall(0.15, () => {
                this.spawnDrumVFX(pX, pY, false);
                soundManager.playDrumExplosion();
            });
            
            this.spawnRipple(pX, pY, 0xcd7f32);
            gsap.delayedCall(0.12, () => this.spawnRipple(pX, pY, 0xffa726));
            
            destroyedTiles = this.board.destroyArea5x5(row, col);
            totalAdded += (250 + destroyedTiles.length * 15) * multiplier;
            
        } else if (isRune1 && isRune2) {
            // 4. Rune + Rune: Clears 3 rows and 3 columns (giant cross)
            comboTextStr = "SIÊU LƯỚI CHỮ THẬP! ⚔️";
            soundType = "rune";
            shakeIntensity = 24;
            
            soundManager.playSuperExplosion();

            const rowsToClear = [row - 1, row, row + 1].filter(r => r >= 0 && r < this.board.rows);
            const colsToClear = [col - 1, col, col + 1].filter(c => c >= 0 && c < this.board.cols);
            
            const fieldsToDestroy = new Set();
            rowsToClear.forEach(r => {
                for (let c = 0; c < this.board.cols; c++) {
                    const f = this.board.getField(r, c);
                    if (f && f.tile && !f.isVoid) fieldsToDestroy.add(f);
                }
            });
            colsToClear.forEach(c => {
                for (let r = 0; r < this.board.rows; r++) {
                    const f = this.board.getField(r, c);
                    if (f && f.tile && !f.isVoid) fieldsToDestroy.add(f);
                }
            });

            // Cross leaf whirlwind VFX along the axes
            this.spawnCrossLeaves(pX, pY);
            const tileSize = 100 * this.board.container.scale.x;
            gsap.delayedCall(0.1, () => {
                this.spawnCrossLeaves(pX - tileSize * 1.5, pY);
                this.spawnCrossLeaves(pX + tileSize * 1.5, pY);
                this.spawnCrossLeaves(pX, pY - tileSize * 1.5);
                this.spawnCrossLeaves(pX, pY + tileSize * 1.5);
            });

            fieldsToDestroy.forEach(f => {
                destroyedTiles.push(f.tile);
                this.board._removeTileOverlays(f.tile);
                f.tile.remove();
            });

            totalAdded += (200 + destroyedTiles.length * 12) * multiplier;

        } else if ((isRune1 && isDrum2) || (isRune2 && isDrum1)) {
            // 5. Rune + Drum: Giant cross (3 rows and 3 columns)
            comboTextStr = "PHÁO HOA LIÊN HOÀN! 🎆";
            soundType = "super";
            shakeIntensity = 26;
            
            soundManager.playRuneExplosion();
            gsap.delayedCall(0.12, () => soundManager.playDrumExplosion());

            const rowsToClear = [row - 1, row, row + 1].filter(r => r >= 0 && r < this.board.rows);
            const colsToClear = [col - 1, col, col + 1].filter(c => c >= 0 && c < this.board.cols);
            
            const fieldsToDestroy = new Set();
            rowsToClear.forEach(r => {
                for (let c = 0; c < this.board.cols; c++) {
                    const f = this.board.getField(r, c);
                    if (f && f.tile && !f.isVoid) fieldsToDestroy.add(f);
                }
            });
            colsToClear.forEach(c => {
                for (let r = 0; r < this.board.rows; r++) {
                    const f = this.board.getField(r, c);
                    if (f && f.tile && !f.isVoid) fieldsToDestroy.add(f);
                }
            });

            // Golden Chim Lac birds and green bamboo leaves whirlwind combined!
            this.spawnDrumVFX(pX, pY, true);
            this.spawnCrossLeaves(pX, pY);

            fieldsToDestroy.forEach(f => {
                destroyedTiles.push(f.tile);
                this.board._removeTileOverlays(f.tile);
                f.tile.remove();
            });

            totalAdded += (220 + destroyedTiles.length * 12) * multiplier;
        }

        // Apply score and floating text
        this.score += totalAdded;
        this.updateUI();
        this.spawnFloatingScore(pX, pY, `SIÊU PHỐI HỢP! +${totalAdded}`);

        // Show floating combo text
        if (comboTextStr) {
            this.comboText.text = comboTextStr;
            this.comboText.visible = true;
            this.comboText.alpha = 1;
            this.comboText.scale.set(0.5);
            this.comboText.y = 750 / 2 - 100;

            gsap.killTweensOf(this.comboText);
            gsap.killTweensOf(this.comboText.scale);

            gsap.to(this.comboText.scale, { x: 1.4, y: 1.4, duration: 0.35, ease: 'back.out(2.5)' });
            gsap.to(this.comboText, {
                alpha: 0,
                y: 750 / 2 - 180,
                duration: 1.2,
                delay: 0.6,
                ease: 'power2.out',
                onComplete: () => { this.comboText.visible = false; },
            });
        }

        // Sounds & Shake
        if (soundType === 'super') {
            soundManager.playSuperExplosion();
        } else if (soundType === 'drum') {
            soundManager.playDrumExplosion();
        } else if (soundType === 'rune') {
            soundManager.playRuneExplosion();
        }
        this.screenShake(shakeIntensity);

        // Spawn particles for all destroyed tiles
        destroyedTiles.forEach(t => {
            if (t && t.sprite && !t.sprite.destroyed) {
                const tX = t.sprite.x * this.board.container.scale.x + this.board.container.x;
                const tY = t.sprite.y * this.board.container.scale.y + this.board.container.y;
                this.spawnParticles(tX, tY, t.color);
            }
        });

        // Wait for animations
        await this.delay(250);

        // Fall down
        await this.processFallDown();

        // Add tiles
        await this.addTiles();

        // Check cascades
        const affectedCols = new Set([col1, col2]);
        destroyedTiles.forEach(t => {
            if (t && t.originalField) {
                affectedCols.add(t.originalField.col);
            } else if (t && t.field) {
                affectedCols.add(t.field.col);
            }
        });
        const { dirtyRows, dirtyCols } =
            this.combinationManager.getDirtyRegionAfterCascade([...affectedCols]);
        this.lastAffectedCols = dirtyCols;
        const newMatches = this.combinationManager.getMatchesInRegion(dirtyRows, dirtyCols);

        if (newMatches.length) {
            await this.delay(150);
            await this.processMatches(newMatches);
            return;
        }

        // Check game over
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


    async processMatches(matches) {
        this.comboCount++;

        // Mark matches that are Super Blasts (match of 4 or 5 containing a special tile)
        matches.forEach(match => {
            const hasSpecial = match.tiles.some(tile => tile.isRune || tile.isRainbow || tile.isDrum);
            if ((match.length >= 4 || match.isTLMatch) && hasSpecial) {
                match.isSuperBlast = true;
            }
        });

        this.showComboText(this.comboCount);

        // Cache original field references before any explosions nullify them
        matches.forEach(match => {
            match.tiles.forEach(tile => {
                if (tile.field) {
                    tile.originalField = tile.field;
                }
            });
        });

        // 1. Gather all matches details (center, coordinates, etc.)
        const pendingExplosions = [];

        matches.forEach(match => {
            let centerTile = match.intersectionTile || match.tiles.find(t => t === this.lastSwappedTile1 || t === this.lastSwappedTile2);
            if (!centerTile) {
                centerTile = match.tiles[Math.floor(match.tiles.length / 2)];
            }
            const centerField = centerTile.originalField || centerTile.field;
            if (!centerField) return;

            const r = centerField.row;
            const c = centerField.col;
            
            // Get screen coordinates
            const pX = centerTile.sprite ? (centerTile.sprite.x * this.board.container.scale.x + this.board.container.x) : (c * App.config.tileSize * this.board.container.scale.x + this.board.container.x + (App.config.tileSize * this.board.container.scale.x)/2);
            const pY = centerTile.sprite ? (centerTile.sprite.y * this.board.container.scale.y + this.board.container.y) : (r * App.config.tileSize * this.board.container.scale.y + this.board.container.y + (App.config.tileSize * this.board.container.scale.y)/2);

            pendingExplosions.push({
                match,
                length: match.length,
                row: r,
                col: c,
                x: pX,
                y: pY,
                color: match.tiles[0].color
            });
        });

        let totalAdded = 0;
        const multiplier = Math.max(1, this.comboCount);
        let playSoundType = this.comboCount >= 2 ? 'combo' : 'match';
        let hasMatch4 = false;
        let hasMatch5 = false;

        // 2. Process each explosion & calculate score
        pendingExplosions.forEach(exp => {
            if (exp.match.isSuperBlast) {
                playSoundType = 'super';
                if (exp.match.isTLMatch) {
                    hasMatch4 = true;
                    // Super Drum Blast (T/L shape containing special tile)
                    this.spawnDrumVFX(exp.x, exp.y, true);
                    const extraTiles = this.board.destroyArea5x5(exp.row, exp.col);
                    
                    // Base 250 + 18 per extra tile destroyed
                    const matchPoints = (250 + extraTiles.length * 18) * multiplier;
                    totalAdded += matchPoints;
                    
                    this.spawnFloatingScore(exp.x, exp.y, `SIÊU TRỐNG ĐỒNG! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ''}`);
                    this.spawnRipple(exp.x, exp.y, 0xffa726);
                } else if (exp.length === 4) {
                    hasMatch4 = true;
                    // Super Cross Blast (Match-4 containing special tile)
                    this.spawnSuperCrossVFX(exp.x, exp.y);
                    const extraTiles = this.board.destroySuperCross(exp.row, exp.col);
                    
                    // Base 150 + 15 per extra tile destroyed
                    const matchPoints = (150 + extraTiles.length * 15) * multiplier;
                    totalAdded += matchPoints;
                    
                    this.spawnFloatingScore(exp.x, exp.y, `SIÊU CHỮ THẬP! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ''}`);
                    this.spawnRipple(exp.x, exp.y, 0x00e676);
                } else {
                    hasMatch5 = true;
                    // Super Board Wipe (Match-5 containing special tile)
                    this.spawnSuperRainbowVFX(exp.x, exp.y);
                    const extraTiles = this.board.destroySuperRainbow();

                    // Base 350 + 20 per extra tile destroyed
                    const matchPoints = (350 + extraTiles.length * 20) * multiplier;
                    totalAdded += matchPoints;

                    this.spawnFloatingScore(exp.x, exp.y, `SIÊU BÃO NỔ! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ''}`);
                    this.spawnRipple(exp.x, exp.y, 0xff00ff);
                }
            } else if (exp.match.isTLMatch) {
                // Normal T/L-shape: Spawns special Drum Gem, no immediate explosion
                const matchPoints = 40 * multiplier;
                totalAdded += matchPoints;
                this.spawnFloatingScore(exp.x, exp.y, `TRỐNG ĐỒNG! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ''}`);
                
                this.spawnRipple(exp.x, exp.y, 0xcd7f32);
            } else if (exp.length === 4) {
                // Normal Match-4: Spawns special Rune tile, no immediate explosion
                const matchPoints = 25 * multiplier;
                totalAdded += matchPoints;
                this.spawnFloatingScore(exp.x, exp.y, `MATCH-4! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ''}`);
                
                const slotIndex = this.sessionColors.indexOf(exp.color);
                const palette = [0xff3d00, 0x00e5ff, 0x2979ff, 0x00e676, 0xffd600, 0xd500f9];
                const rippleColor = slotIndex !== -1 ? palette[slotIndex] : 0xffffff;
                this.spawnRipple(exp.x, exp.y, rippleColor);
            } else if (exp.length >= 5) {
                // Normal Match-5: Spawns special Rainbow Gem, no immediate explosion
                const matchPoints = 50 * multiplier;
                totalAdded += matchPoints;
                this.spawnFloatingScore(exp.x, exp.y, `MATCH-5! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ''}`);
                
                const slotIndex = this.sessionColors.indexOf(exp.color);
                const palette = [0xff3d00, 0x00e5ff, 0x2979ff, 0x00e676, 0xffd600, 0xd500f9];
                const rippleColor = slotIndex !== -1 ? palette[slotIndex] : 0xffffff;
                this.spawnRipple(exp.x, exp.y, rippleColor);
            } else {
                // Normal Match-3
                // Check if any tile in the match was special (Rune, Rainbow, or Drum)
                const specialTiles = exp.match.tiles.filter(t => t.isRune || t.isRainbow || t.isDrum);

                if (specialTiles.length > 0) {
                    // Loop through all special tiles in this match and trigger them all!
                    specialTiles.forEach(specialTile => {
                        const r = specialTile.originalField ? specialTile.originalField.row : exp.row;
                        const c = specialTile.originalField ? specialTile.originalField.col : exp.col;
                        const tX = specialTile.sprite ? (specialTile.sprite.x * this.board.container.scale.x + this.board.container.x) : exp.x;
                        const tY = specialTile.sprite ? (specialTile.sprite.y * this.board.container.scale.y + this.board.container.y) : exp.y;

                        if (specialTile.isDrum) {
                            hasMatch4 = true;
                            if (playSoundType !== 'super' && playSoundType !== 'rainbow') playSoundType = 'drum';
                            
                            this.spawnDrumVFX(tX, tY, false);
                            const extraTiles = this.board.destroyArea3x3(r, c);
                            const matchPoints = (120 + extraTiles.length * 12) * multiplier;
                            totalAdded += matchPoints;
                            this.spawnFloatingScore(tX, tY, `SẤM VANG TRỐNG ĐỒNG! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ''}`);
                            this.spawnRipple(tX, tY, 0xffa726);
                        } else if (specialTile.isRune) {
                            hasMatch4 = true;
                            if (playSoundType !== 'super' && playSoundType !== 'rainbow' && playSoundType !== 'drum') playSoundType = 'rune';
                            
                            this.spawnCrossLeaves(tX, tY);
                            const extraTiles = this.board.destroyCross(r, c);
                            const matchPoints = (100 + extraTiles.length * 10) * multiplier;
                            totalAdded += matchPoints;
                            this.spawnFloatingScore(tX, tY, `HIỆU ỨNG CHỮ THẬP! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ''}`);
                            this.spawnRipple(tX, tY, 0x00e676);
                        } else if (specialTile.isRainbow) {
                            hasMatch5 = true;
                            if (playSoundType !== 'super') playSoundType = 'rainbow';

                            // Normal Rainbow Blast (Destroy all of that color)
                            const targetPositions = [];
                            this.board.fields.forEach(field => {
                                if (field.tile && !field.isVoid && field.tile.color === exp.color && field.tile.sprite) {
                                    const tx = field.tile.sprite.x * this.board.container.scale.x + this.board.container.x;
                                    const ty = field.tile.sprite.y * this.board.container.scale.y + this.board.container.y;
                                    targetPositions.push({ x: tx, y: ty, color: exp.color });
                                }
                            });
                            this.spawnRainbowBlast(tX, tY, targetPositions);
                            const extraTiles = this.board.destroyAllOfColor(exp.color);
                            
                            const matchPoints = (150 + extraTiles.length * 12) * multiplier;
                            totalAdded += matchPoints;
                            this.spawnFloatingScore(tX, tY, `NỔ SẮC CẦU VỒNG! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ''}`);
                            this.spawnRipple(tX, tY, 0xff00ff);
                        }
                    });
                } else {
                    // Normal match-3
                    const matchPoints = 10 * multiplier;
                    totalAdded += matchPoints;
                    this.spawnFloatingScore(exp.x, exp.y, `+${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ''}`);

                    // Ripple Color based on tile color
                    const slotIndex = this.sessionColors.indexOf(exp.color);
                    const palette = [0xff3d00, 0x00e5ff, 0x2979ff, 0x00e676, 0xffd600, 0xd500f9];
                    const rippleColor = slotIndex !== -1 ? palette[slotIndex] : 0xffffff;
                    this.spawnRipple(exp.x, exp.y, rippleColor);
                }
            }
        });

        this.score += totalAdded;
        this.updateUI();

        // 3. Sound triggers
        if (playSoundType === 'super') {
            soundManager.playSuperExplosion();
        } else if (playSoundType === 'rainbow') {
            soundManager.playRainbowExplosion();
        } else if (playSoundType === 'drum') {
            soundManager.playDrumExplosion();
        } else if (playSoundType === 'rune') {
            soundManager.playRuneExplosion();
        } else if (playSoundType === 'combo') {
            soundManager.playCombo(this.comboCount);
        } else {
            soundManager.playMatch();
        }

        // 4. Screen shake triggers
        if (hasMatch5) {
            this.screenShake(25);
        } else if (hasMatch4) {
            this.screenShake(16);
        } else if (this.comboCount >= 2) {
            this.screenShake();
        }

        // Spawn normal particles for matched tiles (for Match-3 and remaining tiles)
        matches.forEach(match => {
            match.tiles.forEach(tile => {
                if (tile.sprite) {
                    const pX = tile.sprite.x * this.board.container.scale.x + this.board.container.x;
                    const pY = tile.sprite.y * this.board.container.scale.y + this.board.container.y;
                    this.spawnParticles(pX, pY, tile.color);
                }
            });
        });

        // Visually remove matches
        this.removeMatches(matches);

        // Collect all columns that have empty fields (where tiles were destroyed/matched)
        const affectedCols = new Set();
        this.board.fields.forEach(field => {
            if (field.tile === null && !field.isVoid) {
                affectedCols.add(field.col);
            }
        });

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

    removeMatches(matches, immediate = false) {
        const removed = new Set();
        const specialSpawns = [];

        matches.forEach(match => {
            if (match.isTLMatch) {
                // Determine which tile is the intersection tile
                const specialTile = match.intersectionTile || match.tiles.find(t => t === this.lastSwappedTile1 || t === this.lastSwappedTile2) || match.tiles[0];
                const targetField = specialTile.originalField || specialTile.field;
                if (targetField && !match.isSuperBlast) {
                    specialSpawns.push({ field: targetField, type: 'drum', color: specialTile.color });
                }

                match.tiles.forEach(tile => {
                    if (tile !== specialTile && !removed.has(tile)) {
                        removed.add(tile);
                        tile.remove(immediate);
                    }
                });

                if (match.isSuperBlast && specialTile && !removed.has(specialTile)) {
                    removed.add(specialTile);
                    specialTile.remove(immediate);
                }
            } else if (match.length === 4) {
                // Determine which tile becomes the special Rune tile
                let specialTile = match.tiles.find(t => t === this.lastSwappedTile1 || t === this.lastSwappedTile2);
                if (!specialTile) {
                    specialTile = match.tiles[Math.floor(match.tiles.length / 2)];
                }
                
                const targetField = specialTile.originalField || specialTile.field;
                if (targetField && !match.isSuperBlast) {
                    specialSpawns.push({ field: targetField, type: 'rune', color: specialTile.color });
                }

                match.tiles.forEach(tile => {
                    if (tile !== specialTile && !removed.has(tile)) {
                        removed.add(tile);
                        tile.remove(immediate);
                    }
                });

                if (match.isSuperBlast && specialTile && !removed.has(specialTile)) {
                    removed.add(specialTile);
                    specialTile.remove(immediate);
                }
            } else if (match.length >= 5) {
                // Determine which tile becomes the Rainbow Gem
                let specialTile = match.tiles.find(t => t === this.lastSwappedTile1 || t === this.lastSwappedTile2);
                if (!specialTile) {
                    specialTile = match.tiles[Math.floor(match.tiles.length / 2)];
                }

                const targetField = specialTile.originalField || specialTile.field;
                if (targetField && !match.isSuperBlast) {
                    specialSpawns.push({ field: targetField, type: 'rainbow', color: specialTile.color });
                }

                match.tiles.forEach(tile => {
                    if (tile !== specialTile && !removed.has(tile)) {
                        removed.add(tile);
                        tile.remove(immediate);
                    }
                });

                if (match.isSuperBlast && specialTile && !removed.has(specialTile)) {
                    removed.add(specialTile);
                    specialTile.remove(immediate);
                }
            } else {
                // Normal match-3, remove all tiles
                match.tiles.forEach(tile => {
                    if (!removed.has(tile)) {
                        removed.add(tile);
                        tile.remove(immediate);
                    }
                });
            }
        });

        // Instantiate/convert the special tiles
        specialSpawns.forEach(spawn => {
            const field = spawn.field;
            if (field) {
                // If the field is currently empty (due to an explosion in this turn), recreate a tile first
                if (field.tile === null) {
                    this.board.createTile(field, spawn.color);
                }

                // Get screen coordinates of the tile/field
                const tX = field.tile.sprite ? (field.tile.sprite.x * this.board.container.scale.x + this.board.container.x) : (field.col * App.config.tileSize * this.board.container.scale.x + this.board.container.x + (App.config.tileSize * this.board.container.scale.x)/2);
                const tY = field.tile.sprite ? (field.tile.sprite.y * this.board.container.scale.y + this.board.container.y) : (field.row * App.config.tileSize * this.board.container.scale.y + this.board.container.y + (App.config.tileSize * this.board.container.scale.y)/2);

                if (spawn.type === 'rune') {
                    field.tile.isRune = true;
                    field.tile.updateStateOverlay();
                    this.spawnRuneCreationVFX(tX, tY);
                    soundManager.playRuneCreation();
                    console.log("🌟 Spawned Rune Tile at row:", field.row, "col:", field.col);
                } else if (spawn.type === 'rainbow') {
                    field.tile.isRainbow = true;
                    field.tile.updateStateOverlay();
                    this.spawnRainbowCreationVFX(tX, tY);
                    soundManager.playRainbowCreation();
                    console.log("🌈 Spawned Rainbow Gem at row:", field.row, "col:", field.col);
                } else if (spawn.type === 'drum') {
                    field.tile.isDrum = true;
                    field.tile.updateStateOverlay();
                    this.spawnDrumCreationVFX(tX, tY);
                    soundManager.playDrumCreation();
                    console.log("🥁 Spawned Bronze Drum Gem at row:", field.row, "col:", field.col);
                }
            }
        });

        this.lastSwappedTile1 = null;
        this.lastSwappedTile2 = null;
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
                const tile = this.board.createTile(field, null, true);
                tile.sprite.y = -App.config.tileSize * 2;
                if (tile.stateOverlay) {
                    tile.stateOverlay.y = tile.sprite.y;
                }

                const delay = Math.random() * 0.15 + 0.2 / (field.row + 1);
                tile.fallDownTo(field.position, delay).then(() => {
                    ++completed;
                    if (completed >= total) resolve();
                });
            });
        });
    }

    removeStartMatches() {
        let matches = this.combinationManager.getMatches();

        while (matches.length) {
            this.removeMatches(matches, true);

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

        const count = 24; // Increased for a richer explosion
        for (let i = 0; i < count; i++) {
            const p = new Graphics();
            const isLeaf = Math.random() > 0.4; // 60% leaves, 40% sparks

            if (isLeaf) {
                // Draw a beautiful small bamboo leaf
                // Shadow
                p.moveTo(1, -7);
                p.quadraticCurveTo(4, 0, 1, 7);
                p.quadraticCurveTo(-2, 0, 1, -7);
                p.fill({ color: 0x000000, alpha: 0.35 });

                // Body (vivid green)
                p.moveTo(0, -8);
                p.quadraticCurveTo(3, 0, 0, 8);
                p.quadraticCurveTo(-3, 0, 0, -8);
                p.fill({ color: 0x2e7d32 });
                p.stroke({ color: 0xaeed9e, width: 0.8 });
            } else {
                // Draw a glowing firefly spark
                p.circle(0, 0, 5);
                p.fill({ color: particleColor, alpha: 0.25 });
                p.circle(0, 0, 3);
                p.fill({ color: 0xffffff, alpha: 0.95 });
            }

            p.x = x;
            p.y = y;
            p.alpha = 0.95;
            p.zIndex = 95;
            p.scale.set(1.0 + Math.random() * 0.5);
            this.container.addChild(p);

            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
            const speed = 70 + Math.random() * 100;
            
            // Physics simulation via GSAP (adds gravity drop)
            gsap.to(p, {
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed + 80, // Gravity pull
                alpha: 0,
                duration: 0.7 + Math.random() * 0.3,
                ease: 'power2.out',
                onComplete: () => p.destroy(),
            });

            gsap.to(p.scale, {
                x: 0.1, y: 0.1,
                duration: 0.65,
                delay: 0.1,
            });

            gsap.to(p, {
                rotation: (Math.random() - 0.5) * 15,
                duration: 0.8
            });
        }
    }

    spawnRipple(x, y, colorHex = 0xffffff) {
        const rippleContainer = new Container();
        rippleContainer.zIndex = 95;
        this.container.addChild(rippleContainer);

        let activeTweens = 0;
        const checkCleanup = () => {
            activeTweens--;
            if (activeTweens <= 0 && rippleContainer && !rippleContainer.destroyed) {
                rippleContainer.destroy({ children: true });
            }
        };

        // 1. Hạt lúa vàng mộc mạc (Rustic Golden Rice Grains)
        // Draw 6-8 golden rice grains that shoot out radially
        const grainCount = 6 + Math.floor(Math.random() * 3);
        for (let i = 0; i < grainCount; i++) {
            const grain = new Graphics();
            
            // Slender rice grain shape
            grain.moveTo(-5, 0);
            grain.quadraticCurveTo(0, -2.5, 5, 0);
            grain.quadraticCurveTo(0, 2.5, -5, 0);
            
            // Rice golden colors: amber/gold/yellow
            const grainColors = [0xffd54f, 0xffb300, 0xffc107];
            const grainColor = grainColors[Math.floor(Math.random() * grainColors.length)];
            grain.fill({ color: grainColor });

            // Highlight line on the upper edge
            grain.moveTo(-3, -1);
            grain.quadraticCurveTo(0, -2, 3, -1);
            grain.stroke({ color: 0xffffff, width: 0.8, alpha: 0.6 });

            grain.x = x;
            grain.y = y;
            grain.rotation = Math.random() * Math.PI * 2;
            rippleContainer.addChild(grain);

            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 45;
            const targetX = x + Math.cos(angle) * distance;
            // Add positive Y offset to simulate a small gravity fall
            const targetY = y + Math.sin(angle) * distance + 15;

            activeTweens++;
            gsap.to(grain, {
                x: targetX,
                y: targetY,
                rotation: grain.rotation + (Math.random() - 0.5) * 8,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.3,
                ease: 'power2.out',
                onComplete: () => {
                    if (grain && !grain.destroyed) {
                        grain.destroy();
                    }
                    checkCleanup();
                }
            });
        }

        // 2. Cánh hoa / Lá quê sắc màu (Colored rural petals/leaves matching the tile color)
        const leafCount = 5 + Math.floor(Math.random() * 3);
        for (let i = 0; i < leafCount; i++) {
            const leaf = new Graphics();
            // A simple curved leaf/petal shape
            leaf.moveTo(0, -5);
            leaf.quadraticCurveTo(2.5, 0, 0, 5);
            leaf.quadraticCurveTo(-2.5, 0, 0, -5);
            leaf.fill({ color: colorHex, alpha: 0.95 });
            leaf.stroke({ color: 0xffffff, width: 0.8, alpha: 0.5 });

            leaf.x = x;
            leaf.y = y;
            leaf.rotation = Math.random() * Math.PI * 2;
            rippleContainer.addChild(leaf);

            const angle = Math.random() * Math.PI * 2;
            const distance = 35 + Math.random() * 40;
            const targetX = x + Math.cos(angle) * distance;
            const targetY = y + Math.sin(angle) * distance + 10;

            activeTweens++;
            gsap.to(leaf, {
                x: targetX,
                y: targetY,
                rotation: leaf.rotation + (Math.random() - 0.5) * 6,
                alpha: 0,
                duration: 0.5 + Math.random() * 0.3,
                ease: 'power1.out',
                onComplete: () => {
                    if (leaf && !leaf.destroyed) {
                        leaf.destroy();
                    }
                    checkCleanup();
                }
            });
        }

        // 3. Khói sương bụi mộc mạc (Soft smoke/mist puffs that drift and expand slightly)
        // Spawns 3 tiny drifting smoke puffs instead of scaling up a single giant concentric circle
        const smokeCount = 3;
        for (let i = 0; i < smokeCount; i++) {
            const smoke = new Graphics();
            smoke.circle(0, 0, 10);
            smoke.fill({ color: colorHex, alpha: 0.22 });
            smoke.circle(-4, 3, 7);
            smoke.fill({ color: 0xffffff, alpha: 0.12 });

            smoke.x = x;
            smoke.y = y;
            smoke.scale.set(0.6);
            rippleContainer.addChild(smoke);

            const angle = Math.random() * Math.PI * 2;
            const driftDistance = 15 + Math.random() * 20;
            const targetX = x + Math.cos(angle) * driftDistance;
            const targetY = y + Math.sin(angle) * driftDistance;

            activeTweens++;
            gsap.to(smoke, {
                x: targetX,
                y: targetY,
                alpha: 0,
                duration: 0.45 + Math.random() * 0.15,
                ease: 'sine.out',
                onComplete: () => {
                    if (smoke && !smoke.destroyed) {
                        smoke.destroy();
                    }
                    checkCleanup();
                }
            });

            gsap.to(smoke.scale, {
                x: 2.2,
                y: 2.2,
                duration: 0.45 + Math.random() * 0.15,
                ease: 'sine.out'
            });
        }
    }

    spawnRuneCreationVFX(x, y) {
        const vfxContainer = new Container();
        vfxContainer.zIndex = 92;
        this.container.addChild(vfxContainer);

        const offsets = [
            { dx: -35, dy: -35 },
            { dx: 35, dy: -35 },
            { dx: -35, dy: 35 },
            { dx: 35, dy: 35 }
        ];

        let completed = 0;
        offsets.forEach(offset => {
            const p = new Graphics();
            // Star/diamond spark
            p.moveTo(0, -6);
            p.lineTo(3, 0);
            p.lineTo(0, 6);
            p.lineTo(-3, 0);
            p.fill({ color: 0xffd54f }); // gold

            p.x = x + offset.dx;
            p.y = y + offset.dy;
            p.scale.set(0.2);
            p.alpha = 0;
            vfxContainer.addChild(p);

            gsap.to(p, {
                x: x,
                y: y,
                alpha: 1,
                duration: 0.35,
                ease: 'power1.out'
            });

            gsap.to(p.scale, {
                x: 1.4,
                y: 1.4,
                duration: 0.35,
                ease: 'power1.out',
                onComplete: () => {
                    p.destroy();
                    completed++;
                    if (completed === 4) {
                        // Flash at the center
                        const flash = new Graphics();
                        flash.circle(0, 0, 15);
                        flash.fill({ color: 0xffffff });
                        flash.x = x;
                        flash.y = y;
                        vfxContainer.addChild(flash);

                        gsap.to(flash, {
                            alpha: 0,
                            duration: 0.2,
                            ease: 'sine.out',
                            onComplete: () => {
                                vfxContainer.destroy();
                            }
                        });
                        gsap.to(flash.scale, {
                            x: 2.2,
                            y: 2.2,
                            duration: 0.2,
                            ease: 'sine.out'
                        });
                    }
                }
            });
        });
    }

    spawnRainbowCreationVFX(x, y) {
        const vfxContainer = new Container();
        vfxContainer.zIndex = 92;
        this.container.addChild(vfxContainer);

        const rainbowColors = [0xff1744, 0xff9100, 0xffea00, 0x00e676, 0x00e5ff, 0x2979ff, 0xd500f9];
        const dotCount = 14;
        let completed = 0;

        for (let i = 0; i < dotCount; i++) {
            const p = new Graphics();
            const color = rainbowColors[i % rainbowColors.length];
            p.circle(0, 0, 4);
            p.fill({ color: color });
            
            p.x = x;
            p.y = y;
            vfxContainer.addChild(p);

            const startAngle = (i * Math.PI * 2) / dotCount;
            const startRadius = 45;

            // Set initial position on circle
            p.x = x + Math.cos(startAngle) * startRadius;
            p.y = y + Math.sin(startAngle) * startRadius;

            // Animate spiral inward
            const obj = { radius: startRadius, angle: startAngle };
            gsap.to(obj, {
                radius: 0,
                angle: startAngle + Math.PI * 1.5, // 270 degree rotation
                duration: 0.45,
                ease: 'sine.out',
                onUpdate: () => {
                    if (p && !p.destroyed) {
                        p.x = x + Math.cos(obj.angle) * obj.radius;
                        p.y = y + Math.sin(obj.angle) * obj.radius;
                    }
                },
                onComplete: () => {
                    p.destroy();
                    completed++;
                    if (completed === dotCount) {
                        // Rainbow flash
                        const flash = new Graphics();
                        flash.circle(0, 0, 16);
                        flash.fill({ color: 0xffffff });
                        flash.x = x;
                        flash.y = y;
                        vfxContainer.addChild(flash);

                        gsap.to(flash, {
                            alpha: 0,
                            duration: 0.25,
                            ease: 'sine.out',
                            onComplete: () => {
                                vfxContainer.destroy();
                            }
                        });
                        gsap.to(flash.scale, {
                            x: 2.5,
                            y: 2.5,
                            duration: 0.25,
                            ease: 'sine.out'
                        });
                    }
                }
            });
        }
    }

    spawnDrumCreationVFX(x, y) {
        const vfxContainer = new Container();
        vfxContainer.zIndex = 92;
        this.container.addChild(vfxContainer);

        // 1. Gathering bronze/gold ring
        const ring = new Graphics();
        ring.circle(0, 0, 48);
        ring.stroke({ color: 0xffa726, width: 3, alpha: 0.8 });
        ring.x = x;
        ring.y = y;
        vfxContainer.addChild(ring);

        gsap.to(ring.scale, {
            x: 0.1,
            y: 0.1,
            duration: 0.35,
            ease: 'power2.in',
            onComplete: () => {
                ring.destroy();
                
                // 2. Radial gold spark blast (8 rays)
                const rays = 8;
                let raysCompleted = 0;
                for (let r = 0; r < rays; r++) {
                    const spark = new Graphics();
                    // Slender diamond ray
                    spark.moveTo(0, -10);
                    spark.lineTo(2, 0);
                    spark.lineTo(0, 10);
                    spark.lineTo(-2, 0);
                    spark.fill({ color: 0xffd54f });

                    spark.x = x;
                    spark.y = y;
                    const angle = (r * Math.PI * 2) / rays;
                    spark.rotation = angle;
                    vfxContainer.addChild(spark);

                    const destX = x + Math.cos(angle) * 35;
                    const destY = y + Math.sin(angle) * 35;

                    gsap.to(spark, {
                        x: destX,
                        y: destY,
                        alpha: 0,
                        duration: 0.25,
                        ease: 'sine.out',
                        onComplete: () => {
                            spark.destroy();
                            raysCompleted++;
                            if (raysCompleted === rays) {
                                vfxContainer.destroy();
                            }
                        }
                    });
                }
            }
        });
    }

    spawnCrossLeaves(x, y) {
        const leafContainer = new Container();
        leafContainer.zIndex = 90;
        this.container.addChild(leafContainer);

        const count = 54; // All 54 are green bamboo leaves for high clarity

        for (let i = 0; i < count; i++) {
            const p = new Graphics();

            // Bamboo leaf: Very long, vibrant green slender leaf with central vein (lá tre xanh)
            // 1. Shadow (offset +2px x/y)
            p.moveTo(2, -23);
            p.quadraticCurveTo(10, -4, 2, 25);
            p.quadraticCurveTo(-6, -4, 2, -23);
            p.fill({ color: 0x000000, alpha: 0.35 });

            // 2. Main body (Vibrant green instead of dark forest green for high contrast)
            p.moveTo(0, -25);
            p.quadraticCurveTo(8, -6, 0, 23);
            p.quadraticCurveTo(-8, -6, 0, -25);
            p.fill({ color: 0x2e7d32 });
            p.stroke({ color: 0xaeed9e, width: 1.8 });

            // 3. Central leaf vein (light/white green)
            p.moveTo(0, -21);
            p.lineTo(0, 21);
            p.stroke({ color: 0xffffff, width: 1.5, alpha: 0.9 });

            p.x = x;
            p.y = y;
            p.scale.set(1.4 + Math.random() * 0.7); 
            leafContainer.addChild(p);

            // Determine direction: horizontal or vertical
            const isHorizontal = i % 2 === 0;
            const direction = Math.random() > 0.5 ? 1 : -1;
            
            // Concentrated wind flow along the lines
            const targetX = isHorizontal ? x + direction * (350 + Math.random() * 450) : x + (Math.random() - 0.5) * 35;
            const targetY = isHorizontal ? y + (Math.random() - 0.5) * 35 : y + direction * (300 + Math.random() * 400);

            gsap.to(p, {
                x: targetX,
                y: targetY,
                rotation: (Math.random() - 0.5) * 12,
                alpha: 0,
                duration: 0.9 + Math.random() * 0.5,
                ease: 'power1.out',
                onComplete: () => p.destroy()
            });
        }

        gsap.delayedCall(1.6, () => {
            leafContainer.destroy();
        });
    }

    spawnRainbowBlast(fromX, fromY, targets) {
        const blastContainer = new Container();
        blastContainer.zIndex = 90;
        this.container.addChild(blastContainer);

        const colors = [0xff80ab, 0x00e5ff, 0xffeb3b, 0x00e676, 0xd500f9];

        targets.forEach((target, idx) => {
            // Draw a very soft, faint wind trail line (làn gió mỏng)
            const trail = new Graphics();
            trail.moveTo(target.x, target.y);
            trail.lineTo(fromX, fromY);
            trail.stroke({ color: 0xffffff, width: 1.5, alpha: 0.25 });
            blastContainer.addChild(trail);

            gsap.to(trail, {
                alpha: 0,
                duration: 1.0,
                onComplete: () => trail.destroy()
            });

            // Spawn 4 beautiful leaves at target flying towards the Rainbow Gem
            const targetColorHex = colors[idx % colors.length];
            for (let j = 0; j < 4; j++) {
                const p = new Graphics();
                
                // 1. Shadow
                p.moveTo(1, -9);
                p.quadraticCurveTo(3, -2, 1, 9);
                p.quadraticCurveTo(-2, -2, 1, -9);
                p.fill({ color: 0x000000, alpha: 0.35 });

                // 2. Leaf Body (slender leaf shape)
                p.moveTo(0, -10);
                p.quadraticCurveTo(4, -2, 0, 10);
                p.quadraticCurveTo(-4, -2, 0, -10);
                p.fill({ color: targetColorHex });
                p.stroke({ color: 0xffffff, width: 0.8, alpha: 0.6 });

                // 3. Central vein
                p.moveTo(0, -8);
                p.lineTo(0, 8);
                p.stroke({ color: 0xffffff, width: 0.8, alpha: 0.8 });

                p.x = target.x + (Math.random() - 0.5) * 20;
                p.y = target.y + (Math.random() - 0.5) * 20;
                p.scale.set(0.9 + Math.random() * 0.5);
                blastContainer.addChild(p);

                // Animate flying and spiraling into the Rainbow Gem
                const delay = Math.random() * 0.15;
                gsap.to(p, {
                    x: fromX,
                    y: fromY,
                    rotation: (Math.random() - 0.5) * 10,
                    duration: 0.9 + Math.random() * 0.4,
                    delay: delay,
                    ease: 'power1.inOut',
                    onComplete: () => p.destroy()
                });
            }

            this.spawnParticles(target.x, target.y, target.color);
        });

        gsap.delayedCall(1.8, () => {
            blastContainer.destroy({ children: true });
        });
    }

    screenShake(customIntensity = null) {
        const intensity = customIntensity !== null ? customIntensity : Math.min(this.comboCount * 3, 12);
        gsap.killTweensOf(this.board.container);
        const originalX = this.board.container.x;
        gsap.to(this.board.container, {
            x: originalX + intensity,
            duration: 0.05,
            yoyo: true,
            repeat: customIntensity !== null ? 8 : 5,
            ease: 'power2.inOut',
            onComplete: () => { this.board.container.x = originalX; },
        });
    }

    /**
     * Spawns a screen-clearing super cross explosion of green bamboo leaves.
     */
    spawnSuperCrossVFX(x, y) {
        const leafContainer = new Container();
        leafContainer.zIndex = 95;
        this.container.addChild(leafContainer);

        // Draw a giant cross flash
        const flash = new Graphics();
        const boardWidth = this.board.cols * App.config.tileSize * this.board.container.scale.x;
        const boardHeight = this.board.rows * App.config.tileSize * this.board.container.scale.y;

        flash.rect(x - 45, this.board.container.y, 90, boardHeight);
        flash.rect(this.board.container.x, y - 45, boardWidth, 90);
        flash.fill({ color: 0xaeed9e, alpha: 0.45 });
        leafContainer.addChild(flash);

        gsap.to(flash, {
            alpha: 0,
            duration: 0.5,
            ease: 'power2.out',
            onComplete: () => flash.destroy()
        });

        // Spawn 80 green bamboo leaves blowing along the lines
        const count = 80;
        for (let i = 0; i < count; i++) {
            const p = new Graphics();
            // Shadow
            p.moveTo(2, -23);
            p.quadraticCurveTo(10, -4, 2, 25);
            p.quadraticCurveTo(-6, -4, 2, -23);
            p.fill({ color: 0x000000, alpha: 0.35 });

            // Body
            p.moveTo(0, -25);
            p.quadraticCurveTo(8, -6, 0, 23);
            p.quadraticCurveTo(-8, -6, 0, -25);
            p.fill({ color: 0x2e7d32 });
            p.stroke({ color: 0xaeed9e, width: 1.8 });

            p.moveTo(0, -21);
            p.lineTo(0, 21);
            p.stroke({ color: 0xffffff, width: 1.5, alpha: 0.9 });

            p.x = x;
            p.y = y;
            p.scale.set(1.5 + Math.random() * 0.9);
            leafContainer.addChild(p);

            const isHorizontal = i % 2 === 0;
            const direction = Math.random() > 0.5 ? 1 : -1;
            const targetX = isHorizontal ? x + direction * (400 + Math.random() * 500) : x + (Math.random() - 0.5) * 75;
            const targetY = isHorizontal ? y + (Math.random() - 0.5) * 75 : y + direction * (350 + Math.random() * 450);

            gsap.to(p, {
                x: targetX,
                y: targetY,
                rotation: (Math.random() - 0.5) * 16,
                alpha: 0,
                duration: 1.0 + Math.random() * 0.6,
                ease: 'power2.out',
                onComplete: () => p.destroy()
            });
        }

        // Spawn ripples
        this.spawnRipple(x, y, 0x00e676);
        gsap.delayedCall(0.12, () => this.spawnRipple(x, y, 0xffffff));

        gsap.delayedCall(1.8, () => {
            leafContainer.destroy();
        });
    }

    /**
     * Spawns a full board rainbow wipe VFX.
     */
    spawnSuperRainbowVFX(x, y) {
        const vfxContainer = new Container();
        vfxContainer.zIndex = 95;
        this.container.addChild(vfxContainer);

        // Giant expanding color circle
        const shockwave = new Graphics();
        shockwave.circle(0, 0, 20);
        shockwave.fill({ color: 0xffffff, alpha: 0.6 });
        shockwave.x = x;
        shockwave.y = y;
        vfxContainer.addChild(shockwave);

        gsap.to(shockwave.scale, {
            x: 40,
            y: 40,
            duration: 0.75,
            ease: 'power2.out'
        });
        gsap.to(shockwave, {
            alpha: 0,
            duration: 0.75,
            ease: 'power2.out',
            onComplete: () => shockwave.destroy()
        });

        // Spawn 100 colorful firefly sparks shooting out in all directions
        const colors = [0xff1744, 0xff9100, 0xffea00, 0x00e676, 0x2979ff, 0xd500f9];
        const count = 100;
        for (let i = 0; i < count; i++) {
            const p = new Graphics();
            const color = colors[i % colors.length];

            p.circle(0, 0, 7);
            p.fill({ color: color, alpha: 0.3 });
            p.circle(0, 0, 4);
            p.fill({ color: 0xffffff, alpha: 0.95 });

            p.x = x;
            p.y = y;
            p.scale.set(1.0 + Math.random() * 0.8);
            vfxContainer.addChild(p);

            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
            const speed = 120 + Math.random() * 250;

            gsap.to(p, {
                x: x + Math.cos(angle) * speed,
                y: y + Math.sin(angle) * speed + 50,
                alpha: 0,
                duration: 0.8 + Math.random() * 0.4,
                ease: 'power3.out',
                onComplete: () => p.destroy()
            });
        }

    }

    /**
     * Spawns a Vietnamese Bronze Drum (Trống Đồng) face that expands,
     * along with soaring golden Chim Lạc birds that spiral outward.
     */
    spawnDrumVFX(x, y, isSuper = false) {
        const vfxContainer = new Container();
        vfxContainer.zIndex = 95;
        this.container.addChild(vfxContainer);

        // 1. Draw expanding Bronze Drum Face
        const drumFace = new Graphics();
        
        // Outer bronze ring
        drumFace.circle(0, 0, 40);
        drumFace.stroke({ color: 0xcd7f32, width: 6, alpha: 0.8 });
        
        // Inner gold ring
        drumFace.circle(0, 0, 32);
        drumFace.stroke({ color: 0xffa726, width: 2, alpha: 0.6 });
        
        // Starburst center
        const rays = 8;
        for (let r = 0; r < rays; r++) {
            const angle = (r * Math.PI * 2) / rays;
            drumFace.moveTo(0, 0);
            drumFace.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
        }
        drumFace.stroke({ color: 0xffe082, width: 3, alpha: 0.9 });
        
        drumFace.x = x;
        drumFace.y = y;
        drumFace.scale.set(0.5);
        vfxContainer.addChild(drumFace);

        gsap.to(drumFace.scale, {
            x: isSuper ? 6.5 : 4.0,
            y: isSuper ? 6.5 : 4.0,
            duration: 0.85,
            ease: 'sine.out'
        });
        gsap.to(drumFace, {
            alpha: 0,
            rotation: Math.PI * 0.75,
            duration: 0.85,
            ease: 'sine.out',
            onComplete: () => drumFace.destroy()
        });

        // 2. Spawn golden Chim Lạc birds spiraling out
        const birdCount = isSuper ? 16 : 8;
        for (let i = 0; i < birdCount; i++) {
            const birdWrapper = new Container();
            birdWrapper.x = x;
            birdWrapper.y = y;
            birdWrapper.rotation = (Math.PI * 2 * i) / birdCount;
            vfxContainer.addChild(birdWrapper);

            const bird = new Graphics();
            // Draw stylized Chim Lạc:
            // Beak & Head
            bird.moveTo(0, -5);
            bird.lineTo(10, 0); // Head/Beak pointing right
            bird.lineTo(0, 3);
            // Body & Tail
            bird.lineTo(-12, 0);
            bird.closePath();
            bird.fill({ color: 0xffd54f }); // Golden body

            // Wings
            bird.moveTo(-2, -2);
            bird.quadraticCurveTo(-6, -10, -10, -8); // Left wing
            bird.moveTo(-2, 2);
            bird.quadraticCurveTo(-6, 10, -10, 8); // Right wing
            bird.stroke({ color: 0xffffff, width: 1.5, alpha: 0.8 });

            bird.x = 10;
            bird.y = 0;
            bird.scale.set(1.2 + Math.random() * 0.5);
            birdWrapper.addChild(bird);

            // Animate spiral movement
            const targetRadius = isSuper ? (220 + Math.random() * 120) : (140 + Math.random() * 80);
            const rotationDelta = (Math.PI * 1.5) * (Math.random() > 0.5 ? 1 : -1);

            gsap.to(birdWrapper, {
                rotation: birdWrapper.rotation + rotationDelta,
                duration: 0.9 + Math.random() * 0.4,
                ease: 'power1.out'
            });

            gsap.to(bird, {
                x: targetRadius,
                alpha: 0,
                duration: 0.9 + Math.random() * 0.4,
                ease: 'power1.out'
            });

            // Soft flap wings animation
            gsap.to(bird.scale, {
                y: bird.scale.y * 0.35,
                duration: 0.15,
                repeat: 6,
                yoyo: true,
                ease: 'sine.inOut'
            });
        }

        // Cleanup container
        gsap.delayedCall(1.6, () => {
            vfxContainer.destroy();
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
            const isMobileLandscape = width > height && height < 500;
            const isMobilePortrait = width < 600 || height > width;

            let panelWidth = 240;
            let panelHeight = 60;
            let fontSize = 24;

            if (isMobileLandscape) {
                // Xoay ngang điện thoại: xếp 2 bảng 2 bên trái/phải bảng ngọc
                panelWidth = 160;
                panelHeight = 50;
                fontSize = 16;

                // Căn giữa bảng Score ở khoảng trống bên trái bảng ngọc
                const leftSpace = this.board.container.x;
                this.scorePanel.x = (leftSpace - panelWidth) / 2;
                this.scorePanel.y = (height - panelHeight) / 2;

                // Căn giữa bảng Moves ở khoảng trống bên phải bảng ngọc
                const boardRight = this.board.container.x + (this.board.cols * App.config.tileSize * this.board.container.scale.x);
                const rightSpace = width - boardRight;
                this.movesPanel.x = boardRight + (rightSpace - panelWidth) / 2;
                this.movesPanel.y = (height - panelHeight) / 2;

            } else if (isMobilePortrait) {
                // Màn hình dọc điện thoại: xếp ở trên cùng
                panelWidth = Math.min(200, (width - 40) / 2);
                panelHeight = 50;
                fontSize = 18;

                const margin = 15;
                const topY = 15;

                this.scorePanel.x = margin;
                this.scorePanel.y = topY;

                this.movesPanel.x = width - margin - panelWidth;
                this.movesPanel.y = topY;
            } else {
                // Màn hình PC/Laptop: xếp ở góc trên trái và góc trên phải
                panelWidth = 240;
                panelHeight = 60;
                fontSize = 24;

                const margin = 40;
                const topY = 25;

                this.scorePanel.x = margin;
                this.scorePanel.y = topY;

                this.movesPanel.x = width - margin - panelWidth;
                this.movesPanel.y = topY;
            }

            // Vẽ lại khung cho 2 bảng
            this.scorePanel.clear();
            this.scorePanel.roundRect(0, 0, panelWidth, panelHeight, 12);
            this.scorePanel.fill({ color: 0x1a233a, alpha: 0.85 });
            this.scorePanel.stroke({ color: 0x4fc3f7, width: 2, alpha: 0.5 });

            this.movesPanel.clear();
            this.movesPanel.roundRect(0, 0, panelWidth, panelHeight, 12);
            this.movesPanel.fill({ color: 0x1a233a, alpha: 0.85 });
            this.movesPanel.stroke({ color: 0x4fc3f7, width: 2, alpha: 0.5 });

            // Định vị lại chữ vào giữa bảng tương ứng
            this.scoreText.style.fontSize = fontSize;
            this.scoreText.x = this.scorePanel.x + panelWidth / 2;
            this.scoreText.y = this.scorePanel.y + panelHeight / 2;

            this.movesText.style.fontSize = fontSize;
            this.movesText.x = this.movesPanel.x + panelWidth / 2;
            this.movesText.y = this.movesPanel.y + panelHeight / 2;
        }

        // 4.5. Position Music Button in Gameplay
        if (this.musicBtn) {
            this.musicBtn.x = width - 36;
            this.musicBtn.y = height - 36;
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

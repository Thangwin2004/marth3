/**
 * ===== src/battle/BattleScene.js =====
 * 
 * Main battle controller — turn-based PvP on shared Match-3 board.
 * 
 * Flow:
 * 1. Init: create board, player, boss, UI
 * 2. Coin flip → decide first turn
 * 3. Turn loop: Player ↔ Boss alternate
 * 4. Player: swap tiles OR use skill → damage boss
 * 5. Boss: AI skill (every N turns) + AI swap → damage player
 * 6. Win: boss HP = 0 | Lose: player HP = 0
 */

import { Container, Graphics, Text } from 'pixi.js';
import { Board } from '../game/Board.js';
import { CombinationManager } from '../game/CombinationManager.js';
import { Player } from './Player.js';
import { Boss } from './Boss.js';
import { DamageSystem } from './DamageSystem.js';
import { BossAI } from './BossAI.js';
import { BossSkillSystem } from './BossSkillSystem.js';
import { SkillSystem } from './SkillSystem.js';
import { EnvironmentSystem } from './EnvironmentSystem.js';
import { statusEffectManager } from './StatusEffects.js';
import { App } from '../system/App.js';
import { Config } from '../config.js';
import { LEVELS } from '../data/LevelData.js';
import { saveManager } from '../system/SaveManager.js';
import gsap from 'gsap';

export class BattleScene {
    /**
     * @param {{ level: number }} data
     */
    constructor(data = {}) {
        this.levelNum = data.level || 1;
        this.levelConfig = LEVELS[this.levelNum];
        if (!this.levelConfig) {
            console.error(`Level ${this.levelNum} not found!`);
            return;
        }

        // Root container
        this.container = new Container();
        this.container.sortableChildren = true;

        // State
        this.currentTurn = 'player'; // 'player' | 'boss'
        this.turnCount = 0;
        this.comboCount = 0;
        this.disabled = false;
        this.selectedTile = null;
        this.isGameOver = false;
        this.grantExtraTurn = false;

        // Init everything
        this.initBackground();
        this.initBoard();
        this.initEntities();
        this.initSystems();
        this.initUI();
        this.removeStartMatches();

        // Bind events
        this.board.container.on('tile-touch-start', this.onTileClick.bind(this));

        // Start battle with coin flip (delayed)
        this.disabled = true;
        setTimeout(() => this.startBattle(), 500);
    }

    // ================================================================
    //  INITIALIZATION
    // ================================================================

    initBackground() {
        // Set terrain background color
        const bgColor = this.levelConfig.terrain.background;
        App.setBackgroundColor(bgColor);

        // Board background panel
        this.boardBg = new Graphics();
        this.container.addChild(this.boardBg);
    }

    initBoard() {
        this.board = new Board(this.levelConfig);
        this.container.addChild(this.board.container);

        // Draw board background
        const boardWidth = this.board.cols * Config.tileSize;
        const boardHeight = this.board.rows * Config.tileSize;
        const padding = 12;
        this.boardBg.roundRect(
            this.board.container.x - padding,
            this.board.container.y - padding,
            boardWidth + padding * 2,
            boardHeight + padding * 2,
            16
        );
        this.boardBg.fill({ color: 0x000000, alpha: 0.4 });
        this.boardBg.stroke({ color: 0xffffff, width: 2, alpha: 0.15 });
    }

    initEntities() {
        const savedSkills = saveManager.getUnlockedSkills();
        this.player = new Player(savedSkills);
        this.boss = new Boss(this.levelConfig);
    }

    initSystems() {
        this.combinationManager = new CombinationManager(this.board);
        this.damageSystem = new DamageSystem(this.levelConfig.terrain);
        this.bossAI = new BossAI(this.boss.aiOptimalChance);
        this.bossSkillSystem = new BossSkillSystem(this.boss, this.board);
        this.skillSystem = new SkillSystem(this.player);
        this.environmentSystem = new EnvironmentSystem(this.levelConfig.terrain, this.board);
    }

    initUI() {
        this.uiContainer = new Container();
        this.uiContainer.zIndex = 100;
        this.container.addChild(this.uiContainer);

        // Level title
        this.titleText = new Text({
            text: `⚔ LEVEL ${this.levelNum}: ${this.levelConfig.bossName}`,
            style: {
                fontFamily: 'Arial, sans-serif',
                fontSize: 22,
                fontWeight: 'bold',
                fill: '#ffffff',
                dropShadow: { color: '#000000', blur: 4, distance: 2 },
            },
        });
        this.titleText.x = Config.canvas.width / 2;
        this.titleText.y = 15;
        this.titleText.anchor.set(0.5, 0);
        this.uiContainer.addChild(this.titleText);

        // Player HP text (left side)
        this.playerHPText = new Text({
            text: `❤️ ${this.player.currentHP}/${this.player.maxHP}`,
            style: { fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: '#4fc3f7' },
        });
        this.playerHPText.x = 30;
        this.playerHPText.y = 50;
        this.uiContainer.addChild(this.playerHPText);

        // Player shield text
        this.playerShieldText = new Text({
            text: '',
            style: { fontFamily: 'Arial', fontSize: 14, fill: '#64b5f6' },
        });
        this.playerShieldText.x = 30;
        this.playerShieldText.y = 75;
        this.uiContainer.addChild(this.playerShieldText);

        // Boss HP text (right side)
        this.bossHPText = new Text({
            text: `🩸 ${this.boss.currentHP}/${this.boss.maxHP}`,
            style: { fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: '#ff6b6b' },
        });
        this.bossHPText.x = Config.canvas.width - 30;
        this.bossHPText.y = 50;
        this.bossHPText.anchor.set(1, 0);
        this.uiContainer.addChild(this.bossHPText);

        // Boss info
        this.bossInfoText = new Text({
            text: this.getBossInfoString(),
            style: { fontFamily: 'Arial', fontSize: 12, fill: '#aaaaaa' },
        });
        this.bossInfoText.x = Config.canvas.width - 30;
        this.bossInfoText.y = 75;
        this.bossInfoText.anchor.set(1, 0);
        this.uiContainer.addChild(this.bossInfoText);

        // Turn indicator text
        this.turnText = new Text({
            text: '',
            style: { fontFamily: 'Arial', fontSize: 16, fill: '#ffdd57' },
        });
        this.turnText.x = Config.canvas.width / 2;
        this.turnText.y = 45;
        this.turnText.anchor.set(0.5, 0);
        this.uiContainer.addChild(this.turnText);

        // Battle log (bottom)
        this.logText = new Text({
            text: '💡 Match tiles to attack the boss!',
            style: { fontFamily: 'Arial', fontSize: 14, fill: '#cccccc' },
        });
        this.logText.x = Config.canvas.width / 2;
        this.logText.y = Config.canvas.height - 30;
        this.logText.anchor.set(0.5, 0.5);
        this.uiContainer.addChild(this.logText);

        // Terrain info
        this.terrainText = new Text({
            text: this.getTerrainInfoString(),
            style: { fontFamily: 'Arial', fontSize: 12, fill: '#aaa' },
        });
        this.terrainText.x = Config.canvas.width / 2;
        this.terrainText.y = Config.canvas.height - 55;
        this.terrainText.anchor.set(0.5, 0.5);
        this.uiContainer.addChild(this.terrainText);

        // Big turn overlay (YOUR TURN / BOSS TURN)
        this.turnOverlay = new Text({
            text: '',
            style: {
                fontFamily: 'Arial', fontSize: 48, fontWeight: 'bold',
                fill: '#ffdd57',
                dropShadow: { color: '#000000', blur: 8, distance: 4 },
            },
        });
        this.turnOverlay.anchor.set(0.5);
        this.turnOverlay.x = Config.canvas.width / 2;
        this.turnOverlay.y = Config.canvas.height / 2;
        this.turnOverlay.visible = false;
        this.turnOverlay.zIndex = 200;
        this.uiContainer.addChild(this.turnOverlay);
    }

    // ================================================================
    //  BATTLE START (COIN FLIP)
    // ================================================================

    async startBattle() {
        // Simple coin flip
        const result = Math.random() < 0.5 ? 'player' : 'boss';
        this.currentTurn = result;

        // Show coin flip result
        await this.showTurnOverlay(
            result === 'player' ? '⚔️ YOU GO FIRST!' : '💀 BOSS GOES FIRST!',
            result === 'player' ? '#ffdd57' : '#ff6b6b'
        );

        this.startTurn(result);
    }

    // ================================================================
    //  TURN MANAGEMENT
    // ================================================================

    async startTurn(who) {
        if (this.isGameOver) return;
        this.currentTurn = who;
        this.turnCount++;
        this.comboCount = 0;

        // Tick status effects for the active entity
        const entity = who === 'player' ? this.player : this.boss;
        const dotResult = statusEffectManager.tickEffects(entity);
        if (dotResult.totalDotDamage > 0) {
            this.addLog(`${entity.name} takes ${dotResult.totalDotDamage} DoT damage!`);
            this.updateUI();
        }

        // Check if stunned
        if (dotResult.wasStunned) {
            this.addLog(`${entity.name} is stunned! Turn skipped.`);
            await this.showTurnOverlay(`${who === 'player' ? '😵' : '💫'} STUNNED!`, '#ffaa00');
            entity.stunned = false;
            await this.delay(800);
            this.switchTurn();
            return;
        }

        // Tick frozen/hidden tiles
        this.board.tickFrozenTiles();
        this.board.tickHiddenTiles();

        // Tick player skill cooldowns
        if (who === 'player') {
            this.player.tickCooldowns();
        }

        // Environment events (every full round = after both turns)
        if (who === 'player' && this.turnCount > 2) {
            const envResult = this.environmentSystem.tick();
            if (envResult.warning) {
                this.addLog(envResult.warning);
            }
            if (envResult.triggered) {
                this.addLog(`🌍 ${envResult.result.description}`);
                if (envResult.result.damage && envResult.result.damageTarget === 'both') {
                    this.player.takeDamage(envResult.result.damage);
                    this.boss.takeDamage(envResult.result.damage);
                }
                // Process cascade after environment event
                await this.processFallDown();
                await this.addTiles();
                this.updateUI();
                if (this.checkGameEnd()) return;
            }
        }

        // Boss turn
        if (who === 'boss') {
            this.disabled = true;
            this.board.setInputEnabled(false);
            await this.showTurnOverlay('💀 BOSS TURN', '#ff6b6b');

            // Boss skill (every N turns)
            this.boss.incrementTurn();
            if (this.bossSkillSystem.shouldUseSkill()) {
                const skillResult = this.bossSkillSystem.executeSkill();
                if (skillResult) {
                    this.addLog(`🔮 Boss uses ${skillResult.skillId}: ${skillResult.description}`);
                    await this.delay(800);
                    await this.processFallDown();
                    await this.addTiles();
                    this.updateUI();
                    if (this.checkGameEnd()) return;
                }
            }

            // Boss AI swap
            await this.delay(600);
            await this.executeBossTurn();
            return;
        }

        // Player turn
        this.disabled = false;
        this.board.setInputEnabled(true);
        await this.showTurnOverlay('⚔️ YOUR TURN', '#ffdd57');
        this.updateUI();
    }

    switchTurn() {
        const next = this.currentTurn === 'player' ? 'boss' : 'player';
        this.startTurn(next);
    }

    // ================================================================
    //  PLAYER INPUT
    // ================================================================

    onTileClick(tile) {
        if (this.disabled || this.isGameOver || this.currentTurn !== 'player') return;
        if (tile.frozen || tile.isStone) return;

        if (this.selectedTile) {
            if (this.selectedTile === tile) {
                this.clearSelection();
            } else if (!this.isNeighbour(this.selectedTile, tile)) {
                this.clearSelection();
                this.selectTile(tile);
            } else {
                // Check if either tile is frozen
                if (this.selectedTile.frozen || tile.frozen) {
                    this.clearSelection();
                    return;
                }
                this.swap(this.selectedTile, tile, false, 'player');
            }
        } else {
            this.selectTile(tile);
        }
    }

    selectTile(tile) {
        this.selectedTile = tile;
        tile.field.select();
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

    // ================================================================
    //  SWAP & MATCH PROCESSING
    // ================================================================

    swap(selectedTile, tile, reverse = false, who = 'player') {
        this.disabled = true;
        this.clearSelection();
        selectedTile.sprite.zIndex = 2;

        selectedTile.moveTo(tile.field.position, 0.2);
        tile.moveTo(selectedTile.field.position, 0.2).then(() => {
            selectedTile.sprite.zIndex = 1;
            this.board.swap(selectedTile, tile);

            if (!reverse) {
                const { dirtyRows, dirtyCols } =
                    this.combinationManager.getDirtyRegionAfterSwap(selectedTile, tile);
                const matches = this.combinationManager.getMatchesInRegion(dirtyRows, dirtyCols);

                if (matches.length) {
                    this.comboCount = 0;
                    this.lastAffectedCols = [...dirtyCols];
                    this.processMatches(matches, who);
                } else {
                    this.swap(tile, selectedTile, true, who);
                }
            } else {
                // After reverse, allow next action
                if (who === 'player') {
                    this.disabled = false;
                } else {
                    // Boss reverse — no valid move, switch turn
                    this.switchTurn();
                }
            }
        });
    }

    async processMatches(matches, who = 'player') {
        this.comboCount++;
        const attacker = who === 'player' ? this.player : this.boss;
        const defender = who === 'player' ? this.boss : this.player;

        // Calculate damage
        const { totalDamage, effects, healAmount, shieldAmount } =
            this.damageSystem.calculate(matches, attacker, defender, this.comboCount);

        // Check for poisoned tiles
        let poisonSelfDamage = 0;
        matches.forEach(match => {
            match.tiles.forEach(tile => {
                if (tile.poisoned) {
                    poisonSelfDamage += 5;
                }
            });
        });

        // Apply damage to defender
        if (totalDamage > 0) {
            this.damageSystem.applyDamage(defender, totalDamage, effects);
            this.addLog(`${who === 'player' ? '⚔️' : '💀'} ${attacker.name}: ${totalDamage} damage!`);
        }

        // Apply self effects
        if (healAmount > 0) {
            const healed = attacker.heal(healAmount);
            if (healed > 0) this.addLog(`💚 ${attacker.name} heals ${healed} HP`);
        }
        if (shieldAmount > 0) {
            attacker.addShield(shieldAmount);
            this.addLog(`🛡 ${attacker.name} gains ${shieldAmount} shield`);
        }

        // Apply poison self damage
        if (poisonSelfDamage > 0) {
            attacker.takeDamage(poisonSelfDamage);
            this.addLog(`☠️ Poison! ${attacker.name} takes ${poisonSelfDamage} self damage`);
        }

        // Apply status effects
        this.damageSystem.applyEffects(effects, attacker, defender, this.board);

        // Check adjacent stones
        const stonesToDestroy = this.combinationManager.getStonesToDestroy(matches);
        stonesToDestroy.forEach(field => {
            if (field.tile) {
                field.tile.remove();
                field.tile = null;
            }
        });

        // Combo display
        if (this.comboCount >= 2) {
            this.addLog(`🔥 COMBO x${this.comboCount}!`);
        }

        // Update UI
        this.updateUI();

        // Remove matched tiles
        this.removeMatches(matches);
        await this.delay(200);

        // Process cascade
        await this.processFallDown();
        await this.addTiles();

        // Check chain combo
        const affectedCols = new Set(this.lastAffectedCols || []);
        matches.forEach(match => {
            match.tiles.forEach(tile => {
                if (tile.field) affectedCols.add(tile.field.col);
            });
        });

        const { dirtyRows, dirtyCols } =
            this.combinationManager.getDirtyRegionAfterCascade([...affectedCols]);
        this.lastAffectedCols = dirtyCols;
        const newMatches = this.combinationManager.getMatchesInRegion(dirtyRows, dirtyCols);

        if (newMatches.length) {
            await this.processMatches(newMatches, who);
            return;
        }

        // Check game end
        if (this.checkGameEnd()) return;

        // End turn
        if (who === 'player') {
            if (this.grantExtraTurn) {
                this.grantExtraTurn = false;
                this.disabled = false;
                this.addLog('⏳ Extra turn!');
            } else {
                this.switchTurn();
            }
        } else {
            this.switchTurn();
        }
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

    // ================================================================
    //  BOSS TURN (AI)
    // ================================================================

    async executeBossTurn() {
        const swapChoice = this.bossAI.findBestSwap(
            this.board,
            this.combinationManager,
            this.levelConfig.terrain
        );

        if (!swapChoice) {
            // No valid swap — shuffle board and try again
            this.board.shuffleAll();
            this.addLog('💀 Boss shuffles the board!');
            await this.delay(500);
            const retrySwap = this.bossAI.findBestSwap(
                this.board, this.combinationManager, this.levelConfig.terrain
            );
            if (!retrySwap) {
                // Still nothing — pass turn
                this.addLog('💀 Boss passes turn.');
                this.switchTurn();
                return;
            }
            this.swap(retrySwap.tile1, retrySwap.tile2, false, 'boss');
            return;
        }

        this.swap(swapChoice.tile1, swapChoice.tile2, false, 'boss');
    }

    // ================================================================
    //  PLAYER SKILL USAGE
    // ================================================================

    /**
     * Called from UI when player clicks a skill.
     * @param {string} skillId
     * @param {object} target - { row, col } for tile/column skills
     */
    async usePlayerSkill(skillId, target = null) {
        if (this.disabled || this.currentTurn !== 'player') return;

        const result = this.skillSystem.execute(skillId, this.board, target, this.boss);
        if (!result.success) return;

        this.addLog(`✨ Used ${skillId}!`);

        if (result.result?.type === 'damage') {
            this.addLog(`💥 ${result.result.damage} damage to boss!`);
        } else if (result.result?.type === 'heal') {
            this.addLog(`💚 Healed ${result.result.amount} HP!`);
        } else if (result.result?.type === 'shield') {
            this.addLog(`🛡 Gained ${result.result.amount} shield!`);
        } else if (result.result?.type === 'extraTurn') {
            this.grantExtraTurn = true;
        }

        // Process board changes (cascade)
        await this.processFallDown();
        await this.addTiles();
        this.updateUI();

        if (this.checkGameEnd()) return;

        if (result.endsTurn) {
            this.switchTurn();
        }
    }

    // ================================================================
    //  BOARD OPERATIONS (from Game.js)
    // ================================================================

    processFallDown() {
        return new Promise(resolve => {
            let started = 0;
            let completed = 0;

            for (let row = this.board.rows - 1; row >= 0; row--) {
                for (let col = this.board.cols - 1; col >= 0; col--) {
                    const field = this.board.getField(row, col);
                    if (field.isVoid) continue;
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
            if (upperField.isVoid) continue;
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
            const emptyFields = this.board.fields.filter(f => f.tile === null && !f.isVoid);
            let total = emptyFields.length;
            let completed = 0;

            if (total === 0) { resolve(); return; }

            emptyFields.forEach(field => {
                const tile = this.board.createTile(field);
                tile.sprite.y = -Config.tileSize * 2;

                const delay = Math.random() * 0.2 + 0.3 / (field.row + 1);
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
            this.removeMatches(matches);
            const emptyFields = this.board.fields.filter(f => f.tile === null && !f.isVoid);
            emptyFields.forEach(field => this.board.createTile(field));
            matches = this.combinationManager.getMatches();
        }
    }

    // ================================================================
    //  GAME END
    // ================================================================

    checkGameEnd() {
        if (!this.boss.isAlive()) {
            this.onVictory();
            return true;
        }
        if (!this.player.isAlive()) {
            this.onDefeat();
            return true;
        }
        return false;
    }

    async onVictory() {
        this.isGameOver = true;
        this.disabled = true;

        // Unlock next level and skill
        saveManager.unlockLevel(this.levelNum + 1);
        const skillReward = this.levelConfig.skillReward;
        if (skillReward) {
            saveManager.unlockSkill(skillReward);
        }

        await this.showTurnOverlay('🎉 VICTORY!', '#ffdd57');
        this.addLog(`Boss defeated! ${skillReward ? `Unlocked: ${skillReward}` : 'Congratulations!'}`);

        // Show victory screen after delay
        await this.delay(2000);
        this.showEndScreen('victory');
    }

    async onDefeat() {
        this.isGameOver = true;
        this.disabled = true;

        await this.showTurnOverlay('💀 DEFEATED...', '#ff6b6b');
        this.addLog('You have been defeated. Try again!');

        await this.delay(2000);
        this.showEndScreen('defeat');
    }

    showEndScreen(type) {
        const screen = new Container();
        screen.zIndex = 300;
        this.container.addChild(screen);

        const overlay = new Graphics();
        overlay.rect(0, 0, Config.canvas.width, Config.canvas.height);
        overlay.fill({ color: 0x000000, alpha: 0.75 });
        screen.addChild(overlay);

        const title = new Text({
            text: type === 'victory' ? '🎉 VICTORY!' : '💀 DEFEATED',
            style: {
                fontFamily: 'Arial', fontSize: 56, fontWeight: 'bold',
                fill: type === 'victory' ? '#ffdd57' : '#ff6b6b',
                dropShadow: { color: '#000000', blur: 8, distance: 4 },
            },
        });
        title.anchor.set(0.5);
        title.x = Config.canvas.width / 2;
        title.y = Config.canvas.height / 2 - 80;
        screen.addChild(title);

        // Skill reward for victory
        if (type === 'victory' && this.levelConfig.skillReward) {
            const skillText = new Text({
                text: `✨ Skill Unlocked: ${this.levelConfig.skillReward}`,
                style: { fontFamily: 'Arial', fontSize: 24, fontWeight: 'bold', fill: '#4fc3f7' },
            });
            skillText.anchor.set(0.5);
            skillText.x = Config.canvas.width / 2;
            skillText.y = Config.canvas.height / 2 - 20;
            screen.addChild(skillText);
        }

        // Buttons
        const btnY = Config.canvas.height / 2 + 50;
        if (type === 'victory' && this.levelNum < 10) {
            this.createButton(screen, 'Next Level ▶', Config.canvas.width / 2 - 130, btnY, 0x4fc3f7, () => {
                // Switch to next level
                const { sceneManager } = require('../system/SceneManager.js');
                sceneManager.switchTo(BattleScene, { level: this.levelNum + 1 });
            });
        }

        this.createButton(screen,
            type === 'victory' ? '🏠 Menu' : '🔄 Retry',
            type === 'victory' ? Config.canvas.width / 2 + 50 : Config.canvas.width / 2 - 60,
            btnY,
            type === 'victory' ? 0x888888 : 0x81c784,
            () => {
                if (type === 'defeat') {
                    // Retry same level
                    this.restartBattle();
                } else {
                    // Go to menu (simplified — just restart)
                    this.restartBattle();
                }
            }
        );

        screen.alpha = 0;
        gsap.to(screen, { alpha: 1, duration: 0.5 });
    }

    restartBattle() {
        // Destroy and recreate
        this.container.destroy({ children: true });
        const newScene = new BattleScene({ level: this.levelNum });
        App.stage.addChild(newScene.container);
    }

    createButton(parent, label, x, y, color, onClick) {
        const btnBg = new Graphics();
        btnBg.roundRect(-80, -25, 160, 50, 12);
        btnBg.fill({ color });
        btnBg.x = x;
        btnBg.y = y;
        btnBg.eventMode = 'static';
        btnBg.cursor = 'pointer';
        parent.addChild(btnBg);

        const btnText = new Text({
            text: label,
            style: { fontFamily: 'Arial', fontSize: 18, fontWeight: 'bold', fill: '#ffffff' },
        });
        btnText.anchor.set(0.5);
        btnText.x = x;
        btnText.y = y;
        parent.addChild(btnText);

        btnBg.on('pointerdown', onClick);
    }

    // ================================================================
    //  UI HELPERS
    // ================================================================

    updateUI() {
        this.playerHPText.text = `❤️ ${this.player.currentHP}/${this.player.maxHP}`;
        this.playerShieldText.text = this.player.shield > 0 ? `🛡 Shield: ${this.player.shield}` : '';
        this.bossHPText.text = `🩸 ${this.boss.currentHP}/${this.boss.maxHP}`;
        this.turnText.text = `Turn: ${this.currentTurn === 'player' ? 'Player' : 'Boss'} #${this.turnCount}`;
    }

    addLog(message) {
        this.logText.text = message;
        console.log(`[Battle] ${message}`);
    }

    getBossInfoString() {
        const weakStr = this.boss.weakness ? `Weak:${this.boss.weakness}` : '';
        const resStr = this.boss.resistance ? `Res:${this.boss.resistance}` : '';
        return `${this.levelConfig.bossEmoji} ${weakStr} ${resStr}`.trim();
    }

    getTerrainInfoString() {
        const t = this.levelConfig.terrain;
        const buffStr = Object.entries(t.buff || {}).map(([k, v]) => `${k}+${Math.round(v * 100)}%`).join(', ');
        const debuffStr = Object.entries(t.debuff || {}).map(([k, v]) => `${k}-${Math.round(v * 100)}%`).join(', ');
        let str = `${t.emoji} ${t.name}`;
        if (buffStr) str += ` | Buff: ${buffStr}`;
        if (debuffStr) str += ` | Debuff: ${debuffStr}`;
        return str;
    }

    async showTurnOverlay(text, color) {
        this.turnOverlay.text = text;
        this.turnOverlay.style.fill = color;
        this.turnOverlay.visible = true;
        this.turnOverlay.alpha = 0;
        this.turnOverlay.scale.set(0.5);

        gsap.to(this.turnOverlay.scale, { x: 1.2, y: 1.2, duration: 0.3, ease: 'back.out(2)' });
        gsap.to(this.turnOverlay, { alpha: 1, duration: 0.3 });

        await this.delay(1200);

        gsap.to(this.turnOverlay, {
            alpha: 0,
            duration: 0.3,
            onComplete: () => { this.turnOverlay.visible = false; },
        });

        await this.delay(300);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Destroy this scene and all its resources.
     */
    destroy() {
        this.container.destroy({ children: true });
    }
}

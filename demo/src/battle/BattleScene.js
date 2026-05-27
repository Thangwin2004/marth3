/**
 * ===== src/battle/BattleScene.js =====
 * 
 * Main battle controller — turn-based PvP on shared Match-3 board.
 * Integrates BattleHUD, CoinFlip, TurnIndicator, Projectile for full UI.
 * 
 * Flow:
 * 1. Init: create board, player, boss, HUD
 * 2. Coin flip animation → decide first turn
 * 3. Turn loop: Player ↔ Boss alternate
 * 4. Player: swap tiles OR use skill → animate → damage boss
 * 5. Boss: AI skill + AI swap → animate → damage player
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
import { Projectile } from './Projectile.js';
import { App } from '../system/App.js';
import { Config } from '../config.js';
import { LEVELS } from '../data/LevelData.js';
import { saveManager } from '../system/SaveManager.js';
import { sceneManager } from '../system/SceneManager.js';
import { BattleHUD } from '../ui/BattleHUD.js';
import { CoinFlip } from '../ui/CoinFlip.js';
import { TurnIndicator } from '../ui/TurnIndicator.js';
import { DamagePopup } from '../ui/DamagePopup.js';
import { MatchSummaryPanel } from '../ui/MatchSummaryPanel.js';
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
        this.initEntities();
        this.initBoard();
        this.initSystems();
        this.initHUD();
        this.removeStartMatches();

        // Bind events
        this.board.container.on('tile-touch-start', this.onTileClick.bind(this));

        // Start battle with coin flip (delayed)
        this.disabled = true;
        setTimeout(() => this.startBattle(), 600);
    }

    // ================================================================
    //  INITIALIZATION
    // ================================================================

    initBackground() {
        const bgColor = this.levelConfig.terrain.background;
        App.setBackgroundColor(bgColor);

        // Board background panel (drawn after board is created)
        this.boardBg = new Graphics();
        this.container.addChild(this.boardBg);
    }

    initEntities() {
        const savedSkills = saveManager.getUnlockedSkills();
        // Scale player Max HP: 100 base + 30 HP per level above Level 1 (makes higher levels balanced!)
        const playerMaxHP = 100 + (this.levelNum - 1) * 30;
        this.player = new Player(savedSkills, playerMaxHP);
        this.boss = new Boss(this.levelConfig);
    }

    initBoard() {
        this.board = new Board(this.levelConfig);
        this.container.addChild(this.board.container);

        // Draw board background panel
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

    initSystems() {
        this.combinationManager = new CombinationManager(this.board);
        this.damageSystem = new DamageSystem(this.levelConfig.terrain, this.levelNum);
        this.bossAI = new BossAI(this.boss.aiOptimalChance);
        this.bossSkillSystem = new BossSkillSystem(this.boss, this.board);
        this.skillSystem = new SkillSystem(this.player);
        this.environmentSystem = new EnvironmentSystem(this.levelConfig.terrain, this.board);
    }

    initHUD() {
        // BattleHUD — full UI with characters, HP bars, skills, etc.
        this.hud = new BattleHUD({
            player: this.player,
            boss: this.boss,
            levelConfig: this.levelConfig,
            onSkillSelect: (skillId) => this.onSkillButtonClick(skillId),
        });
        this.container.addChild(this.hud.container);

        // TurnIndicator — big overlay text
        this.turnIndicator = new TurnIndicator();
        this.container.addChild(this.turnIndicator.container);
    }

    // ================================================================
    //  BATTLE START (COIN FLIP)
    // ================================================================

    async startBattle() {
        // Animated coin flip
        const result = await CoinFlip.play(this.container);
        this.currentTurn = result;
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
            this.hud.setLog(`${entity.name} takes ${dotResult.totalDotDamage} DoT damage!`);
            // Animate hurt for DoT
            this.hud.showDamage(who, dotResult.totalDotDamage, 'poison');
            await this.hud.playHurt(who);
            this.updateUI();
            if (this.checkGameEnd()) return;
        }

        // Check if stunned
        if (dotResult.wasStunned) {
            this.hud.setLog(`${entity.name} is stunned! Turn skipped.`);
            await this.turnIndicator.show(
                `${who === 'player' ? '😵' : '💫'} STUNNED!`, '#ffaa00'
            );
            entity.stunned = false;
            await this.delay(500);
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
                this.hud.setLog(`⚠️ ${envResult.warning}`);
            }
            if (envResult.triggered) {
                this.hud.setLog(`🌍 ${envResult.result.description}`);
                if (envResult.result.damage && envResult.result.damageTarget === 'both') {
                    this.player.takeDamage(envResult.result.damage);
                    this.boss.takeDamage(envResult.result.damage);
                    this.hud.showDamage('player', envResult.result.damage, 'damage');
                    this.hud.showDamage('boss', envResult.result.damage, 'damage');
                }
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
            await this.turnIndicator.show('💀 BOSS TURN', '#ff6b6b');

            // Boss skill (every N turns)
            this.boss.incrementTurn();
            if (this.bossSkillSystem.shouldUseSkill()) {
                await this.hud.playSkillCast('boss');
                const skillResult = this.bossSkillSystem.executeSkill();
                if (skillResult) {
                    this.hud.setLog(`🔮 Boss uses ${skillResult.skillId}: ${skillResult.description}`);
                    await this.delay(600);
                    await this.processFallDown();
                    await this.addTiles();
                    this.updateUI();
                    if (this.checkGameEnd()) return;
                }
            }

            // Boss AI swap
            await this.delay(400);
            await this.executeBossTurn();
            return;
        }

        // Player turn
        this.disabled = false;
        this.board.setInputEnabled(true);
        await this.turnIndicator.show('⚔️ YOUR TURN', '#ffdd57');
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

        // Handle skill targeting first if active
        if (this.skillTargeting) {
            this.handleSkillTarget(tile);
            return;
        }

        if (tile.frozen || tile.isStone) return;

        if (this.selectedTile) {
            if (this.selectedTile === tile) {
                this.clearSelection();
            } else if (!this.isNeighbour(this.selectedTile, tile)) {
                this.clearSelection();
                this.selectTile(tile);
            } else {
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
    //  SKILL BUTTON CLICK
    // ================================================================

    onSkillButtonClick(skillId) {
        if (this.disabled || this.currentTurn !== 'player') return;
        // For skills that need tile targeting, we'd enter a targeting mode
        // For now, self/board skills execute immediately
        const skill = this.skillSystem.getSkill(skillId);
        if (!skill) return;

        if (skill.targetType === 'tile' || skill.targetType === 'column') {
            // Enter targeting mode — next tile click = target
            this.hud.setLog(`🎯 Select a target for ${skill.name}...`);
            this.skillTargeting = skillId;
            return;
        }

        // Execute immediately for self/board skills
        this.usePlayerSkill(skillId);
    }

    // Override onTileClick to handle skill targeting
    handleSkillTarget(tile) {
        if (!this.skillTargeting) return false;

        const target = {
            row: tile.field.row,
            col: tile.field.col,
        };

        this.usePlayerSkill(this.skillTargeting, target);
        this.skillTargeting = null;
        return true;
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
                if (who === 'player') {
                    this.disabled = false;
                } else {
                    this.switchTurn();
                }
            }
        });
    }

    async processMatches(matches, who = 'player') {
        const attacker = who === 'player' ? this.player : this.boss;
        const defender = who === 'player' ? this.boss : this.player;
        const defenderSide = who === 'player' ? 'boss' : 'player';

        // 1. SETTLING PHASE (Cascade Loop until board settles)
        const allMatchesThisTurn = [];
        let currentMatches = matches;
        this.comboCount = 0;

        while (currentMatches.length > 0) {
            this.comboCount++;
            
            // Add to matches list for damage/effects calculation at the end
            currentMatches.forEach(m => allMatchesThisTurn.push(m));

            // Check adjacent stones to destroy
            const stonesToDestroy = this.combinationManager.getStonesToDestroy(currentMatches);
            stonesToDestroy.forEach(field => {
                if (field.tile) {
                    field.tile.remove();
                    field.tile = null;
                }
            });

            // Remove matched tiles visually (starts GSAP fade-out)
            this.removeMatches(currentMatches);
            
            // Combo display popups on the board during settling
            if (this.comboCount >= 2) {
                DamagePopup.show(
                    this.container,
                    this.board.container.x + (this.board.cols * Config.tileSize) / 2,
                    this.board.container.y - 20,
                    this.comboCount,
                    'combo'
                );
                this.hud.setLog(`🔥 COMBO x${this.comboCount}!`);
            }

            await this.delay(250); // wait slightly for destruction animation

            // Process cascade and refill board
            await this.processFallDown();
            await this.addTiles();
            this.updateUI();

            // Find new cascade matches
            const affectedCols = new Set(this.lastAffectedCols || []);
            currentMatches.forEach(match => {
                match.tiles.forEach(tile => {
                    if (tile.field) affectedCols.add(tile.field.col);
                });
            });

            const { dirtyRows, dirtyCols } =
                this.combinationManager.getDirtyRegionAfterCascade([...affectedCols]);
            this.lastAffectedCols = dirtyCols;
            currentMatches = this.combinationManager.getMatchesInRegion(dirtyRows, dirtyCols);

            if (currentMatches.length > 0) {
                await this.delay(200); // pause briefly before next cascade matches are popped
            }
        }

        // 2. ATTACK / ACTION PHASE (Board has fully settled!)
        if (allMatchesThisTurn.length > 0) {
            // Calculate total damage/effects for all accumulated matches
            const { totalDamage, effects, healAmount, shieldAmount } =
                this.damageSystem.calculate(allMatchesThisTurn, attacker, defender, this.comboCount);

            // Check for poisoned tiles in all matches
            let poisonSelfDamage = 0;
            allMatchesThisTurn.forEach(match => {
                match.tiles.forEach(tile => {
                    if (tile.poisoned) {
                        poisonSelfDamage += 5;
                    }
                });
            });

            // Summarize all matches in the battle log
            const colorCounts = {};
            allMatchesThisTurn.forEach(match => {
                match.tiles.forEach(tile => {
                    const color = tile.color;
                    colorCounts[color] = (colorCounts[color] || 0) + 1;
                });
            });

            const emojiMap = {
                fire: '🔥', water: '💧', nature: '🌿', ice: '❄️', lightning: '⚡',
                earth: '⛰️', 'wind-air': '💨', 'psychic-eye': '👁️', sun: '☀️', 'poison-death': '☠️'
            };
            const summaryParts = Object.entries(colorCounts).map(([color, count]) => {
                const emoji = emojiMap[color] || '';
                return `${count}x ${color.charAt(0).toUpperCase() + color.slice(1)} ${emoji}`;
            });
            const summaryString = summaryParts.join(', ');
            this.hud.setLog(`${who === 'player' ? '⚔️' : '💀'} ${attacker.name} matched: ${summaryString} | Combo x${this.comboCount}!`);

            // Show visual match summary panel to display matched tile graphics & combo count
            await MatchSummaryPanel.show(this.container, colorCounts, this.comboCount);

            // ====== ANIMATIONS & EFFECTS ======
            // Attacker casts/attacks
            await this.hud.playAttack(who);

            // Projectile elemental attacks
            if (totalDamage > 0) {
                const boardCenter = {
                    x: this.board.container.x + (this.board.cols * Config.tileSize) / 2,
                    y: this.board.container.y + (this.board.rows * Config.tileSize) / 2,
                };
                const defenderPos = this.hud.getSpritePosition(defenderSide);

                // We can fire multiple projectiles, one for each distinct elemental match!
                const matchedColors = [...new Set(allMatchesThisTurn.map(m => m.tiles[0]?.color).filter(Boolean))];
                
                const colorMap = {
                    fire: 0xff6240, water: 0x42a5f5, nature: 0x66bb6a,
                    ice: 0x80d8ff, lightning: 0xfff176, earth: 0x8d6e63,
                    'wind-air': 0x90caf9, 'psychic-eye': 0xce93d8,
                    sun: 0xffd54f, 'poison-death': 0xb388ff,
                };

                // Fire projectiles in sequence for each matched element!
                for (const color of matchedColors) {
                    const projColor = colorMap[color] || 0xff6240;
                    await Projectile.fire(this.container, boardCenter, defenderPos, projColor);
                }

                // Play defender hurt animation
                await this.hud.playHurt(defenderSide);

                // Apply defender damage
                this.damageSystem.applyDamage(defender, totalDamage, effects);
                this.hud.showDamage(defenderSide, totalDamage, 'damage');
            }

            // Apply self heals
            if (healAmount > 0) {
                const healed = attacker.heal(healAmount);
                if (healed > 0) {
                    const attackerPos = this.hud.getSpritePosition(who);
                    await Projectile.heal(this.container, attackerPos.x, attackerPos.y);
                    await this.hud.playHeal(who);
                    this.hud.showDamage(who, healed, 'heal');
                }
            }

            // Apply self shields
            if (shieldAmount > 0) {
                attacker.addShield(shieldAmount);
                const attackerPos = this.hud.getSpritePosition(who);
                await Projectile.shield(this.container, attackerPos.x, attackerPos.y);
                await this.hud.playShield(who);
                this.hud.showDamage(who, shieldAmount, 'shield');
            }

            // Apply poison self damage
            if (poisonSelfDamage > 0) {
                attacker.takeDamage(poisonSelfDamage);
                this.hud.showDamage(who, poisonSelfDamage, 'poison');
            }

            // Apply status effects
            this.damageSystem.applyEffects(effects, attacker, defender, this.board);

            // Update UI
            this.updateUI();
        }

        // 3. END TURN CHECK
        if (this.checkGameEnd()) return;

        if (who === 'player') {
            if (this.grantExtraTurn) {
                this.grantExtraTurn = false;
                this.disabled = false;
                this.hud.setLog('⏳ Extra turn!');
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

    /** Get a projectile color based on the dominant tile type in matches */
    getTileProjectileColor(matches) {
        const colorMap = {
            fire: 0xff6240, water: 0x42a5f5, nature: 0x66bb6a,
            ice: 0x80d8ff, lightning: 0xfff176, earth: 0x8d6e63,
            'wind-air': 0x90caf9, 'psychic-eye': 0xce93d8,
            sun: 0xffd54f, 'poison-death': 0xb388ff,
        };
        // Use first match tile color
        if (matches.length > 0 && matches[0].tiles.length > 0) {
            const tileColor = matches[0].tiles[0].color;
            return colorMap[tileColor] || 0xff6240;
        }
        return 0xff6240;
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
            this.board.shuffleAll();
            this.hud.setLog('💀 Boss shuffles the board!');
            await this.delay(500);
            const retrySwap = this.bossAI.findBestSwap(
                this.board, this.combinationManager, this.levelConfig.terrain
            );
            if (!retrySwap) {
                this.hud.setLog('💀 Boss passes turn.');
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
     * Called from skill bar or targeting mode.
     * @param {string} skillId
     * @param {object} target - { row, col } for tile/column skills
     */
    async usePlayerSkill(skillId, target = null) {
        if (this.disabled || this.currentTurn !== 'player') return;

        const result = this.skillSystem.execute(skillId, this.board, target, this.boss);
        if (!result.success) return;

        // Play skill cast animation
        await this.hud.playSkillCast('player');

        this.hud.setLog(`✨ Used ${skillId}!`);

        if (result.result?.type === 'damage') {
            const defenderPos = this.hud.getSpritePosition('boss');
            const playerPos = this.hud.getSpritePosition('player');
            await Projectile.fire(this.container, playerPos, defenderPos, 0xff6240);
            await this.hud.playHurt('boss');
            this.hud.showDamage('boss', result.result.damage, 'damage');
            this.hud.setLog(`💥 ${result.result.damage} damage to boss!`);
        } else if (result.result?.type === 'heal') {
            const playerPos = this.hud.getSpritePosition('player');
            await Projectile.heal(this.container, playerPos.x, playerPos.y);
            await this.hud.playHeal('player');
            this.hud.showDamage('player', result.result.amount, 'heal');
            this.hud.setLog(`💚 Healed ${result.result.amount} HP!`);
        } else if (result.result?.type === 'shield') {
            const playerPos = this.hud.getSpritePosition('player');
            await Projectile.shield(this.container, playerPos.x, playerPos.y);
            await this.hud.playShield('player');
            this.hud.showDamage('player', result.result.amount, 'shield');
            this.hud.setLog(`🛡 Gained ${result.result.amount} shield!`);
        } else if (result.result?.type === 'extraTurn') {
            this.grantExtraTurn = true;
            this.hud.setLog('⏳ Extra turn granted!');
        }

        // Process board changes (cascade from tile destruction)
        await this.processFallDown();
        await this.addTiles();
        this.updateUI();

        if (this.checkGameEnd()) return;

        if (result.endsTurn) {
            this.switchTurn();
        } else {
            this.disabled = false;
        }
    }

    // ================================================================
    //  BOARD OPERATIONS
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
        let safety = 0;
        while (matches.length && safety < 100) {
            this.removeMatches(matches);
            const emptyFields = this.board.fields.filter(f => f.tile === null && !f.isVoid);
            emptyFields.forEach(field => this.board.createTile(field));
            matches = this.combinationManager.getMatches();
            safety++;
        }
        if (safety >= 100) {
            console.warn('[BattleScene] removeStartMatches reached safety limit of 100 iterations. Board might have forced patterns.');
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

        // Play defeated animation on boss
        await this.hud.playDefeated('boss');

        // Unlock next level and skill
        saveManager.unlockLevel(this.levelNum + 1);
        const skillReward = this.levelConfig.skillReward;
        if (skillReward) {
            saveManager.unlockSkill(skillReward);
        }

        await this.turnIndicator.show('🎉 VICTORY!', '#ffdd57');
        this.hud.setLog(`Boss defeated! ${skillReward ? `Unlocked: ${skillReward}` : 'Congratulations!'}`);

        await this.delay(1500);
        this.showEndScreen('victory');
    }

    async onDefeat() {
        this.isGameOver = true;
        this.disabled = true;

        // Play defeated animation on player
        await this.hud.playDefeated('player');

        await this.turnIndicator.show('💀 DEFEATED...', '#ff6b6b');
        this.hud.setLog('You have been defeated. Try again!');

        await this.delay(1500);
        this.showEndScreen('defeat');
    }

    showEndScreen(type) {
        const screen = new Container();
        screen.zIndex = 300;
        this.container.addChild(screen);

        // Dark overlay
        const overlay = new Graphics();
        overlay.rect(0, 0, Config.canvas.width, Config.canvas.height);
        overlay.fill({ color: 0x000000, alpha: 0.8 });
        screen.addChild(overlay);

        // Title
        const title = new Text({
            text: type === 'victory' ? '🎉 VICTORY!' : '💀 DEFEATED',
            style: {
                fontFamily: 'Arial', fontSize: 52, fontWeight: 'bold',
                fill: type === 'victory' ? '#ffd54f' : '#ff5252',
                dropShadow: { color: '#000000', blur: 8, distance: 4 },
            },
        });
        title.anchor.set(0.5);
        title.x = Config.canvas.width / 2;
        title.y = Config.canvas.height / 2 - 90;
        screen.addChild(title);

        // Battle stats
        const statsText = new Text({
            text: `Turns: ${this.turnCount} | Level: ${this.levelNum}`,
            style: { fontFamily: 'Arial', fontSize: 18, fill: '#aaaaaa' },
        });
        statsText.anchor.set(0.5);
        statsText.x = Config.canvas.width / 2;
        statsText.y = Config.canvas.height / 2 - 35;
        screen.addChild(statsText);

        // Skill reward for victory
        if (type === 'victory' && this.levelConfig.skillReward) {
            const skillText = new Text({
                text: `✨ Skill Unlocked: ${this.levelConfig.skillReward}`,
                style: { fontFamily: 'Arial', fontSize: 22, fontWeight: 'bold', fill: '#4fc3f7' },
            });
            skillText.anchor.set(0.5);
            skillText.x = Config.canvas.width / 2;
            skillText.y = Config.canvas.height / 2 - 5;
            screen.addChild(skillText);

            // Pulsing glow
            gsap.to(skillText, { alpha: 0.5, duration: 0.6, yoyo: true, repeat: -1 });
        }

        // Buttons
        const btnY = Config.canvas.height / 2 + 55;

        if (type === 'victory' && this.levelNum < 10) {
            this.createButton(screen, 'Next Level ▶', Config.canvas.width / 2 - 110, btnY, 0x4fc3f7, () => {
                this.navigateTo('battle', this.levelNum + 1);
            });
            this.createButton(screen, '🗺️ Levels', Config.canvas.width / 2 + 110, btnY, 0x666666, () => {
                this.navigateTo('levelSelect');
            });
        } else if (type === 'victory') {
            // Level 10 cleared — show congrats
            const congratsText = new Text({
                text: '👑 YOU CONQUERED ALL 10 LEVELS! 👑',
                style: { fontFamily: 'Arial', fontSize: 20, fontWeight: 'bold', fill: '#ffd54f' },
            });
            congratsText.anchor.set(0.5);
            congratsText.x = Config.canvas.width / 2;
            congratsText.y = Config.canvas.height / 2 + 30;
            screen.addChild(congratsText);

            this.createButton(screen, '👑 Level Select', Config.canvas.width / 2, btnY + 30, 0x81c784, () => {
                this.navigateTo('levelSelect');
            });
        } else {
            this.createButton(screen, '🔄 Retry', Config.canvas.width / 2 - 90, btnY, 0x81c784, () => {
                this.navigateTo('battle', this.levelNum);
            });
            this.createButton(screen, '🗺️ Levels', Config.canvas.width / 2 + 90, btnY, 0x666666, () => {
                this.navigateTo('levelSelect');
            });
        }

        // Fade in
        screen.alpha = 0;
        gsap.to(screen, { alpha: 1, duration: 0.5 });
    }

    async navigateTo(target, level) {
        if (target === 'battle') {
            await sceneManager.switchTo(BattleScene, { level });
        } else if (target === 'levelSelect') {
            const { LevelSelectScene } = await import('../scenes/LevelSelectScene.js');
            await sceneManager.switchTo(LevelSelectScene);
        } else {
            const { MainMenuScene } = await import('../scenes/MainMenuScene.js');
            await sceneManager.switchTo(MainMenuScene);
        }
    }

    createButton(parent, label, x, y, color, onClick) {
        const btnContainer = new Container();
        btnContainer.x = x;
        btnContainer.y = y;
        parent.addChild(btnContainer);

        const bg = new Graphics();
        bg.roundRect(-85, -22, 170, 44, 10);
        bg.fill({ color });
        bg.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
        bg.eventMode = 'static';
        bg.cursor = 'pointer';
        btnContainer.addChild(bg);

        const text = new Text({
            text: label,
            style: { fontFamily: 'Arial', fontSize: 16, fontWeight: 'bold', fill: '#ffffff' },
        });
        text.anchor.set(0.5);
        btnContainer.addChild(text);

        // Hover effect
        bg.on('pointerover', () => gsap.to(btnContainer.scale, { x: 1.05, y: 1.05, duration: 0.15 }));
        bg.on('pointerout', () => gsap.to(btnContainer.scale, { x: 1, y: 1, duration: 0.15 }));
        bg.on('pointerdown', onClick);
    }

    // ================================================================
    //  UI UPDATE
    // ================================================================

    updateUI() {
        const bossSkillIn = this.boss.skills.length > 0
            ? this.boss.skillInterval - (this.boss.turnCounter % this.boss.skillInterval)
            : undefined;

        this.hud.update({
            currentTurn: this.currentTurn,
            turnCount: this.turnCount,
            bossSkillIn,
        });
    }

    // ================================================================
    //  UTILITIES
    // ================================================================

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    destroy() {
        const killTweensRecursive = (obj) => {
            gsap.killTweensOf(obj);
            if (obj.scale) gsap.killTweensOf(obj.scale);
            if (obj.children) {
                obj.children.forEach(killTweensRecursive);
            }
        };
        killTweensRecursive(this.container);

        this.hud.destroy();
        this.turnIndicator.destroy();
        this.container.destroy({ children: true });
    }
}

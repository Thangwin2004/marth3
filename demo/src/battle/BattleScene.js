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
import { ElementGuidePanel } from '../ui/ElementGuidePanel.js';
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
        this.elementGuideActive = false;
        this.bossMissCount = 0;
        this.bossMercyMiss = false;
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
        const saveData = saveManager.load();
        // Scale player Max HP: 100 base + 15 HP per level above Level 1 (RPG progression!)
        let playerMaxHP = 100 + ((saveData.heroLevel || 1) - 1) * 15;

        // Apply Stone Plate Armor HP Buff (+50 HP)
        const equipped = saveData.equippedItems || {};
        if (equipped.armor === 'stone_plate') {
            playerMaxHP += 50;
        }

        this.player = new Player(savedSkills, playerMaxHP);

        // Apply Stone Plate Armor Shield Buff (+20 starting Shield)
        if (equipped.armor === 'stone_plate') {
            this.player.addShield(20);
        }

        this.boss = new Boss(this.levelConfig);

        // Apply Chaos Eye Relic boss element manipulation
        if (equipped.relic === 'chaos_eye') {
            // Find player's strongest mastery element, defaulting to fire if none upgraded
            let bestElement = 'fire';
            let maxM = -1;
            const masteryLevels = saveData.masteryLevels || {};
            for (const [el, lvl] of Object.entries(masteryLevels)) {
                if (lvl > maxM) {
                    maxM = lvl;
                    bestElement = el;
                }
            }

            const ELEMENT_CHART = {
                fire: { weak: ['nature', 'ice'] },
                water: { weak: ['fire', 'earth'] },
                nature: { weak: ['water', 'earth', 'poison-death'] },
                ice: { weak: ['nature', 'wind-air'] },
                lightning: { weak: ['water', 'wind-air'] },
                earth: { weak: ['fire', 'lightning', 'poison-death'] },
                'wind-air': { weak: ['nature', 'lightning'] },
                'psychic-eye': { weak: ['poison-death', 'sun'] },
                sun: { weak: ['poison-death', 'ice'] },
                'poison-death': { weak: ['psychic-eye', 'sun'] }
            };

            const weakTypes = ELEMENT_CHART[bestElement]?.weak || ['nature'];
            const targetBossType = weakTypes[0];

            this.boss.bossType = targetBossType;
            this.chaosEyeTriggered = true;
            this.chaosEyeTargetType = targetBossType;
            this.chaosEyeBestElement = bestElement;
        }
    }

    initBoard() {
        // Set dynamic tileSize based on board dimensions in levelConfig
        const boardRows = this.levelConfig.board?.rows || Config.board.rows;
        const boardCols = this.levelConfig.board?.cols || Config.board.cols;

        let targetTileSize = 65; // default for 8x8 or smaller
        if (Math.max(boardRows, boardCols) >= 12) {
            targetTileSize = 46;
        } else if (Math.max(boardRows, boardCols) >= 10) {
            targetTileSize = 54;
        }

        // Update both Config and App.config to ensure consistent scaling everywhere
        Config.tileSize = targetTileSize;
        if (App.config) {
            App.config.tileSize = targetTileSize;
        }

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

        // Make the boss sprite container interactive and clickable for 'boss' targetType skills
        this.hud.bossSprite.container.eventMode = 'static';
        this.hud.bossSprite.container.cursor = 'pointer';
        this.hud.bossSprite.container.on('pointerdown', () => this.onBossClick());

        // Add "📖 Element Guide" button in top bar empty space
        const guideBtnContainer = new Container();
        guideBtnContainer.x = Config.canvas.width / 2 + 180;
        guideBtnContainer.y = 38; // beautifully aligned vertically with HP bars
        this.container.addChild(guideBtnContainer);

        const btnW = 120;
        const btnH = 28;

        const btnBg = new Graphics();
        // Glassmorphic look: semi-transparent dark base with a neon cyan stroke
        btnBg.roundRect(-btnW / 2, -btnH / 2, btnW, btnH, 6);
        btnBg.fill({ color: 0x070d1a, alpha: 0.85 });
        btnBg.stroke({ color: 0x00d2ff, width: 1.5, alpha: 0.8 });
        btnBg.eventMode = 'static';
        btnBg.cursor = 'pointer';
        guideBtnContainer.addChild(btnBg);

        const btnText = new Text({
            text: '📖 Element Guide',
            style: { 
                fontFamily: 'Arial, sans-serif', 
                fontSize: 10, 
                fontWeight: 'bold', 
                fill: '#00d2ff',
                dropShadow: { color: '#000000', blur: 2, distance: 1 }
            },
        });
        btnText.anchor.set(0.5);
        guideBtnContainer.addChild(btnText);

        // Hover animations using gsap
        btnBg.on('pointerover', () => {
            gsap.to(guideBtnContainer.scale, { x: 1.05, y: 1.05, duration: 0.15 });
            gsap.to(btnBg, { alpha: 1, duration: 0.15 });
        });
        btnBg.on('pointerout', () => {
            gsap.to(guideBtnContainer.scale, { x: 1, y: 1, duration: 0.15 });
            gsap.to(btnBg, { alpha: 0.85, duration: 0.15 });
        });
        btnBg.on('pointerdown', () => this.showElementGuide());

        // TurnIndicator — big overlay text
        this.turnIndicator = new TurnIndicator();
        this.container.addChild(this.turnIndicator.container);
    }

    // ================================================================
    //  BATTLE START (COIN FLIP)
    // ================================================================

    async startBattle() {
        // Chaos Eye log at battle start
        if (this.chaosEyeTriggered) {
            const emojiMap = {
                fire: '🔥', water: '💧', nature: '🌿', ice: '❄️', lightning: '⚡',
                earth: '⛰️', 'wind-air': '💨', 'psychic-eye': '👁️', sun: '☀️', 'poison-death': '☠️'
            };
            const bossEmoji = emojiMap[this.chaosEyeTargetType] || '';
            const playerEmoji = emojiMap[this.chaosEyeBestElement] || '';
            this.hud.setLog(`👁️🌪️ [Mắt Bão Hỗn Loạn] đã ép hệ của Boss chuyển sang hệ ${this.chaosEyeTargetType.toUpperCase()} ${bossEmoji}! Hệ này cực kỳ sợ hệ ${this.chaosEyeBestElement.toUpperCase()} ${playerEmoji} của bạn! (Gây x2.0 Sát thương!)`);
            this.chaosEyeTriggered = false;
        }

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

        if (who === 'player') {
            this.playerTurnsCount = (this.playerTurnsCount || 0) + 1;

            // Decrement Quartz Fortress immunity turns
            if (this.player.quartzImmunityTurns > 0) {
                this.player.quartzImmunityTurns--;
                if (this.player.quartzImmunityTurns === 0) {
                    this.hud.setLog('💎 [Pháo Đài Thạch Anh] Hiệu ứng miễn nhiễm Choáng đã kết thúc.');
                }
            }

            // Check Time Hourglass Relic (Cleanse every 5 player turns)
            const saveData = saveManager.load();
            const equipped = saveData.equippedItems || {};
            if (equipped.relic === 'time_hourglass' && this.playerTurnsCount % 5 === 0) {
                statusEffectManager.cleanse(this.player);
                this.hud.setLog(`⏳✨ [Đồng Hồ Cát] kích hoạt! Tự động thanh tẩy toàn bộ hiệu ứng bất lợi!`);
                const playerPos = this.hud.getSpritePosition('player');
                DamagePopup.show(this.container, playerPos.x, playerPos.y - 50, '✨ Cleanse!', 'heal');
                this.updateUI();
            }

            // Check Natural Regrowth Passive (Heal 5% of Max HP)
            const equippedSkills = saveData.equippedSkills || {};
            const passives = equippedSkills.passives || [];
            if (passives.includes('nat_regrow')) {
                const healAmt = Math.floor(this.player.maxHP * 0.05);
                if (healAmt > 0) {
                    const healed = this.player.heal(healAmt);
                    if (healed > 0) {
                        this.hud.setLog(`🌿💚 [Hồi Phục Tự Nhiên] tự động hồi +${healed} HP!`);
                        const playerPos = this.hud.getSpritePosition('player');
                        DamagePopup.show(this.container, playerPos.x, playerPos.y - 50, `+${healed}`, 'heal');
                        this.updateUI();
                    }
                }
            }
        }

        const currentRound = Math.floor((this.turnCount - 1) / 2) + 1;

        // Check if Boss should enter Enraged (Cuồng Nộ) state
        if (currentRound > 18 && this.hud && this.hud.bossSprite && !this.hud.bossSprite.isEnraged) {
            this.hud.bossSprite.setEnraged(true);
            this.hud.setLog('🔥 WARNING: The Boss has entered ENRAGED state! Sát thương Boss tăng thêm!');
            await this.turnIndicator.show('💀 BOSS ENRAGED! 💀', '#ff1744');
            // Play a scary screen shake / roar animation (boss hurts)
            await this.hud.playHurt('boss');
        }


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
                    const skillNameMap = {
                        freezeTiles: 'BĂNG PHONG TẬP KÍCH ❄️',
                        destroyRow: 'HỦY DIỆT HÀNG NGANG 🔥',
                        destroyCol: 'SẤM SÉT HỦY DIỆT CỘT ⚡',
                        corruptTiles: 'MA HÓA Ô NGỌC ☠️',
                        stoneBlock: 'THẠCH BẢN PHONG TỎA ⛰️',
                        shuffleBoard: 'HỖN LOẠN DỊCH CHUYỂN 🌪️',
                        poisonTiles: 'KỊ ĐỘC PHỦ LÊN 🤢',
                        cloneTiles: 'PHÂN THÂN ĐỒNG HÓA 🔮',
                        voidTiles: 'HƯ VÔ KHÔNG GIAN 👁️'
                    };
                    const skillName = skillNameMap[skillResult.skillId] || skillResult.skillId.toUpperCase();
                    this.hud.setLog(`🔮 Boss uses ${skillResult.skillId}: ${skillResult.description}`);
                    
                    // Show a gorgeous full screen text banner for Boss Skill casting
                    await this.turnIndicator.show(`🔮 BOSS SKILL: ${skillName}`, '#ff5252');

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
        // For skills that need tile/boss targeting, we'd enter a targeting mode
        // For now, self/board skills execute immediately
        const skill = this.skillSystem.getSkill(skillId);
        if (!skill) return;

        if (skill.targetType === 'tile' || skill.targetType === 'column' || skill.targetType === 'boss') {
            // Enter targeting mode
            if (skill.targetType === 'boss') {
                this.hud.setLog(`🎯 Select a target for ${skill.name}... (Click the Boss to attack!)`);
            } else {
                this.hud.setLog(`🎯 Select a target for ${skill.name}...`);
            }
            this.skillTargeting = skillId;
            return;
        }

        // Execute immediately for self/board skills
        this.usePlayerSkill(skillId);
    }

    onBossClick() {
        if (this.disabled || this.isGameOver || this.currentTurn !== 'player') return;

        // If a skill targeting the boss is active, execute it directly on the boss!
        if (this.skillTargeting) {
            const skill = this.skillSystem.getSkill(this.skillTargeting);
            if (skill && skill.targetType === 'boss') {
                this.usePlayerSkill(this.skillTargeting, { boss: true });
                this.skillTargeting = null;
            }
        }
    }

    async showElementGuide() {
        if (this.elementGuideActive) return;
        this.elementGuideActive = true;

        await ElementGuidePanel.show(this.container);

        this.elementGuideActive = false;
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

        // Save swapped tiles to identify where to morph special tiles
        if (!reverse) {
            this.lastSwappedTiles = [selectedTile, tile];
        }

        selectedTile.moveTo(tile.field.position, 0.2);
        tile.moveTo(selectedTile.field.position, 0.2).then(() => {
            selectedTile.sprite.zIndex = 1;
            this.board.swap(selectedTile, tile);

            if (!reverse) {
                // Check for Rainbow Gem swap activation
                let isRainbowSwap = false;
                let rainbowTile = null;
                let targetTile = null;

                if (selectedTile.isRainbow) {
                    rainbowTile = selectedTile;
                    targetTile = tile;
                    isRainbowSwap = true;
                } else if (tile.isRainbow) {
                    rainbowTile = tile;
                    targetTile = selectedTile;
                    isRainbowSwap = true;
                }

                if (isRainbowSwap && targetTile) {
                    const targetColor = targetTile.color;
                    this.hud.setLog(`🌈 Rainbow Gem activated! Hút sạch toàn bộ ngọc màu ${targetColor}!`);
                    
                    // Show giant floating text
                    DamagePopup.show(
                        this.container,
                        rainbowTile.sprite.x,
                        rainbowTile.sprite.y - 20,
                        'RAINBOW!',
                        'combo'
                    );

                    // Destroy the Rainbow Gem itself
                    rainbowTile.remove();

                    // Destroy all tiles of targetColor
                    const clearedTiles = this.board.destroyAllOfColor(targetColor);
                    
                    // Trigger match processing
                    if (clearedTiles.length > 0) {
                        this.comboCount = 0;
                        this.lastAffectedCols = [];
                        // Package as a match
                        const rainbowMatch = { tiles: clearedTiles, length: clearedTiles.length };
                        this.processMatches([rainbowMatch], who);
                    } else {
                        this.switchTurn();
                    }
                    return;
                }

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
                    this.hud.setLog('❌ Swap missed! You lost your turn!');
                    this.switchTurn();
                } else {
                    if (this.bossMercyMiss) {
                        this.hud.setLog('💤 Boss ngủ gật trượt lượt! Cơ hội lật kèo của bạn! 💤');
                        this.bossMercyMiss = false; // Reset flag
                    } else {
                        this.hud.setLog('💀 Boss missed the swap! Turn passes to you!');
                    }
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
        const morphedTiles = new Set(); // Track morphed tiles to avoid destroying them

        while (currentMatches.length > 0) {
            this.comboCount++;
            
            // Tracks all columns that are affected by any tile destruction/removal in this iteration
            const affectedCols = new Set();

            // Add to matches list for damage/effects calculation at the end
            currentMatches.forEach(m => {
                allMatchesThisTurn.push(m);
                m.tiles.forEach(tile => {
                    if (tile.field) affectedCols.add(tile.field.col);
                });
            });

            // 1. Group matched tiles by color to check for L/T-shape matches
            const colorGroups = {};
            currentMatches.forEach(match => {
                const firstTile = match.tiles[0];
                if (!firstTile) return;
                const color = firstTile.color;
                if (!colorGroups[color]) {
                    colorGroups[color] = [];
                }
                match.tiles.forEach(tile => {
                    if (!colorGroups[color].includes(tile)) {
                        colorGroups[color].push(tile);
                    }
                });
            });

            const processedColors = new Set();

            // 2. Detect L-shape / T-shape intersection tiles
            Object.entries(colorGroups).forEach(([color, tiles]) => {
                tiles.forEach(T => {
                    if (!T.field) return;
                    const rowTiles = tiles.filter(t => t.field && t.field.row === T.field.row);
                    const colTiles = tiles.filter(t => t.field && t.field.col === T.field.col);
                    
                    if (rowTiles.length >= 3 && colTiles.length >= 3) {
                        const row = T.field.row;
                        const col = T.field.col;
                        const posX = T.sprite ? T.sprite.x : 0;
                        const posY = T.sprite ? T.sprite.y : 0;

                        this.hud.setLog(`💥 Ghép chữ L/T! Kích hoạt nổ 3x3 quanh giao điểm!`);
                        const explodedTiles = this.board.destroyArea3x3(row, col);
                        if (explodedTiles.length > 0) {
                            const lMatch = { tiles: explodedTiles, length: explodedTiles.length };
                            allMatchesThisTurn.push(lMatch);
                            // Track columns of exploded tiles
                            explodedTiles.forEach(t => { if (t.field) affectedCols.add(t.field.col); });
                            DamagePopup.show(this.container, posX, posY - 20, '3x3 EXPLOSION!', 'damage');
                        }
                        processedColors.add(color);
                    }
                });
            });

            // 3. Process remaining straight Match-5 and Match-4 explosions
            currentMatches.forEach(match => {
                const firstTile = match.tiles[0];
                if (!firstTile) return;
                const color = firstTile.color;
                if (processedColors.has(color)) return; // already handled by L-shape

                if (match.length >= 5) {
                    // Match-5: Instant Cross Explosion (+)
                    const triggerTile = match.tiles.find(t => this.lastSwappedTiles && this.lastSwappedTiles.includes(t)) || match.tiles[Math.floor(match.length / 2)];
                    if (triggerTile && triggerTile.field && !triggerTile.isStone) {
                        const row = triggerTile.field.row;
                        const col = triggerTile.field.col;
                        const posX = triggerTile.sprite ? triggerTile.sprite.x : 0;
                        const posY = triggerTile.sprite ? triggerTile.sprite.y : 0;

                        this.hud.setLog(`💥 Ghép 5 thẳng hàng! Kích hoạt nổ chữ thập (+) tức thời!`);
                        const explodedTiles = this.board.destroyCross(row, col);
                        if (explodedTiles.length > 0) {
                            const crossMatch = { tiles: explodedTiles, length: explodedTiles.length };
                            allMatchesThisTurn.push(crossMatch);
                            // Track columns of exploded tiles
                            explodedTiles.forEach(t => { if (t.field) affectedCols.add(t.field.col); });
                            DamagePopup.show(this.container, posX, posY - 20, 'CROSS BLAST!', 'damage');
                        }
                        processedColors.add(color);
                    }
                } else if (match.length === 4) {
                    // Match-4: Row or Column Explosion!
                    const triggerTile = match.tiles.find(t => this.lastSwappedTiles && this.lastSwappedTiles.includes(t)) || match.tiles[Math.floor(match.length / 2)];
                    if (triggerTile && triggerTile.field && !triggerTile.isStone) {
                        const row = triggerTile.field.row;
                        const col = triggerTile.field.col;
                        const posX = triggerTile.sprite ? triggerTile.sprite.x : 0;
                        const posY = triggerTile.sprite ? triggerTile.sprite.y : 0;

                        // Check if horizontal or vertical
                        const isHorizontal = match.tiles.every(t => t.field && t.field.row === match.tiles[0].field.row);
                        if (isHorizontal) {
                            this.hud.setLog(`💥 Ghép 4 ngang! Phá hủy toàn bộ hàng ${row + 1}!`);
                            const explodedTiles = this.board.destroyRow(row);
                            if (explodedTiles.length > 0) {
                                const rowMatch = { tiles: explodedTiles, length: explodedTiles.length };
                                allMatchesThisTurn.push(rowMatch);
                                // Track columns of exploded tiles
                                explodedTiles.forEach(t => { if (t.field) affectedCols.add(t.field.col); });
                                DamagePopup.show(this.container, posX, posY - 20, 'ROW CLEAR!', 'damage');
                            }
                        } else {
                            this.hud.setLog(`💥 Ghép 4 dọc! Phá hủy toàn bộ cột ${col + 1}!`);
                            const explodedTiles = this.board.destroyColumn(col);
                            if (explodedTiles.length > 0) {
                                const colMatch = { tiles: explodedTiles, length: explodedTiles.length };
                                allMatchesThisTurn.push(colMatch);
                                // Track columns of exploded tiles
                                explodedTiles.forEach(t => { if (t.field) affectedCols.add(t.field.col); });
                                DamagePopup.show(this.container, posX, posY - 20, 'COLUMN CLEAR!', 'damage');
                            }
                        }
                        processedColors.add(color);
                    }
                }
            });

            // Check adjacent stones to destroy
            const stonesToDestroy = this.combinationManager.getStonesToDestroy(currentMatches);
            stonesToDestroy.forEach(field => {
                if (field.tile) {
                    affectedCols.add(field.col); // Track stones columns
                    field.tile.remove();
                    field.tile = null;
                }
            });

            // Check for Rune Tiles in current matches to trigger cross explosions
            const runesToTrigger = [];
            currentMatches.forEach(match => {
                match.tiles.forEach(tile => {
                    // Check if it is a Rune and it is NOT one of the newly morphed ones this frame
                    if (tile.isRune && tile.field && !morphedTiles.has(tile)) {
                        runesToTrigger.push({
                            row: tile.field.row,
                            col: tile.field.col,
                            tile: tile
                        });
                    }
                });
            });

            // Trigger Rune explosions
            runesToTrigger.forEach(rune => {
                this.board._removeTileOverlays(rune.tile);
                const explodedTiles = this.board.destroyCross(rune.row, rune.col);
                if (explodedTiles.length > 0) {
                    this.hud.setLog(`💥 Rune Tile exploded! Hủy diệt chữ thập!`);
                    // Package as a fake match so they deal damage & cascade
                    const runeMatch = { tiles: explodedTiles, length: explodedTiles.length };
                    allMatchesThisTurn.push(runeMatch);
                    // Track columns of exploded tiles
                    explodedTiles.forEach(t => { if (t.field) affectedCols.add(t.field.col); });
                    DamagePopup.show(this.container, rune.tile.sprite.x, rune.tile.sprite.y - 20, 'EXPLOSION!', 'damage');
                }
            });

            // Remove matched tiles visually (except morphed ones)
            this.removeMatches(currentMatches, morphedTiles);
            
            // Clear morphed list for next cascades so they can be matched
            morphedTiles.clear();
            
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

            // Find new cascade matches in affected cols only (highly optimized for 12x12 boards)
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
            const currentRound = Math.floor((this.turnCount - 1) / 2) + 1;

            // Check for poisoned tiles in all matches (can be computed upfront)
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

            // Accumulate status effects to apply at the very end
            const accumulatedEffects = [];

            // ====== SEQUENTIAL ATTACK ANIMATIONS & DAMAGE ======
            // Process each match in allMatchesThisTurn one by one!
            for (let i = 0; i < allMatchesThisTurn.length; i++) {
                const match = allMatchesThisTurn[i];
                const tileType = match.tiles[0]?.color;
                if (!tileType) continue;

                // Calculate damage and effects for this single match
                const { totalDamage, effects: matchEffects, healAmount: matchHeal, shieldAmount: matchShield } =
                    this.damageSystem.calculate([match], attacker, defender, match.comboStep || 1, currentRound);

                if (matchEffects) {
                    matchEffects.forEach(eff => accumulatedEffects.push(eff));
                }

                if (totalDamage > 0) {
                    // Attacker play attack lunge animation
                    await this.hud.playAttack(who);

                    // Determine projectile start position (center of match tiles, or fallback to board center)
                    const boardCenter = {
                        x: this.board.container.x + (this.board.cols * Config.tileSize) / 2,
                        y: this.board.container.y + (this.board.rows * Config.tileSize) / 2,
                    };
                    const firstTile = match.tiles[0];
                    const startPos = (firstTile && firstTile.sprite) 
                        ? { x: firstTile.sprite.x + this.board.container.x, y: firstTile.sprite.y + this.board.container.y } 
                        : boardCenter;
                    
                    const defenderPos = this.hud.getSpritePosition(defenderSide);

                    const colorMap = {
                        fire: 0xff6240, water: 0x42a5f5, nature: 0x66bb6a,
                        ice: 0x80d8ff, lightning: 0xfff176, earth: 0x8d6e63,
                        'wind-air': 0x90caf9, 'psychic-eye': 0xce93d8,
                        sun: 0xffd54f, 'poison-death': 0xb388ff,
                    };
                    const projColor = colorMap[tileType] || 0xff6240;

                    // Fire projectile
                    await Projectile.fire(this.container, startPos, defenderPos, projColor, tileType);

                    // Play defender hurt animation
                    await this.hud.playHurt(defenderSide);

                    // Apply defender damage
                    this.damageSystem.applyDamage(defender, totalDamage, matchEffects);

                    // Determine damage type popup: damage, effective, or resisted
                    let dmgType = 'damage';
                    if (defender.getWeaknessMultiplier) {
                        const mult = defender.getWeaknessMultiplier(tileType);
                        if (mult > 1.0) dmgType = 'effective';
                        else if (mult < 1.0) dmgType = 'resisted';
                    }

                    // Show sequential damage popup on defender
                    this.hud.showDamage(defenderSide, totalDamage, dmgType);

                    // Physical reflection logic for Giáp Gai Thạch Bản (reflected immediately per hit!)
                    if (who === 'boss') {
                        const saveData = saveManager.load();
                        const equipped = saveData.equippedItems || {};
                        if (equipped.armor === 'stone_plate') {
                            const reflectDmg = Math.floor(totalDamage * 0.20);
                            if (reflectDmg > 0) {
                                this.boss.takeDamage(reflectDmg);
                                this.hud.setLog(`🛡️⛰️ [Giáp Gai Thạch Bản] phản lại ${reflectDmg} sát thương hệ Thổ lên Boss!`);
                                const bossPos = this.hud.getSpritePosition('boss');
                                DamagePopup.show(this.container, bossPos.x, bossPos.y - 50, `⛰️ ${reflectDmg}`, 'damage');
                            }
                        }
                    }

                    // Small pause between hits to make them feel punchy and sequential
                    await this.delay(350);
                }

                // Process heal of this single match immediately
                if (matchHeal > 0) {
                    const healed = attacker.heal(matchHeal);
                    if (healed > 0) {
                        const attackerPos = this.hud.getSpritePosition(who);
                        await Projectile.heal(this.container, attackerPos.x, attackerPos.y);
                        await this.hud.playHeal(who);
                        this.hud.showDamage(who, healed, 'heal');
                        await this.delay(300);
                    }
                }

                // Process shield of this single match immediately
                if (matchShield > 0) {
                    attacker.addShield(matchShield);
                    const attackerPos = this.hud.getSpritePosition(who);
                    await Projectile.shield(this.container, attackerPos.x, attackerPos.y);
                    await this.hud.playShield(who);
                    this.hud.showDamage(who, matchShield, 'shield');
                    await this.delay(300);
                }
            }

            // Apply poison self damage
            if (poisonSelfDamage > 0) {
                attacker.takeDamage(poisonSelfDamage);
                this.hud.showDamage(who, poisonSelfDamage, 'poison');
                this.hud.setLog(`🤢 ${attacker.name} dính độc từ ô ngọc bị nhiễm độc! Nhận ${poisonSelfDamage} sát thương!`);
            }

            // Apply status effects accumulated throughout all matches
            this.damageSystem.applyEffects(accumulatedEffects, attacker, defender, this.board);

            // Magic Sword Combo 4+ effect
            if (who === 'player' && this.comboCount >= 4) {
                const saveData = saveManager.load();
                const equipped = saveData.equippedItems || {};
                if (equipped.weapon === 'magic_sword') {
                    // Find a regular tile on the board to transform
                    const regularFields = [];
                    for (let r = 0; r < this.board.rows; r++) {
                        for (let c = 0; c < this.board.cols; c++) {
                            const field = this.board.getField(r, c);
                            if (field && field.tile && !field.tile.isRune && !field.tile.isRainbow && !field.tile.frozen && !field.tile.isStone && !field.tile.isVoid && field.tile.color !== 'lightning') {
                                regularFields.push(field);
                            }
                        }
                    }

                    if (regularFields.length > 0) {
                        const targetField = regularFields[Math.floor(Math.random() * regularFields.length)];
                        const tile = targetField.tile;
                        tile.color = 'lightning';
                        tile.draw(); // redraw the tile with the new lightning color

                        this.hud.setLog(`⚡⚔️ [Kiếm Ma Thuật] kích hoạt! Combo x${this.comboCount} đã biến 1 ô ngọc thường thành Lôi Ngọc!`);
                        DamagePopup.show(this.container, tile.sprite.x, tile.sprite.y - 20, '⚡ LÔI KIẾM!', 'combo');
                    }
                }
            }

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

    removeMatches(matches, morphedTiles = new Set()) {
        const removed = new Set();
        matches.forEach(match => {
            match.tiles.forEach(tile => {
                if (!removed.has(tile) && !morphedTiles.has(tile)) {
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

    getBossMaxMisses() {
        const level = this.levelNum;
        if (level <= 2) return Infinity; // Unlimited misses in Levels 1-2
        if (level === 3 || level === 4) return 11; // 10-12 times in Levels 3-4
        if (level === 5) return 8;
        if (level === 6) return 6;
        if (level === 7) return 5;
        if (level === 8) return 4;
        if (level === 9) return 3;
        return 2; // Level 10: 1 to 3 misses (set to 2)
    }

    shouldBossMiss() {
        const hpPercent = this.player.getHPPercent();
        if (hpPercent <= 0.3) {
            // Player is low HP (<= 30%)
            const maxMisses = this.getBossMaxMisses();
            if (this.bossMissCount < maxMisses) {
                return true;
            }
        }
        return false;
    }

    async executeBossTurn() {
        // Dynamic Dynamic Difficulty: check if Boss should miss to ease low-HP player experience
        if (this.shouldBossMiss()) {
            const missChoice = this.bossAI.findInvalidSwap(this.board, this.combinationManager);
            if (missChoice) {
                this.bossMissCount++;
                this.bossMercyMiss = true;
                this.hud.setLog('💤 Boss phân tâm ngủ gật... Cố tình ghép trượt! 💤');
                this.hud.showDamage('boss', '', 'sleep');
                this.swap(missChoice.tile1, missChoice.tile2, false, 'boss');
                return;
            }
        }

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
            
            // Map active damage skill to custom element style
            let skillElement = 'fire';
            if (skillId === 'lightning') skillElement = 'lightning';
            else if (skillId === 'bomb') skillElement = 'earth';
            
            await Projectile.fire(this.container, playerPos, defenderPos, 0xff6240, skillElement);
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
            // Use immediate (synchronous) removal during init — no GSAP animation.
            // This prevents ghost sprites accumulating in the container before
            // the first frame renders, which can cause PixiJS v8 render errors.
            const removed = new Set();
            matches.forEach(match => {
                match.tiles.forEach(tile => {
                    if (!removed.has(tile)) {
                        removed.add(tile);
                        tile.remove(true);  // immediate = true
                    }
                });
            });
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

        // Map level to elemental shards
        const shardRewards = {
            1: 'nature',
            2: 'fire',
            3: 'ice',
            4: 'lightning',
            5: 'water',
            6: 'earth',
            7: 'poison-death',
            8: 'psychic-eye',
            9: 'wind-air',
            10: 'sun'
        };

        // Add Gold & EXP & Shards!
        const expGained = this.levelNum * 40;
        const goldGained = this.levelNum * 50;
        const shardColor = shardRewards[this.levelNum] || 'nature';
        const shardsGained = 10;

        saveManager.addGold(goldGained);
        saveManager.addShards(shardColor, shardsGained);
        const lvlUpResult = saveManager.addExp(expGained);

        await this.turnIndicator.show('🎉 VICTORY!', '#ffdd57');
        
        let rewardText = `Boss defeated! Nhận: EXP +${expGained}, Vàng +${goldGained}, Mảnh ${shardColor.toUpperCase()} +${shardsGained}!`;
        if (lvlUpResult.leveledUp) {
            rewardText += ` 🌟 LEVEL UP! (Lvl ${lvlUpResult.level}) 🌟`;
        }
        if (skillReward) {
            rewardText += ` Unlocked skill: ${skillReward.toUpperCase()}!`;
        }
        this.hud.setLog(rewardText);

        await this.delay(2000);
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

    createButton(parent, label, x, y, color, onClick, w = 170, h = 44, fontSize = 16) {
        const btnContainer = new Container();
        btnContainer.x = x;
        btnContainer.y = y;
        parent.addChild(btnContainer);

        const bg = new Graphics();
        bg.roundRect(-w / 2, -h / 2, w, h, 8);
        bg.fill({ color });
        bg.stroke({ color: 0xffffff, width: 1, alpha: 0.3 });
        bg.eventMode = 'static';
        bg.cursor = 'pointer';
        btnContainer.addChild(bg);

        const text = new Text({
            text: label,
            style: { fontFamily: 'Arial', fontSize: fontSize, fontWeight: 'bold', fill: '#ffffff' },
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
        // Prevent any pending game logic (turn callbacks, delays) from running
        this.isGameOver = true;
        this.disabled = true;

        const killTweensRecursive = (obj) => {
            if (!obj) return;
            gsap.killTweensOf(obj);
            if (obj.scale) gsap.killTweensOf(obj.scale);
            if (obj.children) {
                // Copy array to avoid issues if children are modified during iteration
                [...obj.children].forEach(killTweensRecursive);
            }
        };
        killTweensRecursive(this.container);

        if (this.hud) this.hud.destroy();
        if (this.turnIndicator) this.turnIndicator.destroy();
        this.container.destroy({ children: true });
    }
}

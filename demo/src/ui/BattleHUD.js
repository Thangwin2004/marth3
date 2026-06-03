/**
 * ===== src/ui/BattleHUD.js =====
 * 
 * Full battle HUD — integrates HealthBar, SkillBar, CharacterSprite,
 * and all UI elements for the battle screen.
 * 
 * Layout: Player (LEFT) | Board (CENTER) | Boss (RIGHT)
 * HP bars + Turn info (TOP), Skills + Battle log (BOTTOM)
 */

import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { Config } from '../config.js';
import { HealthBar } from './HealthBar.js';
import { SkillBar } from './SkillBar.js';
import { CharacterSprite } from './CharacterSprite.js';
import { DamagePopup } from './DamagePopup.js';
import { SKILLS } from '../data/SkillData.js';

const BOSS_SKILL_INFO = {
    freezeTiles:  { name: 'Đóng Băng', emoji: '❄️', desc: 'Đóng băng ngẫu nhiên các ô ngọc khiến không thể di chuyển trong 2 lượt' },
    destroyRow:   { name: 'Diệt Hàng', emoji: '🔥', desc: 'Thiêu rụi hoàn toàn một hàng ngọc ngẫu nhiên trên bảng' },
    destroyCol:   { name: 'Diệt Cột', emoji: '⚡', desc: 'Gọi sấm sét phá hủy hoàn toàn một cột ngọc ngẫu nhiên' },
    corruptTiles: { name: 'Ma Hóa',   emoji: '☠️', desc: 'Ma hóa các ô ngọc thành ngọc hỏng, khớp không gây sát thương' },
    stoneBlock:   { name: 'Khối Đá',  emoji: '⛰️', desc: 'Tạo các khối đá cản trở di chuyển và không thể khớp ngọc thường' },
    shuffleBoard: { name: 'Tráo Bảng', emoji: '🌪️', desc: 'Đảo lộn xáo trộn toàn bộ tất cả các ô ngọc trên bảng đấu' },
    poisonTiles:  { name: 'Phủ Độc',  emoji: '🤢', desc: 'Nhiễm độc ô ngọc, nếu khớp sẽ gây 5 sát thương độc lên người chơi' },
    cloneTiles:   { name: 'Đồng Hóa', emoji: '🔮', desc: 'Biến đổi toàn bộ ngọc trong một hàng ngẫu nhiên thành cùng một màu' },
    voidTiles:    { name: 'Hư Vô',    emoji: '👁️', desc: 'Hủy diệt vĩnh viễn các ô ngọc thành ô hư vô trống rỗng' }
};

export class BattleHUD {
    /**
     * @param {object} params
     * @param {import('../battle/Player.js').Player} params.player
     * @param {import('../battle/Boss.js').Boss} params.boss
     * @param {object} params.levelConfig
     * @param {Function} params.onSkillSelect - callback(skillId)
     */
    constructor({ player, boss, levelConfig, onSkillSelect }) {
        this.player = player;
        this.boss = boss;
        this.levelConfig = levelConfig;

        this.container = new Container();
        this.container.sortableChildren = true;
        this.container.zIndex = 50;

        // ===================== TOP BAR =====================
        this.topBar = new Container();
        this.topBar.y = 26;
        this.container.addChild(this.topBar);

        // Level title (center top)
        this.titleText = new Text({
            text: `⚔ LEVEL ${levelConfig.level}: ${levelConfig.bossName}`,
            style: {
                fontFamily: 'Arial, sans-serif', fontSize: 20, fontWeight: 'bold',
                fill: '#ffffff',
                dropShadow: { color: '#000000', blur: 4, distance: 2 },
            },
        });
        this.titleText.anchor.set(0.5, 0);
        this.titleText.x = Config.canvas.width / 2;
        this.topBar.addChild(this.titleText);

        // Player HP bar (left)
        this.playerHP = new HealthBar({ width: 200, color: 0x4caf50, side: 'left' });
        this.playerHP.container.x = 25;
        this.playerHP.container.y = 30;
        this.topBar.addChild(this.playerHP.container);

        const playerLabel = new Text({
            text: '❤️ Player',
            style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#4fc3f7' },
        });
        playerLabel.x = 25;
        playerLabel.y = 52;
        this.topBar.addChild(playerLabel);

        // Player shield text
        this.playerShieldText = new Text({
            text: '',
            style: { fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: '#64b5f6' },
        });
        this.playerShieldText.x = 110;
        this.playerShieldText.y = 52;
        this.topBar.addChild(this.playerShieldText);

        // Boss HP bar (right)
        this.bossHP = new HealthBar({ width: 200, color: 0xf44336, side: 'right' });
        this.bossHP.container.x = Config.canvas.width - 225;
        this.bossHP.container.y = 30;
        this.topBar.addChild(this.bossHP.container);

        const bossLabel = new Text({
            text: `🩸 ${levelConfig.bossEmoji} ${levelConfig.bossName}`,
            style: { fontFamily: 'Arial', fontSize: 14, fontWeight: 'bold', fill: '#ff6b6b' },
        });
        bossLabel.anchor.set(1, 0); // Right-align to screen margin
        bossLabel.x = Config.canvas.width - 25;
        bossLabel.y = 52;
        this.topBar.addChild(bossLabel);

        // Boss weakness/resistance info
        const weakStr = boss.weakness ? `Weak: ${boss.weakness}` : '';
        const resStr = boss.resistance ? `Resist: ${boss.resistance}` : '';
        this.bossInfoText = new Text({
            text: `${weakStr}  ${resStr}`.trim(),
            style: { 
                fontFamily: 'Arial', 
                fontSize: 13, 
                fontWeight: 'bold', 
                fill: '#e0e0e0', // High contrast off-white
                dropShadow: { color: '#000000', blur: 3, distance: 1 }
            },
        });
        this.bossInfoText.anchor.set(1, 0); // Right-align to screen margin
        this.bossInfoText.x = Config.canvas.width - 25;
        this.bossInfoText.y = 70; // Positioned slightly lower for perfect spacing
        this.topBar.addChild(this.bossInfoText);

        // Turn indicator (center)
        this.turnText = new Text({
            text: '',
            style: { fontFamily: 'Arial', fontSize: 15, fill: '#ffdd57' },
        });
        this.turnText.anchor.set(0.5, 0);
        this.turnText.x = Config.canvas.width / 2;
        this.turnText.y = 30;
        this.topBar.addChild(this.turnText);

        // ===================== CHARACTERS =====================

        // Player character (left side)
        const bossColorMap = {
            1: 0x81c784, 2: 0xff7043, 3: 0x80d8ff, 4: 0xfff176,
            5: 0x4fc3f7, 6: 0xb388ff, 7: 0xff5722, 8: 0x7c4dff,
            9: 0x90a4ae, 10: 0xff1744,
        };

        this.playerSprite = new CharacterSprite({
            side: 'left', name: 'Player', emoji: '🧙', color: 0x1565c0,
            scale: 1.4, isPlayer: true,
            imagePath: '/assets/card-NPC/a_brave_armored_knight_in_high_fantasy_rpg_style_standing_in_a_dramatic_pose/screen.png',
        });
        this.playerSprite.container.x = 120;
        this.playerSprite.container.y = Config.canvas.height / 2 - 10;
        this.container.addChild(this.playerSprite.container);

        // Boss character (right side)
        this.bossSprite = new CharacterSprite({
            side: 'right',
            name: levelConfig.bossName,
            emoji: levelConfig.bossEmoji,
            color: bossColorMap[levelConfig.level] || 0xf44336,
            scale: 1.4 + (levelConfig.level * 0.05), // bigger bosses at higher levels
            isPlayer: false,
            imagePath: levelConfig.bossImage || null,
        });
        this.bossSprite.container.x = Config.canvas.width - 120;
        this.bossSprite.container.y = Config.canvas.height / 2 - 10;
        this.container.addChild(this.bossSprite.container);

        // ===================== BOTTOM BAR =====================
        this.bottomBar = new Container();
        this.container.addChild(this.bottomBar);

        // Skill bar (below player)
        this.skillBar = new SkillBar(onSkillSelect);
        this.skillBar.container.x = 120;
        this.skillBar.container.y = Config.canvas.height - 80;
        this.bottomBar.addChild(this.skillBar.container);

        // Battle log
        this.logText = new Text({
            text: '💡 Match tiles to attack the boss!',
            style: { fontFamily: 'Arial', fontSize: 13, fill: '#cccccc' },
        });
        this.logText.anchor.set(0.5, 0.5);
        this.logText.x = Config.canvas.width / 2;
        this.logText.y = Config.canvas.height - 10;
        this.bottomBar.addChild(this.logText);

        // Terrain info bar
        this.terrainText = new Text({
            text: this.getTerrainString(),
            style: { fontFamily: 'Arial', fontSize: 11, fill: '#999999' },
        });
        this.terrainText.anchor.set(0.5, 0.5);
        this.terrainText.x = Config.canvas.width / 2;
        this.terrainText.y = Config.canvas.height - 26;
        this.bottomBar.addChild(this.terrainText);

        // Environment event warning (right side)
        this.envWarning = new Text({
            text: '',
            style: { fontFamily: 'Arial', fontSize: 12, fontWeight: 'bold', fill: '#ff9800' },
        });
        this.envWarning.anchor.set(1, 0.5);
        this.envWarning.x = Config.canvas.width - 25;
        this.envWarning.y = Config.canvas.height - 80;
        this.bottomBar.addChild(this.envWarning);

        // Boss next skill info
        this.bossSkillText = new Text({
            text: '',
            style: { fontFamily: 'Arial', fontSize: 11, fill: '#e57373' },
        });
        this.bossSkillText.anchor.set(1, 0.5);
        this.bossSkillText.x = Config.canvas.width - 25;
        this.bossSkillText.y = Config.canvas.height - 60;
        this.bottomBar.addChild(this.bossSkillText);

        // Boss skills list text
        const skillNames = this.boss.skills.map(id => {
            const info = BOSS_SKILL_INFO[id];
            return info ? `${info.emoji} ${info.name}` : id;
        }).join(' | ');

        this.bossSkillsListText = new Text({
            text: skillNames ? `Chiêu: ${skillNames}` : '',
            style: { fontFamily: 'Arial', fontSize: 9.5, fill: '#aaaaaa' },
        });
        this.bossSkillsListText.anchor.set(1, 0.5);
        this.bossSkillsListText.x = Config.canvas.width - 25;
        this.bossSkillsListText.y = Config.canvas.height - 40;
        this.bottomBar.addChild(this.bossSkillsListText);

        // Initialize hover tooltip
        this.initBossSkillTooltip();
    }

    // ===================== UPDATE =====================

    /**
     * Update all HUD elements with current game state.
     */
    update(state = {}) {
        const { currentTurn, turnCount, envTurnsUntil, bossSkillIn } = state;

        // HP bars
        this.playerHP.update(this.player.currentHP, this.player.maxHP, this.player.shield);
        this.bossHP.update(this.boss.currentHP, this.boss.maxHP, this.boss.shield);

        // Shield text
        this.playerShieldText.text = this.player.shield > 0 ? `🛡 ${this.player.shield}` : '';

        // Turn text with Round count and Enrage visual indicator
        const currentRound = Math.floor(((turnCount || 1) - 1) / 2) + 1;
        const enragedStr = this.bossSprite.isEnraged ? ' 🔥 [ENRAGED]' : '';
        this.turnText.text = `Round ${currentRound} (Turn ${turnCount || 0}) | ${currentTurn === 'player' ? '⚔️ Your Turn' : '💀 Boss Turn'}${enragedStr}`;

        // Skill bar
        const skillStates = this.player.getSkillStates();
        if (skillStates.length > 0) {
            this.skillBar.setEnabled(currentTurn === 'player');
            this.skillBar.render(skillStates);
        }

        // Status icons (including shield)
        const playerEffects = [...this.player.statusEffects];
        if (this.player.shield > 0) {
            playerEffects.push({ type: 'shield', duration: null, damage: this.player.shield });
        }
        this.playerSprite.showStatusIcons(playerEffects);

        const bossEffects = [...this.boss.statusEffects];
        if (this.boss.shield > 0) {
            bossEffects.push({ type: 'shield', duration: null, damage: this.boss.shield });
        }
        this.bossSprite.showStatusIcons(bossEffects);

        // Environment warning
        if (envTurnsUntil !== undefined && envTurnsUntil <= 2) {
            this.envWarning.text = `⚠️ ${this.levelConfig.terrain.event?.name || 'Event'} in ${envTurnsUntil}t`;
            this.envWarning.visible = true;
        } else {
            this.envWarning.text = '';
        }

        // Boss skill countdown
        if (bossSkillIn !== undefined && this.boss.skills.length > 0) {
            this.bossSkillText.text = `🔮 Boss skill in ${bossSkillIn}t`;
        }
    }

    // ===================== ANIMATIONS =====================

    /** Show damage popup near an entity */
    showDamage(target, amount, type = 'damage') {
        const sprite = target === 'player' ? this.playerSprite : this.bossSprite;
        DamagePopup.show(
            this.container,
            sprite.container.x,
            sprite.container.y - 60,
            amount,
            type
        );
    }

    /** Play attack animation on attacker sprite */
    async playAttack(who) {
        const sprite = who === 'player' ? this.playerSprite : this.bossSprite;
        await sprite.playAttack();
    }

    /** Play hurt animation on defender sprite with elemental damage type */
    async playHurt(who, type = 'damage') {
        const sprite = who === 'player' ? this.playerSprite : this.bossSprite;
        await sprite.playHurt(type);
    }

    /** Play heal animation */
    async playHeal(who) {
        const sprite = who === 'player' ? this.playerSprite : this.bossSprite;
        await sprite.playHeal();
    }

    /** Play shield animation */
    async playShield(who) {
        const sprite = who === 'player' ? this.playerSprite : this.bossSprite;
        await sprite.playShield();
    }

    /** Play skill cast animation */
    async playSkillCast(who) {
        const sprite = who === 'player' ? this.playerSprite : this.bossSprite;
        await sprite.playSkillCast();
    }

    /** Play defeated animation */
    async playDefeated(who) {
        const sprite = who === 'player' ? this.playerSprite : this.bossSprite;
        await sprite.playDefeated();
    }

    /** Get sprite position for projectile targeting */
    getSpritePosition(who) {
        const sprite = who === 'player' ? this.playerSprite : this.bossSprite;
        return { x: sprite.container.x, y: sprite.container.y };
    }

    // ===================== LOG =====================

    setLog(message) {
        this.logText.text = message;
        // Brief flash effect
        this.logText.alpha = 0;
        gsap.to(this.logText, { alpha: 1, duration: 0.3 });
    }

    // ===================== HELPERS =====================

    getTerrainString() {
        const t = this.levelConfig.terrain;
        const buffStr = Object.entries(t.buff || {}).map(([k, v]) => `${k}+${Math.round(v * 100)}%`).join(', ');
        const debuffStr = Object.entries(t.debuff || {}).map(([k, v]) => `${k}-${Math.round(v * 100)}%`).join(', ');
        let str = `${t.emoji} ${t.name}`;
        if (buffStr) str += ` | ⬆ ${buffStr}`;
        if (debuffStr) str += ` | ⬇ ${debuffStr}`;
        return str;
    }

    initBossSkillTooltip() {
        const tooltip = new Container();
        tooltip.zIndex = 300;
        tooltip.visible = false;
        tooltip.alpha = 0;
        this.bottomBar.addChild(tooltip);
        this.skillTooltip = tooltip;

        const w = 310;
        const h = this.boss.skills.length * 36 + 35; // dynamic height based on number of skills

        // Draw glassmorphic dark container
        const bg = new Graphics();
        bg.roundRect(0, 0, w, h, 8);
        bg.fill({ color: 0x070d1a, alpha: 0.96 });
        bg.stroke({ color: 0xff5252, width: 1.5, alpha: 0.8 }); // boss red glowing border
        tooltip.addChild(bg);

        // Tooltip Title
        const title = new Text({
            text: '💀 CHIÊU THỨC CỦA BOSS',
            style: { fontFamily: 'Arial, sans-serif', fontSize: 11, fontWeight: 'bold', fill: '#ffd54f' }
        });
        title.x = 12;
        title.y = 10;
        tooltip.addChild(title);

        // Populate skills descriptions
        this.boss.skills.forEach((id, idx) => {
            const info = BOSS_SKILL_INFO[id] || { name: id, emoji: '🔮', desc: 'Kỹ năng đặc biệt của Boss' };
            const itemText = new Text({
                text: `${info.emoji} ${info.name}: ${info.desc}`,
                style: {
                    fontFamily: 'Arial, sans-serif',
                    fontSize: 9,
                    fill: '#cfd8dc',
                    wordWrap: true,
                    wordWrapWidth: w - 24
                }
            });
            itemText.x = 12;
            itemText.y = 30 + idx * 36;
            tooltip.addChild(itemText);
        });

        // Set position to hover above the bottom right HUD
        tooltip.x = Config.canvas.width - w - 25;
        tooltip.y = Config.canvas.height - 65 - h; // floating perfectly above the text

        // Make the trigger text interactive
        const showTooltip = () => {
            tooltip.visible = true;
            gsap.to(tooltip, { alpha: 1, duration: 0.2 });
        };
        const hideTooltip = () => {
            gsap.to(tooltip, { alpha: 0, duration: 0.15, onComplete: () => { tooltip.visible = false; } });
        };

        this.bossSkillText.eventMode = 'static';
        this.bossSkillText.cursor = 'help';
        this.bossSkillText.on('pointerover', showTooltip);
        this.bossSkillText.on('pointerout', hideTooltip);

        this.bossSkillsListText.eventMode = 'static';
        this.bossSkillsListText.cursor = 'help';
        this.bossSkillsListText.on('pointerover', showTooltip);
        this.bossSkillsListText.on('pointerout', hideTooltip);
    }

    destroy() {
        if (this.skillTooltip) {
            gsap.killTweensOf(this.skillTooltip);
        }
        this.playerSprite.destroy();
        this.bossSprite.destroy();
        this.container.destroy({ children: true });
    }
}

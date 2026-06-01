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
            style: { fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: '#4fc3f7' },
        });
        playerLabel.x = 25;
        playerLabel.y = 52;
        this.topBar.addChild(playerLabel);

        // Player shield text
        this.playerShieldText = new Text({
            text: '',
            style: { fontFamily: 'Arial', fontSize: 12, fill: '#64b5f6' },
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
            style: { fontFamily: 'Arial', fontSize: 13, fontWeight: 'bold', fill: '#ff6b6b' },
        });
        bossLabel.x = Config.canvas.width - 225;
        bossLabel.y = 52;
        this.topBar.addChild(bossLabel);

        // Boss weakness/resistance info
        const weakStr = boss.weakness ? `Weak: ${boss.weakness}` : '';
        const resStr = boss.resistance ? `Resist: ${boss.resistance}` : '';
        this.bossInfoText = new Text({
            text: `${weakStr}  ${resStr}`.trim(),
            style: { fontFamily: 'Arial', fontSize: 11, fill: '#aaaaaa' },
        });
        this.bossInfoText.x = Config.canvas.width - 225;
        this.bossInfoText.y = 68;
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
            scale: 1.0, isPlayer: true,
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
            scale: 1.0 + (levelConfig.level * 0.05), // bigger bosses at higher levels
            isPlayer: false,
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
        this.logText.y = Config.canvas.height - 25;
        this.bottomBar.addChild(this.logText);

        // Terrain info bar
        this.terrainText = new Text({
            text: this.getTerrainString(),
            style: { fontFamily: 'Arial', fontSize: 11, fill: '#999999' },
        });
        this.terrainText.anchor.set(0.5, 0.5);
        this.terrainText.x = Config.canvas.width / 2;
        this.terrainText.y = Config.canvas.height - 50;
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

        // Status icons
        this.playerSprite.showStatusIcons(this.player.statusEffects);
        this.bossSprite.showStatusIcons(this.boss.statusEffects);

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

    /** Play hurt animation on defender sprite */
    async playHurt(who) {
        const sprite = who === 'player' ? this.playerSprite : this.bossSprite;
        await sprite.playHurt();
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

    destroy() {
        this.playerSprite.destroy();
        this.bossSprite.destroy();
        this.container.destroy({ children: true });
    }
}

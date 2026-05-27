/**
 * @file SkillData.js
 * @description Player skill definitions for the Match-3 Boss Battle RPG.
 * Each skill has an id, display info, cooldown, unlock level, and target type.
 */

/** @enum {'tile'|'self'|'board'|'column'} TargetType */

/**
 * @typedef {Object} Skill
 * @property {string} id - Unique identifier
 * @property {string} name - Display name
 * @property {string} icon - Emoji icon
 * @property {number} color - Hex color for UI
 * @property {string} description - Tooltip description
 * @property {number} cooldown - Turns before reuse
 * @property {number} unlockedAtLevel - Level at which the skill is unlocked
 * @property {TargetType} targetType - What the skill targets
 */

/** @type {Object.<string, Skill>} */
export const SKILLS = {
  fireball: {
    id: 'fireball',
    name: 'Fireball',
    icon: '🔥',
    color: 0xff6240,
    description: 'Destroy 1 tile + deal 15 damage',
    cooldown: 5,
    unlockedAtLevel: 1,
    targetType: 'tile',
  },
  heal: {
    id: 'heal',
    name: 'Heal',
    icon: '💚',
    color: 0x81c784,
    description: 'Restore 25 HP',
    cooldown: 6,
    unlockedAtLevel: 2,
    targetType: 'self',
  },
  shuffle: {
    id: 'shuffle',
    name: 'Shuffle',
    icon: '🔀',
    color: 0x64b5f6,
    description: 'Shuffle entire board',
    cooldown: 8,
    unlockedAtLevel: 3,
    targetType: 'board',
  },
  barrier: {
    id: 'barrier',
    name: 'Barrier',
    icon: '🛡️',
    color: 0x42a5f5,
    description: 'Gain +30 shield',
    cooldown: 6,
    unlockedAtLevel: 4,
    targetType: 'self',
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning Strike',
    icon: '⚡',
    color: 0xfff176,
    description: 'Destroy 1 column + deal 5 damage per tile',
    cooldown: 7,
    unlockedAtLevel: 5,
    targetType: 'column',
  },
  purify: {
    id: 'purify',
    name: 'Purify',
    icon: '🧹',
    color: 0xce93d8,
    description: 'Remove all corrupt/poison/stone tiles',
    cooldown: 8,
    unlockedAtLevel: 6,
    targetType: 'board',
  },
  bomb: {
    id: 'bomb',
    name: 'Bomb',
    icon: '💣',
    color: 0xff8a65,
    description: 'Destroy 3×3 area + deal 8 damage per tile',
    cooldown: 8,
    unlockedAtLevel: 7,
    targetType: 'tile',
  },
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    color: 0xf48fb1,
    description: 'Transform 5 random tiles to same color',
    cooldown: 10,
    unlockedAtLevel: 8,
    targetType: 'board',
  },
  extraTurn: {
    id: 'extraTurn',
    name: 'Extra Turn',
    icon: '⏳',
    color: 0xffd54f,
    description: 'Take an extra turn',
    cooldown: 10,
    unlockedAtLevel: 9,
    targetType: 'self',
  },
};

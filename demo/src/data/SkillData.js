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
    description: 'Deal 15 direct damage to the boss',
    cooldown: 5,
    unlockedAtLevel: 1,
    targetType: 'boss',
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
  meteor_shower: {
    id: 'meteor_shower',
    name: 'Mưa Thiên Thạch',
    icon: '☄️',
    color: 0xff3d00,
    description: 'Gây 40 sát thương lên Boss và phá hủy 5 viên ngọc Đỏ 🔥 trên bàn cờ',
    cooldown: 6,
    unlockedAtLevel: 4,
    targetType: 'boss',
  },
  barrier: {
    id: 'barrier',
    name: 'Barrier',
    icon: '🛡️',
    color: 0x42a5f5,
    description: 'Gain +30 shield',
    cooldown: 6,
    unlockedAtLevel: 5,
    targetType: 'self',
  },
  lightning: {
    id: 'lightning',
    name: 'Lightning Strike',
    icon: '⚡',
    color: 0xfff176,
    description: 'Deal 45 direct damage to the boss',
    cooldown: 7,
    unlockedAtLevel: 6,
    targetType: 'boss',
  },
  quartz_fortress: {
    id: 'quartz_fortress',
    name: 'Pháo Đài Thạch Anh',
    icon: '💎',
    color: 0x00e5ff,
    description: 'Nhận +40 Giáp và miễn nhiễm Choáng 2 lượt',
    cooldown: 7,
    unlockedAtLevel: 7,
    targetType: 'self',
  },
  purify: {
    id: 'purify',
    name: 'Purify',
    icon: '🧹',
    color: 0xce93d8,
    description: 'Remove all corrupt/poison/stone tiles',
    cooldown: 8,
    unlockedAtLevel: 8,
    targetType: 'board',
  },
  bomb: {
    id: 'bomb',
    name: 'Bomb',
    icon: '💣',
    color: 0xff8a65,
    description: 'Deal 72 direct damage to the boss',
    cooldown: 8,
    unlockedAtLevel: 9,
    targetType: 'boss',
  },
  rainbow: {
    id: 'rainbow',
    name: 'Rainbow',
    icon: '🌈',
    color: 0xf48fb1,
    description: 'Transform 5 random tiles to same color',
    cooldown: 10,
    unlockedAtLevel: 10,
    targetType: 'board',
  },
  extraTurn: {
    id: 'extraTurn',
    name: 'Extra Turn',
    icon: '⏳',
    color: 0xffd54f,
    description: 'Take an extra turn',
    cooldown: 10,
    unlockedAtLevel: 11,
    targetType: 'self',
  },
};

/** @type {Object.<string, {id:string, name:string, icon:string, description:string}>} */
export const PASSIVE_SKILLS = {
  elem_crit: {
    id: 'elem_crit',
    name: 'Bạo Kích Nguyên Tố',
    icon: '🎯💥',
    description: 'Nổ ngọc hệ khắc chế tăng +30% sát thương chí mạng.'
  },
  nat_regrow: {
    id: 'nat_regrow',
    name: 'Hồi Phục Tự Nhiên',
    icon: '🌿💚',
    description: 'Tự động hồi 5% HP tối đa mỗi lượt chơi của mình.'
  }
};


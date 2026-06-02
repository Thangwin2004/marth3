/**
 * @file LevelData.js
 * @description Level configurations, tile damage tables, and tile type
 *   definitions for the Match-3 Boss Battle RPG.
 */

/**
 * All available tile element types.
 * @type {string[]}
 */
export const ALL_TILE_TYPES = [
  'fire',
  'water',
  'nature',
  'ice',
  'lightning',
  'earth',
  'wind-air',
  'psychic-eye',
  'sun',
  'poison-death',
];

/**
 * Damage and effect table for each tile element type.
 * @type {Object.<string, {baseDmg:number, selfEffect:Object|null, enemyEffect:Object|null}>}
 */
export const TILE_DAMAGE = {
  fire: {
    baseDmg: 12,
    selfEffect: null,
    enemyEffect: { type: 'burn', damage: 3, duration: 2 },
  },
  water: {
    baseDmg: 10,
    selfEffect: { type: 'cleanse' },
    enemyEffect: null,
  },
  nature: {
    baseDmg: 6,
    selfEffect: { type: 'heal', amount: 8 },
    enemyEffect: null,
  },
  ice: {
    baseDmg: 8,
    selfEffect: { type: 'shield', amount: 8 },
    enemyEffect: { type: 'freeze', chance: 0.15, count: 2, duration: 1 },
  },
  lightning: {
    baseDmg: 15,
    selfEffect: null,
    enemyEffect: { type: 'stun', chance: 0.10, duration: 1 },
  },
  earth: {
    baseDmg: 5,
    selfEffect: { type: 'shield', amount: 12 },
    enemyEffect: null,
  },
  'wind-air': {
    baseDmg: 11,
    selfEffect: null,
    enemyEffect: { type: 'pierce', shieldPiercePercent: 0.5 },
  },
  'psychic-eye': {
    baseDmg: 9,
    selfEffect: null,
    enemyEffect: { type: 'curse', damageReduction: 0.3, duration: 2 },
  },
  sun: {
    baseDmg: 7,
    selfEffect: { type: 'heal', amount: 12 },
    enemyEffect: null,
  },
  'poison-death': {
    baseDmg: 8,
    selfEffect: null,
    enemyEffect: { type: 'poison', damage: 4, duration: 3, stackable: true },
  },
};

/**
 * Pokemon-like type relationship chart.
 * Defines which elements are super effective (weak) or not very effective (resist).
 */
export const ELEMENT_CHART = {
  fire: {
    weak: ['nature', 'ice'],
    resist: ['water', 'earth']
  },
  water: {
    weak: ['fire', 'earth'],
    resist: ['nature', 'lightning']
  },
  nature: {
    weak: ['water', 'earth', 'poison-death'],
    resist: ['fire', 'wind-air']
  },
  ice: {
    weak: ['nature', 'wind-air'],
    resist: ['fire', 'water']
  },
  lightning: {
    weak: ['water', 'wind-air'],
    resist: ['earth', 'lightning']
  },
  earth: {
    weak: ['fire', 'lightning', 'poison-death'],
    resist: ['nature', 'wind-air']
  },
  'wind-air': {
    weak: ['nature', 'lightning'],
    resist: ['earth', 'ice']
  },
  'psychic-eye': {
    weak: ['poison-death', 'sun'],
    resist: ['psychic-eye']
  },
  sun: {
    weak: ['poison-death', 'ice'],
    resist: ['fire', 'sun']
  },
  'poison-death': {
    weak: ['sun', 'nature'],
    resist: ['earth', 'poison-death']
  }
};

// ---------------------------------------------------------------------------
// Helper: build buff/debuff objects for all tile types
// ---------------------------------------------------------------------------
function allTileBuff(value) {
  const obj = {};
  ALL_TILE_TYPES.forEach((t) => (obj[t] = value));
  return obj;
}

/**
 * Level configurations array. Index 0 is null (unused); levels 1-10 at index 1-10.
 *
 * @typedef {Object} LevelConfig
 * @property {number} level
 * @property {string} bossName
 * @property {string} bossEmoji
 * @property {Object} terrain
 * @property {Object} boss
 * @property {number} tileCount - Number of tile types used this level (6-10)
 * @property {number} playerHP
 * @property {string|null} skillReward - Skill ID unlocked on victory
 */

/** @type {(null|LevelConfig)[]} */
export const LEVELS = [
  null, // index 0 unused

  // ── Level 1 ─────────────────────────────────────────────────────────────
  {
    level: 1,
    board: { rows: 8, cols: 8 },
    bossName: 'Slime',
    bossEmoji: '🌱',
    terrain: {
      name: 'Grassland',
      emoji: '🌿',
      background: 0x0f2a0f,
      fieldColor: 0x1a3a1a,
      buff: { nature: 0.2 },
      debuff: {},
      specialRule: 'Wind occasionally shifts a row of tiles.',
      event: {
        name: 'Wind Shift',
        interval: 5,
        description: 'Shifts one random row of tiles.',
      },
    },
    boss: {
      maxHP: 200,
      weakness: 'fire',
      resistance: 'nature',
      aiOptimalChance: 0.3,
      skills: [],
      skillInterval: 3,
    },
    tileCount: 6,
    playerHP: 100,
    skillReward: 'fireball',
  },

  // ── Level 2 ─────────────────────────────────────────────────────────────
  {
    level: 2,
    board: { rows: 8, cols: 8 },
    bossName: 'Goblin',
    bossEmoji: '🔥',
    terrain: {
      name: 'Cave',
      emoji: '🔥',
      background: 0x1a0f05,
      fieldColor: 0x2a1a0a,
      buff: { fire: 0.2 },
      debuff: { water: 0.2 },
      specialRule: 'Lava periodically destroys random tiles.',
      event: {
        name: 'Lava Burst',
        interval: 4,
        description: 'Destroys 2 random tiles.',
      },
    },
    boss: {
      maxHP: 350,
      weakness: 'water',
      resistance: 'fire',
      aiOptimalChance: 0.4,
      skills: [],
      skillInterval: 3,
    },
    tileCount: 7,
    playerHP: 100,
    skillReward: 'heal',
  },

  // ── Level 3 ─────────────────────────────────────────────────────────────
  {
    level: 3,
    board: { rows: 8, cols: 8 },
    bossName: 'Ice Golem',
    bossEmoji: '🧊',
    terrain: {
      name: 'Snow',
      emoji: '❄️',
      background: 0x0f1a2a,
      fieldColor: 0x1a2a3a,
      buff: { ice: 0.2 },
      debuff: { fire: 0.2 },
      specialRule: 'Blizzard freezes tiles periodically.',
      event: {
        name: 'Blizzard',
        interval: 4,
        description: 'Freezes 3 random tiles.',
      },
    },
    boss: {
      maxHP: 500,
      weakness: 'fire',
      resistance: 'ice',
      aiOptimalChance: 0.4,
      skills: ['freezeTiles'],
      skillInterval: 3,
    },
    tileCount: 7,
    playerHP: 100,
    skillReward: 'shuffle',
  },

  // ── Level 4 ─────────────────────────────────────────────────────────────
  {
    level: 4,
    board: { rows: 8, cols: 8 },
    bossName: 'Thunder Wolf',
    bossEmoji: '⚡',
    terrain: {
      name: 'Thunder Hills',
      emoji: '⚡',
      background: 0x1a1a0f,
      fieldColor: 0x2a2a1a,
      buff: { lightning: 0.3 },
      debuff: { earth: 0.2 },
      specialRule: 'Lightning strikes random tiles dealing damage.',
      event: {
        name: 'Lightning Strike',
        interval: 3,
        description: 'Destroys 1 random tile and deals 5 damage to player.',
      },
    },
    boss: {
      maxHP: 650,
      weakness: 'earth',
      resistance: 'lightning',
      aiOptimalChance: 0.6,
      skills: ['shuffleBoard', 'destroyRow'],
      skillInterval: 3,
    },
    tileCount: 8,
    playerHP: 100,
    skillReward: 'barrier',
  },

  // ── Level 5 ─────────────────────────────────────────────────────────────
  {
    level: 5,
    board: { rows: 10, cols: 10 },
    bossName: 'Sea Serpent',
    bossEmoji: '🌊',
    terrain: {
      name: 'Ocean',
      emoji: '🌊',
      background: 0x050f2a,
      fieldColor: 0x0a1a3a,
      buff: { water: 0.2 },
      debuff: { lightning: 0.3 },
      specialRule: 'Waves shuffle rows periodically.',
      event: {
        name: 'Tidal Wave',
        interval: 4,
        description: 'Shuffles 1 random row.',
      },
    },
    boss: {
      maxHP: 800,
      weakness: 'lightning',
      resistance: 'water',
      aiOptimalChance: 0.6,
      skills: ['destroyCol', 'corruptTiles'],
      skillInterval: 3,
    },
    tileCount: 8,
    playerHP: 100,
    skillReward: 'lightning',
  },

  // ── Level 6 ─────────────────────────────────────────────────────────────
  {
    level: 6,
    board: { rows: 10, cols: 10 },
    bossName: 'Shadow Knight',
    bossEmoji: '💀',
    terrain: {
      name: 'Graveyard',
      emoji: '💀',
      background: 0x1a0a1a,
      fieldColor: 0x2a1a2a,
      buff: { 'poison-death': 0.3 },
      debuff: { sun: 0.3 },
      specialRule: 'Ghosts corrupt tiles periodically.',
      event: {
        name: 'Ghost Corruption',
        interval: 3,
        description: 'Corrupts 3 random tiles.',
      },
    },
    boss: {
      maxHP: 1000,
      weakness: 'sun',
      resistance: 'psychic-eye',
      aiOptimalChance: 0.75,
      skills: ['stoneBlock', 'corruptTiles'],
      skillInterval: 3,
    },
    tileCount: 9,
    playerHP: 100,
    skillReward: 'purify',
  },

  // ── Level 7 ─────────────────────────────────────────────────────────────
  {
    level: 7,
    board: { rows: 10, cols: 10 },
    bossName: 'Lava Dragon',
    bossEmoji: '🌋',
    terrain: {
      name: 'Volcano',
      emoji: '🌋',
      background: 0x2a0505,
      fieldColor: 0x3a0a0a,
      buff: { fire: 0.3 },
      debuff: { ice: 0.3 },
      specialRule: 'Eruptions destroy the bottom row and deal damage.',
      event: {
        name: 'Eruption',
        interval: 3,
        description: 'Destroys the bottom row and deals 10 damage to player.',
      },
    },
    boss: {
      maxHP: 1200,
      weakness: 'ice',
      resistance: 'fire',
      aiOptimalChance: 0.85,
      skills: ['destroyRow', 'poisonTiles', 'corruptTiles'],
      skillInterval: 3,
    },
    tileCount: 9,
    playerHP: 100,
    skillReward: 'bomb',
  },

  // ── Level 8 ─────────────────────────────────────────────────────────────
  {
    level: 8,
    board: { rows: 12, cols: 12 },
    bossName: 'Lich King',
    bossEmoji: '🌑',
    terrain: {
      name: 'Dark Tower',
      emoji: '🌑',
      background: 0x05050f,
      fieldColor: 0x0a0a1a,
      buff: { 'psychic-eye': 0.3 },
      debuff: { nature: 0.3 },
      specialRule: 'Darkness hides tiles periodically.',
      event: {
        name: 'Encroaching Darkness',
        interval: 3,
        description: 'Hides 4 random tiles.',
      },
    },
    boss: {
      maxHP: 1500,
      weakness: 'nature',
      resistance: 'poison-death',
      aiOptimalChance: 0.85,
      skills: ['cloneTiles', 'stoneBlock', 'corruptTiles'],
      skillInterval: 3,
    },
    tileCount: 10,
    playerHP: 100,
    skillReward: 'rainbow',
  },

  // ── Level 9 ─────────────────────────────────────────────────────────────
  {
    level: 9,
    board: { rows: 12, cols: 12 },
    bossName: 'Ancient Dragon',
    bossEmoji: '🏔️',
    terrain: {
      name: 'Summit',
      emoji: '🏔️',
      background: 0x1a1a2a,
      fieldColor: 0x2a2a3a,
      buff: { 'wind-air': 0.3 },
      debuff: { earth: 0.3 },
      specialRule: 'Tornado rotates a 3×3 area periodically.',
      event: {
        name: 'Tornado',
        interval: 2,
        description: 'Rotates a random 3×3 area of tiles.',
      },
    },
    boss: {
      maxHP: 2000,
      weakness: 'poison-death',
      resistance: 'wind-air',
      aiOptimalChance: 0.85,
      skills: ['voidTiles', 'destroyRow', 'destroyCol', 'shuffleBoard'],
      skillInterval: 3,
    },
    tileCount: 10,
    playerHP: 100,
    skillReward: 'extraTurn',
  },

  // ── Level 10 ────────────────────────────────────────────────────────────
  {
    level: 10,
    board: { rows: 12, cols: 12 },
    bossName: 'Demon Lord',
    bossEmoji: '👑',
    terrain: {
      name: 'Golden Throne',
      emoji: '👑',
      background: 0x2a1505,
      fieldColor: 0x3a2a1a,
      buff: allTileBuff(0.1),
      debuff: allTileBuff(0.1),
      specialRule: 'Chaos triggers a random environmental event each cycle.',
      event: {
        name: 'Chaos',
        interval: 2,
        description: 'Triggers a random environmental event.',
      },
    },
    boss: {
      maxHP: 3000,
      weakness: null,
      resistance: null,
      aiOptimalChance: 1.0,
      skills: [
        'freezeTiles',
        'destroyRow',
        'destroyCol',
        'corruptTiles',
        'stoneBlock',
        'poisonTiles',
        'cloneTiles',
        'voidTiles',
        'shuffleBoard',
      ],
      skillInterval: 3,
    },
    tileCount: 10,
    playerHP: 100,
    skillReward: null,
  },
];

// Map boss image folders dynamically
const bossFolders = [
  'a_giant_translucent_green_slime_monster_in_a_lush_grassland_environment._high',
  'a_fierce_red_skinned_goblin_warrior_in_a_dark_cave_environment_with_glowing',
  'a_massive_translucent_ice_golem_made_of_jagged_blue_ice_in_a_snowy_blizzard',
  'a_ferocious_thunder_wolf_with_fur_crackling_with_blue_electricity_in_a_stormy',
  'a_colossal_sea_serpent_with_blue_scales_rising_from_powerful_ocean_waves._high',
  'a_spectral_shadow_knight_in_dark_heavy_armor_wielding_a_dark_blade_standing_in',
  'a_winged_lava_dragon_breathing_fire_in_a_volcanic_environment_with_eruptions_',
  'a_sinister_lich_king_in_dark_robes_holding_a_glowing_staff_in_a_dark_tower_',
  'a_majestic_ancient_dragon_perched_on_a_snowy_mountain_summit_with_clouds_and',
  'the_ultimate_demon_lord_sitting_on_a_grand_golden_throne_surrounded_by_chaotic'
];

// Map background image folders dynamically
const bgFolders = [
  'high_fantasy_rpg_battle_background_level_1_lush_grassland_environment_with',
  'high_fantasy_rpg_battle_background_level_2_deep_dark_cave_with_glowing_red_lava',
  'high_fantasy_rpg_battle_background_level_3_snowy_mountain_peaks_during_a',
  'high_fantasy_rpg_battle_background_level_4_stormy_hills_at_night_with_blue',
  'high_fantasy_rpg_battle_background_level_5_vast_ocean_with_massive_crashing',
  'high_fantasy_rpg_battle_background_level_6_eerie_graveyard_at_night_with_thick',
  'high_fantasy_rpg_battle_background_level_7_inside_a_massive_volcano_with_rivers',
  'high_fantasy_rpg_battle_background_level_8_top_of_a_dark_sinister_tower_with',
  'high_fantasy_rpg_battle_background_level_9_high_altitude_snowy_summit_with',
  'high_fantasy_rpg_battle_background_level_10_grand_demonic_throne_room_with'
];

LEVELS.forEach((lvl) => {
  if (lvl && lvl.level) {
    const idx = lvl.level - 1;
    if (bossFolders[idx]) {
      lvl.bossImage = `/assets/card-NPC/${bossFolders[idx]}/screen.png`;
    }
    if (bgFolders[idx]) {
      lvl.bgImage = `/assets/backgroud-level/${bgFolders[idx]}/screen.png`;
    }
  }
});


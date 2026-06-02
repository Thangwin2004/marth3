/**
 * ===== src/config.js =====
 * 
 * Game configuration for Match-3 Boss Battle RPG.
 * 
 * Canvas: 1100×750
 * Board: 8×8 (default, can be overridden per level)
 * TileSize: 50px
 */

export const Config = {
    /** Canvas dimensions */
    canvas: {
        width: 1100,
        height: 750,
    },

    /** Default board size (can be overridden by level config) */
    board: {
        rows: 8,
        cols: 8,
    },

    /** Tile size in pixels */
    tileSize: 65,

    /**
     * All tile types available in the game.
     * Each level uses a subset (first N types) based on difficulty.
     */
    tileColors: [
        'fire', 'water', 'nature', 'ice', 'lightning',
        'earth', 'wind-air', 'psychic-eye', 'sun', 'poison-death',
    ],

    /**
     * Asset mappings: alias → file path
     * PixiJS Assets.load() uses these to cache textures.
     */
    assets: {
        fire: '/assets/tile/fire.svg',
        water: '/assets/tile/Water.svg',
        nature: '/assets/tile/Nature.svg',
        ice: '/assets/tile/Ice.svg',
        lightning: '/assets/tile/Lightning.svg',
        earth: '/assets/tile/Earth.svg',
        'wind-air': '/assets/tile/Windy.svg',
        'psychic-eye': '/assets/tile/Psychic.svg',
        sun: '/assets/tile/Sun.svg',
        'poison-death': '/assets/tile/Poison.svg',
    },

    /**
     * Match length multipliers for damage calculation.
     * 3 tiles = ×1.0 (base), 4 tiles = ×1.3, 5 tiles = ×1.6, 6+ tiles = ×2.0
     */
    matchMultipliers: {
        3: 1.0,
        4: 1.3,
        5: 1.6,
        6: 2.0,
    },

    /**
     * Combo chain multipliers.
     * chain 1 = ×1.0, chain 2 = ×1.5, chain 3 = ×2.0, chain 4+ = ×2.5
     */
    comboMultipliers: [0, 1.0, 1.5, 2.0, 2.5],

    /** Turn timer (seconds per turn) */
    turnTimer: 20,

    /** Default player HP per level */
    playerHP: 100,
};

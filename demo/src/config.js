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
    width: 1200,
    height: 750,
  },

  /** Default board size (can be overridden by level config) */
  board: {
    rows: 8,
    cols: 7,
  },

  /** Tile size in pixels */
  tileSize: 100,

  /**
   * All tile types available in the game.
   * We limit it to 6 colors for a standard playable 8x8 board.
   */
  tileColors: ["duck", "turtle", "husky", "daulan", "laclac", "echxanh"],

  /**
   * Asset mappings: alias → file path
   * PixiJS Assets.load() uses these to cache textures.
   */
  assets: {
    duck: "/assets/imagenobackgrd/003_avatar_duck.webp",
    turtle: "/assets/imagenobackgrd/004_avatar_turtle.webp",
    husky: "/assets/imagenobackgrd/008_avatar_husky.webp",
    daulan: "/assets/imagenobackgrd/015_avatar_dauLan.webp",
    laclac: "/assets/imagenobackgrd/001_avatar_laclac.webp",
    echxanh: "/assets/imagenobackgrd/010_avatar_echxanh1.webp",
    home_btn: "/assets/home_btn.webp",
    settings_btn: "/assets/settings_btn.webp",
    close_btn: "/assets/close_btn.webp",
    replay_btn: "/assets/replay_btn.webp",
    play_btn: "/assets/play_btn.webp",
    play_btn_rect: "/assets/play_btn_rect.webp",
    trophy_btn: "/assets/trophy_btn.webp",
    back_btn: "/assets/back_btn.webp",
    profile_btn: "/assets/profile_btn.webp",
    delete_btn: "/assets/delete_btn.webp",
    revive_btn: "/assets/revive_btn.webp",
    x2_btn: "/assets/x2_btn.webp",
    continue_btn: "/assets/continue_btn.webp",
    toggle_on: "/assets/toggle_on.webp",
    toggle_off: "/assets/toggle_off.webp",
  },

  /**
   * Match length multipliers for score calculation.
   */
  matchMultipliers: {
    3: 1.0,
    4: 1.5,
    5: 2.0,
  },

  /**
   * Combo chain multipliers.
   */
  comboMultipliers: [0, 1.0, 1.5, 2.0, 2.5, 3.0],
};

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
    duck: "/assets/imagenobackgrd/003_avatar_duck.png",
    turtle: "/assets/imagenobackgrd/004_avatar_turtle.png",
    husky: "/assets/imagenobackgrd/008_avatar_husky.png",
    daulan: "/assets/imagenobackgrd/015_avatar_dauLan.png",
    laclac: "/assets/imagenobackgrd/001_avatar_laclac.png",
    echxanh: "/assets/imagenobackgrd/010_avatar_echxanh1.png",
    home_btn: "/assets/home_btn.png",
    settings_btn: "/assets/settings_btn.png",
    close_btn: "/assets/close_btn.png",
    replay_btn: "/assets/replay_btn.png",
    play_btn: "/assets/play_btn.png",
    play_btn_rect: "/assets/play_btn_rect.png",
    trophy_btn: "/assets/trophy_btn.png",
    back_btn: "/assets/back_btn.png",
    profile_btn: "/assets/profile_btn.png",
    delete_btn: "/assets/delete_btn.png",
    revive_btn: "/assets/revive_btn.png",
    x2_btn: "/assets/x2_btn.png",
    continue_btn: "/assets/continue_btn.png",
    toggle_on: "/assets/toggle_on.png",
    toggle_off: "/assets/toggle_off.png",
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

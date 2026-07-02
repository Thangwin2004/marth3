import {
  Container,
  Text,
  Graphics,
  Texture,
  Sprite,
  Assets,
  BlurFilter,
  FillGradient,
  GraphicsContext,
  TextStyle,
  Rectangle,
} from "pixi.js";
import { Board } from "../game/Board.js";
import { CombinationManager } from "../game/CombinationManager.js";
import { App } from "../system/App.js";
import { saveManager } from "../system/SaveManager.js";
import { sceneManager } from "../system/SceneManager.js";
import { soundManager } from "../system/SoundManager.js";
import gsap from "gsap";
import { Colorful3DCircleButton, Colorful3DButton, createVectorIcon as createVectorIconFromUI, mapEmojiToIconType } from "../system/UIComponents.js";

function gameAlert(message) {
  return new Promise((resolve) => {
    if (!document.getElementById("game-alert-styles")) {
      const style = document.createElement("style");
      style.id = "game-alert-styles";
      style.textContent = `
        .game-alert-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100dvw;
          height: 100dvh;
          background: rgba(0, 0, 0, 0.65);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 100000;
          opacity: 0;
          transition: opacity 0.25s ease;
        }
        .game-alert-card {
          background: #fbfaf5;
          border: 5px solid #5900b3;
          box-shadow: inset 0 0 0 2.5px #ffea00, 0 10px 25px rgba(0, 0, 0, 0.35);
          border-radius: 20px;
          padding: 28px 24px;
          width: 85%;
          max-width: 340px;
          text-align: center;
          transform: scale(0.85);
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          font-family: 'Outfit', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        .game-alert-text {
          color: #360207;
          font-size: 17px;
          line-height: 1.6;
          margin: 0 0 24px 0;
          font-weight: 700;
          text-shadow: 0 1px 0 rgba(255,255,255,0.8);
        }
        .game-alert-img-btn {
          height: 48px;
          width: auto;
          cursor: pointer;
          transition: transform 0.1s ease, filter 0.1s ease;
        }
        .game-alert-img-btn:hover {
          transform: scale(1.08);
          filter: brightness(1.08);
        }
        .game-alert-img-btn:active {
          transform: scale(0.96);
          filter: brightness(0.92);
        }
      `;
      document.head.appendChild(style);
    }

    const existing = document.getElementById("game-alert-overlay-id");
    if (existing) existing.remove();

    const overlay = document.createElement("div");
    overlay.id = "game-alert-overlay-id";
    overlay.className = "game-alert-overlay";

    const card = document.createElement("div");
    card.className = "game-alert-card";

    const text = document.createElement("p");
    text.className = "game-alert-text";
    text.innerText = message;

    const button = document.createElement("img");
    button.className = "game-alert-img-btn";
    button.src = "assets/yes_btn.png";
    button.alt = "ĐỒNG Ý";

    card.appendChild(text);
    card.appendChild(button);
    overlay.appendChild(card);

    const container = document.getElementById("app") || document.body;
    container.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      card.style.transform = "scale(1)";
    });

    const closeAlert = () => {
      overlay.style.opacity = "0";
      card.style.transform = "scale(0.85)";
      setTimeout(() => {
        overlay.remove();
        resolve();
      }, 250);
    };

    button.addEventListener("click", closeAlert);
  });
}

export const AdManager = {
  showRewardedVideo: async () => {
    console.log("[AdManager] Requesting Rewarded Video Ad...");
    await gameAlert(
      "📺 Đang tải quảng cáo... Vui lòng xem hết để nhận phần thưởng!",
    );
    return new Promise((resolve) => {
      setTimeout(async () => {
        await gameAlert(
          "🎉 Cảm ơn bạn đã xem quảng cáo! Phần thưởng đã được mở khóa.",
        );
        resolve(true);
      }, 2000);
    });
  },
  showInterstitial: async () => {
    console.log("[AdManager] Showing Interstitial Ad...");
    await gameAlert("📺 Đang hiển thị quảng cáo giữa màn hình...");
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 1000);
    });
  },
};

const ALL_AVATAR_FILES = [
  "001_avatar_laclac.png",
  "002_avatar_cat_lick1.png",
  "003_avatar_duck.png",
  "004_avatar_turtle.png",
  "005_avatar_long.png",
  "006_avatar_horse.png",
  "007_avatar_tiguawhite.png",
  "008_avatar_husky.png",
  "009_avatar_doremonk.png",
  "010_avatar_echxanh1.png",
  "011_avatar_nudaeng.png",
  "012_avatar_hubcat.png",
  "013_avatar_unicorn.png",
  "014_avatar_zongbadou.png",
  "015_avatar_dauLan.png",
  "016_avatar_banhtung.png",
  "017_avatar_tiguayel.png",
  "018_avatar_megachard.png",
  "019_avatar_gigaboy.png",
  "020_avatar_cloudball.png",
  "021_avatar_culama.png",
  "022_avatar_poolpanda.png",
  "023_avatar_trollvn.png",
  "024_avatar_heothy.png",
  "025_avatar_zolype.png",
  "026_avatar_crick.png",
  "027_avatar_penguine.png",
  "028_avatar_timao.png",
  "029_avatar_caocal.png",
  "030_avatar_cowboy.png",
  "031_avatar_ninjadog.png",
  "032_avatar_petrocat.png",
  "033_avatar_richmonkey.png",
  "034_avatar_hazagi.png",
  "035_avatar_dogoin.png",
  "036_avatar_watermelon.png",
  "037_avatar_timone.png",
  "038_avatar_ronaldo.png",
  "039_avatar_hustmouse.png",
  "040_avatar_hitbear.png",
  "041_avatar_echxanh2.png",
  "042_avatar_zolype2.png",
  "043_avatar_cat_lick2.png",
  "044_avatar_poolpanda2.png",
];

function killTweensRecursive(obj) {
  if (!obj) return;
  gsap.killTweensOf(obj);
  if (obj.scale) gsap.killTweensOf(obj.scale);
  if (obj.position) gsap.killTweensOf(obj.position);
  if (obj.pivot) gsap.killTweensOf(obj.pivot);
  if (obj.skew) gsap.killTweensOf(obj.skew);
  if (obj.children) {
    const children = [...obj.children];
    children.forEach(killTweensRecursive);
  }
}

const palettes = {
  yellow: { top: 0xFFE500, bottom: 0xFF9900, shadow: 0x8A4500, stroke: 0xFFF8B3 },
  green:  { top: 0x7FFF00, bottom: 0x00CC00, shadow: 0x006600, stroke: 0xD4FFD4 },
  pink:   { top: 0xFF66B2, bottom: 0xCC0066, shadow: 0x800040, stroke: 0xFFE6F2 },
  blue:   { top: 0x33CCFF, bottom: 0x0088CC, shadow: 0x004466, stroke: 0xE6F9FF },
  purple: { top: 0xB266FF, bottom: 0x5900B3, shadow: 0x330066, stroke: 0xF2E6FF },
  red:    { top: 0xF95E8B, bottom: 0xD93955, shadow: 0x92233F, stroke: 0xFFD4E2 }
};

const getColorStyle = (colorValue, label = "") => {
  const lbl = String(label).toUpperCase();
  if (lbl.includes("PLAY") || lbl.includes("CHƠI LẠI")) return "green";
  if (lbl.includes("TIẾP TỤC")) return "yellow";
  if (lbl.includes("QUAY LẠI") || lbl.includes("BACK") || lbl.includes("TRANG CHỦ")) return "blue";
  if (lbl.includes("XÓA") || lbl.includes("RESET")) return "red";
  
  if (colorValue === 0x5c0612 || colorValue === 0xd32f2f) return "red";
  if (colorValue === 0x1b0103) return "blue";
  if (colorValue === 0x4caf50 || colorValue === 0x2ecc71) return "green";
  if (colorValue === 0xffaa00 || colorValue === 0xffea00) return "yellow";
  
  return "purple";
};

function getIconTexture(emojiChar) {
  const mapping = {
    "🏠": "home_btn",
    "🏡": "home_btn",
    "⚙️": "settings_btn",
    "✕": "close_btn",
    "↩️": "back_btn",
    "👤": "profile_btn",
    "▶️": "continue_btn",
    "🏆": "trophy_btn",
    "🔄": "replay_btn",
    "🗑️": "delete_btn",
    "heart": "revive_btn",
    "star": "x2_btn"
  };

  const charStr = String(emojiChar);
  for (const key of Object.keys(mapping)) {
    if (charStr.includes(key)) {
      return Texture.from(mapping[key]);
    }
  }
  return null;
}

function createVectorIcon(emojiChar, size = 24) {
  const tex = getIconTexture(emojiChar);
  if (tex) {
    const sprite = new Sprite(tex);
    sprite.anchor.set(0.5);
    const finalSize = String(emojiChar).includes("🗑️") ? size * 1.55 : size;
    sprite.width = finalSize;
    sprite.height = finalSize;
    return sprite;
  }
  return createVectorIconFromUI(emojiChar, size);
}

export class GameScene {
  constructor(data = {}) {
    this.container = new Container();
    this.container.sortableChildren = true;

    App.setBackgroundColor(0x0a0a1a);

    // Hide the user profile widget during gameplay to prevent overlapping with HUD
    const profileWidget = document.getElementById("user-profile");
    if (profileWidget) {
      profileWidget.style.display = "none";
    }

    // Lower BGM volume during gameplay so explosion SFX pop out
    soundManager.setBGMVolume(0.25);

    // === SHOW LOADING OVERLAY ===
    // Background to cover the transition
    this.loadingBg = new Graphics();
    this.loadingBg.rect(0, 0, App.app.screen.width, App.app.screen.height);
    this.loadingBg.fill(0x241442); // Deep vibrant purple matching game aesthetic
    this.container.addChild(this.loadingBg);

    // Animated logo for loading screen (replacing text and tribal avatar)
    this.loadingAvatar = Sprite.from("/logo.png");
    this.loadingAvatar.anchor.set(0.5);
    this.loadingAvatar.x = App.app.screen.width / 2;
    this.loadingAvatar.y = App.app.screen.height / 2;
    // Scale logo down slightly depending on its intrinsic size (adjusting scale)
    this.loadingAvatar.scale.set(0.8);
    this.container.addChild(this.loadingAvatar);

    // Animate the logo to make the loading screen feel alive
    gsap.to(this.loadingAvatar.scale, {
      x: 0.9,
      y: 0.9,
      duration: 0.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    gsap.to(this.loadingAvatar, {
      y: this.loadingAvatar.y - 10,
      duration: 0.6,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });

    // Load background and avatars, then start with smooth fade out
    const startTime = Date.now();
    this.loadResources().then(() => {
      const elapsed = Date.now() - startTime;
      const minDuration = 600; // minimum duration in ms
      const delay = Math.max(0, minDuration - elapsed);
      setTimeout(() => {
        if (this.loadingBg && !this.loadingBg.destroyed) {
          gsap.to(this.loadingBg, {
            alpha: 0,
            duration: 0.3,
            onComplete: () => {
              this.loadingBg.destroy();
            }
          });
        }
        if (this.loadingAvatar && !this.loadingAvatar.destroyed) {
          gsap.killTweensOf(this.loadingAvatar);
          gsap.killTweensOf(this.loadingAvatar.scale);
          gsap.to(this.loadingAvatar, {
            alpha: 0,
            duration: 0.25,
            onComplete: () => {
              this.loadingAvatar.destroy();
              this.initGame();
            }
          });
        } else {
          this.initGame();
        }
      }, delay);
    });
  }

  async loadResources() {
    try {
      // 1. Randomize and select a background
      const bgIndex = Math.floor(Math.random() * 3) + 1;
      const bgPath = `/assets/backgroud/vietnamese_cultural_landscape_background_${bgIndex}/screen.png`;
      this.bgTexture = await Assets.load(bgPath);

      // 2. Randomize and select 6 distinct avatars from the 44, avoiding duplicates (e.g., cat_lick1 and cat_lick2)
      const getBaseName = (filename) => {
        const name = filename.replace(".png", "").split("_").slice(2).join("_");
        return name.replace(/\d+$/, ""); // Remove trailing numbers
      };

      const chosenFiles = [];
      const chosenBases = new Set();
      const shuffledFiles = [...ALL_AVATAR_FILES].sort(
        () => 0.5 - Math.random(),
      );

      for (const file of shuffledFiles) {
        const base = getBaseName(file);
        if (!chosenBases.has(base)) {
          chosenFiles.push(file);
          chosenBases.add(base);
        }
        if (chosenFiles.length === 6) break;
      }

      this.sessionColors = chosenFiles.map((file) => {
        const parts = file.replace(".png", "").split("_");
        return parts.slice(2).join("_");
      });

      // 3. Load the 6 chosen avatars dynamically in parallel
      const loadPromises = chosenFiles.map((file, idx) => {
        const alias = this.sessionColors[idx];
        const src = `/assets/imagebldp/${file}`;
        return Assets.load({ alias, src });
      });
      await Promise.all(loadPromises);
    } catch (err) {
      console.error("Failed to load GameScene dynamic assets:", err);
    }
  }

  initGame() {
    // Destroy loading text
    if (this.loadingText) {
      this.loadingText.destroy();
      this.loadingText = null;
    }

    // === CREATE BACKGROUND ===
    this.bg = new Sprite(this.bgTexture);
    this.bg.width = App.app.screen.width;
    this.bg.height = App.app.screen.height;
    this.bg.tint = 0x888888; // brighter background for clearer landscape
    this.container.addChild(this.bg);

    // === CREATE AMBIENT PARTICLES ===
    this.createAmbientParticles();

    // === CREATE BOARD ===
    // Pass session colors so the board uses them
    this.board = new Board(null, this.sessionColors);
    this.createBoardBackground();

    // Add board and bg outlines
    this.container.addChild(this.boardBg);
    this.container.addChild(this.board.container);

    // === CREATE COMBINATION MANAGER ===
    this.combinationManager = new CombinationManager(this.board);

    // === GAME STATE ===
    this.selectedTile = null;
    this.disabled = false;
    this.score = 0;
    this.moves = 30;
    this.comboCount = 0;
    this.isGameOver = false;
    this.hasContinued = false;

    // === REMOVE INITIAL MATCHES ===
    this.removeStartMatches();

    // Check if there is at least one possible move at start
    if (!this.combinationManager.hasPossibleMoves()) {
      this.board.shuffleAll(this.combinationManager, false);
    }

    // === CREATE UI ===
    this.createUI();

    // === LISTEN FOR GRID EVENTS ===
    this.board.container.on("tile-touch-start", this.onTileClick.bind(this));

    // Adjust all components positions and scaling
    this.resize();

    // Entrance animation
    this.container.alpha = 0;
    gsap.to(this.container, { alpha: 1, duration: 0.5 });
  }

  /**
   * Create the dark background outline for the board.
   */
  createBoardBackground() {
    const boardWidth = this.board.cols * App.config.tileSize;
    const boardHeight = this.board.rows * App.config.tileSize;
    const padding = 16;
    const w = boardWidth + padding * 2;
    const h = boardHeight + padding * 2;
    const shadowOffset = 8;

    const theme = palettes.purple;

    this.boardBg = new Graphics();
    
    // 1. 3D Shadow Base
    this.boardBg.roundRect(0, shadowOffset, w, h, 24);
    this.boardBg.fill({ color: theme.shadow });

    // 2. Main Face Background (gradient)
    const bgGrad = new FillGradient({
      start: { x: 0, y: 0 },
      end: { x: 0, y: h },
      colorStops: [
        { offset: 0, color: theme.top },
        { offset: 1, color: theme.bottom }
      ]
    });
    this.boardBg.roundRect(0, 0, w, h, 24);
    this.boardBg.fill({ fill: bgGrad });
    this.boardBg.stroke({ width: 5, color: theme.stroke });

    // 3. Highlight Sheen
    this.boardBg.ellipse(w / 2, h * 0.12, w * 0.45, h * 0.08);
    this.boardBg.fill({ color: 0xffffff, alpha: 0.15 });

    // Scale background with the board container
    const scale = this.board.container.scale.x;
    this.boardBg.scale.set(scale);

    // Align background with board
    this.boardBg.x = this.board.container.x - padding * scale;
    this.boardBg.y = this.board.container.y - padding * scale;
  }

  createAmbientParticles() {
    const tempParticle = new Graphics();
    tempParticle.circle(8, 8, 8);
    tempParticle.fill({ color: 0xffffff });
    const particleTexture = App.app.renderer.generateTexture({
      target: tempParticle,
    });
    tempParticle.destroy();

    this.ambientParticles = [];
    for (let i = 0; i < 25; i++) {
      const size = 1.2 + Math.random() * 3.5;
      const p = new Sprite(particleTexture);
      p.anchor.set(0.5);
      p.width = size * 2;
      p.height = size * 2;
      const colors = [0x4fc3f7, 0xffeb3b, 0x00e676, 0xff5252, 0xd500f9];
      p.tint = colors[Math.floor(Math.random() * colors.length)];
      p.alpha = 0.08 + Math.random() * 0.18;
      p.x = Math.random() * App.app.screen.width;
      p.y = Math.random() * App.app.screen.height;
      this.container.addChild(p);
      this.ambientParticles.push(p);

      gsap.to(p, {
        y: -20,
        x: p.x + (Math.random() - 0.5) * 120,
        alpha: 0,
        duration: 6 + Math.random() * 10,
        repeat: -1,
        delay: Math.random() * 6,
        onRepeat: () => {
          p.y = App.app.screen.height + 20;
          p.x = Math.random() * App.app.screen.width;
          p.alpha = 0.08 + Math.random() * 0.18;
        },
      });
    }
  }

  spawnFloatingScore(x, y, textString) {
    const floatText = new Text({
      text: textString,
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 26,
        fontWeight: "bold",
        fill: "#ffdd57",
        
        
      },
    });
    floatText.anchor.set(0.5);
    floatText.x = x;
    floatText.y = y;
    floatText.zIndex = 80;
    this.container.addChild(floatText);

    gsap.to(floatText, {
      y: y - 70,
      alpha: 0,
      duration: 0.9,
      ease: "power2.out",
      onComplete: () => floatText.destroy(),
    });

    floatText.scale.set(0.4);
    gsap.to(floatText.scale, {
      x: 1.15,
      y: 1.15,
      duration: 0.25,
      ease: "back.out(2.5)",
    });
  }

  /**
   * Create top HUD elements (Score, Moves).
   */
  createUI() {
    this.uiContainer = new Container();
    this.container.addChild(this.uiContainer);

    // === SCORE PANEL BACKGROUND ===
    this.scorePanel = new Graphics();
    this.uiContainer.addChild(this.scorePanel);

    // === SCORE LABEL ===
    this.scoreText = new Text({
      text: "ĐIỂM: 0",
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 24,
        fontWeight: "900",
        fill: "#ffffff",
        
        
        padding: 24,
      },
    });
    this.scoreText.anchor.set(0.5);
    this.uiContainer.addChild(this.scoreText);

    // === MOVES PANEL BACKGROUND ===
    this.movesPanel = new Graphics();
    this.uiContainer.addChild(this.movesPanel);

    // === MOVES LABEL ===
    this.movesText = new Text({
      text: `LƯỢT ĐI: ${this.moves}`,
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 24,
        fontWeight: "900",
        fill: "#ffffff",
        
        
        padding: 24,
      },
    });
    this.movesText.anchor.set(0.5);
    this.uiContainer.addChild(this.movesText);

    // === COMBO TEXT (Hidden by default) ===
    this.comboText = new Text({
      text: "",
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 42,
        fontWeight: "bold",
        fill: "#ff5252",
        
        
      },
    });
    this.comboText.anchor.set(0.5);
    this.comboText.visible = false;
    this.uiContainer.addChild(this.comboText);

    this.tutorialText = new Text({
      text: "👉 Nhấp hai con thú cạnh nhau để đổi chỗ và tạo nhóm 3 cùng loại!",
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 14,
        fontWeight: "bold",
        fill: "#ffecb3",
        
        
      },
    });
    this.tutorialText.anchor.set(0.5);
    this.uiContainer.addChild(this.tutorialText);

    // === SETTINGS BUTTON ===
    this.settingsBtn = this.createCircularButton(
      "⚙️",
      0,
      0,
      () => {
        this.showSettingsModal(true);
      },
    );
    this.uiContainer.addChild(this.settingsBtn);
  }

  /**
   * Update HUD texts with scale pulsing effects.
   */
  updateUI() {
    const newScoreStr = `ĐIỂM: ${this.score}`;
    const newMovesStr = `LƯỢT ĐI: ${this.moves}`;

    if (this.scoreText.text !== newScoreStr) {
      this.scoreText.text = newScoreStr;
      gsap.killTweensOf(this.scoreText.scale);
      this.scoreText.scale.set(1);
      gsap.to(this.scoreText.scale, {
        x: 1.18,
        y: 1.18,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
    }

    if (this.movesText.text !== newMovesStr) {
      this.movesText.text = newMovesStr;
      gsap.killTweensOf(this.movesText.scale);
      this.movesText.scale.set(1);
      gsap.to(this.movesText.scale, {
        x: 1.18,
        y: 1.18,
        duration: 0.12,
        yoyo: true,
        repeat: 1,
        ease: "power2.out",
      });
    }
  }

  /**
   * Pop combo text with animations.
   */
  showComboText(comboNum) {
    if (comboNum < 2) return;
    this.comboText.text = `COMBO x${comboNum}! 🔥`;
    this.comboText.visible = true;
    this.comboText.alpha = 1;
    this.comboText.scale.set(0.5);
    this.comboText.y = App.app.screen.height / 2 - 100;

    // Kill active tweens on comboText
    gsap.killTweensOf(this.comboText);
    gsap.killTweensOf(this.comboText.scale);

    gsap.to(this.comboText.scale, {
      x: 1.3,
      y: 1.3,
      duration: 0.25,
      ease: "back.out(2.5)",
    });
    gsap.to(this.comboText, {
      alpha: 0,
      y: App.app.screen.height / 2 - 180,
      duration: 1.0,
      delay: 0.4,
      ease: "power2.out",
      onComplete: () => {
        this.comboText.visible = false;
      },
    });
  }

  // ============================================================
  //  INPUT HANDLING
  // ============================================================

  onTileClick(tile) {
    if (this.disabled || this.isGameOver) return;

    soundManager.playClick();

    if (this.selectedTile) {
      if (this.selectedTile === tile) {
        this.clearSelection();
      } else if (!this.isNeighbour(this.selectedTile, tile)) {
        this.clearSelection();
        this.selectTile(tile);
      } else {
        this.swap(this.selectedTile, tile);
      }
    } else {
      this.selectTile(tile);
    }
  }

  selectTile(tile) {
    this.selectedTile = tile;
    this.selectedTile.field.select();

    // Wobble and pulse the selected tile scale
    if (tile.sprite && !tile.sprite.destroyed) {
      gsap.killTweensOf(tile.sprite.scale);
      const baseScale = 1.0; // Standard container baseline scale

      gsap.to(tile.sprite.scale, {
        x: baseScale * 1.12,
        y: baseScale * 1.12,
        duration: 0.22,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
      });
    }
  }

  clearSelection() {
    if (this.selectedTile) {
      this.selectedTile.field.unselect();

      // Restore scale of selection
      const tile = this.selectedTile;
      if (tile.sprite && !tile.sprite.destroyed) {
        gsap.killTweensOf(tile.sprite.scale);
        const baseScale = 1.0; // Standard container baseline scale
        gsap.to(tile.sprite.scale, {
          x: baseScale,
          y: baseScale,
          duration: 0.15,
        });
      }

      this.selectedTile = null;
    }
  }

  isNeighbour(tile1, tile2) {
    const rowDiff = Math.abs(tile1.field.row - tile2.field.row);
    const colDiff = Math.abs(tile1.field.col - tile2.field.col);
    return rowDiff + colDiff === 1;
  }

  // ============================================================
  //  SWAP & MATCH LOGIC
  // ============================================================

  swap(selectedTile, tile, reverse = false) {
    this.disabled = true;
    this.clearSelection();
    selectedTile.sprite.zIndex = 2;

    if (!reverse) {
      soundManager.playSwap();
      this.lastSwappedTile1 = selectedTile;
      this.lastSwappedTile2 = tile;
    }

    selectedTile.moveTo(tile.field.position, 0.2);
    tile.moveTo(selectedTile.field.position, 0.2).then(() => {
      selectedTile.sprite.zIndex = 1;
      this.board.swap(selectedTile, tile);

      if (!reverse) {
        // Find matches in the affected rows and cols first
        const { dirtyRows, dirtyCols } =
          this.combinationManager.getDirtyRegionAfterSwap(selectedTile, tile);
        const matches = this.combinationManager.getMatchesInRegion(
          dirtyRows,
          dirtyCols,
        );

        if (matches.length) {
          this.moves--;
          this.comboCount = 0;
          this.lastAffectedCols = [...dirtyCols];
          this.updateUI();

          // Check if BOTH swapped tiles are special
          const isTile1Special =
            selectedTile.isRune ||
            selectedTile.isRainbow ||
            selectedTile.isDrum;
          const isTile2Special = tile.isRune || tile.isRainbow || tile.isDrum;

          if (isTile1Special && isTile2Special) {
            this.processSpecialCombo(selectedTile, tile);
          } else {
            this.processMatches(matches);
          }
        } else {
          // No matches -> Swap back
          this.swap(tile, selectedTile, true);
        }
      } else {
        // Unlock input
        this.disabled = false;
      }
    });
  }

  async processSpecialCombo(tile1, tile2) {
    this.disabled = true;

    const row = tile2.field ? tile2.field.row : 0;
    const col = tile2.field ? tile2.field.col : 0;
    const pX = tile2.sprite
      ? tile2.sprite.x * this.board.container.scale.x + this.board.container.x
      : 0;
    const pY = tile2.sprite
      ? tile2.sprite.y * this.board.container.scale.y + this.board.container.y
      : 0;

    let totalAdded = 0;
    const multiplier = Math.max(1, this.comboCount);

    let destroyedTiles = [];
    let comboTextStr = "";
    let soundType = "super";
    let shakeIntensity = 20;

    // Identify types
    const isRainbow1 = tile1.isRainbow;
    const isRainbow2 = tile2.isRainbow;
    const isDrum1 = tile1.isDrum;
    const isDrum2 = tile2.isDrum;
    const isRune1 = tile1.isRune;
    const isRune2 = tile2.isRune;

    // Capture columns before removing tiles
    const col1 = tile1.field ? tile1.field.col : col;
    const col2 = tile2.field ? tile2.field.col : col;

    // Remove the two swapped tiles first (so they don't get processed again)
    tile1.remove(true);
    tile2.remove(true);

    if (isRainbow1 && isRainbow2) {
      // 1. Rainbow + Rainbow: Clear board
      comboTextStr = "SIÊU BÃO CẦU VỒNG! 🌈";
      soundType = "super";
      shakeIntensity = 30;

      // Multicolored expanding rainbow ripples
      const rainbowColors = [
        0xff1744, 0xff9100, 0xffea00, 0x00e676, 0x2979ff, 0xd500f9,
      ];
      rainbowColors.forEach((color, index) => {
        gsap.delayedCall(index * 0.08, () => {
          this.spawnRipple(pX, pY, color);
          this.screenShake(25 - index * 2);
        });
      });

      // Wipe board
      destroyedTiles = this.board.destroySuperRainbow();
      totalAdded += (500 + destroyedTiles.length * 15) * multiplier;
    } else if (
      (isRainbow1 && (isDrum2 || isRune2)) ||
      (isRainbow2 && (isDrum1 || isRune1))
    ) {
      // 2. Rainbow + Drum or Rainbow + Rune
      const specialType = isDrum1 || isDrum2 ? "drum" : "rune";
      const otherTile = isRainbow1 ? tile2 : tile1;
      const targetColor =
        otherTile.color !== "rainbow" && otherTile.color !== "stone"
          ? otherTile.color
          : this.sessionColors[
              Math.floor(Math.random() * this.sessionColors.length)
            ];

      comboTextStr =
        specialType === "drum"
          ? "CƠN MƯA TRỐNG ĐỒNG! 🥁"
          : "BÃO CHỮ THẬP RUNE! ⚡";
      soundType = specialType === "drum" ? "drum" : "rune";
      shakeIntensity = 25;

      this.spawnRipple(pX, pY, 0x00ffff);
      soundManager.playRainbowExplosion();

      // Find all tiles of targetColor
      const targetFields = [];
      this.board.fields.forEach((field) => {
        if (
          field.tile &&
          !field.isVoid &&
          field.tile.color === targetColor &&
          !field.tile.isStone
        ) {
          targetFields.push(field);
        }
      });

      // Shoot rainbow laser beams to all target positions
      const targetPositions = targetFields.map((field) => {
        const t = field.tile;
        const tX =
          t.sprite.x * this.board.container.scale.x + this.board.container.x;
        const tY =
          t.sprite.y * this.board.container.scale.y + this.board.container.y;
        return { x: tX, y: tY, color: targetColor };
      });
      this.spawnRainbowBlast(pX, pY, targetPositions);

      // Convert them to special tiles
      targetFields.forEach((field) => {
        const t = field.tile;
        if (specialType === "drum") {
          t.isDrum = true;
          t.isRune = false;
          t.isRainbow = false;
        } else {
          t.isRune = true;
          t.isDrum = false;
          t.isRainbow = false;
        }
        t.updateStateOverlay();
      });

      // Wait a brief moment for the visual conversion and laser travel
      await this.delay(450);

      // Now detonate all of them sequentially
      const listToExplode = targetFields.map((f) => f.tile);
      for (const t of listToExplode) {
        if (!t || !t.field) continue;
        const r = t.field.row;
        const c = t.field.col;
        const tX =
          t.sprite.x * this.board.container.scale.x + this.board.container.x;
        const tY =
          t.sprite.y * this.board.container.scale.y + this.board.container.y;

        let extra = [];
        if (specialType === "drum") {
          soundManager.playDrumExplosion();
          this.spawnDrumVFX(tX, tY, false);
          extra = this.board.destroyArea3x3(r, c);
        } else {
          soundManager.playRuneExplosion();
          this.spawnCrossLeaves(tX, tY);
          extra = this.board.destroyCross(r, c);
        }

        destroyedTiles.push(t, ...extra);
        totalAdded += (40 + extra.length * 10) * multiplier;
        this.spawnParticles(tX, tY, t.color);
        await this.delay(100); // satisfying waterfall delay
      }
    } else if (isDrum1 && isDrum2) {
      // 3. Drum + Drum: Giant 5x5 area explosion
      comboTextStr = "ĐẠI TRỐNG ĐỒNG PHÁT NỔ! 💥";
      soundType = "super";
      shakeIntensity = 28;

      // Dual expanding bronze drums for cultural resonance
      this.spawnDrumVFX(pX, pY, true);
      gsap.delayedCall(0.15, () => {
        this.spawnDrumVFX(pX, pY, false);
        soundManager.playDrumExplosion();
      });

      this.spawnRipple(pX, pY, 0xcd7f32);
      gsap.delayedCall(0.12, () => this.spawnRipple(pX, pY, 0xffa726));

      destroyedTiles = this.board.destroyArea5x5(row, col);
      totalAdded += (250 + destroyedTiles.length * 15) * multiplier;
    } else if (isRune1 && isRune2) {
      // 4. Rune + Rune: Clears 3 rows and 3 columns (giant cross)
      comboTextStr = "SIÊU LƯỚI CHỮ THẬP! ⚔️";
      soundType = "rune";
      shakeIntensity = 24;

      soundManager.playSuperExplosion();

      const rowsToClear = [row - 1, row, row + 1].filter(
        (r) => r >= 0 && r < this.board.rows,
      );
      const colsToClear = [col - 1, col, col + 1].filter(
        (c) => c >= 0 && c < this.board.cols,
      );

      const fieldsToDestroy = new Set();
      rowsToClear.forEach((r) => {
        for (let c = 0; c < this.board.cols; c++) {
          const f = this.board.getField(r, c);
          if (f && f.tile && !f.isVoid) fieldsToDestroy.add(f);
        }
      });
      colsToClear.forEach((c) => {
        for (let r = 0; r < this.board.rows; r++) {
          const f = this.board.getField(r, c);
          if (f && f.tile && !f.isVoid) fieldsToDestroy.add(f);
        }
      });

      // Cross leaf whirlwind VFX along the axes
      this.spawnCrossLeaves(pX, pY);
      const tileSize = 100 * this.board.container.scale.x;
      gsap.delayedCall(0.1, () => {
        this.spawnCrossLeaves(pX - tileSize * 1.5, pY);
        this.spawnCrossLeaves(pX + tileSize * 1.5, pY);
        this.spawnCrossLeaves(pX, pY - tileSize * 1.5);
        this.spawnCrossLeaves(pX, pY + tileSize * 1.5);
      });

      fieldsToDestroy.forEach((f) => {
        destroyedTiles.push(f.tile);
        this.board._removeTileOverlays(f.tile);
        f.tile.remove();
      });

      totalAdded += (200 + destroyedTiles.length * 12) * multiplier;
    } else if ((isRune1 && isDrum2) || (isRune2 && isDrum1)) {
      // 5. Rune + Drum: Giant cross (3 rows and 3 columns)
      comboTextStr = "PHÁO HOA LIÊN HOÀN! 🎆";
      soundType = "super";
      shakeIntensity = 26;

      soundManager.playRuneExplosion();
      gsap.delayedCall(0.12, () => soundManager.playDrumExplosion());

      const rowsToClear = [row - 1, row, row + 1].filter(
        (r) => r >= 0 && r < this.board.rows,
      );
      const colsToClear = [col - 1, col, col + 1].filter(
        (c) => c >= 0 && c < this.board.cols,
      );

      const fieldsToDestroy = new Set();
      rowsToClear.forEach((r) => {
        for (let c = 0; c < this.board.cols; c++) {
          const f = this.board.getField(r, c);
          if (f && f.tile && !f.isVoid) fieldsToDestroy.add(f);
        }
      });
      colsToClear.forEach((c) => {
        for (let r = 0; r < this.board.rows; r++) {
          const f = this.board.getField(r, c);
          if (f && f.tile && !f.isVoid) fieldsToDestroy.add(f);
        }
      });

      // Golden Chim Lac birds and green bamboo leaves whirlwind combined!
      this.spawnDrumVFX(pX, pY, true);
      this.spawnCrossLeaves(pX, pY);

      fieldsToDestroy.forEach((f) => {
        destroyedTiles.push(f.tile);
        this.board._removeTileOverlays(f.tile);
        f.tile.remove();
      });

      totalAdded += (220 + destroyedTiles.length * 12) * multiplier;
    }

    // Apply score and floating text
    this.score += totalAdded;
    this.updateUI();
    this.spawnFloatingScore(pX, pY, `SIÊU PHỐI HỢP! +${totalAdded}`);

    // Show floating combo text
    if (comboTextStr) {
      this.comboText.text = comboTextStr;
      this.comboText.visible = true;
      this.comboText.alpha = 1;
      this.comboText.scale.set(0.5);
      this.comboText.y = 750 / 2 - 100;

      gsap.killTweensOf(this.comboText);
      gsap.killTweensOf(this.comboText.scale);

      gsap.to(this.comboText.scale, {
        x: 1.4,
        y: 1.4,
        duration: 0.35,
        ease: "back.out(2.5)",
      });
      gsap.to(this.comboText, {
        alpha: 0,
        y: 750 / 2 - 180,
        duration: 1.2,
        delay: 0.6,
        ease: "power2.out",
        onComplete: () => {
          this.comboText.visible = false;
        },
      });
    }

    // Sounds & Shake
    if (soundType === "super") {
      soundManager.playSuperExplosion();
    } else if (soundType === "drum") {
      soundManager.playDrumExplosion();
    } else if (soundType === "rune") {
      soundManager.playRuneExplosion();
    }
    this.screenShake(shakeIntensity);

    // Spawn particles for all destroyed tiles
    destroyedTiles.forEach((t) => {
      if (t && t.sprite && !t.sprite.destroyed) {
        const tX =
          t.sprite.x * this.board.container.scale.x + this.board.container.x;
        const tY =
          t.sprite.y * this.board.container.scale.y + this.board.container.y;
        this.spawnParticles(tX, tY, t.color);
      }
    });

    // Wait for animations
    await this.delay(250);

    // Fall down
    await this.processFallDown();

    // Add tiles
    await this.addTiles();

    // Check cascades
    const affectedCols = new Set([col1, col2]);
    destroyedTiles.forEach((t) => {
      if (t && t.originalField) {
        affectedCols.add(t.originalField.col);
      } else if (t && t.field) {
        affectedCols.add(t.field.col);
      }
    });
    const { dirtyRows, dirtyCols } =
      this.combinationManager.getDirtyRegionAfterCascade([...affectedCols]);
    this.lastAffectedCols = dirtyCols;
    const newMatches = this.combinationManager.getMatchesInRegion(
      dirtyRows,
      dirtyCols,
    );

    if (newMatches.length) {
      await this.delay(150);
      await this.processMatches(newMatches);
      return;
    }

    // Check game over
    if (this.moves <= 0) {
      this.showGameOver();
    } else {
      if (!this.combinationManager.hasPossibleMoves()) {
        await this.handleDeadlock();
      } else {
        this.disabled = false;
      }
    }
  }

  async processMatches(matches) {
    this.comboCount++;

    // Mark matches that are Super Blasts (match of 4 or 5 containing a special tile)
    matches.forEach((match) => {
      const hasSpecial = match.tiles.some(
        (tile) => tile.isRune || tile.isRainbow || tile.isDrum,
      );
      if ((match.length >= 4 || match.isTLMatch) && hasSpecial) {
        match.isSuperBlast = true;
      }
    });

    this.showComboText(this.comboCount);

    // Cache original field references before any explosions nullify them
    matches.forEach((match) => {
      match.tiles.forEach((tile) => {
        if (tile.field) {
          tile.originalField = tile.field;
        }
      });
    });

    // 1. Gather all matches details (center, coordinates, etc.)
    const pendingExplosions = [];

    matches.forEach((match) => {
      let centerTile =
        match.intersectionTile ||
        match.tiles.find(
          (t) => t === this.lastSwappedTile1 || t === this.lastSwappedTile2,
        );
      if (!centerTile) {
        centerTile = match.tiles[Math.floor(match.tiles.length / 2)];
      }
      const centerField = centerTile.originalField || centerTile.field;
      if (!centerField) return;

      const r = centerField.row;
      const c = centerField.col;

      // Get screen coordinates
      const pX = centerTile.sprite
        ? centerTile.sprite.x * this.board.container.scale.x +
          this.board.container.x
        : c * App.config.tileSize * this.board.container.scale.x +
          this.board.container.x +
          (App.config.tileSize * this.board.container.scale.x) / 2;
      const pY = centerTile.sprite
        ? centerTile.sprite.y * this.board.container.scale.y +
          this.board.container.y
        : r * App.config.tileSize * this.board.container.scale.y +
          this.board.container.y +
          (App.config.tileSize * this.board.container.scale.y) / 2;

      pendingExplosions.push({
        match,
        length: match.length,
        row: r,
        col: c,
        x: pX,
        y: pY,
        color: match.tiles[0].color,
      });
    });

    let totalAdded = 0;
    const multiplier = Math.max(1, this.comboCount);
    let playSoundType = this.comboCount >= 2 ? "combo" : "match";
    let hasMatch4 = false;
    let hasMatch5 = false;

    // 2. Process each explosion & calculate score
    pendingExplosions.forEach((exp) => {
      if (exp.match.isSuperBlast) {
        playSoundType = "super";
        if (exp.match.isTLMatch) {
          hasMatch4 = true;
          // Super Drum Blast (T/L shape containing special tile)
          this.spawnDrumVFX(exp.x, exp.y, true);
          const extraTiles = this.board.destroyArea5x5(exp.row, exp.col);

          // Base 250 + 18 per extra tile destroyed
          const matchPoints = (250 + extraTiles.length * 18) * multiplier;
          totalAdded += matchPoints;

          this.spawnFloatingScore(
            exp.x,
            exp.y,
            `SIÊU TRỐNG ĐỒNG! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ""}`,
          );
          this.spawnRipple(exp.x, exp.y, 0xffa726);
        } else if (exp.length === 4) {
          hasMatch4 = true;
          // Super Cross Blast (Match-4 containing special tile)
          this.spawnSuperCrossVFX(exp.x, exp.y);
          const extraTiles = this.board.destroySuperCross(exp.row, exp.col);

          // Base 150 + 15 per extra tile destroyed
          const matchPoints = (150 + extraTiles.length * 15) * multiplier;
          totalAdded += matchPoints;

          this.spawnFloatingScore(
            exp.x,
            exp.y,
            `SIÊU CHỮ THẬP! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ""}`,
          );
          this.spawnRipple(exp.x, exp.y, 0x00e676);
        } else {
          hasMatch5 = true;
          // Super Board Wipe (Match-5 containing special tile)
          this.spawnSuperRainbowVFX(exp.x, exp.y);
          const extraTiles = this.board.destroySuperRainbow();

          // Base 350 + 20 per extra tile destroyed
          const matchPoints = (350 + extraTiles.length * 20) * multiplier;
          totalAdded += matchPoints;

          this.spawnFloatingScore(
            exp.x,
            exp.y,
            `SIÊU BÃO NỔ! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ""}`,
          );
          this.spawnRipple(exp.x, exp.y, 0xff00ff);
        }
      } else if (exp.match.isTLMatch) {
        // Normal T/L-shape: Spawns special Drum Gem, no immediate explosion
        const matchPoints = 40 * multiplier;
        totalAdded += matchPoints;
        this.spawnFloatingScore(
          exp.x,
          exp.y,
          `TRỐNG ĐỒNG! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ""}`,
        );

        this.spawnRipple(exp.x, exp.y, 0xcd7f32);
      } else if (exp.length === 4) {
        // Normal Match-4: Spawns special Rune tile, no immediate explosion
        const matchPoints = 25 * multiplier;
        totalAdded += matchPoints;
        this.spawnFloatingScore(
          exp.x,
          exp.y,
          `KẾT HỢP 4! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ""}`,
        );

        const slotIndex = this.sessionColors.indexOf(exp.color);
        const palette = [
          0xff3d00, 0x00e5ff, 0x2979ff, 0x00e676, 0xffd600, 0xd500f9,
        ];
        const rippleColor = slotIndex !== -1 ? palette[slotIndex] : 0xffffff;
        this.spawnRipple(exp.x, exp.y, rippleColor);
      } else if (exp.length >= 5) {
        // Normal Match-5: Spawns special Rainbow Gem, no immediate explosion
        const matchPoints = 50 * multiplier;
        totalAdded += matchPoints;
        this.spawnFloatingScore(
          exp.x,
          exp.y,
          `KẾT HỢP 5! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ""}`,
        );

        const slotIndex = this.sessionColors.indexOf(exp.color);
        const palette = [
          0xff3d00, 0x00e5ff, 0x2979ff, 0x00e676, 0xffd600, 0xd500f9,
        ];
        const rippleColor = slotIndex !== -1 ? palette[slotIndex] : 0xffffff;
        this.spawnRipple(exp.x, exp.y, rippleColor);
      } else {
        // Normal Match-3
        // Check if any tile in the match was special (Rune, Rainbow, or Drum)
        const specialTiles = exp.match.tiles.filter(
          (t) => t.isRune || t.isRainbow || t.isDrum,
        );

        if (specialTiles.length > 0) {
          // Loop through all special tiles in this match and trigger them all!
          specialTiles.forEach((specialTile) => {
            const r = specialTile.originalField
              ? specialTile.originalField.row
              : exp.row;
            const c = specialTile.originalField
              ? specialTile.originalField.col
              : exp.col;
            const tX = specialTile.sprite
              ? specialTile.sprite.x * this.board.container.scale.x +
                this.board.container.x
              : exp.x;
            const tY = specialTile.sprite
              ? specialTile.sprite.y * this.board.container.scale.y +
                this.board.container.y
              : exp.y;

            if (specialTile.isDrum) {
              hasMatch4 = true;
              if (playSoundType !== "super" && playSoundType !== "rainbow")
                playSoundType = "drum";

              this.spawnDrumVFX(tX, tY, false);
              const extraTiles = this.board.destroyArea3x3(r, c);
              const matchPoints = (120 + extraTiles.length * 12) * multiplier;
              totalAdded += matchPoints;
              this.spawnFloatingScore(
                tX,
                tY,
                `SẤM VANG TRỐNG ĐỒNG! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ""}`,
              );
              this.spawnRipple(tX, tY, 0xffa726);
            } else if (specialTile.isRune) {
              hasMatch4 = true;
              if (
                playSoundType !== "super" &&
                playSoundType !== "rainbow" &&
                playSoundType !== "drum"
              )
                playSoundType = "rune";

              this.spawnCrossLeaves(tX, tY);
              const extraTiles = this.board.destroyCross(r, c);
              const matchPoints = (100 + extraTiles.length * 10) * multiplier;
              totalAdded += matchPoints;
              this.spawnFloatingScore(
                tX,
                tY,
                `HIỆU ỨNG CHỮ THẬP! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ""}`,
              );
              this.spawnRipple(tX, tY, 0x00e676);
            } else if (specialTile.isRainbow) {
              hasMatch5 = true;
              if (playSoundType !== "super") playSoundType = "rainbow";

              // Normal Rainbow Blast (Destroy all of that color)
              const targetPositions = [];
              this.board.fields.forEach((field) => {
                if (
                  field.tile &&
                  !field.isVoid &&
                  field.tile.color === exp.color &&
                  field.tile.sprite
                ) {
                  const tx =
                    field.tile.sprite.x * this.board.container.scale.x +
                    this.board.container.x;
                  const ty =
                    field.tile.sprite.y * this.board.container.scale.y +
                    this.board.container.y;
                  targetPositions.push({ x: tx, y: ty, color: exp.color });
                }
              });
              this.spawnRainbowBlast(tX, tY, targetPositions);
              const extraTiles = this.board.destroyAllOfColor(exp.color);

              const matchPoints = (150 + extraTiles.length * 12) * multiplier;
              totalAdded += matchPoints;
              this.spawnFloatingScore(
                tX,
                tY,
                `NỔ SẮC CẦU VỒNG! +${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ""}`,
              );
              this.spawnRipple(tX, tY, 0xff00ff);
            }
          });
        } else {
          // Normal match-3
          const matchPoints = 10 * multiplier;
          totalAdded += matchPoints;
          this.spawnFloatingScore(
            exp.x,
            exp.y,
            `+${matchPoints}${multiplier > 1 ? ` (x${multiplier})` : ""}`,
          );

          // Ripple Color based on tile color
          const slotIndex = this.sessionColors.indexOf(exp.color);
          const palette = [
            0xff3d00, 0x00e5ff, 0x2979ff, 0x00e676, 0xffd600, 0xd500f9,
          ];
          const rippleColor = slotIndex !== -1 ? palette[slotIndex] : 0xffffff;
          this.spawnRipple(exp.x, exp.y, rippleColor);
        }
      }
    });

    this.score += totalAdded;
    this.updateUI();

    // 3. Sound triggers
    if (playSoundType === "super") {
      soundManager.playSuperExplosion();
    } else if (playSoundType === "rainbow") {
      soundManager.playRainbowExplosion();
    } else if (playSoundType === "drum") {
      soundManager.playDrumExplosion();
    } else if (playSoundType === "rune") {
      soundManager.playRuneExplosion();
    } else if (playSoundType === "combo") {
      soundManager.playCombo(this.comboCount);
    } else {
      soundManager.playMatch();
    }

    // 4. Screen shake triggers
    if (hasMatch5) {
      this.screenShake(25);
    } else if (hasMatch4) {
      this.screenShake(16);
    } else if (this.comboCount >= 2) {
      this.screenShake();
    }

    // Spawn normal particles for matched tiles (for Match-3 and remaining tiles)
    matches.forEach((match) => {
      match.tiles.forEach((tile) => {
        if (tile.sprite) {
          const pX =
            tile.sprite.x * this.board.container.scale.x +
            this.board.container.x;
          const pY =
            tile.sprite.y * this.board.container.scale.y +
            this.board.container.y;
          this.spawnParticles(pX, pY, tile.color);
        }
      });
    });

    // Visually remove matches
    this.removeMatches(matches);

    // Collect all columns that have empty fields (where tiles were destroyed/matched)
    const affectedCols = new Set();
    this.board.fields.forEach((field) => {
      if (field.tile === null && !field.isVoid) {
        affectedCols.add(field.col);
      }
    });

    // Wait for pop/fade animation
    await this.delay(180);

    // Fall down existing tiles
    await this.processFallDown();

    // Spawn new tiles
    await this.addTiles();

    // Check for cascade chains
    const { dirtyRows, dirtyCols } =
      this.combinationManager.getDirtyRegionAfterCascade([...affectedCols]);
    this.lastAffectedCols = dirtyCols;
    const newMatches = this.combinationManager.getMatchesInRegion(
      dirtyRows,
      dirtyCols,
    );

    if (newMatches.length) {
      await this.delay(150);
      await this.processMatches(newMatches);
      return;
    }

    // Gameplay settled. Check game over
    if (this.moves <= 0) {
      this.showGameOver();
    } else {
      if (!this.combinationManager.hasPossibleMoves()) {
        await this.handleDeadlock();
      } else {
        this.disabled = false;
      }
    }
  }

  removeMatches(matches, immediate = false) {
    const removed = new Set();
    const specialSpawns = [];

    matches.forEach((match) => {
      if (match.isTLMatch) {
        // Determine which tile is the intersection tile
        const specialTile =
          match.intersectionTile ||
          match.tiles.find(
            (t) => t === this.lastSwappedTile1 || t === this.lastSwappedTile2,
          ) ||
          match.tiles[0];
        const targetField = specialTile.originalField || specialTile.field;
        if (targetField && !match.isSuperBlast) {
          specialSpawns.push({
            field: targetField,
            type: "drum",
            color: specialTile.color,
          });
        }

        match.tiles.forEach((tile) => {
          if (tile !== specialTile && !removed.has(tile)) {
            removed.add(tile);
            tile.remove(immediate);
          }
        });

        if (match.isSuperBlast && specialTile && !removed.has(specialTile)) {
          removed.add(specialTile);
          specialTile.remove(immediate);
        }
      } else if (match.length === 4) {
        // Determine which tile becomes the special Rune tile
        let specialTile = match.tiles.find(
          (t) => t === this.lastSwappedTile1 || t === this.lastSwappedTile2,
        );
        if (!specialTile) {
          specialTile = match.tiles[Math.floor(match.tiles.length / 2)];
        }

        const targetField = specialTile.originalField || specialTile.field;
        if (targetField && !match.isSuperBlast) {
          specialSpawns.push({
            field: targetField,
            type: "rune",
            color: specialTile.color,
          });
        }

        match.tiles.forEach((tile) => {
          if (tile !== specialTile && !removed.has(tile)) {
            removed.add(tile);
            tile.remove(immediate);
          }
        });

        if (match.isSuperBlast && specialTile && !removed.has(specialTile)) {
          removed.add(specialTile);
          specialTile.remove(immediate);
        }
      } else if (match.length >= 5) {
        // Determine which tile becomes the Rainbow Gem
        let specialTile = match.tiles.find(
          (t) => t === this.lastSwappedTile1 || t === this.lastSwappedTile2,
        );
        if (!specialTile) {
          specialTile = match.tiles[Math.floor(match.tiles.length / 2)];
        }

        const targetField = specialTile.originalField || specialTile.field;
        if (targetField && !match.isSuperBlast) {
          specialSpawns.push({
            field: targetField,
            type: "rainbow",
            color: specialTile.color,
          });
        }

        match.tiles.forEach((tile) => {
          if (tile !== specialTile && !removed.has(tile)) {
            removed.add(tile);
            tile.remove(immediate);
          }
        });

        if (match.isSuperBlast && specialTile && !removed.has(specialTile)) {
          removed.add(specialTile);
          specialTile.remove(immediate);
        }
      } else {
        // Normal match-3, remove all tiles
        match.tiles.forEach((tile) => {
          if (!removed.has(tile)) {
            removed.add(tile);
            tile.remove(immediate);
          }
        });
      }
    });

    // Instantiate/convert the special tiles
    specialSpawns.forEach((spawn) => {
      const field = spawn.field;
      if (field) {
        // If the field is currently empty (due to an explosion in this turn), recreate a tile first
        if (field.tile === null) {
          this.board.createTile(field, spawn.color);
        }

        // Get screen coordinates of the tile/field
        const tX = field.tile.sprite
          ? field.tile.sprite.x * this.board.container.scale.x +
            this.board.container.x
          : field.col * App.config.tileSize * this.board.container.scale.x +
            this.board.container.x +
            (App.config.tileSize * this.board.container.scale.x) / 2;
        const tY = field.tile.sprite
          ? field.tile.sprite.y * this.board.container.scale.y +
            this.board.container.y
          : field.row * App.config.tileSize * this.board.container.scale.y +
            this.board.container.y +
            (App.config.tileSize * this.board.container.scale.y) / 2;

        if (spawn.type === "rune") {
          field.tile.isRune = true;
          field.tile.updateStateOverlay();
          this.spawnRuneCreationVFX(tX, tY);
          soundManager.playRuneCreation();
          console.log(
            "🌟 Spawned Rune Tile at row:",
            field.row,
            "col:",
            field.col,
          );
        } else if (spawn.type === "rainbow") {
          field.tile.isRainbow = true;
          field.tile.updateStateOverlay();
          this.spawnRainbowCreationVFX(tX, tY);
          soundManager.playRainbowCreation();
          console.log(
            "🌈 Spawned Rainbow Gem at row:",
            field.row,
            "col:",
            field.col,
          );
        } else if (spawn.type === "drum") {
          field.tile.isDrum = true;
          field.tile.updateStateOverlay();
          this.spawnDrumCreationVFX(tX, tY);
          soundManager.playDrumCreation();
          console.log(
            "🥁 Spawned Bronze Drum Gem at row:",
            field.row,
            "col:",
            field.col,
          );
        }
      }
    });

    this.lastSwappedTile1 = null;
    this.lastSwappedTile2 = null;
  }

  processFallDown() {
    return new Promise((resolve) => {
      let started = 0;
      let completed = 0;

      for (let row = this.board.rows - 1; row >= 0; row--) {
        for (let col = this.board.cols - 1; col >= 0; col--) {
          const field = this.board.getField(row, col);
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
    return new Promise((resolve) => {
      const emptyFields = this.board.fields.filter((f) => f.tile === null);
      let total = emptyFields.length;
      let completed = 0;

      if (total === 0) {
        resolve();
        return;
      }

      emptyFields.forEach((field) => {
        const tile = this.board.createTile(field, null, true);
        tile.sprite.y = -App.config.tileSize * 2;
        if (tile.stateOverlay) {
          tile.stateOverlay.y = tile.sprite.y;
        }

        const delay = Math.random() * 0.15 + 0.2 / (field.row + 1);
        tile.fallDownTo(field.position, delay).then(() => {
          ++completed;
          if (completed >= total) resolve();
        });
      });
    });
  }

  removeStartMatches() {
    let matches = this.combinationManager.getMatches();

    while (matches.length) {
      this.removeMatches(matches, true);

      const emptyFields = this.board.fields.filter((f) => f.tile === null);
      emptyFields.forEach((field) => {
        this.board.createTile(field);
      });

      matches = this.combinationManager.getMatches();
    }
  }

  // ============================================================
  //  EFFECTS
  // ============================================================

  spawnParticles(x, y, color) {
    const slotIndex = this.sessionColors.indexOf(color);
    const palette = [
      0xff3d00, // Đỏ cam rực rỡ
      0x00e5ff, // Xanh Cyan điện tử
      0x2979ff, // Xanh biển Hoàng gia
      0x00e676, // Xanh lá Neon
      0xffd600, // Vàng kim sáng
      0xd500f9, // Hồng Neon rực
    ];
    const particleColor = slotIndex !== -1 ? palette[slotIndex] : 0xffffff;

    const count = 10; // Optimized count (from 24) to prevent CPU hitching
    for (let i = 0; i < count; i++) {
      const p = new Graphics();
      const isLeaf = Math.random() > 0.4; // 60% leaves, 40% sparks

      if (isLeaf) {
        // Draw a beautiful small bamboo leaf - simplified single fill pass (no shadow, no stroke)
        p.moveTo(0, -6);
        p.quadraticCurveTo(3, 0, 0, 6);
        p.quadraticCurveTo(-3, 0, 0, -6);
        p.fill({ color: 0x2e7d32 });
      } else {
        // Draw a glowing firefly spark - simplified single circle fill pass
        p.circle(0, 0, 3.5);
        p.fill({ color: particleColor });
      }

      p.x = x;
      p.y = y;
      p.alpha = 0.95;
      p.zIndex = 95;
      p.scale.set(1.0 + Math.random() * 0.5);
      this.container.addChild(p);

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.3;
      const speed = 70 + Math.random() * 100;

      // Physics simulation via GSAP (adds gravity drop)
      gsap.to(p, {
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 80, // Gravity pull
        alpha: 0,
        duration: 0.7 + Math.random() * 0.3,
        ease: "power2.out",
        onComplete: () => {
          killTweensRecursive(p);
          p.destroy();
        },
      });

      gsap.to(p.scale, {
        x: 0.1,
        y: 0.1,
        duration: 0.65,
        delay: 0.1,
      });

      gsap.to(p, {
        rotation: (Math.random() - 0.5) * 15,
        duration: 0.8,
      });
    }
  }

  spawnRipple(x, y, colorHex = 0xffffff) {
    const rippleContainer = new Container();
    rippleContainer.zIndex = 95;
    this.container.addChild(rippleContainer);

    let activeTweens = 0;
    const checkCleanup = () => {
      activeTweens--;
      if (activeTweens <= 0 && rippleContainer && !rippleContainer.destroyed) {
        rippleContainer.destroy({ children: true });
      }
    };

    // 1. Hạt lúa vàng mộc mạc (Rustic Golden Rice Grains)
    // Draw 3 golden rice grains (optimized from 6-8) - simplified fill pass (no stroke)
    const grainCount = 3;
    for (let i = 0; i < grainCount; i++) {
      const grain = new Graphics();

      // Slender rice grain shape
      grain.moveTo(-4, 0);
      grain.quadraticCurveTo(0, -2, 4, 0);
      grain.quadraticCurveTo(0, 2, -4, 0);

      // Rice golden colors: amber/gold/yellow
      const grainColors = [0xffd54f, 0xffb300, 0xffc107];
      const grainColor =
        grainColors[Math.floor(Math.random() * grainColors.length)];
      grain.fill({ color: grainColor });

      grain.x = x;
      grain.y = y;
      grain.rotation = Math.random() * Math.PI * 2;
      rippleContainer.addChild(grain);

      const angle = Math.random() * Math.PI * 2;
      const distance = 40 + Math.random() * 45;
      const targetX = x + Math.cos(angle) * distance;
      // Add positive Y offset to simulate a small gravity fall
      const targetY = y + Math.sin(angle) * distance + 15;

      activeTweens++;
      gsap.to(grain, {
        x: targetX,
        y: targetY,
        rotation: grain.rotation + (Math.random() - 0.5) * 8,
        alpha: 0,
        duration: 0.5 + Math.random() * 0.3,
        ease: "power2.out",
        onComplete: () => {
          if (grain && !grain.destroyed) {
            grain.destroy();
          }
          checkCleanup();
        },
      });
    }

    // 2. Cánh hoa / Lá quê sắc màu (Colored rural petals/leaves matching the tile color)
    // Draw 3 leaves/petals (optimized from 5-7) - simplified fill pass (no stroke)
    const leafCount = 3;
    for (let i = 0; i < leafCount; i++) {
      const leaf = new Graphics();
      // A simple curved leaf/petal shape
      leaf.moveTo(0, -4);
      leaf.quadraticCurveTo(2, 0, 0, 4);
      leaf.quadraticCurveTo(-2, 0, 0, -4);
      leaf.fill({ color: colorHex, alpha: 0.9 });

      leaf.x = x;
      leaf.y = y;
      leaf.rotation = Math.random() * Math.PI * 2;
      rippleContainer.addChild(leaf);

      const angle = Math.random() * Math.PI * 2;
      const distance = 35 + Math.random() * 40;
      const targetX = x + Math.cos(angle) * distance;
      const targetY = y + Math.sin(angle) * distance + 10;

      activeTweens++;
      gsap.to(leaf, {
        x: targetX,
        y: targetY,
        rotation: leaf.rotation + (Math.random() - 0.5) * 6,
        alpha: 0,
        duration: 0.5 + Math.random() * 0.3,
        ease: "power1.out",
        onComplete: () => {
          if (leaf && !leaf.destroyed) {
            leaf.destroy();
          }
          checkCleanup();
        },
      });
    }

    // 3. Khói sương bụi mộc mạc (Soft smoke/mist puffs that drift and expand slightly)
    // Spawns 1 tiny smoke puff (optimized from 3) - simplified single circle pass
    const smokeCount = 1;
    for (let i = 0; i < smokeCount; i++) {
      const smoke = new Graphics();
      smoke.circle(0, 0, 8);
      smoke.fill({ color: colorHex, alpha: 0.18 });

      smoke.x = x;
      smoke.y = y;
      smoke.scale.set(0.6);
      rippleContainer.addChild(smoke);

      const angle = Math.random() * Math.PI * 2;
      const driftDistance = 15 + Math.random() * 20;
      const targetX = x + Math.cos(angle) * driftDistance;
      const targetY = y + Math.sin(angle) * driftDistance;

      activeTweens++;
      gsap.to(smoke, {
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 0.45 + Math.random() * 0.15,
        ease: "sine.out",
        onComplete: () => {
          if (smoke && !smoke.destroyed) {
            killTweensRecursive(smoke);
            smoke.destroy();
          }
          checkCleanup();
        },
      });

      gsap.to(smoke.scale, {
        x: 2.2,
        y: 2.2,
        duration: 0.45 + Math.random() * 0.15,
        ease: "sine.out",
      });
    }
  }

  spawnRuneCreationVFX(x, y) {
    const vfxContainer = new Container();
    vfxContainer.zIndex = 92;
    this.container.addChild(vfxContainer);

    const offsets = [
      { dx: -35, dy: -35 },
      { dx: 35, dy: -35 },
      { dx: -35, dy: 35 },
      { dx: 35, dy: 35 },
    ];

    let completed = 0;
    offsets.forEach((offset) => {
      const p = new Graphics();
      // Star/diamond spark
      p.moveTo(0, -6);
      p.lineTo(3, 0);
      p.lineTo(0, 6);
      p.lineTo(-3, 0);
      p.fill({ color: 0xffd54f }); // gold

      p.x = x + offset.dx;
      p.y = y + offset.dy;
      p.scale.set(0.2);
      p.alpha = 0;
      vfxContainer.addChild(p);

      gsap.to(p, {
        x: x,
        y: y,
        alpha: 1,
        duration: 0.35,
        ease: "power1.out",
      });

      gsap.to(p.scale, {
        x: 1.4,
        y: 1.4,
        duration: 0.35,
        ease: "power1.out",
        onComplete: () => {
          killTweensRecursive(p);
          p.destroy();
          completed++;
          if (completed === 4) {
            // Flash at the center
            const flash = new Graphics();
            flash.circle(0, 0, 15);
            flash.fill({ color: 0xffffff });
            flash.x = x;
            flash.y = y;
            vfxContainer.addChild(flash);

            gsap.to(flash, {
              alpha: 0,
              duration: 0.2,
              ease: "sine.out",
              onComplete: () => {
                killTweensRecursive(vfxContainer);
                vfxContainer.destroy();
              },
            });
            gsap.to(flash.scale, {
              x: 2.2,
              y: 2.2,
              duration: 0.2,
              ease: "sine.out",
            });
          }
        },
      });
    });
  }

  spawnRainbowCreationVFX(x, y) {
    const vfxContainer = new Container();
    vfxContainer.zIndex = 92;
    this.container.addChild(vfxContainer);

    const rainbowColors = [
      0xff1744, 0xff9100, 0xffea00, 0x00e676, 0x00e5ff, 0x2979ff, 0xd500f9,
    ];
    const dotCount = 14;
    let completed = 0;

    for (let i = 0; i < dotCount; i++) {
      const p = new Graphics();
      const color = rainbowColors[i % rainbowColors.length];
      p.circle(0, 0, 4);
      p.fill({ color: color });

      p.x = x;
      p.y = y;
      vfxContainer.addChild(p);

      const startAngle = (i * Math.PI * 2) / dotCount;
      const startRadius = 45;

      // Set initial position on circle
      p.x = x + Math.cos(startAngle) * startRadius;
      p.y = y + Math.sin(startAngle) * startRadius;

      // Animate spiral inward
      const obj = { radius: startRadius, angle: startAngle };
      gsap.to(obj, {
        radius: 0,
        angle: startAngle + Math.PI * 1.5, // 270 degree rotation
        duration: 0.45,
        ease: "sine.out",
        onUpdate: () => {
          if (p && !p.destroyed) {
            p.x = x + Math.cos(obj.angle) * obj.radius;
            p.y = y + Math.sin(obj.angle) * obj.radius;
          }
        },
        onComplete: () => {
          killTweensRecursive(p);
          p.destroy();
          completed++;
          if (completed === dotCount) {
            // Rainbow flash
            const flash = new Graphics();
            flash.circle(0, 0, 16);
            flash.fill({ color: 0xffffff });
            flash.x = x;
            flash.y = y;
            vfxContainer.addChild(flash);

            gsap.to(flash, {
              alpha: 0,
              duration: 0.25,
              ease: "sine.out",
              onComplete: () => {
                killTweensRecursive(vfxContainer);
                vfxContainer.destroy();
              },
            });
            gsap.to(flash.scale, {
              x: 2.5,
              y: 2.5,
              duration: 0.25,
              ease: "sine.out",
            });
          }
        },
      });
    }
  }

  spawnDrumCreationVFX(x, y) {
    const vfxContainer = new Container();
    vfxContainer.zIndex = 92;
    this.container.addChild(vfxContainer);

    // 1. Gathering bronze/gold ring
    const ring = new Graphics();
    ring.circle(0, 0, 48);
    ring.stroke({ color: 0xffa726, width: 3, alpha: 0.8 });
    ring.x = x;
    ring.y = y;
    vfxContainer.addChild(ring);

    gsap.to(ring.scale, {
      x: 0.1,
      y: 0.1,
      duration: 0.35,
      ease: "power2.in",
      onComplete: () => {
        killTweensRecursive(ring);
        ring.destroy();

        // 2. Radial gold spark blast (8 rays)
        const rays = 8;
        let raysCompleted = 0;
        for (let r = 0; r < rays; r++) {
          const spark = new Graphics();
          // Slender diamond ray
          spark.moveTo(0, -10);
          spark.lineTo(2, 0);
          spark.lineTo(0, 10);
          spark.lineTo(-2, 0);
          spark.fill({ color: 0xffd54f });

          spark.x = x;
          spark.y = y;
          const angle = (r * Math.PI * 2) / rays;
          spark.rotation = angle;
          vfxContainer.addChild(spark);

          const destX = x + Math.cos(angle) * 35;
          const destY = y + Math.sin(angle) * 35;

          gsap.to(spark, {
            x: destX,
            y: destY,
            alpha: 0,
            duration: 0.25,
            ease: "sine.out",
            onComplete: () => {
              killTweensRecursive(spark);
              spark.destroy();
              raysCompleted++;
              if (raysCompleted === rays) {
                killTweensRecursive(vfxContainer);
                vfxContainer.destroy();
              }
            },
          });
        }
      },
    });
  }

  spawnCrossLeaves(x, y) {
    const leafContainer = new Container();
    leafContainer.zIndex = 90;
    this.container.addChild(leafContainer);

    const count = 24; // Optimized count (from 54) to prevent CPU lags

    for (let i = 0; i < count; i++) {
      const p = new Graphics();

      // Slender leaf shape - simplified single fill pass (no shadow, no strokes/veins)
      p.moveTo(0, -18);
      p.quadraticCurveTo(5, -4, 0, 16);
      p.quadraticCurveTo(-5, -4, 0, -18);
      p.fill({ color: 0x2e7d32 });

      p.x = x;
      p.y = y;
      p.scale.set(1.4 + Math.random() * 0.7);
      leafContainer.addChild(p);

      // Determine direction: horizontal or vertical
      const isHorizontal = i % 2 === 0;
      const direction = Math.random() > 0.5 ? 1 : -1;

      // Concentrated wind flow along the lines
      const targetX = isHorizontal
        ? x + direction * (350 + Math.random() * 450)
        : x + (Math.random() - 0.5) * 35;
      const targetY = isHorizontal
        ? y + (Math.random() - 0.5) * 35
        : y + direction * (300 + Math.random() * 400);

      gsap.to(p, {
        x: targetX,
        y: targetY,
        rotation: (Math.random() - 0.5) * 12,
        alpha: 0,
        duration: 0.9 + Math.random() * 0.5,
        ease: "power1.out",
        onComplete: () => {
          killTweensRecursive(p);
          p.destroy();
        },
      });
    }

    gsap.delayedCall(1.6, () => {
      killTweensRecursive(leafContainer);
      leafContainer.destroy();
    });
  }

  spawnRainbowBlast(fromX, fromY, targets) {
    const blastContainer = new Container();
    blastContainer.zIndex = 90;
    this.container.addChild(blastContainer);

    const colors = [0xff80ab, 0x00e5ff, 0xffeb3b, 0x00e676, 0xd500f9];

    targets.forEach((target, idx) => {
      // Draw a very soft, faint wind trail line (làn gió mỏng)
      const trail = new Graphics();
      trail.moveTo(target.x, target.y);
      trail.lineTo(fromX, fromY);
      trail.stroke({ color: 0xffffff, width: 1.5, alpha: 0.25 });
      blastContainer.addChild(trail);

      gsap.to(trail, {
        alpha: 0,
        duration: 1.0,
        onComplete: () => {
          killTweensRecursive(trail);
          trail.destroy();
        },
      });

      // Spawn 2 beautiful leaves at target (optimized from 4) - simplified single fill pass
      const targetColorHex = colors[idx % colors.length];
      for (let j = 0; j < 2; j++) {
        const p = new Graphics();

        p.moveTo(0, -8);
        p.quadraticCurveTo(3.5, 0, 0, 8);
        p.quadraticCurveTo(-3.5, 0, 0, -8);
        p.fill({ color: targetColorHex });

        p.x = target.x + (Math.random() - 0.5) * 20;
        p.y = target.y + (Math.random() - 0.5) * 20;
        p.scale.set(0.9 + Math.random() * 0.5);
        blastContainer.addChild(p);

        // Animate flying and spiraling into the Rainbow Gem
        const delay = Math.random() * 0.15;
        gsap.to(p, {
          x: fromX,
          y: fromY,
          rotation: (Math.random() - 0.5) * 10,
          duration: 0.9 + Math.random() * 0.4,
          delay: delay,
          ease: "power1.inOut",
          onComplete: () => {
            killTweensRecursive(p);
            p.destroy();
          },
        });
      }

      this.spawnParticles(target.x, target.y, target.color);
    });

    gsap.delayedCall(1.8, () => {
      killTweensRecursive(blastContainer);
      blastContainer.destroy({ children: true });
    });
  }

  screenShake(customIntensity = null) {
    const intensity =
      customIntensity !== null
        ? customIntensity
        : Math.min(this.comboCount * 3, 12);
    gsap.killTweensOf(this.board.container);
    const originalX = this.board.container.x;
    gsap.to(this.board.container, {
      x: originalX + intensity,
      duration: 0.05,
      yoyo: true,
      repeat: customIntensity !== null ? 8 : 5,
      ease: "power2.inOut",
      onComplete: () => {
        this.board.container.x = originalX;
      },
    });
  }

  /**
   * Spawns a screen-clearing super cross explosion of green bamboo leaves.
   */
  spawnSuperCrossVFX(x, y) {
    const leafContainer = new Container();
    leafContainer.zIndex = 95;
    this.container.addChild(leafContainer);

    // Draw a giant cross flash
    const flash = new Graphics();
    const boardWidth =
      this.board.cols * App.config.tileSize * this.board.container.scale.x;
    const boardHeight =
      this.board.rows * App.config.tileSize * this.board.container.scale.y;

    flash.rect(x - 45, this.board.container.y, 90, boardHeight);
    flash.rect(this.board.container.x, y - 45, boardWidth, 90);
    flash.fill({ color: 0xaeed9e, alpha: 0.45 });
    leafContainer.addChild(flash);

    gsap.to(flash, {
      alpha: 0,
      duration: 0.5,
      ease: "power2.out",
      onComplete: () => {
        killTweensRecursive(flash);
        flash.destroy();
      },
    });

    // Spawn 36 green bamboo leaves blowing along the lines (optimized from 80)
    const count = 36;
    for (let i = 0; i < count; i++) {
      const p = new Graphics();
      // Slender leaf shape - simplified single fill pass (no shadow, no strokes/veins)
      p.moveTo(0, -18);
      p.quadraticCurveTo(6, -4, 0, 16);
      p.quadraticCurveTo(-6, -4, 0, -18);
      p.fill({ color: 0x2e7d32 });

      p.x = x;
      p.y = y;
      p.scale.set(1.5 + Math.random() * 0.9);
      leafContainer.addChild(p);

      const isHorizontal = i % 2 === 0;
      const direction = Math.random() > 0.5 ? 1 : -1;
      const targetX = isHorizontal
        ? x + direction * (400 + Math.random() * 500)
        : x + (Math.random() - 0.5) * 75;
      const targetY = isHorizontal
        ? y + (Math.random() - 0.5) * 75
        : y + direction * (350 + Math.random() * 450);

      gsap.to(p, {
        x: targetX,
        y: targetY,
        rotation: (Math.random() - 0.5) * 16,
        alpha: 0,
        duration: 1.0 + Math.random() * 0.6,
        ease: "power2.out",
        onComplete: () => {
          killTweensRecursive(p);
          p.destroy();
        },
      });
    }

    // Spawn ripples
    this.spawnRipple(x, y, 0x00e676);
    gsap.delayedCall(0.12, () => this.spawnRipple(x, y, 0xffffff));

    gsap.delayedCall(1.8, () => {
      killTweensRecursive(leafContainer);
      leafContainer.destroy();
    });
  }

  /**
   * Spawns a full board rainbow wipe VFX.
   */
  spawnSuperRainbowVFX(x, y) {
    const vfxContainer = new Container();
    vfxContainer.zIndex = 95;
    this.container.addChild(vfxContainer);

    // Giant expanding color circle
    const shockwave = new Graphics();
    shockwave.circle(0, 0, 20);
    shockwave.fill({ color: 0xffffff, alpha: 0.6 });
    shockwave.x = x;
    shockwave.y = y;
    vfxContainer.addChild(shockwave);

    gsap.to(shockwave.scale, {
      x: 40,
      y: 40,
      duration: 0.75,
      ease: "power2.out",
    });
    gsap.to(shockwave, {
      alpha: 0,
      duration: 0.75,
      ease: "power2.out",
      onComplete: () => {
        killTweensRecursive(shockwave);
        shockwave.destroy();
      },
    });

    // Spawn 48 colorful firefly sparks shooting out in all directions (optimized from 100) - simplified single fill pass
    const colors = [0xff1744, 0xff9100, 0xffea00, 0x00e676, 0x2979ff, 0xd500f9];
    const count = 48;
    for (let i = 0; i < count; i++) {
      const p = new Graphics();
      const color = colors[i % colors.length];

      p.circle(0, 0, 4);
      p.fill({ color: color });

      p.x = x;
      p.y = y;
      p.scale.set(1.0 + Math.random() * 0.8);
      vfxContainer.addChild(p);

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
      const speed = 120 + Math.random() * 250;

      gsap.to(p, {
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed + 50,
        alpha: 0,
        duration: 0.8 + Math.random() * 0.4,
        ease: "power3.out",
        onComplete: () => {
          killTweensRecursive(p);
          p.destroy();
        },
      });
    }

    gsap.delayedCall(1.5, () => {
      killTweensRecursive(vfxContainer);
      vfxContainer.destroy({ children: true });
    });
  }

  /**
   * Spawns a Vietnamese Bronze Drum (Trống Đồng) face that expands,
   * along with soaring golden Chim Lạc birds that spiral outward.
   */
  spawnDrumVFX(x, y, isSuper = false) {
    const vfxContainer = new Container();
    vfxContainer.zIndex = 95;
    this.container.addChild(vfxContainer);

    // 1. Draw expanding Bronze Drum Face
    const drumFace = new Graphics();

    // Outer bronze ring
    drumFace.circle(0, 0, 40);
    drumFace.stroke({ color: 0xcd7f32, width: 6, alpha: 0.8 });

    // Inner gold ring
    drumFace.circle(0, 0, 32);
    drumFace.stroke({ color: 0xffa726, width: 2, alpha: 0.6 });

    // Starburst center
    const rays = 8;
    for (let r = 0; r < rays; r++) {
      const angle = (r * Math.PI * 2) / rays;
      drumFace.moveTo(0, 0);
      drumFace.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20);
    }
    drumFace.stroke({ color: 0xffe082, width: 3, alpha: 0.9 });

    drumFace.x = x;
    drumFace.y = y;
    drumFace.scale.set(0.5);
    vfxContainer.addChild(drumFace);

    gsap.to(drumFace.scale, {
      x: isSuper ? 6.5 : 4.0,
      y: isSuper ? 6.5 : 4.0,
      duration: 0.85,
      ease: "sine.out",
    });
    gsap.to(drumFace, {
      alpha: 0,
      rotation: Math.PI * 0.75,
      duration: 0.85,
      ease: "sine.out",
      onComplete: () => {
        killTweensRecursive(drumFace);
        drumFace.destroy();
      },
    });

    // 2. Spawn golden Chim Lạc birds spiraling out
    const birdCount = isSuper ? 16 : 8;
    for (let i = 0; i < birdCount; i++) {
      const birdWrapper = new Container();
      birdWrapper.x = x;
      birdWrapper.y = y;
      birdWrapper.rotation = (Math.PI * 2 * i) / birdCount;
      vfxContainer.addChild(birdWrapper);

      const bird = new Graphics();
      // Draw stylized Chim Lạc:
      // Beak & Head
      bird.moveTo(0, -5);
      bird.lineTo(10, 0); // Head/Beak pointing right
      bird.lineTo(0, 3);
      // Body & Tail
      bird.lineTo(-12, 0);
      bird.closePath();
      bird.fill({ color: 0xffd54f }); // Golden body

      // Wings
      bird.moveTo(-2, -2);
      bird.quadraticCurveTo(-6, -10, -10, -8); // Left wing
      bird.moveTo(-2, 2);
      bird.quadraticCurveTo(-6, 10, -10, 8); // Right wing
      bird.stroke({ color: 0xffffff, width: 1.5, alpha: 0.8 });

      bird.x = 10;
      bird.y = 0;
      bird.scale.set(1.2 + Math.random() * 0.5);
      birdWrapper.addChild(bird);

      // Animate spiral movement
      const targetRadius = isSuper
        ? 220 + Math.random() * 120
        : 140 + Math.random() * 80;
      const rotationDelta = Math.PI * 1.5 * (Math.random() > 0.5 ? 1 : -1);

      gsap.to(birdWrapper, {
        rotation: birdWrapper.rotation + rotationDelta,
        duration: 0.9 + Math.random() * 0.4,
        ease: "power1.out",
      });

      gsap.to(bird, {
        x: targetRadius,
        alpha: 0,
        duration: 0.9 + Math.random() * 0.4,
        ease: "power1.out",
      });

      // Soft flap wings animation
      gsap.to(bird.scale, {
        y: bird.scale.y * 0.35,
        duration: 0.15,
        repeat: 6,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    // Cleanup container
    gsap.delayedCall(1.6, () => {
      killTweensRecursive(vfxContainer);
      vfxContainer.destroy();
    });
  }

  spawnFireworkBurst(x, y, count = 25) {
    const colors = [
      0xffd600, // Vàng kim sáng
      0xff3d00, // Đỏ cam rực rỡ
      0xffffff, // Trắng lấp lánh
      0xff007f, // Hồng sen
      0x00e5ff, // Xanh điện tử
      0x4caf50, // Xanh lá bamboo
    ];

    // 1. Central flash
    const flash = new Graphics()
      .circle(0, 0, 35)
      .fill({ color: 0xffffff, alpha: 0.8 });
    flash.position.set(x, y);
    this.container.addChild(flash);
    const flashScaleTween = gsap.to(flash.scale, {
      x: 2.0,
      y: 2.0,
      duration: 0.25,
      ease: "power2.out",
    });
    gsap.to(flash, {
      alpha: 0,
      duration: 0.25,
      ease: "power2.inOut",
      onComplete: () => {
        killTweensRecursive(flash);
        flash.destroy();
      },
    });

    // 2. Expanding shockwave ring
    const ringColor = colors[Math.floor(Math.random() * colors.length)];
    const ring = new Graphics()
      .circle(0, 0, 20)
      .stroke({ width: 2.5, color: ringColor });
    ring.position.set(x, y);
    this.container.addChild(ring);
    const ringScaleTween = gsap.to(ring.scale, {
      x: 3.5,
      y: 3.5,
      duration: 0.8,
      ease: "power1.out",
    });
    gsap.to(ring, {
      alpha: 0,
      duration: 0.8,
      ease: "power1.out",
      onComplete: () => {
        killTweensRecursive(ring);
        ring.destroy();
      },
    });

    // 3. Spawn radial particles (Sparks, Twinkling Stars, and Bamboo Leaves!)
    for (let i = 0; i < count; i++) {
      const p = new Graphics();
      const rand = Math.random();
      const color = colors[Math.floor(Math.random() * colors.length)];

      let type = "spark";
      if (rand > 0.7) {
        type = "star";
      } else if (rand > 0.9) {
        type = "leaf";
      }

      if (type === "spark") {
        // Tapered needle
        p.moveTo(-10, 0)
          .lineTo(0, -1.5)
          .lineTo(10, 0)
          .lineTo(0, 1.5)
          .closePath()
          .fill({ color: color });
      } else if (type === "star") {
        // Twinkling 4-point star
        p.moveTo(0, -8)
          .quadraticCurveTo(0, 0, 8, 0)
          .quadraticCurveTo(0, 0, 0, 8)
          .quadraticCurveTo(0, 0, -8, 0)
          .quadraticCurveTo(0, 0, 0, -8)
          .closePath()
          .fill({ color: color });
      } else {
        // Bamboo leaf
        p.moveTo(0, -8)
          .quadraticCurveTo(2.5, 0, 0, 8)
          .quadraticCurveTo(-2.5, 0, 0, -8)
          .closePath()
          .fill({ color: 0x2e7d32 })
          .stroke({ width: 0.6, color: 0xaeed9e });
      }

      p.position.set(x, y);
      p.zIndex = 95;
      this.container.addChild(p);

      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.25;
      const speed = 120 + Math.random() * 150;
      const targetX = x + Math.cos(angle) * speed;
      const targetY = y + Math.sin(angle) * speed + 60; // Gravity pull

      // Rotate spark along velocity
      if (type === "spark") {
        p.rotation = angle;
      } else {
        p.rotation = Math.random() * Math.PI * 2;
        if (type === "star") {
          gsap.to(p, {
            alpha: 0.3,
            duration: 0.15,
            repeat: 5,
            yoyo: true,
            ease: "sine.inOut",
          });
        }
      }

      // Physics/Friction scale down & fade out (combined to prevent race conditions on destroy!)
      gsap.to(p, {
        x: targetX,
        y: targetY,
        alpha: 0,
        duration: 0.8 + Math.random() * 0.4,
        ease: "power2.out",
        onComplete: () => {
          killTweensRecursive(p);
          p.destroy();
        },
      });
    }
  }

  // ============================================================
  //  GAME OVER OVERLAY
  // ============================================================

  showGameOver() {
    this.isGameOver = true;
    this.disabled = true;

    // Dừng nhạc nền và phát nhạc kết quả tương ứng
    soundManager.stopBGM();
    const rank = saveManager.addScore(this.score);
    if (rank) {
      soundManager.playVictory();
    } else {
      soundManager.playGameOver();
    }

    this.gameOverScreen = new Container();
    this.gameOverScreen.zIndex = 100;
    this.container.addChild(this.gameOverScreen);

    // Overlay transparent background
    this.gameOverOverlay = new Graphics();
    this.gameOverOverlay.rect(
      0,
      0,
      App.app.screen.width,
      App.app.screen.height,
    );
    this.gameOverOverlay.fill({ color: 0x000000, alpha: 0.8 });
    this.gameOverScreen.addChild(this.gameOverOverlay);

    // Premium modal container
    this.gameOverModal = new Container();
    this.gameOverModal.x = App.app.screen.width / 2;
    this.gameOverModal.y = App.app.screen.height / 2;
    this.gameOverScreen.addChild(this.gameOverModal);

    // Hào quang vàng xoay nhẹ đằng sau modal Game Over
    const starburst = new Graphics();
    const rays = 12;
    for (let i = 0; i < rays; i++) {
      const angle1 = (i * Math.PI * 2) / rays - 0.1;
      const angle2 = (i * Math.PI * 2) / rays + 0.1;
      starburst.moveTo(0, 0);
      starburst.arc(0, 0, 420, angle1, angle2);
      starburst.fill({ color: 0xffdd57, alpha: 0.05 });
    }
    this.gameOverModal.addChild(starburst);
    gsap.to(starburst, {
      rotation: Math.PI * 2,
      duration: 25,
      repeat: -1,
      ease: "none",
    });

    const cardW = 480;
    const cardH = 480;

    // 1. Soft Card Shadow
    const cardShadow = new Graphics()
      .roundRect(-cardW / 2 + 6, -cardH / 2 + 12, cardW, cardH, 24)
      .fill({ color: 0x000000, alpha: 0.25 });
    this.gameOverModal.addChild(cardShadow);

    // 2. Thick 3D Cyan-Blue Border
    const borderBg = new Graphics()
      .roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, 24)
      .fill({ color: 0x004466 }) // Shadow Base
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 24)
      .fill({
        fill: new FillGradient({
          start: { x: 0, y: -cardH / 2 },
          end: { x: 0, y: cardH / 2 },
          colorStops: [
            { offset: 0, color: 0x33ccff },
            { offset: 1, color: 0x0088cc }
          ]
        })
      })
      .stroke({ color: 0xffea00, width: 2.5 }); // Gold inner border
    this.gameOverModal.addChild(borderBg);

    // 3. Bright Cream Card Face
    const cardFace = new Graphics()
      .roundRect(-cardW / 2 + 8, -cardH / 2 + 8, cardW - 16, cardH - 16, 18)
      .fill({ color: 0xfbfaf5 });
    this.gameOverModal.addChild(cardFace);

    // 1. Glowing neon & floating title
    const titleContainer = new Container();
    titleContainer.position.set(0, -185);
    this.gameOverModal.addChild(titleContainer);

    const titleGrad = new FillGradient({
      end: { x: 0, y: 44 },
      colorStops: [
        { offset: 0, color: 0xffea00 },
        { offset: 1, color: 0xff3300 },
      ],
    });

    const glowText = new Text({
      text: "TRÒ CHƠI KẾT THÚC",
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 34,
        fill: 0xffea00,
        fontWeight: "900",
        
      },
    });
    glowText.anchor.set(0.5);
    titleContainer.addChild(glowText);

    const glowFilter = new BlurFilter();
    glowFilter.blur = 5;
    glowText.filters = [glowFilter];

    const victoryText = new Text({
      text: "TRÒ CHƠI KẾT THÚC",
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 34,
        fill: titleGrad,
        fontWeight: "900",
        
        
      },
    });
    victoryText.anchor.set(0.5);
    titleContainer.addChild(victoryText);

    // Title animations
    gsap.to(glowText, {
      alpha: 0.35,
      duration: 1.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    gsap.to(titleContainer, {
      y: "-=6",
      duration: 1.5,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    // 2. Central Vietnamese Emblem Badge (rotating trống đồng and detailed chim lạc birds!)
    const badgeContainer = new Container();
    badgeContainer.position.set(0, -68);
    badgeContainer.scale.set(1.45);
    this.gameOverModal.addChild(badgeContainer);

    const lacBirdCtx = new GraphicsContext()
      // --- Base Silhouette ---
      .moveTo(35, -4)
      .lineTo(10, -2)
      .quadraticCurveTo(12, -7, 8, -8)
      .quadraticCurveTo(-2, -16, -20, -14)
      .quadraticCurveTo(-22, -13, -20, -12)
      .quadraticCurveTo(-4, -10, 4, -5)
      .quadraticCurveTo(-4, 2, -12, 8)
      .quadraticCurveTo(-25, 14, -40, 10)
      .quadraticCurveTo(-55, 15, -68, 22)
      .quadraticCurveTo(-54, 11, -44, 5)
      .quadraticCurveTo(-58, 12, -70, 14)
      .quadraticCurveTo(-48, 5, -38, 2)
      .lineTo(-32, -3)
      .quadraticCurveTo(-18, -4, -4, -3)
      .lineTo(10, -4.5)
      .lineTo(35, -4)
      .closePath()
      .fill({ color: 0xd4af37, alpha: 0.25 })
      .stroke({ width: 1.5, color: 0xd4af37 })

      // --- Wings with Traditional Comb Feathers ---
      .moveTo(-22, 0)
      .bezierCurveTo(-15, -20, -5, -36, 10, -45)
      .bezierCurveTo(-2, -30, -8, -18, -12, -10)
      .quadraticCurveTo(-16, -18, -20, 0)
      .closePath()
      .fill({ color: 0xd4af37, alpha: 0.3 })
      .stroke({ width: 1.5, color: 0xd4af37 })

      .moveTo(0, -20)
      .lineTo(4, -32)
      .moveTo(-4, -16)
      .lineTo(-1, -26)
      .moveTo(-8, -12)
      .lineTo(-5, -20)
      .moveTo(-12, -8)
      .lineTo(-9, -15)
      .moveTo(-16, -4)
      .lineTo(-13, -10)

      // --- Plumed Crest ---
      .moveTo(8, -8)
      .bezierCurveTo(12, -16, 25, -20, 38, -22)
      .bezierCurveTo(24, -14, 18, -8, 10, -7)
      .closePath()
      .fill({ color: 0xd4af37, alpha: 0.35 })
      .stroke({ width: 1, color: 0xd4af37 })

      // --- Tail Feathers ---
      .moveTo(-20, -14)
      .bezierCurveTo(-38, -18, -55, -15, -72, -10)
      .bezierCurveTo(-52, -8, -35, -10, -20, -12)
      .closePath()
      .fill({ color: 0xd4af37, alpha: 0.35 })
      .stroke({ width: 1, color: 0xd4af37 })

      .moveTo(-32, -11)
      .lineTo(-52, -14)
      .moveTo(-42, -10)
      .lineTo(-62, -12)

      // --- Internal Dong Son Carving Details ---
      .moveTo(11, -3.2)
      .lineTo(32, -4)
      .stroke({ width: 1.0, color: 0xd4af37, alpha: 0.7 })

      .circle(7, -5, 2.2)
      .fill({ color: 0xffea00 })
      .stroke({ width: 0.8, color: 0x3e2723 })
      .circle(7, -5, 0.8)
      .fill({ color: 0x000000 })

      .circle(-18, 5, 2.8)
      .stroke({ width: 1.0, color: 0xd4af37 })
      .circle(-18, 5, 1.2)
      .fill({ color: 0xffea00 })

      .circle(-28, 4, 2.2)
      .stroke({ width: 1.0, color: 0xd4af37 })
      .circle(-28, 4, 0.8)
      .fill({ color: 0xffea00 })

      .moveTo(-35, 6)
      .quadraticCurveTo(-48, 15, -58, 18)
      .stroke({ width: 1.2, color: 0xd4af37 })
      .moveTo(-32, 7)
      .quadraticCurveTo(-45, 17, -55, 20)
      .stroke({ width: 1.2, color: 0xd4af37 });

    const leftBird = new Graphics(lacBirdCtx);
    leftBird.position.set(-82, -5);
    leftBird.scale.set(-1.1, 1.1); // flip horizontally
    badgeContainer.addChild(leftBird);

    const rightBird = new Graphics(lacBirdCtx);
    rightBird.position.set(82, -5);
    rightBird.scale.set(1.1);
    badgeContainer.addChild(rightBird);

    // Rotating Drum (trống đồng, radius 42)
    const drum = new Graphics()
      .circle(0, 0, 42)
      .fill(
        new FillGradient({
          start: { x: -42, y: -42 },
          end: { x: 42, y: 42 },
          colorStops: [
            { offset: 0, color: 0xaa7c11 },
            { offset: 0.5, color: 0x8a6d20 },
            { offset: 1, color: 0x4a3b10 },
          ],
        }),
      )
      .stroke({ width: 2.2, color: 0xffea00 })
      .circle(0, 0, 35)
      .stroke({ width: 1.2, color: 0xd4af37, alpha: 0.6 })
      .circle(0, 0, 28)
      .stroke({ width: 1, color: 0xd4af37, alpha: 0.5 })
      .circle(0, 0, 20)
      .stroke({ width: 0.8, color: 0xd4af37, alpha: 0.4 })
      .star(0, 0, 12, 12, 5)
      .fill({ color: 0xffea00 })
      .stroke({ width: 1, color: 0xb89326 });
    badgeContainer.addChild(drum);

    gsap.to(drum, {
      rotation: Math.PI * 2,
      duration: 16,
      repeat: -1,
      ease: "none",
    });

    // Record Ribbon (relocated down)
    if (rank) {
      const ribbon = new Graphics()
        .roundRect(-60, 30, 120, 20, 5)
        .fill({ color: 0xd32f2f })
        .stroke({ width: 1.2, color: 0xffea00 });
      const ribbonText = new Text({
        text: "KỶ LỤC MỚI!",
        style: {
          fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
          fontSize: 10,
          fill: "#ffffff",
          fontWeight: "bold",
          
          
          padding: 8,
        },
      });
      ribbonText.anchor.set(0.5);
      ribbonText.position.set(0, 40);
      badgeContainer.addChild(ribbon, ribbonText);
    }

    // 3. Stats Labels (Relocated below the badge)
    const scoreLabel = new Text({
      text: `ĐIỂM SỐ: ${this.score}`,
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 26,
        fontWeight: "bold",
        fill: "#241d4f",
        
      },
    });
    scoreLabel.anchor.set(0.5);
    scoreLabel.y = 35;
    this.gameOverModal.addChild(scoreLabel);

    if (rank) {
      const rankContainer = new Container();
      rankContainer.y = 85;
      this.gameOverModal.addChild(rankContainer);

      const trophyL = createVectorIcon("🏆", 24);
      rankContainer.addChild(trophyL);

      const rankText = new Text({
        text: ` KỶ LỤC MỚI! HẠNG #${rank} `,
        style: {
          fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
          fontSize: 20,
          fontWeight: "bold",
          fill: "#e91e63",
          
        },
      });
      rankText.anchor.set(0.5);
      rankText.position.set(20, 0);
      rankContainer.addChild(rankText);

      // Center the elements in rankContainer
      const gap = 8;
      const totalW = trophyL.width + gap + rankText.width;
      trophyL.x = -totalW / 2 + trophyL.width / 2;
      rankText.x = totalW / 2 - rankText.width / 2;

      rankContainer.scale.set(1.0);
      gsap.to(rankContainer.scale, {
        x: 1.06,
        y: 1.06,
        duration: 0.6,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    } else {
      const normalLabel = new Text({
        text: "Hãy cố gắng hơn ở lượt chơi kế tiếp nhé!",
        style: {
          fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
          fontSize: 14,
          fill: "#7c73a1",
          
        },
      });
      normalLabel.anchor.set(0.5);
      normalLabel.y = 85;
      this.gameOverModal.addChild(normalLabel);
    }

    // 4. Action Buttons (Circular Icon style in a single row)
    const btnY = 165;
    const btnRadius = 32;

    // Revive button (heart icon)
    const reviveBtn = this.createCircularButton(
      "heart",
      -135,
      btnY,
      async () => {
        if (this.hasContinued) return;
        const success = await AdManager.showRewardedVideo();
        if (success) {
          if (this.gameOverIntervalId) {
            clearInterval(this.gameOverIntervalId);
            this.gameOverIntervalId = null;
          }
          this.hasContinued = true;
          this.moves = 5;
          this.isGameOver = false;
          this.disabled = false;
          gsap.to(this.gameOverScreen, {
            alpha: 0,
            duration: 0.3,
            onComplete: () => {
              killTweensRecursive(this.gameOverScreen);
              this.gameOverScreen.destroy({ children: true });
              this.gameOverScreen = null;
              soundManager.stopBGM();
              soundManager.playBGM();
            },
          });
        }
      },
      this.gameOverModal,
      btnRadius
    );
    if (this.hasContinued) {
      reviveBtn.alpha = 0.5;
      reviveBtn.eventMode = "none";
    }

    // Double Reward button (star x2 icon)
    let hasDoubled = false;
    const doubleBtn = this.createCircularButton(
      "star",
      -45,
      btnY,
      async () => {
        if (hasDoubled) return;
        const success = await AdManager.showRewardedVideo();
        if (success) {
          hasDoubled = true;
          doubleBtn.alpha = 0.5;
          doubleBtn.eventMode = "none";
          this.score = this.score * 2;
          scoreLabel.text = `ĐIỂM SỐ: ${this.score}`;
          await gameAlert("🎉 Điểm số của bạn đã được x2!");
        }
      },
      this.gameOverModal,
      btnRadius
    );

    // PLAY AGAIN Button (replay arrow icon)
    this.createCircularButton(
      "🔄",
      45,
      btnY,
      async () => {
        if (this.gameOverIntervalId) {
          clearInterval(this.gameOverIntervalId);
          this.gameOverIntervalId = null;
        }
        window.defeatCount_marth3 = (window.defeatCount_marth3 || 0) + 1;
        if (window.defeatCount_marth3 >= 3) {
          window.defeatCount_marth3 = 0;
          await AdManager.showInterstitial();
        }
        await sceneManager.switchTo(GameScene);
      },
      this.gameOverModal,
      btnRadius
    );

    // MAIN MENU Button (home icon)
    this.createCircularButton(
      "🏠",
      135,
      btnY,
      async () => {
        if (this.gameOverIntervalId) {
          clearInterval(this.gameOverIntervalId);
          this.gameOverIntervalId = null;
        }
        const { MainMenuScene } = await import("./MainMenuScene.js");
        await sceneManager.switchTo(MainMenuScene);
      },
      this.gameOverModal,
      btnRadius
    );

    // 5. Spawn Confetti Fireworks Loop
    this.gameOverIntervalId = setInterval(() => {
      if (!this.isGameOver || !this.gameOverScreen) {
        clearInterval(this.gameOverIntervalId);
        this.gameOverIntervalId = null;
        return;
      }
      this.spawnFireworkBurst(
        Math.random() * App.app.screen.width,
        Math.random() * App.app.screen.height * 0.65,
        16,
      );
    }, 850);

    // Initial big explosions
    for (let i = 0; i < 4; i++) {
      gsap.delayedCall(i * 0.3, () => {
        if (this.isGameOver && this.gameOverScreen) {
          this.spawnFireworkBurst(
            App.app.screen.width / 2 + (Math.random() - 0.5) * 320,
            App.app.screen.height / 2 - 80 + (Math.random() - 0.5) * 240,
            28,
          );
        }
      });
    }

    // Apply responsive layout immediately
    this.resize();

    const targetScale = this.gameOverModal.scale.x;
    this.gameOverModal.scale.set(targetScale * 0.7);

    // Entrance animation
    this.gameOverScreen.alpha = 0;
    gsap.to(this.gameOverScreen, { alpha: 1, duration: 0.4 });
    gsap.to(this.gameOverModal.scale, {
      x: targetScale,
      y: targetScale,
      duration: 0.5,
      ease: "back.out(1.8)",
    });
  }

  async handleDeadlock() {
    this.disabled = true;

    this.deadlockOverlayContainer = new Container();
    this.deadlockOverlayContainer.zIndex = 90;
    this.container.addChild(this.deadlockOverlayContainer);

    // Dark glassmorphic background overlay
    this.deadlockOverlayBg = new Graphics();
    this.deadlockOverlayBg.rect(
      0,
      0,
      App.app.screen.width,
      App.app.screen.height,
    );
    this.deadlockOverlayBg.fill({ color: 0x000000, alpha: 0.75 });
    this.deadlockOverlayContainer.addChild(this.deadlockOverlayBg);

    // Center notification container
    this.deadlockModal = new Container();
    this.deadlockModal.x = App.app.screen.width / 2;
    this.deadlockModal.y = App.app.screen.height / 2;
    this.deadlockOverlayContainer.addChild(this.deadlockModal);

    // Hào quang cam xoay đằng sau modal thông báo bế tắc
    const starburst = new Graphics();
    const rays = 8;
    for (let i = 0; i < rays; i++) {
      const angle1 = (i * Math.PI * 2) / rays - 0.12;
      const angle2 = (i * Math.PI * 2) / rays + 0.12;
      starburst.moveTo(0, 0);
      starburst.arc(0, 0, 320, angle1, angle2);
      starburst.fill({ color: 0xffaa00, alpha: 0.05 });
    }
    this.deadlockModal.addChild(starburst);
    gsap.to(starburst, {
      rotation: Math.PI * 2,
      duration: 18,
      repeat: -1,
      ease: "none",
    });

    const modalBg = new Graphics();
    modalBg.roundRect(-220, -70, 440, 140, 16);
    modalBg.fill({ color: 0x161233, alpha: 0.96 });
    modalBg.stroke({ color: 0xffea00, width: 5 });
    this.deadlockModal.addChild(modalBg);

    const text = new Text({
      text: "HẾT NƯỚC ĐI!\nĐANG TRÁO BÀN NGỌC...",
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 24,
        fontWeight: "bold",
        fill: "#ffea00",
        align: "center",
        
        
      },
    });
    text.anchor.set(0.5);
    this.deadlockModal.addChild(text);

    // Apply responsive layout immediately
    this.resize();

    const targetScale = this.deadlockModal.scale.x;
    this.deadlockModal.scale.set(targetScale * 0.7);

    // Show overlay with animation
    this.deadlockOverlayContainer.alpha = 0;
    gsap.to(this.deadlockOverlayContainer, { alpha: 1, duration: 0.3 });
    gsap.to(this.deadlockModal.scale, {
      x: targetScale,
      y: targetScale,
      duration: 0.4,
      ease: "back.out(1.5)",
    });

    // Wait for player to notice
    await this.delay(1200);

    // Shuffle the board with slider animation
    await this.board.shuffleAll(this.combinationManager, true);

    // Add a small extra delay for satisfying resolution
    await this.delay(400);

    // Fade out overlay
    await new Promise((resolve) => {
      gsap.to(this.deadlockOverlayContainer, {
        alpha: 0,
        duration: 0.3,
        onComplete: () => {
          killTweensRecursive(this.deadlockOverlayContainer);
          this.deadlockOverlayContainer.destroy({ children: true });
          this.deadlockOverlayContainer = null;
          this.deadlockOverlayBg = null;
          this.deadlockModal = null;
          resolve();
        },
      });
    });

    this.disabled = false;
  }

  createModalButton(
    parent,
    label,
    x,
    y,
    color,
    onClick,
    textColor = 0xffffff,
    btnWidth = 240,
    btnHeight = 56,
  ) {
    const btn = new Container();
    btn.x = x;
    btn.y = y;
    parent.addChild(btn);

    btn.eventMode = "static";
    btn.cursor = "pointer";

    // Sub-container for contents to apply tactile press offset without interfering with parent position
    const content = new Container();
    btn.addChild(content);

    const shadow = new Graphics();
    const bg = new Graphics();
    const highlight = new Graphics();

    content.addChild(shadow);
    content.addChild(bg);
    content.addChild(highlight);

    const width = btnWidth;
    const hh = btnHeight / 2;
    const isSmall = width < 150;
    const radius = hh; // Capsule corner radius
    const shadowOffset = isSmall ? 4 : 5;

    const colorStyle = getColorStyle(color, label);
    const theme = palettes[colorStyle] || palettes.blue;

    // 1. 3D Base Shadow
    shadow.roundRect(-width / 2, -hh + shadowOffset, width, btnHeight, radius).fill({ color: theme.shadow });

    // 2. Main Face Background (gradient)
    const btnGrad = new FillGradient({
      start: { x: 0, y: -hh },
      end: { x: 0, y: hh },
      colorStops: [
        { offset: 0, color: theme.top },
        { offset: 1, color: theme.bottom }
      ]
    });
    bg.roundRect(-width / 2, -hh, width, btnHeight, radius)
      .fill({ fill: btnGrad })
      .stroke({ width: 2.5, color: theme.stroke });

    // 3. Glossy highlight sheen on top (ellipse highlight)
    highlight.ellipse(0, -hh / 2, width * 0.42, btnHeight * 0.2)
      .fill({ color: 0xffffff, alpha: 0.25 });

    // Add Label / Icon
    let textObj = null;

    const spaceIdx = label.indexOf(" ");
    if (spaceIdx !== -1 && label.charCodeAt(0) > 127) {
      const emoji = label.substring(0, spaceIdx);
      const textStr = label.substring(spaceIdx + 1);

      const emojiSize = isSmall ? 16 : 26;
      const textSize = isSmall ? 11 : 14;

      const emojiIcon = createVectorIcon(emoji, emojiSize);
      content.addChild(emojiIcon);

      const text = new Text({
        text: textStr.toUpperCase(),
        style: new TextStyle({
          fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
          fontSize: textSize,
          fontWeight: "900",
          fill: textColor,
          
          }),
      });
      text.anchor.set(0.5);
      content.addChild(text);
      textObj = text;

      const gap = isSmall ? 6 : 12;
      const totalW = emojiIcon.width + gap + text.width;
      emojiIcon.x = -totalW / 2 + emojiIcon.width / 2;
      text.x = totalW / 2 - text.width / 2;
    } else {
      const textSize = isSmall ? 11 : (label.length > 2 ? 15 : 22);
      const text = new Text({
        text: label.toUpperCase(),
        style: new TextStyle({
          fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
          fontSize: textSize,
          fontWeight: "900",
          fill: textColor,
          
          }),
      });
      text.anchor.set(0.5);
      content.addChild(text);
      textObj = text;
    }

    // Interactivity
    btn.on("pointerover", () => {
      gsap.to(btn.scale, { x: 1.05, y: 1.05, duration: 0.12 });
      // soundManager.playClick();
    });
    btn.on("pointerout", () => {
      gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.12 });
      gsap.to(content, { y: 0, duration: 0.1 });
    });
    btn.on("pointerdown", () => {
      gsap.to(content, { y: shadowOffset - 1, duration: 0.05 });
    });
    btn.on("pointerup", () => {
      gsap.to(content, { y: 0, duration: 0.1 });
      onClick();
    });
    btn.on("pointerupoutside", () => {
      gsap.to(content, { y: 0, duration: 0.1 });
    });
  }

  createCircularButton(emojiText, x, y, onClick, parent = null, customRadius = 26) {
    const tex = getIconTexture(emojiText);
    if (tex) {
      const btn = new Container();
      btn.x = x;
      btn.y = y;
      if (parent) {
        parent.addChild(btn);
      }
 
      btn.eventMode = "static";
      btn.cursor = "pointer";
 
      const content = new Container();
      btn.addChild(content);
 
      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5);
      sprite.width = customRadius * 2;
      sprite.height = customRadius * 2;
      const drawOverlays = (r) => {};
      content.addChild(sprite);



      drawOverlays(customRadius);
 
      btn.r = customRadius;
      btn.updateStyle = (r) => {
        btn.r = r;
        sprite.width = r * 2;
        sprite.height = r * 2;
        drawOverlays(r);
      };
 
      btn.on("pointerover", () => {
        gsap.to(btn.scale, { x: 1.08, y: 1.08, duration: 0.12 });
        // soundManager.playClick();
      });
 
      btn.on("pointerout", () => {
        gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.12 });
        gsap.to(content, { y: 0, duration: 0.1 });
      });
 
      btn.on("pointerdown", () => {
        gsap.to(content, { y: 4, duration: 0.05 });
      });
 
      btn.on("pointerup", () => {
        gsap.to(content, { y: 0, duration: 0.1 });
        onClick();
      });
 
      btn.on("pointerupoutside", () => {
        gsap.to(content, { y: 0, duration: 0.1 });
      });
 
      // Entrance animation
      btn.alpha = 0;
      gsap.to(btn, {
        alpha: 1,
        duration: 0.5,
        delay: 0.4,
        ease: "power2.out",
      });
 
      return btn;
    }
    return null;
  }

  resize() {
    const width = App.app.screen.width;
    const height = App.app.screen.height;

    // 1. Resize Background
    if (this.bg) {
      this.bg.width = width;
      this.bg.height = height;
    }

    // 2. Adjust Board Position and Scale
    if (this.board) {
      this.board.adjustPosition();
    }

    // 3. Adjust Board Outline Background
    if (this.boardBg && this.board) {
      const scale = this.board.container.scale.x;
      this.boardBg.scale.set(scale);
      const padding = 16;
      this.boardBg.x = this.board.container.x - padding * scale;
      this.boardBg.y = this.board.container.y - padding * scale;
    }

    // 4. Position and scale HUD panels
    if (
      this.scorePanel &&
      this.movesPanel &&
      this.scoreText &&
      this.movesText
    ) {
      const isMobileLandscape = width > height && height < 500;
      const isMobilePortrait = width < 600 || height > width;

      let panelWidth = 240;
      let panelHeight = 60;
      let fontSize = 24;

      if (isMobileLandscape) {
        // Xoay ngang điện thoại: xếp 2 bảng 2 bên trái/phải bảng ngọc
        panelWidth = 160;
        panelHeight = 50;
        fontSize = 16;

        // Căn giữa bảng Score ở khoảng trống bên trái bảng ngọc
        const leftSpace = this.board.container.x;
        this.scorePanel.x = (leftSpace - panelWidth) / 2;
        this.scorePanel.y = (height - panelHeight) / 2;

        // Căn giữa bảng Moves ở khoảng trống bên phải bảng ngọc
        const boardRight =
          this.board.container.x +
          this.board.cols * App.config.tileSize * this.board.container.scale.x;
        const rightSpace = width - boardRight;
        this.movesPanel.x = boardRight + (rightSpace - panelWidth) / 2;
        this.movesPanel.y = (height - panelHeight) / 2;
      } else if (isMobilePortrait) {
        // Màn hình dọc điện thoại: xếp ở trên cùng nhưng lùi xuống để không bị nút Fullscreen đè
        panelWidth = Math.min(200, (width - 40) / 2);
        panelHeight = 50;
        fontSize = 18;

        const margin = 15;
        const topY = 75; // Pushed down from 15 to clear the 16px top + 44px height profile/fullscreen buttons

        this.scorePanel.x = margin;
        this.scorePanel.y = topY;

        this.movesPanel.x = width - margin - panelWidth;
        this.movesPanel.y = topY;
      } else {
        // Màn hình PC/Laptop: xếp ở góc trên trái và góc trên phải
        panelWidth = 240;
        panelHeight = 60;
        fontSize = 24;

        const margin = 100;
        const topY = 25;

        this.scorePanel.x = margin;
        this.scorePanel.y = topY;

        this.movesPanel.x = width - margin - panelWidth;
        this.movesPanel.y = topY;
      }

      // Vẽ lại khung cho 2 bảng (Dạng hộp 3D cartoon bubble!)
      const shadowOffset = 5;

      this.scorePanel.clear()
        // 3D Shadow Base
        .roundRect(0, shadowOffset, panelWidth, panelHeight, 12)
        .fill({ color: 0x004466 })
        // Main Face Background (gradient)
        .roundRect(0, 0, panelWidth, panelHeight, 12)
        .fill({
          fill: new FillGradient({
            start: { x: 0, y: 0 },
            end: { x: 0, y: panelHeight },
            colorStops: [
              { offset: 0, color: 0x33CCFF },
              { offset: 1, color: 0x0088CC }
            ]
          })
        })
        .stroke({ width: 2.5, color: 0xE6F9FF })
        // Highlight Sheen
        .ellipse(panelWidth / 2, panelHeight * 0.22, panelWidth * 0.42, panelHeight * 0.15)
        .fill({ color: 0xffffff, alpha: 0.25 });

      this.movesPanel.clear()
        // 3D Shadow Base
        .roundRect(0, shadowOffset, panelWidth, panelHeight, 12)
        .fill({ color: 0x800040 })
        // Main Face Background (gradient)
        .roundRect(0, 0, panelWidth, panelHeight, 12)
        .fill({
          fill: new FillGradient({
            start: { x: 0, y: 0 },
            end: { x: 0, y: panelHeight },
            colorStops: [
              { offset: 0, color: 0xFF66B2 },
              { offset: 1, color: 0xCC0066 }
            ]
          })
        })
        .stroke({ width: 2.5, color: 0xFFE6F2 })
        // Highlight Sheen
        .ellipse(panelWidth / 2, panelHeight * 0.22, panelWidth * 0.42, panelHeight * 0.15)
        .fill({ color: 0xffffff, alpha: 0.25 });

      // Định vị lại chữ vào giữa bảng tương ứng
      this.scoreText.style.fontSize = fontSize;
      this.scoreText.x = this.scorePanel.x + panelWidth / 2;
      this.scoreText.y = this.scorePanel.y + panelHeight / 2;

      this.movesText.style.fontSize = fontSize;
      this.movesText.x = this.movesPanel.x + panelWidth / 2;
      this.movesText.y = this.movesPanel.y + panelHeight / 2;
    }

    // 4.5. Position Settings Button in Gameplay
    if (this.settingsBtn) {
      this.settingsBtn.x = width - 42;
      this.settingsBtn.y = height - 42;
    }

    // 5. Position Combo Text
    if (this.comboText) {
      this.comboText.x = width / 2;
      this.comboText.y = height / 2 - 100;
    }

    // 5.2. Position and Resize Loading Text
    if (this.loadingText && !this.loadingText.destroyed) {
      this.loadingText.x = width / 2;
      this.loadingText.y = height / 2;
      this.loadingText.style.fontSize = Math.max(
        14,
        Math.min(22, 22 * (width / 480)),
      );
    }

    // 5.5. Position and Resize Tutorial Text
    if (this.tutorialText && !this.tutorialText.destroyed) {
      const isMobilePortrait = width < 600 || height > width;
      if (isMobilePortrait) {
        // Enforce word wrapping on mobile to prevent overflow
        this.tutorialText.style.wordWrap = true;
        this.tutorialText.style.wordWrapWidth = Math.min(width - 80, 320);
        this.tutorialText.style.align = "center";

        this.tutorialText.style.fontSize = Math.max(
          11,
          Math.min(13, 13 * (width / 450)),
        );
        this.tutorialText.x = width / 2;
        // Position it in the bottom space below the board
        let boardBottom = height - 100;
        let scale = 1.0;
        if (this.board && this.board.container) {
          scale = this.board.container.scale.y;
          boardBottom =
            this.board.container.y +
            this.board.rows *
              App.config.tileSize *
              scale;
        }
        // Visual bottom of the board background (includes outline padding 16px)
        const boardBgBottom = boardBottom + 16 * scale;
        // Settings button top boundary (center is height - 42, radius is 26)
        const settingsBtnTop = height - 68;

        // Position the tutorial text vertically centered in the safe gap
        if (settingsBtnTop > boardBgBottom) {
          this.tutorialText.y = boardBgBottom + (settingsBtnTop - boardBgBottom) / 2;
        } else {
          // Fallback if screen is extremely squished: place it slightly above settings button
          this.tutorialText.y = settingsBtnTop - 20;
        }
        this.tutorialText.visible = true;
      } else {
        // Disable word wrap or set a large wrap width on PC
        this.tutorialText.style.wordWrap = true;
        this.tutorialText.style.wordWrapWidth = 600;
        this.tutorialText.style.align = "center";

        this.tutorialText.style.fontSize = 14;
        this.tutorialText.x = width / 2;
        
        // Calculate the top of the board visually
        let boardTop = 115;
        if (this.boardBg && this.board) {
            boardTop = this.board.container.y - 16 * this.board.container.scale.x;
        }
        
        const isMobileLandscape = width > height && height < 500;
        if (isMobileLandscape) {
            // Hide on squished mobile landscape to save space
            this.tutorialText.visible = false;
        } else {
            // On PC, HUD ends at y = 85 (25 + 60). Center the text between HUD and Board.
            const hudBottom = 85;
            this.tutorialText.y = hudBottom + (boardTop - hudBottom) / 2;
            this.tutorialText.visible = true;
        }
      }
    }

    // 6. Handle Game Over Screen
    if (this.gameOverScreen && !this.gameOverScreen.destroyed) {
      if (this.gameOverOverlay) {
        this.gameOverOverlay.clear();
        this.gameOverOverlay.rect(0, 0, width, height);
        this.gameOverOverlay.fill({ color: 0x000000, alpha: 0.8 });
      }
      if (this.gameOverModal) {
        this.gameOverModal.x = width / 2;
        this.gameOverModal.y = height / 2;
        const modalScale =
          width < 600 || height > width
            ? Math.min(1.0, (width - 40) / 480)
            : 1.0;
        this.gameOverModal.scale.set(modalScale);
      }
    }

    // 7. Handle Deadlock Overlay
    if (
      this.deadlockOverlayContainer &&
      !this.deadlockOverlayContainer.destroyed
    ) {
      if (this.deadlockOverlayBg) {
        this.deadlockOverlayBg.clear();
        this.deadlockOverlayBg.rect(0, 0, width, height);
        this.deadlockOverlayBg.fill({ color: 0x000000, alpha: 0.75 });
      }
      if (this.deadlockModal) {
        this.deadlockModal.x = width / 2;
        this.deadlockModal.y = height / 2;
        const modalScale =
          width < 600 || height > width
            ? Math.min(1.0, (width - 40) / 440)
            : 1.0;
        this.deadlockModal.scale.set(modalScale);
      }
    }

    // 8. Settings Popup Resizing
    if (this.settingsPopup) {
      if (this.settingsOverlayBg) {
        this.settingsOverlayBg.clear();
        this.settingsOverlayBg.rect(0, 0, width, height);
        this.settingsOverlayBg.fill({ color: 0x000000, alpha: 0.65 });
      }
      if (this.settingsModal) {
        this.settingsModal.x = width / 2;
        this.settingsModal.y = height / 2;
        const modalScale =
          width < 600 || height > width
            ? Math.min(1.0, (width - 40) / 380)
            : 1.0;
        this.settingsModal.scale.set(modalScale);
      }
    }
  }

  // ============================================================
  //  CLEANUP
  // ============================================================

  showSettingsModal(isIngame = true) {
    if (this.settingsPopup) return;

    soundManager.playClick();

    // Pause game logic by disabling interactions
    this.disabled = true;

    const popup = new Container();
    popup.zIndex = 150;
    this.container.addChild(popup);
    this.settingsPopup = popup;

    this.settingsOverlayBg = new Graphics();
    this.settingsOverlayBg.rect(0, 0, App.app.screen.width, App.app.screen.height);
    this.settingsOverlayBg.fill({ color: 0x000000, alpha: 0.65 });
    this.settingsOverlayBg.eventMode = "static";
    popup.addChild(this.settingsOverlayBg);

    this.settingsModal = new Container();
    this.settingsModal.x = App.app.screen.width / 2;
    this.settingsModal.y = App.app.screen.height / 2;
    popup.addChild(this.settingsModal);

    const cardW = 420;
    const cardH = 380;

    // 1. Soft Card Shadow
    const cardShadow = new Graphics()
      .roundRect(-cardW / 2 + 6, -cardH / 2 + 12, cardW, cardH, 20)
      .fill({ color: 0x000000, alpha: 0.25 });
    this.settingsModal.addChild(cardShadow);

    // 2. Thick 3D Purple-Violet Border
    const borderBg = new Graphics()
      .roundRect(-cardW / 2, -cardH / 2 + 6, cardW, cardH, 20)
      .fill({ color: 0x330066 }) // Shadow Base
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 20)
      .fill({
        fill: new FillGradient({
          start: { x: 0, y: -cardH / 2 },
          end: { x: 0, y: cardH / 2 },
          colorStops: [
            { offset: 0, color: 0xb266ff },
            { offset: 1, color: 0x5900b3 }
          ]
        })
      })
      .stroke({ color: 0xffea00, width: 2.5 }); // Gold inner border
    this.settingsModal.addChild(borderBg);

    // 3. Bright Cream Card Face
    const cardFace = new Graphics()
      .roundRect(-cardW / 2 + 8, -cardH / 2 + 8, cardW - 16, cardH - 16, 14)
      .fill({ color: 0xfbfaf5 });
    this.settingsModal.addChild(cardFace);

    // 4. Floating 3D Title Ribbon (Cyan-Blue)
    const ribbonW = 210;
    const ribbonH = 42;
    const ribbonY = -cardH / 2;
    const ribbon = new Graphics()
      .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2 + 4, ribbonW, ribbonH, 10)
      .fill({ color: 0x004466 }) // Ribbon shadow
      .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2, ribbonW, ribbonH, 10)
      .fill({
        fill: new FillGradient({
          start: { x: 0, y: ribbonY - ribbonH / 2 },
          end: { x: 0, y: ribbonY + ribbonH / 2 },
          colorStops: [
            { offset: 0, color: 0x33ccff },
            { offset: 1, color: 0x0088cc }
          ]
        })
      })
      .stroke({ color: 0xe6f9ff, width: 2 });
    this.settingsModal.addChild(ribbon);

    // Title text inside ribbon
    const titleText = new Text({
      text: "CÀI ĐẶT GAME",
      style: new TextStyle({
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 18,
        fill: 0xffffff,
        fontWeight: "bold",
        letterSpacing: 1.5,
        
        }),
    });
    titleText.anchor.set(0.5);
    titleText.position.set(0, ribbonY);
    this.settingsModal.addChild(titleText);

    // Reusable Toggle Row Builder
    const createToggleRow = (labelText, yPos, initialMuteState, onToggle, strokeColor = 0xddeaff) => {
      const row = new Container();
      row.position.set(0, yPos);

      // Row background card panel to group label and toggle visually
      // Enlarged height to 56 to fit the 50-height toggle switch
      const rowBg = new Graphics()
        .roundRect(-165, -32, 330, 64, 15)
        .fill({ color: 0xffffff }) // Warm creamy beige
        .stroke({ color: strokeColor, width: 3 });
      row.addChild(rowBg);

      // Left label (enlarged cartoon text)
      const label = new Text({
        text: labelText.toUpperCase(),
        style: new TextStyle({
          fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
          fontSize: 18,
          fill: "#360207",
          fontWeight: "bold",
          letterSpacing: 0.8,
          }),
      });
      label.anchor.set(0, 0.5);
      label.position.set(-140, 0);
      row.addChild(label);

      // Right slider track (using preloaded 3D toggle texture)
      // Enlarged to width = 100, height = 50 to make it visually matching and prominent
      const track = new Sprite(Texture.from(initialMuteState ? "toggle_off" : "toggle_on"));
      track.anchor.set(0.5);
      track.width = 100;
      track.height = 50;
      track.eventMode = "static";
      track.cursor = "pointer";
      track.position.set(110, 0);
      row.addChild(track);

      // Draw dotted connector line dynamically between text and switch
      const labelWidth = label.width;
      const startX = -140 + labelWidth + 15;
      const endX = 110 - 50 - 15;
      if (startX < endX) {
        const dots = new Graphics();
        for (let dx = startX; dx <= endX; dx += 6) {
          dots.circle(dx, 0, 1.5);
        }
        dots.fill({ color: 0xccccdd });
        row.addChild(dots);
      }

      const handleToggle = () => {
        soundManager.playClick();
        const isMuted = onToggle();
        track.texture = Texture.from(isMuted ? "toggle_off" : "toggle_on");
      };

      track.on("pointertap", handleToggle);
      label.eventMode = "static";
      label.cursor = "pointer";
      label.on("pointertap", handleToggle);

      return row;
    };

    // Add Music and SFX rows (spaced out for cardH = 300)
    const musicRowY = -80;
    const sfxRowY = -10;

    const musicRow = createToggleRow(
      "NHẠC NỀN",
      musicRowY,
      !soundManager.musicEnabled,
      () => {
        soundManager.toggleMusic();
        return !soundManager.musicEnabled;
      },
      0x00ccff // Cyan border
    );
    const sfxRow = createToggleRow(
      "HIỆU ỨNG",
      sfxRowY,
      !soundManager.enabled,
      () => {
        soundManager.enabled = !soundManager.enabled;
        return !soundManager.enabled;
      },
      0xff66cc // Pink border
    );

    this.settingsModal.addChild(musicRow);
    this.settingsModal.addChild(sfxRow);

    const closePopup = () => {
      soundManager.playClick();
      gsap.to(this.settingsModal.scale, { x: 0.7, y: 0.7, duration: 0.2 });
      gsap.to(popup, {
        alpha: 0,
        duration: 0.2,
        onComplete: () => {
          killTweensRecursive(popup);
          popup.destroy({ children: true });
          this.settingsPopup = null;
          this.settingsOverlayBg = null;
          this.settingsModal = null;
          this.disabled = false; // resume game interactions
        },
      });
    };

    // Use the 3D circular buttons side-by-side at y = 45!
    // Enlarged to radius = 32 (diameter = 64) to match the Game Over screen
    this.createCircularButton(
      "🏠",
      -80,
      85,
      async () => {
        closePopup();
        const { MainMenuScene } = await import("./MainMenuScene.js");
        await sceneManager.switchTo(MainMenuScene);
      },
      this.settingsModal,
      32
    );

    this.createCircularButton(
      "🔄",
      0,
      85,
      async () => {
        closePopup();
        await sceneManager.switchTo(GameScene);
      },
      this.settingsModal,
      32
    );

    this.createCircularButton(
      "▶️",
      80,
      85,
      closePopup,
      this.settingsModal,
      32
    );

    const versionText = new Text({
      text: "Phiên bản: 1.0.0",
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 11,
        fill: "#7c73a1",
      },
    });
    versionText.anchor.set(0.5);
    versionText.position.set(0, 150);
    this.settingsModal.addChild(versionText);

    // Apply responsive layout immediately to compute target scale
    this.resize();

    const targetScale = this.settingsModal.scale.x;
    this.settingsModal.scale.set(targetScale * 0.7);

    // Entrance animation
    popup.alpha = 0;
    gsap.to(popup, { alpha: 1, duration: 0.3 });
    gsap.to(this.settingsModal.scale, {
      x: targetScale,
      y: targetScale,
      duration: 0.35,
      ease: "back.out(1.8)",
    });
  }

  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  destroy() {
    if (this.gameOverIntervalId) {
      clearInterval(this.gameOverIntervalId);
      this.gameOverIntervalId = null;
    }

    // Show the user profile widget again when exiting GameScene
    const profileWidget = document.getElementById("user-profile");
    if (profileWidget) {
      profileWidget.style.display = "none";
    }

    // Recursively kill all GSAP animations inside this scene graph
    killTweensRecursive(this.container);
    if (this.board && this.board.container) {
      killTweensRecursive(this.board.container);
    }
    if (this.ambientParticles) {
      this.ambientParticles.forEach((p) => killTweensRecursive(p));
    }

    // Clean up board
    if (this.board) {
      this.board.fields.forEach((field) => {
        if (field.tile) {
          field.tile._cleanupBoardOverlays();
        }
      });
      this.board.container.destroy({ children: true });
    }

    this.container.destroy({ children: true });
  }
}

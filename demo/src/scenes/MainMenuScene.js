import { Container, Graphics, Sprite, Texture, Text, Assets, TextStyle, FillGradient, Rectangle } from "pixi.js";
import gsap from "gsap";
import { Config } from "../config.js";
import { App } from "../system/App.js";
import { sceneManager } from "../system/SceneManager.js";
import { saveManager } from "../system/SaveManager.js";
import { GameScene } from "./GameScene.js";
import { soundManager } from "../system/SoundManager.js";
import { Colorful3DCircleButton, Colorful3DButton, createVectorIcon as createVectorIconFromUI, mapEmojiToIconType } from "../system/UIComponents.js";

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

function getAvatarAlias(name) {
  let spriteAlias = "menu_avatar_unique_0";
  if (!name) return spriteAlias;

  if (name.includes("Bơ Lạc")) spriteAlias = "menu_avatar_unique_0";
  else if (name.includes("Đậu Phộng")) spriteAlias = "menu_avatar_unique_14";
  else if (name.includes("Ếch Xanh")) spriteAlias = "menu_avatar_unique_9";
  else if (name.includes("Gấu Trúc")) spriteAlias = "menu_avatar_unique_21";
  else if (name.includes("Mèo Lười")) spriteAlias = "menu_avatar_unique_1";
  else {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const avatarIdx = Math.abs(hash) % ALL_AVATAR_FILES.length;
    spriteAlias = `menu_avatar_unique_${avatarIdx}`;
  }
  return spriteAlias;
}

function gameConfirm(message) {
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
        .game-alert-buttons-container {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 20px;
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

    const btnContainer = document.createElement("div");
    btnContainer.className = "game-alert-buttons-container";

    const okButton = document.createElement("img");
    okButton.className = "game-alert-img-btn";
    okButton.src = "assets/yes_btn.png";
    okButton.alt = "ĐỒNG Ý";

    const cancelButton = document.createElement("img");
    cancelButton.className = "game-alert-img-btn";
    cancelButton.src = "assets/close_btn.png";
    cancelButton.alt = "HỦY";

    btnContainer.appendChild(okButton);
    btnContainer.appendChild(cancelButton);
    card.appendChild(text);
    card.appendChild(btnContainer);
    overlay.appendChild(card);

    const container = document.getElementById("app") || document.body;
    container.appendChild(overlay);

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      card.style.transform = "scale(1)";
    });

    const handleSelect = (choice) => {
      overlay.style.opacity = "0";
      card.style.transform = "scale(0.85)";
      setTimeout(() => {
        overlay.remove();
        resolve(choice);
      }, 250);
    };

    okButton.addEventListener("click", () => handleSelect(true));
    cancelButton.addEventListener("click", () => handleSelect(false));
  });
}

const palettes = {
  yellow: { top: 0xFFE500, bottom: 0xFF9900, shadow: 0x8A4500, stroke: 0xFFF8B3 },
  green: { top: 0x7FFF00, bottom: 0x00CC00, shadow: 0x006600, stroke: 0xD4FFD4 },
  pink: { top: 0xFF66B2, bottom: 0xCC0066, shadow: 0x800040, stroke: 0xFFE6F2 },
  blue: { top: 0x33CCFF, bottom: 0x0088CC, shadow: 0x004466, stroke: 0xE6F9FF },
  purple: { top: 0xB266FF, bottom: 0x5900B3, shadow: 0x330066, stroke: 0xF2E6FF },
  red: { top: 0xF95E8B, bottom: 0xD93955, shadow: 0x92233F, stroke: 0xFFD4E2 }
};

const getColorStyle = (colorValue, label = "") => {
  const lbl = String(label).toUpperCase();
  if (lbl.includes("PLAY") || lbl.includes("CHƠI LẠI")) return "green";
  if (lbl.includes("TIẾP TỤC")) return "yellow";
  if (lbl.includes("QUAY LẠI") || lbl.includes("BACK")) return "blue";
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
    "▶️": "play_btn",
    "🏆": "trophy_btn",
    "🔄": "replay_btn",
    "🗑️": "delete_btn"
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

export class MainMenuScene {
  constructor(data = {}) {
    this.container = new Container();
    this.container.sortableChildren = true;

    App.setBackgroundColor(0x0a0a1a);

    // Make music slightly louder than click SFX (0.18) on Main Menu
    soundManager.setBGMVolume(0.4);

    // Phát nhạc nền khi người chơi tương tác lần đầu
    const startBGM = () => {
      soundManager.playBGM();
      window.removeEventListener("click", startBGM);
      window.removeEventListener("touchend", startBGM);
    };
    window.addEventListener("click", startBGM);
    window.addEventListener("touchend", startBGM);

    // === BACKGROUND ===
    this.bg = new Sprite(Texture.WHITE);
    this.bg.width = App.app.screen.width;
    this.bg.height = App.app.screen.height;
    this.bg.tint = 0x0a0a1a; // dark fallback tint
    this.container.addChild(this.bg);

    // Load random background from the 3 new options
    const bgIndex = Math.floor(Math.random() * 3) + 1;
    const bgPath = `/assets/backgroud/vietnamese_cultural_landscape_background_${bgIndex}/screen.png`;
    Assets.load(bgPath)
      .then((texture) => {
        if (this.bg.destroyed) return;
        this.bg.texture = texture;
        this.bg.tint = 0x888888; // brighter background for clearer landscape
      })
      .catch((err) => {
        console.error("Failed to load Main Menu background:", err);
      });

    // === PARTICLES ===
    const tempParticle = new Graphics();
    tempParticle.circle(8, 8, 8);
    tempParticle.fill({ color: 0xffffff });
    const particleTexture = App.app.renderer.generateTexture({
      target: tempParticle,
    });
    tempParticle.destroy();

    // Spawn 30 drifting particles
    this.particles = [];
    for (let i = 0; i < 30; i++) {
      const size = 1 + Math.random() * 3;
      const p = new Sprite(particleTexture);
      p.anchor.set(0.5);
      p.width = size * 2;
      p.height = size * 2;
      p.alpha = 0.1 + Math.random() * 0.2;
      p.x = Math.random() * App.app.screen.width;
      p.y = Math.random() * App.app.screen.height;
      this.container.addChild(p);
      this.particles.push(p);

      // Animate upward drift
      gsap.to(p, {
        y: -20,
        x: p.x + (Math.random() - 0.5) * 100,
        alpha: 0,
        duration: 5 + Math.random() * 8,
        repeat: -1,
        delay: Math.random() * 5,
        onRepeat: () => {
          p.y = App.app.screen.height + 20;
          p.x = Math.random() * App.app.screen.width;
          p.alpha = 0.1 + Math.random() * 0.2;
        },
      });
    }

    // === TITLE ===
    this.titleContainer = new Container();
    this.container.addChild(this.titleContainer);

    this.titleContent = new Container();
    this.titleContainer.addChild(this.titleContent);

    // Glow behind title (Sprite-based)
    const tempGlow = new Graphics();
    tempGlow.circle(120, 120, 120);
    tempGlow.fill({ color: 0xffffff });
    const glowTexture = App.app.renderer.generateTexture({ target: tempGlow });
    tempGlow.destroy();
    const glow = new Sprite(glowTexture);
    glow.anchor.set(0.5);
    glow.y = -100; // Positioned behind the logo
    glow.tint = 0xffe082; // Warm golden glow to match the new logo
    glow.alpha = 0.15;
    this.titleContent.addChild(glow);

    gsap.to(glow, {
      alpha: 0.25,
      duration: 2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });
    gsap.to(glow.scale, {
      x: 1.3,
      y: 1.3,
      duration: 3,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut",
    });

    // Load and add the new logo
    Assets.load("/logo.png")
      .then((texture) => {
        if (this.titleContent.destroyed) return;
        const logo = new Sprite(texture);
        logo.anchor.set(0.5);
        logo.y = -100; // Position above title text
        logo.width = 140; // Increased size from 120 to 140 for better visibility
        logo.height = 140;
        this.titleContent.addChild(logo);

        // Subtle pulsing animation for the logo
        gsap.to(logo.scale, {
          x: logo.scale.x * 1.06,
          y: logo.scale.y * 1.06,
          duration: 2.5,
          yoyo: true,
          repeat: -1,
          ease: "sine.inOut",
        });
      })
      .catch((err) => {
        console.error("Failed to load logo.png on main menu:", err);
      });

    // Main title
    const titleGrad = new FillGradient({
      end: { x: 0, y: 48 },
      colorStops: [
        { color: 0xffea00, offset: 0 },
        { color: 0xd4af37, offset: 0.5 },
        { color: 0xaa7c11, offset: 1 },
      ],
    });

    const title = new Text({
      text: "Bộ Lạc CRUSH",
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 48,
        fontWeight: "bold",
        fill: titleGrad,
        
        
      },
    });
    title.anchor.set(0.5);
    this.titleContent.addChild(title);

    const subtitle = new Text({
      text: "DỄ THƯƠNG MATCH-3",
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 14,
        fontWeight: "bold",
        fill: "#ffecb3",
        
        letterSpacing: 4,
        
      },
    });
    subtitle.anchor.set(0.5);
    subtitle.y = 44;
    this.titleContent.addChild(subtitle);

    // Decorative line
    const line = new Sprite(Texture.WHITE);
    line.anchor.set(0.5);
    line.width = 320;
    line.height = 3;
    line.tint = 0xffb300;
    line.alpha = 0.8;
    line.y = 74;
    this.titleContent.addChild(line);

    // === HIGHEST SCORE DISPLAY ===
    const leaderboard = saveManager.getLeaderboard();
    const topScore = leaderboard.length > 0 ? leaderboard[0].score : 0;

    this.infoText = new Text({
      text:
        topScore > 0
          ? `🏆 KỶ LỤC ĐIỂM: ${topScore}`
          : `🎯 Hãy thiết lập kỷ lục điểm số ngay hôm nay!`,
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 18,
        fontWeight: "bold",
        fill: "#ffdd57",
        
        
      },
    });
    this.infoText.anchor.set(0.5);
    this.container.addChild(this.infoText);

    // === MENU BUTTONS ===
    this.playBtn = this.createPlayNowButton(0, 0, async () => {
      await sceneManager.switchTo(GameScene);
    });

    this.achievementsBtn = this.createCircularButton("🏆", 0, 0, () => {
      this.showLeaderboard();
    });

    this.settingsBtn = this.createCircularButton("⚙️", 0, 0, () => {
      this.showSettingsModal(false);
    });

    // === ANIMAL SCROLLING BANNER (PARADE) ===
    this.paradeContainer = new Container();
    this.container.addChild(this.paradeContainer);

    // 1. Load all unique avatars once to prevent duplicate asset loading
    const uniquePromises = ALL_AVATAR_FILES.map((file, idx) => {
      const alias = `menu_avatar_unique_${idx}`;
      const src = `/assets/imagebldp/${file}`;
      return Assets.load({ alias, src });
    });

    const paradeSprites = [];
    const spacing = 64;

    Promise.all(uniquePromises).then(() => {
      if (this.paradeContainer.destroyed) return;

      // 2. Generate 80 parade items (spans up to 5120px) to cover any monitor size
      const numItems = 80;
      for (let i = 0; i < numItems; i++) {
        // Pick the avatar sequentially, repeating from 0 to 43
        const avatarIdx = i % ALL_AVATAR_FILES.length;
        const alias = `menu_avatar_unique_${avatarIdx}`;

        const itemContainer = new Container();
        itemContainer.x = i * spacing;
        this.paradeContainer.addChild(itemContainer);

        // Styled Frame under the sprite to make it stand out
        const frame = new Graphics()
          .roundRect(-30, -30, 60, 60, 10)
          .fill({ color: 0x120103, alpha: 0.9 })
          .stroke({ color: 0xffea00, width: 2 });
        itemContainer.addChild(frame);

        // Mask for rounded corners on the sprite
        const mask = new Graphics()
          .roundRect(-28, -28, 56, 56, 8)
          .fill({ color: 0xffffff });
        itemContainer.addChild(mask);

        const sprite = Sprite.from(alias);
        sprite.anchor.set(0.5);
        sprite.width = 56;
        sprite.height = 56;
        sprite.mask = mask;
        itemContainer.addChild(sprite);

        paradeSprites.push(itemContainer);
      }

      // Smooth horizontal scrolling ticker
      this.tickerFn = () => {
        const speed = 0.8; // pixels per frame
        paradeSprites.forEach((sprite) => {
          sprite.x -= speed;
          // Wrap if scrolled off the left edge
          if (sprite.x < -50) {
            let maxX = -9999;
            paradeSprites.forEach((s) => {
              if (s.x > maxX) maxX = s.x;
            });
            sprite.x = maxX + spacing;
          }
        });
      };
      App.app.ticker.add(this.tickerFn);
    });

    // Tự động căn chỉnh toàn bộ vị trí các nút và tiêu đề
    this.resize();

    // Khởi tạo các DOM overlay (Google login và Fullscreen)
    this.initDOMOverlays();

    // Entrance animation
    this.titleContent.alpha = 0;
    this.titleContent.y = -30;
    gsap.to(this.titleContent, {
      alpha: 1,
      y: 0,
      duration: 0.8,
      ease: "power2.out",
      delay: 0.2,
      onComplete: () => {
        // Hoạt ảnh bay bồng bềnh nhẹ nhàng
        gsap.to(this.titleContent, {
          y: 8,
          duration: 2.2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      },
    });
  }

  resize() {
    const width = App.app.screen.width;
    const height = App.app.screen.height;

    // 1. Background
    if (this.bg) {
      this.bg.width = width;
      this.bg.height = height;
    }

    const scale = Math.min(1.0, width / 450, height / 650);

    // 2. Title Container
    if (this.titleContainer) {
      this.titleContainer.x = width / 2;
      this.titleContainer.y = height > width ? height * 0.2 : height * 0.24;
      this.titleContainer.scale.set(scale);
    }

    // 3. Leaderboard Top Score Info
    if (this.infoText && this.titleContainer) {
      this.infoText.x = width / 2;
      this.infoText.y = this.titleContainer.y + 115 * scale;
      this.infoText.style.fontSize = Math.max(12, Math.min(18, 18 * scale));
    }

    // 4. Play Button & Circular buttons below it (Memory Card style layout)
    // Distribute dynamically to avoid overlap and fill empty space
    const titleBottomY = this.infoText ? this.infoText.y : (this.titleContainer ? this.titleContainer.y + 115 * scale : height * 0.35);
    const playY = Math.max(titleBottomY + 80 * scale, height * 0.55);
    const playH = Math.max(68, Math.min(84, 84 * scale));

    if (this.playBtn) {
      this.playBtn.position.set(width / 2, playY);
      this.playBtn.updateStyle(playH / 2 / scale);
      this.playBtn.scale.set(scale);
    }

    // Push circY to bottom but keep safe distance from playBtn
    const circY = Math.max(playY + 110 * scale, height * 0.8);
    const circR = Math.max(34, Math.min(42, 42 * scale));
    const circGap = 28 * scale;

    const visibleCircs = [];
    if (this.achievementsBtn) {
      visibleCircs.push(this.achievementsBtn);
    }
    if (this.settingsBtn) {
      visibleCircs.push(this.settingsBtn);
    }

    const totalCircs = visibleCircs.length;
    const startX = width / 2 - ((totalCircs - 1) * (circR * 2 + circGap)) / 2;
    visibleCircs.forEach((btn, idx) => {
      btn.position.set(startX + idx * (circR * 2 + circGap), circY);
      btn.updateStyle(circR / scale);
      btn.scale.set(scale);
    });

    // 6. Parade bottom banner
    if (this.paradeContainer) {
      this.paradeContainer.y = height - 85;
    }

    // 7. Leaderboard Popup Resizing
    if (this.leaderboardPopup) {
      if (this.leaderboardOverlay) {
        this.leaderboardOverlay.clear();
        this.leaderboardOverlay.rect(0, 0, width, height);
        this.leaderboardOverlay.fill({ color: 0x000000, alpha: 0.75 });
      }
      if (this.leaderboardModal) {
        this.leaderboardModal.x = width / 2;
        this.leaderboardModal.y = height / 2;
        const modalScale =
          width < 600 || height > width
            ? Math.min(1.0, (width - 20) / 500)
            : 1.0;
        this.leaderboardModal.scale.set(modalScale);
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

  createMenuButton(label, x, y, color, width = 220, onClick, parent = this.container, btnHeight = 56) {
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

    if (label.startsWith("GOOGLE_ICON")) {
      const displayText = label.includes(":")
        ? label.split(":")[1]
        : "ĐĂNG NHẬP GOOGLE";

      const text = new Text({
        text: displayText.toUpperCase(),
        style: new TextStyle({
          fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
          fontSize: 14,
          fontWeight: "bold",
          fill: "#ffffff",
          
          }),
      });
      text.anchor.set(0.5);
      content.addChild(text);
      textObj = text;

      const icon = new Sprite();
      content.addChild(icon);
      btn.icon = icon;
      Assets.load("/google_logo.png")
        .then((texture) => {
          icon.texture = texture;
          icon.anchor.set(0.5);
          icon.width = 24;
          icon.height = 24;

          const gap = 12;
          const totalW = icon.width + gap + text.width;
          icon.x = -totalW / 2 + icon.width / 2;
          text.x = totalW / 2 - text.width / 2;
        })
        .catch((err) => {
          console.error("Failed to load google_logo.png:", err);
        });
    } else {
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
            fontWeight: "bold",
            fill: "#ffffff",
            
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
            fontWeight: "bold",
            fill: "#ffffff",
            
            }),
        });
        text.anchor.set(0.5);
        content.addChild(text);
        textObj = text;
      }
    }

    // Interactivity
    btn.on("pointerover", () => {
      gsap.to(btn.scale, { x: 1.05, y: 1.05, duration: 0.12 });
      soundManager.playClick();
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

  createPlayNowButton(x, y, onClick, parent = this.container) {
    const btn = new Container();
    btn.x = x;
    btn.y = y;
    parent.addChild(btn);

    btn.eventMode = "static";
    btn.cursor = "pointer";

    // Sub-container for contents to apply tactile press offset
    const content = new Container();
    btn.addChild(content);

    const shadow = new Graphics();
    const bg = new Graphics();
    const highlight = new Graphics();

    content.addChild(shadow);
    content.addChild(bg);
    content.addChild(highlight);

    // Vietnamese label "CHƠI NGAY"
    const label = new Text({
      text: "CHƠI NGAY",
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 18,
        fill: 0xFFFFFF,
        align: 'center',
        
        }
    });
    label.anchor.set(0.5);
    content.addChild(label);

    let currentR = 30;

    btn.updateStyle = (r) => {
      currentR = r;
      const ratio = 3.2; // Match aspect ratio
      const width = r * 2 * ratio;
      const height = r * 2;
      const radius = r;

      // 1. Draw 3D Base Shadow (Combined bottom shadow and 3D base)
      shadow.clear()
        // Soft black drop shadow
        .roundRect(-width / 2, -r + r * 0.22, width, height, radius)
        .fill({ color: 0x000000, alpha: 0.45 })
        // Dark green 3D base
        .roundRect(-width / 2, -r + r * 0.15, width, height, radius)
        .fill({ color: 0x087903 });

      // 2. Main Face Background (vibrant green gradient)
      const btnGrad = new FillGradient({
        start: { x: 0, y: -r },
        end: { x: 0, y: r },
        colorStops: [
          { offset: 0, color: 0x95ED39 }, // Bright green
          { offset: 1, color: 0x4EAC0C }  // Medium green
        ]
      });
      bg.clear()
        .roundRect(-width / 2, -r, width, height, radius)
        .fill({ fill: btnGrad })
        .stroke({ width: Math.max(2.5, r * 0.15), color: 0xFFFFFF }); // Thick white border!

      // 3. Glossy highlight sheen on top (ellipse highlight)
      highlight.clear()
        .ellipse(0, -r / 2, width * 0.42, height * 0.2)
        .fill({ color: 0xffffff, alpha: 0.25 });

      label.style.fontSize = Math.max(14, r * 0.52);
      label.y = -r * 0.08;
    };

    btn.on("pointerover", () => {
      gsap.to(btn.scale, { x: 1.05, y: 1.05, duration: 0.12 });
      soundManager.playClick();
    });

    btn.on("pointerout", () => {
      gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.12 });
      gsap.to(content, { y: 0, duration: 0.1 });
    });

    btn.on("pointerdown", () => {
      gsap.to(content, { y: currentR * 0.12, duration: 0.05 });
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

  createCircularButton(emojiText, x, y, onClick, parent = this.container, customRadius = 26) {
    const tex = getIconTexture(emojiText);
    if (tex) {
      const btn = new Container();
      btn.x = x;
      btn.y = y;
      parent.addChild(btn);

      btn.eventMode = "static";
      btn.cursor = "pointer";

      const content = new Container();
      btn.addChild(content);

      const sprite = new Sprite(tex);
      sprite.anchor.set(0.5);
      const ratio = (tex.width && tex.height) ? (tex.width / tex.height) : 1;
      if (ratio > 1.2 || ratio < 0.8) {
        sprite.height = customRadius * 2;
        sprite.width = customRadius * 2 * ratio;
      } else {
        sprite.width = customRadius * 2;
        sprite.height = customRadius * 2;
      }
      content.addChild(sprite);

      btn.r = customRadius;
      btn.updateStyle = (r) => {
        btn.r = r;
        const currentRatio = (tex.width && tex.height) ? (tex.width / tex.height) : 1;
        if (currentRatio > 1.2 || currentRatio < 0.8) {
          sprite.height = r * 2;
          sprite.width = r * 2 * currentRatio;
        } else {
          sprite.width = r * 2;
          sprite.height = r * 2;
        }
      };

      btn.on("pointerover", () => {
        gsap.to(btn.scale, { x: 1.08, y: 1.08, duration: 0.12 });
        soundManager.playClick();
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

  /**
   * Show high score leaderboard modal.
   */
  showLeaderboard() {
    if (this.leaderboardPopup) return;

    soundManager.playClick();

    const popup = new Container();
    popup.zIndex = 200;
    this.container.addChild(popup);
    this.leaderboardPopup = popup;

    // Dark modal overlay to capture clicks
    this.leaderboardOverlay = new Graphics();
    this.leaderboardOverlay.rect(0, 0, App.app.screen.width, App.app.screen.height);
    this.leaderboardOverlay.fill({ color: 0x000000, alpha: 0.75 });
    this.leaderboardOverlay.eventMode = "static";
    popup.addChild(this.leaderboardOverlay);

    this.leaderboardModal = new Container();
    this.leaderboardModal.x = App.app.screen.width / 2;
    this.leaderboardModal.y = App.app.screen.height / 2;
    popup.addChild(this.leaderboardModal);

    const cardW = 500;
    const cardH = 580;

    // 1. Soft Card Shadow
    const cardShadow = new Graphics()
      .roundRect(-cardW / 2 + 6, -cardH / 2 + 12, cardW, cardH, 24)
      .fill({ color: 0x000000, alpha: 0.25 });
    this.leaderboardModal.addChild(cardShadow);

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
    this.leaderboardModal.addChild(borderBg);

    // 3. Bright Cream Card Face
    const cardFace = new Graphics()
      .roundRect(-cardW / 2 + 8, -cardH / 2 + 8, cardW - 16, cardH - 16, 18)
      .fill({ color: 0xfbfaf5 });
    this.leaderboardModal.addChild(cardFace);

    // 4. Floating 3D Title Ribbon (Pink/Magenta)
    const ribbonW = 430;
    const ribbonH = 48;
    const ribbonY = -cardH / 2;
    const ribbon = new Graphics()
      .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2 + 4, ribbonW, ribbonH, 12)
      .fill({ color: 0x800040 }) // Ribbon shadow
      .roundRect(-ribbonW / 2, ribbonY - ribbonH / 2, ribbonW, ribbonH, 12)
      .fill({
        fill: new FillGradient({
          start: { x: 0, y: ribbonY - ribbonH / 2 },
          end: { x: 0, y: ribbonY + ribbonH / 2 },
          colorStops: [
            { offset: 0, color: 0xff66b2 },
            { offset: 1, color: 0xcc0066 }
          ]
        })
      })
      .stroke({ color: 0xffe6f2, width: 2 });
    this.leaderboardModal.addChild(ribbon);

    // Header Title centered inside ribbon
    const titleContainer = new Container();
    titleContainer.position.set(0, ribbonY);
    this.leaderboardModal.addChild(titleContainer);

    const titleIcon = createVectorIcon("🏆", 28);
    titleContainer.addChild(titleIcon);

    const titleText = new Text({
      text: " BẢNG VÀNG THÀNH TÍCH",
      style: new TextStyle({
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 19,
        fill: 0xffffff, // white on pink ribbon
        fontWeight: "bold",
        letterSpacing: 1.5,
        align: "center",
        
        }),
    });
    titleText.anchor.set(0.5);
    titleContainer.addChild(titleText);

    // Layout
    const titleGap = 8;
    const titleTotalW = titleIcon.width + titleGap + titleText.width;
    titleIcon.x = -titleTotalW / 2 + titleIcon.width / 2;
    titleText.x = titleTotalW / 2 - titleText.width / 2;

    // Active User Profile Display
    let currentUser = null;
    try {
      const savedUser = localStorage.getItem("google_user");
      if (savedUser) {
        currentUser = JSON.parse(savedUser);
      }
    } catch (e) {
      console.error(e);
    }
    const userTextStr = currentUser
      ? `Tài khoản: ${currentUser.name} (Google)`
      : `Tài khoản: Khách (Điểm lưu thiết bị)`;
    const userText = new Text({
      text: userTextStr,
      style: new TextStyle({
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 13,
        fontWeight: "bold",
        fill: currentUser ? "#e91e63" : "#7c73a1",
        
      }),
    });
    userText.anchor.set(0.5);
    userText.y = -cardH / 2 + 65;
    this.leaderboardModal.addChild(userText);

    // Columns Header row
    const headerY = -160;
    const colRankX = -140;
    const colScoreX = 130;

    const rankHeader = new Text({
      text: "HẠNG",
      style: new TextStyle({
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 20,
        fontWeight: "bold",
        fill: 0x004466,
        
      }),
    });
    rankHeader.anchor.set(0.5);
    rankHeader.position.set(colRankX, headerY);
    this.leaderboardModal.addChild(rankHeader);

    const scoreHeader = new Text({
      text: "ĐIỂM",
      style: new TextStyle({
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 20,
        fontWeight: "bold",
        fill: 0x004466,
        
      }),
    });
    scoreHeader.anchor.set(0.5);
    scoreHeader.position.set(colScoreX, headerY);
    this.leaderboardModal.addChild(scoreHeader);

    // Divider line below headers (using clean bright blue)
    const headerDivider = new Graphics()
      .moveTo(-225, headerY + 18)
      .lineTo(225, headerY + 18)
      .stroke({ color: 0x0088cc, width: 2, alpha: 0.35 });
    this.leaderboardModal.addChild(headerDivider);

    // Fetch top scores (unique profiles + default competitors bot integration)
    const list = saveManager.getLeaderboard();

    if (list.length === 0) {
      const emptyText = new Text({
        text: "Chưa có thành tích nào.\nHãy chơi game để thiết lập kỷ lục nhé! 🚀",
        style: new TextStyle({
          fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
          fontSize: 16,
          fill: "#7c73a1",
          align: "center",
          lineHeight: 22,
        }),
      });
      emptyText.anchor.set(0.5);
      emptyText.y = 10;
      this.leaderboardModal.addChild(emptyText);
    } else {
      // Draw list items
      const startY = -110;
      const rowHeight = 52;

      list.forEach((entry, idx) => {
        const rowY = startY + idx * rowHeight;
        const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
        const rankIcon = medals[idx] || `${idx + 1}`;

        // Row background highlight for top 3 or player highlighted using 3D lacquer colors
        const rowW = 450;
        const rowH = rowHeight - 12; // Gap of 12px
        const rowRadius = 8;
        const rowShadowOffset = 3;

        let rTop, rBottom, rShadow, rStroke;
        if (idx === 0) {
          // Gold
          rTop = 0xFFE500; rBottom = 0xFF9900; rShadow = 0x8A4500; rStroke = 0xFFF8B3;
        } else if (idx === 1) {
          // Silver
          rTop = 0xf0f4f8; rBottom = 0xb0bec5; rShadow = 0x455a64; rStroke = 0xffffff;
        } else if (idx === 2) {
          // Bronze
          rTop = 0xffebe6; rBottom = 0xa1887f; rShadow = 0x5d4037; rStroke = 0xfff3e0;
        } else {
          // Others (Brightened up to clean white-gray)
          rTop = 0xffffff; rBottom = 0xf2f2f2; rShadow = 0xbdbdbd; rStroke = 0xffffff;
        }

        const rowBg = new Graphics()
          // 3D Shadow Base
          .roundRect(-rowW / 2, rowY - rowH / 2 + rowShadowOffset, rowW, rowH, rowRadius)
          .fill({ color: rShadow })
          // Main Face
          .roundRect(-rowW / 2, rowY - rowH / 2, rowW, rowH, rowRadius)
          .fill({
            fill: new FillGradient({
              start: { x: 0, y: rowY - rowH / 2 },
              end: { x: 0, y: rowY + rowH / 2 },
              colorStops: [
                { offset: 0, color: rTop },
                { offset: 1, color: rBottom }
              ]
            })
          })
          .stroke({ color: rStroke, width: 2 });
        this.leaderboardModal.addChild(rowBg);

        // --- Rank/Medal ---
        const rankCell = new Container();
        rankCell.position.set(-170, rowY);
        this.leaderboardModal.addChild(rankCell);

        let rankNode;
        if (idx === 0) rankNode = createVectorIcon("🥇", 28);
        else if (idx === 1) rankNode = createVectorIcon("🥈", 28);
        else if (idx === 2) rankNode = createVectorIcon("🥉", 28);
        else {
          rankNode = new Text({
            text: `${idx + 1}`,
            style: new TextStyle({
              fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
              fontSize: 24,
              fontWeight: "bold",
              fill: "#241d4f",
              
            }),
          });
          rankNode.anchor.set(0.5);
        }
        rankCell.addChild(rankNode);

        // --- Avatar ---
        const avatarCell = new Container();
        avatarCell.position.set(-120, rowY);
        this.leaderboardModal.addChild(avatarCell);

        let borderCol;
        if (idx === 0) borderCol = 0xffea00;
        else if (idx === 1) borderCol = 0xb0bec5;
        else if (idx === 2) borderCol = 0xa1887f;
        else borderCol = 0xd7ccc8;

        const avatarFrame = new Graphics()
          .roundRect(-16, -16, 32, 32, 6)
          .fill({ color: 0x120103, alpha: 0.9 })
          .stroke({ color: borderCol, width: 1.5 });
        avatarCell.addChild(avatarFrame);

        const avatarMask = new Graphics()
          .roundRect(-14, -14, 28, 28, 5)
          .fill({ color: 0xffffff });
        avatarCell.addChild(avatarMask);

        // Map avatar dynamically based on user/bot name
        const name = entry.userName || "";
        const spriteAlias = getAvatarAlias(name);

        const avatarSprite = Sprite.from(spriteAlias);
        avatarSprite.anchor.set(0.5);
        avatarSprite.width = 28;
        avatarSprite.height = 28;
        avatarSprite.mask = avatarMask;
        avatarCell.addChild(avatarSprite);

        // --- Name ---
        const nameText = new Text({
          text: name,
          style: new TextStyle({
            fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
            fontSize: 18,
            fontWeight: "bold",
            fill: "#241d4f",
            
          }),
        });
        nameText.anchor.set(0, 0.5);
        nameText.position.set(-90, rowY);
        this.leaderboardModal.addChild(nameText);

        // --- Score ---
        const scoreText = new Text({
          text: entry.score.toLocaleString(),
          style: new TextStyle({
            fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
            fontSize: 24,
            fontWeight: "bold",
            fill: "#241d4f",
            
          }),
        });
        scoreText.anchor.set(1, 0.5);
        scoreText.position.set(160, rowY);
        this.leaderboardModal.addChild(scoreText);
      });
    }

    // Determine active player's personal best score and rank
    const personalList = saveManager.load().leaderboard || [];
    const personalBest = personalList.length > 0 ? personalList[0].score : 0;

    let activeKey = "match3_pure_leaderboard";
    try {
      const savedUser = localStorage.getItem("google_user");
      if (savedUser) {
        const user = JSON.parse(savedUser);
        activeKey = `match3_pure_leaderboard_${user.id}`;
      }
    } catch (e) {
      console.error(e);
    }

    const activeRankIdx = list.findIndex(entry => entry.profileKey === activeKey);
    const activeRankVal = activeRankIdx !== -1 ? (activeRankIdx + 1) : null;

    // Pinned Best Record Banner at the bottom (Vibrant 3D style)
    const footerBg = new Graphics()
      .roundRect(-225, 143, 450, 44, 8)
      .fill({ color: 0xfff275, alpha: 1.0 })
      .stroke({ color: 0xffa200, width: 3, alpha: 1.0 });
    this.leaderboardModal.addChild(footerBg);

    // Footer Rank cell at -170
    const footerRankCell = new Container();
    footerRankCell.position.set(-170, 165);
    this.leaderboardModal.addChild(footerRankCell);

    let footerRankNode;
    if (activeRankVal === 1) footerRankNode = createVectorIcon("🥇", 28);
    else if (activeRankVal === 2) footerRankNode = createVectorIcon("🥈", 28);
    else if (activeRankVal === 3) footerRankNode = createVectorIcon("🥉", 28);
    else {
      footerRankNode = new Text({
        text: activeRankVal ? String(activeRankVal) : "-",
        style: new TextStyle({
          fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
          fontSize: 24,
          fontWeight: "bold",
          fill: "#241d4f",
          })
      });
      footerRankNode.anchor.set(0.5);
    }
    footerRankCell.addChild(footerRankNode);

    // Footer Avatar at -120
    const footerAvatar = new Container();
    footerAvatar.position.set(-120, 165);
    this.leaderboardModal.addChild(footerAvatar);

    const footerFrame = new Graphics()
      .roundRect(-16, -16, 32, 32, 6)
      .fill({ color: 0x120103, alpha: 0.9 })
      .stroke({ color: 0xffea00, width: 1.5 });
    footerAvatar.addChild(footerFrame);

    const footerMask = new Graphics()
      .roundRect(-14, -14, 28, 28, 5)
      .fill({ color: 0xffffff });
    footerAvatar.addChild(footerMask);

    // Resolve avatar for active user
    const activeName = currentUser ? currentUser.name : "Khách";
    const activeAvatarAlias = getAvatarAlias(activeName);

    const footerSprite = Sprite.from(activeAvatarAlias);
    footerSprite.anchor.set(0.5);
    footerSprite.width = 28;
    footerSprite.height = 28;
    footerSprite.mask = footerMask;
    footerAvatar.addChild(footerSprite);

    // Footer Name text at -90
    const footerName = new Text({
      text: activeName,
      style: new TextStyle({
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 18,
        fontWeight: "bold",
        fill: "#241d4f",
        
      }),
    });
    footerName.anchor.set(0, 0.5);
    footerName.position.set(-90, 165);
    this.leaderboardModal.addChild(footerName);

    // Footer Score text at 160 (right aligned)
    const footerScore = new Text({
      text: personalBest.toLocaleString(),
      style: new TextStyle({
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 24,
        fontWeight: "bold",
        fill: "#241d4f",
        
      }),
    });
    footerScore.anchor.set(1, 0.5);
    footerScore.position.set(160, 165);
    this.leaderboardModal.addChild(footerScore);

    // CLOSE Button (3D circular back button at bottom center)
    const closePopup = () => {
      soundManager.playClick();
      gsap.to(this.leaderboardModal.scale, { x: 0.7, y: 0.7, duration: 0.25 });
      gsap.to(popup, {
        alpha: 0,
        duration: 0.25,
        onComplete: () => {
          killTweensRecursive(popup);
          popup.destroy({ children: true });
          this.leaderboardPopup = null;
          this.leaderboardOverlay = null;
          this.leaderboardModal = null;
        },
      });
    };

    const closeBtn = this.createCircularButton(
      "↩️",
      0,
      235,
      closePopup,
      this.leaderboardModal,
      32
    );

    // Apply responsive layout immediately to compute target scale
    this.resize();

    const targetScale = this.leaderboardModal.scale.x;
    this.leaderboardModal.scale.set(targetScale * 0.7);

    // Entrance animation
    popup.alpha = 0;
    gsap.to(popup, { alpha: 1, duration: 0.3 });
    gsap.to(this.leaderboardModal.scale, {
      x: targetScale,
      y: targetScale,
      duration: 0.35,
      ease: "back.out(1.8)",
    });
  }

  showSettingsModal(isIngame = false) {
    if (this.settingsPopup) return;

    soundManager.playClick();

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

    const cardW = 340;
    const cardH = 300;

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
        },
      });
    };

    // Circular close btn (✕) in top right using standard bubble button style
    const closeBtn = this.createCircularButton("✕", cardW / 2 - 20, -cardH / 2 + 20, closePopup, this.settingsModal);

    // Reusable Toggle Row Builder
    const createToggleRow = (labelText, yPos, initialMuteState, onToggle) => {
      const row = new Container();
      row.position.set(0, yPos);

      // Row background card panel to group label and toggle visually
      // Enlarged height to 56 to fit the 50-height toggle switch
      const rowBg = new Graphics()
        .roundRect(-135, -28, 270, 56, 10)
        .fill({ color: 0xefede0 }) // Warm creamy beige
        .stroke({ color: 0xdfdac0, width: 1.5 });
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
      label.position.set(-115, 0);
      row.addChild(label);

      // Right slider track (using preloaded 3D toggle texture)
      // Enlarged to width = 100, height = 50 to make it visually matching and prominent
      const track = new Sprite(Texture.from(initialMuteState ? "toggle_off" : "toggle_on"));
      track.anchor.set(0.5);
      track.width = 100;
      track.height = 50;
      track.eventMode = "static";
      track.cursor = "pointer";
      track.position.set(80, 0);
      row.addChild(track);

      // Draw dotted connector line dynamically between text and switch
      const labelWidth = label.width;
      const startX = -115 + labelWidth + 12;
      const endX = 80 - 50 - 12;
      if (startX < endX) {
        const dots = new Graphics();
        for (let dx = startX; dx <= endX; dx += 6) {
          dots.circle(dx, 0, 1.5);
        }
        dots.fill({ color: 0xc0bba0 });
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
    const musicRowY = -60;
    const sfxRowY = -10;

    const musicRow = createToggleRow(
      "NHẠC NỀN",
      musicRowY,
      !soundManager.musicEnabled,
      () => {
        soundManager.toggleMusic();
        return !soundManager.musicEnabled;
      }
    );
    const sfxRow = createToggleRow(
      "HIỆU ỨNG",
      sfxRowY,
      !soundManager.enabled,
      () => {
        soundManager.enabled = !soundManager.enabled;
        return !soundManager.enabled;
      }
    );

    this.settingsModal.addChild(musicRow);
    this.settingsModal.addChild(sfxRow);

    // Reset Data button styled as a single Red 3D capsule button with icon and text
    const resetBtn = this.createMenuButton(
      "🗑️ Xóa lịch sử",
      0,
      55,
      "red",
      230,
      async () => {
        soundManager.playClick();
        const confirmDelete = await gameConfirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu thành tích không?");
        if (confirmDelete) {
          saveManager.reset();
          closePopup();
          await sceneManager.switchTo(MainMenuScene);
        }
      },
      this.settingsModal,
      44
    );

    const versionText = new Text({
      text: "Phiên bản: 1.0.0",
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: 12,
        fill: "#aaaaaa",
      },
    });
    versionText.anchor.set(0.5);
    versionText.position.set(0, 110);
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

  destroy() {
    // Stop ticker function on destroy to avoid memory leak
    if (this.tickerFn && App.app && App.app.ticker) {
      App.app.ticker.remove(this.tickerFn);
    }

    killTweensRecursive(this.container);

    this.particles.forEach((p) => {
      gsap.killTweensOf(p);
    });

    this.container.destroy({ children: true });
  }

  initDOMOverlays() {

    // 2. Google Modal Account Items
    const modal = document.getElementById("google-login-modal");
    const accountItems = document.querySelectorAll(".google-account-item");
    accountItems.forEach((item) => {
      item.onclick = () => {
        const accountId = item.getAttribute("data-account");
        let name = "Guest";
        let email = "";
        let avatar = "";

        if (accountId === "laclac") {
          name = "Lạc Lạc (Bơ Lạc)";
          email = "laclac.bolac@gmail.com";
          avatar = "/assets/imagebldp/001_avatar_laclac.png";
        } else if (accountId === "dauphong") {
          name = "Đậu Phộng";
          email = "dauphong.bolac@gmail.com";
          avatar = "/assets/imagebldp/015_avatar_dauLan.png";
        }

        // Set current user
        const user = { id: accountId, name, email, avatar };
        localStorage.setItem("google_user", JSON.stringify(user));

        // Hide modal
        if (modal) modal.classList.remove("active");

        // Update UI
        this.updateUserUI();
      };
    });

    // 3. Close Modal Button
    const closeBtn = document.getElementById("google-modal-close-btn");
    if (closeBtn && modal) {
      closeBtn.onclick = () => {
        modal.classList.remove("active");
      };
    }

    // 4. Sign out Button
    const signOutBtn = document.getElementById("user-signout");
    if (signOutBtn) {
      signOutBtn.onclick = () => {
        localStorage.removeItem("google_user");
        if (window.parent !== window) {
          window.parent.postMessage({ type: "trigger_google_logout" }, "*");
        }
        this.updateUserUI();
      };
    }

    // 5. Parent Iframe postMessage Bridge
    window.addEventListener("message", (event) => {
      const data = event.data;
      if (data && data.type === "user_profile") {
        const user = data.user; // { id: '...', name: '...', avatar: '...', email: '...' }
        if (user) {
          localStorage.setItem("google_user", JSON.stringify(user));
        } else {
          localStorage.removeItem("google_user");
        }
        this.updateUserUI();
      }
    });

    // If running inside parent iframe, request the logged-in profile immediately
    if (window.parent !== window) {
      window.parent.postMessage({ type: "get_user_profile" }, "*");
    }

    // 6. Real Google Identity Services (GSI) Integration with polling fallback
    const initRealGoogleSignIn = () => {
      try {
        if (window.google && window.google.accounts) {
          window.google.accounts.id.initialize({
            client_id:
              import.meta.env.VITE_GOOGLE_CLIENT_ID ||
              "55776077309-8pco7q4b260ghldp.apps.googleusercontent.com",
            callback: (response) => {
              try {
                const jwt = response.credential;
                const base64Url = jwt.split(".")[1];
                const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
                const jsonPayload = decodeURIComponent(
                  window
                    .atob(base64)
                    .split("")
                    .map(
                      (c) =>
                        "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2),
                    )
                    .join(""),
                );
                const payload = JSON.parse(jsonPayload);
                const user = {
                  id: payload.sub,
                  name: payload.name,
                  avatar: payload.picture,
                  email: payload.email,
                };
                localStorage.setItem("google_user", JSON.stringify(user));

                if (modal) modal.classList.remove("active");

                // Notify parent of successful login
                if (window.parent !== window) {
                  window.parent.postMessage(
                    { type: "google_login_success", user: user },
                    "*",
                  );
                }
                this.updateUserUI();
              } catch (err) {
                console.error("Failed to parse Google JWT credential:", err);
              }
            },
          });

          // Render the official Google Sign-in button
          const realBtnContainer = document.getElementById(
            "google-real-signin-btn",
          );
          if (realBtnContainer) {
            window.google.accounts.id.renderButton(realBtnContainer, {
              theme: "outline",
              size: "large",
              width: 260,
            });
          }
        } else {
          // If not loaded yet, retry in 100ms
          setTimeout(initRealGoogleSignIn, 100);
        }
      } catch (e) {
        console.warn("GSI client initialization was blocked or failed:", e);
      }
    };
    initRealGoogleSignIn();

    this.updateUserUI();
  }

  updateUserUI() {
    let currentUser = null;
    try {
      const savedUser = localStorage.getItem("google_user");
      if (savedUser) {
        currentUser = JSON.parse(savedUser);
      }
    } catch (e) {
      console.error("Error loading user profile:", e);
    }

    const profileWidget = document.getElementById("user-profile");
    if (profileWidget) {
      profileWidget.style.display = "none";
    }

    // Update the highest score banner display
    const leaderboard = saveManager.getLeaderboard();
    const topScore = leaderboard.length > 0 ? leaderboard[0].score : 0;
    if (this.infoText) {
      this.infoText.text =
        topScore > 0
          ? `🏆 KỶ LỤC ĐIỂM: ${topScore}`
          : `🎯 Hãy thiết lập kỷ lục điểm số ngay hôm nay!`;
    }

    this.resize();
  }

  showGoogleLoginModal() {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "trigger_google_login" }, "*");
    } else {
      const modal = document.getElementById("google-login-modal");
      if (modal) {
        modal.classList.add("active");
      }
    }
  }
}

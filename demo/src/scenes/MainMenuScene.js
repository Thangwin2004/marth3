import {
  Container,
  Graphics,
  Sprite,
  Texture,
  Text,
  Assets,
  TextStyle,
  FillGradient,
  Rectangle,
} from "pixi.js";
import gsap from "gsap";
import { Config } from "../config.js";
import { App } from "../system/App.js";
import { sceneManager } from "../system/SceneManager.js";
import { saveManager } from "../system/SaveManager.js";
import { GameScene } from "./GameScene.js";
import { soundManager } from "../system/SoundManager.js";
import {
  Colorful3DCircleButton,
  Colorful3DButton,
  createVectorIcon as createVectorIconFromUI,
  mapEmojiToIconType,
} from "../system/UIComponents.js";

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

function getAvatarUrl(name) {
  let idx = 0;
  if (!name) idx = 0;
  else if (name.includes("Bơ Lạc")) idx = 0;
  else if (name.includes("Đậu Phộng")) idx = 14;
  else if (name.includes("Ếch Xanh")) idx = 9;
  else if (name.includes("Gấu Trúc")) idx = 21;
  else if (name.includes("Mèo Lười")) idx = 1;
  else {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    idx = Math.abs(hash) % ALL_AVATAR_FILES.length;
  }
  return `/assets/imagenobackgrd/${ALL_AVATAR_FILES[idx]}`;
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
          border: 5px solid #0088cc;
          box-shadow: inset 0 0 0 2.5px #33ccff, 0 10px 25px rgba(0, 0, 0, 0.35);
          border-radius: 20px;
          padding: 28px 24px;
          width: 85%;
          max-width: 340px;
          text-align: center;
          transform: scale(0.85);
          transition: transform 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          font-family: 'Be Vietnam Pro', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
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
  yellow: {
    top: 0xffe500,
    bottom: 0xff9900,
    shadow: 0x8a4500,
    stroke: 0xfff8b3,
  },
  green: {
    top: 0x7fff00,
    bottom: 0x00cc00,
    shadow: 0x006600,
    stroke: 0xd4ffd4,
  },
  pink: { top: 0xff66b2, bottom: 0xcc0066, shadow: 0x800040, stroke: 0xffe6f2 },
  blue: { top: 0x33ccff, bottom: 0x0088cc, shadow: 0x004466, stroke: 0xe6f9ff },
  purple: {
    top: 0xb266ff,
    bottom: 0x5900b3,
    shadow: 0x330066,
    stroke: 0xf2e6ff,
  },
  red: { top: 0xf95e8b, bottom: 0xd93955, shadow: 0x92233f, stroke: 0xffd4e2 },
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
    "🗑️": "delete_btn",
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
    sprite.anchor.set(0.5, 0.45); // Fix visual center for icons with bottom shadow
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
        fontFamily: '"Nunito", sans-serif',
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
        fontFamily: '"Nunito", sans-serif',
        fontSize: 14,
        fontWeight: "bold",
        fill: "#33ccff",

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
        fontFamily: '"Nunito", sans-serif',
        fontSize: 18,
        fontWeight: "bold",
        fill: "#33ccff",
      },
    });
    this.infoText.anchor.set(0.5);
    this.container.addChild(this.infoText);

    // === MENU BUTTONS ===
    this.playBtn = this.createPlayNowButton(0, 0, async () => {
      soundManager.playClick();
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
      const src = `/assets/imagenobackgrd/${file}`;
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

    // Bỏ qua khởi tạo DOM overlay Google login


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
    const titleBottomY = this.infoText
      ? this.infoText.y
      : this.titleContainer
        ? this.titleContainer.y + 115 * scale
        : height * 0.35;
    let playY = Math.max(titleBottomY + 80 * scale, height * 0.55);
    const playH = Math.max(68, Math.min(84, 84 * scale));

    const circR = Math.max(34, Math.min(42, 42 * scale));
    const circGap = 28 * scale;

    // Parade top bound is roughly (height - 85) - 30 = height - 115
    const maxCircY = height - 115 - 15 - circR;

    // Determine circY, spacing it nicely below playBtn but avoiding parade
    let circY = Math.max(playY + 110 * scale, height * 0.75);
    if (circY > maxCircY) {
      circY = maxCircY;
    }

    // If circY was pushed up too high, ensure it doesn't overlap playBtn
    const minCircY = playY + playH / 2 + circR + 15;
    if (circY < minCircY) {
      circY = minCircY;
      // If even minCircY pushes playBtn out, shift playBtn up
      playY = circY - (playH / 2 + circR + 15);
    }

    if (this.playBtn) {
      this.playBtn.position.set(width / 2, playY);
      this.playBtn.updateStyle(playH / 2 / scale);
      this.playBtn.scale.set(scale);
    }

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
            ? Math.min(1.0, (width - 20) / 420)
            : 1.0;
        this.settingsModal.scale.set(modalScale);
      }
    }
  }

  createMenuButton(
    label,
    x,
    y,
    color,
    width = 220,
    onClick,
    parent = this.container,
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

    const hh = btnHeight / 2;
    const isSmall = width < 150;
    const radius = hh; // Capsule corner radius
    const shadowOffset = isSmall ? 4 : 5;

    const colorStyle = getColorStyle(color, label);
    const theme = palettes[colorStyle] || palettes.blue;

    // 1. 3D Base Shadow
    shadow
      .roundRect(-width / 2, -hh + shadowOffset, width, btnHeight, radius)
      .fill({ color: theme.shadow });

    // 2. Main Face Background (gradient)
    const btnGrad = new FillGradient({
      start: { x: 0, y: -hh },
      end: { x: 0, y: hh },
      colorStops: [
        { offset: 0, color: theme.top },
        { offset: 1, color: theme.bottom },
      ],
    });
    bg.roundRect(-width / 2, -hh, width, btnHeight, radius)
      .fill({ fill: btnGrad })
      .stroke({ width: 2.5, color: theme.stroke });

    // 3. Glossy highlight sheen on top (ellipse highlight)
    highlight
      .ellipse(0, -hh / 2, width * 0.42, btnHeight * 0.2)
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
          fontFamily: '"Nunito", sans-serif',
          fontSize: 14,
          fontWeight: "bold",
          fill: "#ffffff",
        }),
      });
      text.anchor.set(0.5);
      text.y = -2; // Optical center correction
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
          icon.y = -1;
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
            fontFamily: '"Nunito", sans-serif',
            fontSize: textSize,
            fontWeight: "bold",
            fill: "#ffffff",
          }),
        });
        text.anchor.set(0.5);
        text.y = -2; // Optical center correction
        content.addChild(text);
        textObj = text;

        const gap = isSmall ? 6 : 12;
        const totalW = emojiIcon.width + gap + text.width;
        emojiIcon.x = -totalW / 2 + emojiIcon.width / 2;
        emojiIcon.y = -1;
        text.x = totalW / 2 - text.width / 2;
      } else {
        const textSize = isSmall ? 11 : label.length > 2 ? 15 : 22;
        const text = new Text({
          text: label.toUpperCase(),
          style: new TextStyle({
            fontFamily: '"Nunito", sans-serif',
            fontSize: textSize,
            fontWeight: "bold",
            fill: "#ffffff",
          }),
        });
        text.anchor.set(0.5);
        text.y = -2; // Optical center correction
        content.addChild(text);
        textObj = text;
      }
    }

    // Interactivity
    btn.on("pointerover", (e) => {
      if (window.matchMedia("(hover: none)").matches) return;

      gsap.to(btn.scale, { x: 1.05, y: 1.05, duration: 0.12 });
      // soundManager.playClick();
    });
    btn.on("pointerout", (e) => {
      if (window.matchMedia("(hover: none)").matches) return;

      gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.12 });
      gsap.to(content, { y: 0, duration: 0.1 });
    });
    btn.on("pointerdown", () => {
      gsap.to(content, { y: shadowOffset - 1, duration: 0.05 });
    });
    btn.on("pointerup", () => {
      gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.12 });
      gsap.to(content, { y: 0, duration: 0.1 });
      onClick();
    });
    btn.on("pointerupoutside", () => {
      gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.12 });
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
        fontFamily: '"Nunito", sans-serif',
        fontSize: 22,
        fontWeight: "900",
        fill: 0xffffff,
        align: "center",
      },
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
      shadow
        .clear()
        // Soft black drop shadow
        .roundRect(-width / 2, -r + r * 0.22, width, height, radius)
        .fill({ color: 0x000000, alpha: 0.45 })
        // Dark blue 3D base
        .roundRect(-width / 2, -r + r * 0.15, width, height, radius)
        .fill({ color: 0x004466 });

      // 2. Main Face Background (vibrant blue gradient)
      const btnGrad = new FillGradient({
        start: { x: 0, y: -r },
        end: { x: 0, y: r },
        colorStops: [
          { offset: 0, color: 0x33ccff }, // Bright cyan
          { offset: 1, color: 0x0088cc }, // Medium blue
        ],
      });
      bg.clear()
        .roundRect(-width / 2, -r, width, height, radius)
        .fill({ fill: btnGrad })
        .stroke({ width: Math.max(2.5, r * 0.15), color: 0xffffff }); // Thick white border!

      // 3. Glossy highlight sheen on top (ellipse highlight)
      highlight
        .clear()
        .ellipse(0, -r / 2, width * 0.42, height * 0.2)
        .fill({ color: 0xffffff, alpha: 0.25 });

      label.style.fontSize = Math.max(14, r * 0.52);
      label.y = -r * 0.08;
    };

    btn.on("pointerover", (e) => {
      if (window.matchMedia("(hover: none)").matches) return;

      gsap.to(btn.scale, { x: 1.05, y: 1.05, duration: 0.12 });
      // soundManager.playClick();
    });

    btn.on("pointerout", (e) => {
      if (window.matchMedia("(hover: none)").matches) return;

      gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.12 });
      gsap.to(content, { y: 0, duration: 0.1 });
    });

    btn.on("pointerdown", () => {
      gsap.to(content, { y: currentR * 0.12, duration: 0.05 });
    });

    btn.on("pointerup", () => {
      gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.12 });
      gsap.to(content, { y: 0, duration: 0.1 });
      onClick();
    });

    btn.on("pointerupoutside", () => {
      gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.12 });
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

  createCircularButton(
    emojiText,
    x,
    y,
    onClick,
    parent = this.container,
    customRadius = 26,
  ) {
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
      sprite.anchor.set(0.5, 0.45); // Fix visual center for icons with bottom shadow
      const ratio = tex.width && tex.height ? tex.width / tex.height : 1;
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
        const currentRatio =
          tex.width && tex.height ? tex.width / tex.height : 1;
        if (currentRatio > 1.2 || currentRatio < 0.8) {
          sprite.height = r * 2;
          sprite.width = r * 2 * currentRatio;
        } else {
          sprite.width = r * 2;
          sprite.height = r * 2;
        }
      };

      btn.on("pointerover", (e) => {
        if (window.matchMedia("(hover: none)").matches) return;

        gsap.to(btn.scale, { x: 1.08, y: 1.08, duration: 0.12 });
        // soundManager.playClick();
      });

      btn.on("pointerout", (e) => {
        if (window.matchMedia("(hover: none)").matches) return;

        gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.12 });
        gsap.to(content, { y: 0, duration: 0.1 });
      });

      btn.on("pointerdown", () => {
        gsap.to(content, { y: 4, duration: 0.05 });
      });

      btn.on("pointerup", () => {
        gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.12 });
        gsap.to(content, { y: 0, duration: 0.1 });
        onClick();
      });

      btn.on("pointerupoutside", () => {
        gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.12 });
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

    const overlay = document.createElement("div");
    overlay.id = "game-leaderboard-overlay-id";
    overlay.className = "game-popup-overlay";

    const card = document.createElement("div");
    card.className = "game-popup-card wide";

    const title = document.createElement("div");
    title.className = "game-popup-title";
    title.innerText = "BẢNG VÀNG";
    card.appendChild(title);

    const closePopup = () => {
      soundManager.playClick();
      overlay.style.opacity = "0";
      card.style.transform = "scale(0.85)";
      setTimeout(() => {
        overlay.remove();
        this.leaderboardPopup = null;
      }, 250);
    };

    const closeBtn = document.createElement("button");
    closeBtn.className = "game-popup-close-btn";
    closeBtn.addEventListener("click", closePopup);
    card.appendChild(closeBtn);

    let currentUser = null;
    try {
      const savedUser = localStorage.getItem("google_user");
      if (savedUser) {
        currentUser = JSON.parse(savedUser);
      }
    } catch (e) {
      console.error(e);
    }

    const userText = document.createElement("div");
    userText.className = "game-leaderboard-user-text";
    userText.innerText = currentUser
      ? `Tài khoản: ${currentUser.name} (Google)`
      : `Tài khoản: Khách (Điểm lưu thiết bị)`;
    card.appendChild(userText);

    const list = saveManager.getLeaderboard();

    const tableContainer = document.createElement("div");
    tableContainer.className = "game-leaderboard-table-container";

    if (list.length === 0) {
      const emptyText = document.createElement("div");
      emptyText.style.padding = "24px";
      emptyText.style.color = "#360207";
      emptyText.style.fontSize = "16px";
      emptyText.style.fontWeight = "bold";
      emptyText.innerText =
        "Chưa có thành tích nào.\nHãy chơi game để thiết lập kỷ lục nhé! 🚀";
      tableContainer.appendChild(emptyText);
    } else {
      const table = document.createElement("table");
      table.className = "game-leaderboard-table";

      const thead = document.createElement("thead");
      thead.innerHTML = `
        <tr>
          <th>HẠNG</th>
          <th>THÀNH VIÊN</th>
          <th>ĐIỂM SỐ</th>
        </tr>
      `;
      table.appendChild(thead);

      const tbody = document.createElement("tbody");
      list.forEach((entry, idx) => {
        const row = document.createElement("tr");
        if (idx < 3) row.className = `rank-${idx}`;

        const medalText =
          idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`;
        const name = entry.userName || "";
        const avatarUrl = getAvatarUrl(name);

        row.innerHTML = `
          <td>${medalText}</td>
          <td style="text-align: left; display: flex; align-items: center; gap: 8px;">
            <img src="${avatarUrl}" style="width: 28px; height: 28px; border-radius: 50%; border: 1.5px solid #0088cc; background: #fff;" alt="" />
            <span>${name}</span>
          </td>
          <td>${entry.score.toLocaleString()}</td>
        `;
        tbody.appendChild(row);
      });
      table.appendChild(tbody);
      tableContainer.appendChild(table);
    }

    card.appendChild(tableContainer);

    // Personal Best Footer
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

    const activeRankIdx = list.findIndex(
      (entry) => entry.profileKey === activeKey,
    );
    const activeRankVal = activeRankIdx !== -1 ? activeRankIdx + 1 : null;
    const activeName = currentUser ? currentUser.name : "Khách";
    const activeAvatarUrl = getAvatarUrl(activeName);

    const footer = document.createElement("div");
    footer.className = "game-leaderboard-footer";

    const rankItem = document.createElement("div");
    rankItem.className = "game-leaderboard-footer-item";
    rankItem.innerText = activeRankVal ? `Hạng: #${activeRankVal}` : "Hạng: -";
    footer.appendChild(rankItem);

    const nameItem = document.createElement("div");
    nameItem.className = "game-leaderboard-footer-item";
    nameItem.style.display = "flex";
    nameItem.style.alignItems = "center";
    nameItem.style.justifyContent = "center";
    nameItem.style.gap = "6px";
    nameItem.innerHTML = `
      <img src="${activeAvatarUrl}" style="width: 24px; height: 24px; border-radius: 50%; border: 2px solid #0088cc;" alt="" />
      <span>${activeName}</span>
    `;
    footer.appendChild(nameItem);

    const scoreItem = document.createElement("div");
    scoreItem.className = "game-leaderboard-footer-item";
    scoreItem.innerText = `Điểm: ${personalBest.toLocaleString()}`;
    footer.appendChild(scoreItem);

    card.appendChild(footer);

    overlay.appendChild(card);
    const appContainer = document.getElementById("app") || document.body;
    appContainer.appendChild(overlay);

    this.leaderboardPopup = {
      isHTML: true,
      destroy: () => {
        overlay.remove();
        this.leaderboardPopup = null;
      },
    };

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      card.style.opacity = "1";
      card.style.transform = "scale(1)";
    });
  }

  showSettingsModal(isIngame = false) {
    if (this.settingsPopup) return;

    soundManager.playClick();

    const overlay = document.createElement("div");
    overlay.id = "game-settings-overlay-id";
    overlay.className = "game-popup-overlay";

    const card = document.createElement("div");
    card.className = "game-popup-card";

    const title = document.createElement("div");
    title.className = "game-popup-title";
    title.innerText = "CÀI ĐẶT";
    card.appendChild(title);

    const closePopup = () => {
      soundManager.playClick();
      overlay.style.opacity = "0";
      card.style.transform = "scale(0.85)";
      setTimeout(() => {
        overlay.remove();
        this.settingsPopup = null;
      }, 250);
    };

    const closeBtn = document.createElement("button");
    closeBtn.className = "game-popup-close-btn";
    closeBtn.addEventListener("click", closePopup);
    card.appendChild(closeBtn);

    const rowContainer = document.createElement("div");
    rowContainer.className = "game-settings-row-container";

    const createToggleRow = (label, isEnabled, onToggle) => {
      const row = document.createElement("div");
      row.style.cssText = `width:100%; height:70px; border-radius:12px; background:#fbfaf5; border:3px solid #fff; display:flex; justify-content:space-between; align-items:center; padding:0 20px; box-sizing:border-box; margin-bottom: 15px;`;
      
      const text = document.createElement("span");
      text.style.cssText = `font-family:'Fredoka', 'Baloo 2', 'Be Vietnam Pro', sans-serif; font-size:18px; font-weight:bold; color:#47363B; letter-spacing:0.8px; white-space:nowrap;`;
      text.innerText = label;

      const dots = document.createElement("div");
      dots.style.cssText = `flex:1; border-bottom: 4px dotted #c0bba0; margin: 0 15px; position:relative; top:5px;`;

      const toggle = document.createElement("div");
      const isMuted = !isEnabled;
      toggle.style.cssText = `width:96px; height:46px; border-radius:23px; background:${isMuted ? '#E8E3D8' : '#81C784'}; border:3px solid #fff; box-shadow: inset 0 3px 6px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.1); cursor:pointer; position:relative; transition: background 0.25s, transform 0.1s; flex-shrink:0; display:flex; align-items:center;`;
      
      const statusText = document.createElement("span");
      statusText.innerText = isMuted ? "OFF" : "ON";
      statusText.style.cssText = `color:#fff; font-family:'Impact', 'Arial Black', sans-serif; font-size:18px; position:absolute; width:100%; text-align:center; padding-right:${isMuted ? '0' : '32px'}; padding-left:${isMuted ? '32px' : '0'}; box-sizing:border-box; transition: padding 0.25s; text-shadow: 0 2px 3px rgba(0,0,0,0.4); pointer-events:none;`;

      const knob = document.createElement("div");
      knob.style.cssText = `width:36px; height:36px; border-radius:50%; background:#fff; position:absolute; top:2px; left:${isMuted ? '3px' : '51px'}; transition: left 0.25s cubic-bezier(0.3, 1.2, 0.5, 1); box-shadow: 0 3px 6px rgba(0,0,0,0.4); pointer-events:none;`;
      
      toggle.appendChild(statusText);
      toggle.appendChild(knob);

      toggle.onclick = () => {
        const newState = onToggle(); // Trả về trạng thái ENABLED sau khi toggle
        const nowMuted = !newState;
        toggle.style.background = nowMuted ? '#E8E3D8' : '#81C784';
        knob.style.left = nowMuted ? '3px' : '51px';
        statusText.innerText = nowMuted ? "OFF" : "ON";
        statusText.style.paddingRight = nowMuted ? '0' : '32px';
        statusText.style.paddingLeft = nowMuted ? '32px' : '0';
      };
      
      toggle.onmousedown = () => toggle.style.transform = "scale(0.92)";
      toggle.onmouseup = () => toggle.style.transform = "scale(1)";
      toggle.onmouseleave = () => toggle.style.transform = "scale(1)";

      row.appendChild(text);
      row.appendChild(dots);
      row.appendChild(toggle);
      return row;
    };

    // Music row
    const musicRow = createToggleRow("ÂM NHẠC", soundManager.musicEnabled, () => {
      soundManager.playClick();
      soundManager.toggleMusic();
      return soundManager.musicEnabled;
    });
    rowContainer.appendChild(musicRow);

    // SFX row
    const sfxRow = createToggleRow("HIỆU ỨNG", soundManager.enabled, () => {
      soundManager.playClick();
      soundManager.enabled = !soundManager.enabled;
      return soundManager.enabled;
    });
    rowContainer.appendChild(sfxRow);

    card.appendChild(rowContainer);

    // Reset Data Button
    const resetBtn = document.createElement("button");
    resetBtn.className = "game-settings-reset-btn";
    resetBtn.innerHTML = `<img src="/assets/delete_btn.png" class="game-settings-reset-icon" alt="" /> XÓA LỊCH SỬ`;
    resetBtn.addEventListener("click", async () => {
      soundManager.playClick();
      const confirmDelete = await gameConfirm(
        "Bạn có chắc chắn muốn xóa toàn bộ dữ liệu thành tích không?",
      );
      if (confirmDelete) {
        saveManager.reset();
        closePopup();
        await sceneManager.switchTo(MainMenuScene);
      }
    });
    card.appendChild(resetBtn);

    // Version
    const versionText = document.createElement("div");
    versionText.style.fontSize = "12px";
    versionText.style.color = "#360207";
    versionText.style.marginTop = "20px";
    versionText.innerText = "Phiên bản: 1.0.0";
    card.appendChild(versionText);

    overlay.appendChild(card);
    const appContainer = document.getElementById("app") || document.body;
    appContainer.appendChild(overlay);

    this.settingsPopup = {
      isHTML: true,
      destroy: () => {
        overlay.remove();
        this.settingsPopup = null;
      },
    };

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
      card.style.opacity = "1";
      card.style.transform = "scale(1)";
    });
  }

  destroy() {
    // Stop ticker function on destroy to avoid memory leak
    if (this.tickerFn && App.app && App.app.ticker) {
      App.app.ticker.remove(this.tickerFn);
    }

    // Clean up HTML popups
    const settingsOverlay = document.getElementById("game-settings-overlay-id");
    if (settingsOverlay) settingsOverlay.remove();

    const leaderboardOverlay = document.getElementById(
      "game-leaderboard-overlay-id",
    );
    if (leaderboardOverlay) leaderboardOverlay.remove();

    killTweensRecursive(this.container);

    this.particles.forEach((p) => {
      gsap.killTweensOf(p);
    });

    this.container.destroy({ children: true });
  }

  updateUserUI() {
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
}

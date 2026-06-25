import { Container, Graphics, Sprite, Texture, Text, Assets, TextStyle, FillGradient } from "pixi.js";
import gsap from "gsap";
import { Config } from "../config.js";
import { App } from "../system/App.js";
import { sceneManager } from "../system/SceneManager.js";
import { saveManager } from "../system/SaveManager.js";
import { GameScene } from "./GameScene.js";
import { soundManager } from "../system/SoundManager.js";

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
        fontFamily: "Outfit, Arial, sans-serif",
        fontSize: 48,
        fontWeight: "bold",
        fill: titleGrad,
        stroke: { color: "#360207", width: 6 },
        dropShadow: { color: "#2b050a", blur: 6, distance: 3, alpha: 0.85 },
      },
    });
    title.anchor.set(0.5);
    this.titleContent.addChild(title);

    const subtitle = new Text({
      text: "DỄ THƯƠNG MATCH-3",
      style: {
        fontFamily: "Outfit, Arial, sans-serif",
        fontSize: 14,
        fontWeight: "bold",
        fill: "#ffecb3",
        stroke: { color: "#000000", width: 4 },
        letterSpacing: 4,
        dropShadow: { color: "#000000", blur: 4, distance: 2, alpha: 0.8 },
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
        fontFamily: "Outfit, Arial, sans-serif",
        fontSize: 18,
        fontWeight: "bold",
        fill: "#ffdd57",
        stroke: { color: "#000000", width: 4 },
        dropShadow: { color: "#000000", blur: 4, distance: 2, alpha: 0.9 },
      },
    });
    this.infoText.anchor.set(0.5);
    this.container.addChild(this.infoText);

    // === MENU BUTTONS ===
    this.playBtn = this.createPlayButton(async () => {
      await sceneManager.switchTo(GameScene);
    });

    this.achievementsBtn = this.createCircularButton("🏆", 0, 0, () => {
      this.showLeaderboard();
    });

    this.settingsBtn = this.createCircularButton("⚙️", 0, 0, () => {
      this.showSettingsModal(false);
    });

    // === BOTTOM INFO ===
    this.versionText = new Text({
      text: "💎 Pure Match-3 v1.0 | PixiJS v8 | 6 Loại Thú | Bàn Cờ 8x8",
      style: {
        fontFamily: "Outfit, Arial, sans-serif",
        fontSize: 12,
        fontWeight: "bold",
        fill: "#ffffff",
        stroke: { color: "#000000", width: 3 },
      },
    });
    this.versionText.anchor.set(0.5);
    this.container.addChild(this.versionText);

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
    const playY = height * 0.53;
    const playW = Math.max(200, Math.min(260, 260 * scale));
    const playH = Math.max(50, Math.min(68, 68 * scale));

    if (this.playBtn) {
      this.playBtn.position.set(width / 2, playY);
      this.playBtn.updateStyle(playW, playH);
      this.playBtn.scale.set(scale);
    }

    const circY = playY + 115 * scale;
    const circR = Math.max(20, Math.min(26, 26 * scale));
    const circGap = 20 * scale;

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
      btn.updateStyle(circR);
      btn.scale.set(scale);
    });

    // 5. Version text
    if (this.versionText) {
      this.versionText.x = width / 2;
      this.versionText.y = height - 20;
      this.versionText.style.fontSize = Math.max(9, Math.min(12, 12 * scale));
    }

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
    const bg3d = new Graphics();
    const bg = new Graphics();
    const highlight = new Graphics();

    content.addChild(shadow);
    content.addChild(bg3d);
    content.addChild(bg);
    content.addChild(highlight);

    const hh = btnHeight / 2;

    const btnGrad = new FillGradient({
      start: { x: 0, y: -hh },
      end: { x: 0, y: hh },
      colorStops: [
        { offset: 0, color: 0xff3b4e },
        { offset: 0.4, color: 0xd32f2f },
        { offset: 1, color: 0x6e0912 },
      ],
    });

    const goldGrad = new FillGradient({
      start: { x: -width / 2, y: -hh },
      end: { x: width / 2, y: hh },
      colorStops: [
        { offset: 0, color: 0xffea00 },
        { offset: 0.5, color: 0xb89326 },
        { offset: 1, color: 0xffea00 },
      ],
    });

    const isSmall = width < 150;
    const radius = isSmall ? 10 : 14;
    const offset3d = isSmall ? 3 : 4;
    const shadowOffset = isSmall ? 4 : 6;

    // 1. Soft 3D drop shadow
    shadow.roundRect(-width / 2, -hh + shadowOffset, width, btnHeight, radius).fill({ color: 0x000000, alpha: 0.45 });

    // 2. 3D Extrusion base
    bg3d.roundRect(-width / 2, -hh + offset3d, width, btnHeight, radius)
      .fill({ color: 0x4a000a })
      .stroke({ width: 1, color: 0x240003 });

    // 3. Main face
    bg.roundRect(-width / 2, -hh, width, btnHeight, radius)
      .fill(btnGrad)
      .stroke({ width: 2, fill: goldGrad });

    // 4. Glossy highlight sheen on top
    const sheenH = isSmall ? 11 : 16;
    highlight.roundRect(-width / 2 + 4, -hh + 2, width - 8, sheenH, isSmall ? 8 : 10)
      .fill({ color: 0xffffff, alpha: 0.18 });

    // Add Label / Icon
    let textObj = null;

    if (label.startsWith("GOOGLE_ICON")) {
      const displayText = label.includes(":")
        ? label.split(":")[1]
        : "ĐĂNG NHẬP GOOGLE";

      const text = new Text({
        text: displayText,
        style: new TextStyle({
          fontFamily: "Outfit, Arial, sans-serif",
          fontSize: 14,
          fontWeight: "bold",
          fill: "#ffffff",
          dropShadow: { color: 0x000000, blur: 2, distance: 1.5 }
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

        const emojiText = new Text({
          text: emoji,
          style: new TextStyle({
            fontFamily: "Outfit, Arial, sans-serif",
            fontSize: emojiSize,
            fill: "#ffffff",
          }),
        });
        emojiText.anchor.set(0.5);
        content.addChild(emojiText);

        const text = new Text({
          text: textStr,
          style: new TextStyle({
            fontFamily: "Outfit, Arial, sans-serif",
            fontSize: textSize,
            fontWeight: "bold",
            fill: "#ffffff",
            dropShadow: { color: 0x000000, blur: 2, distance: 1.5 }
          }),
        });
        text.anchor.set(0.5);
        content.addChild(text);
        textObj = text;

        const gap = isSmall ? 6 : 12;
        const totalW = emojiText.width + gap + text.width;
        emojiText.x = -totalW / 2 + emojiText.width / 2;
        text.x = totalW / 2 - text.width / 2;
      } else {
        const textSize = isSmall ? 11 : (label.length > 2 ? 15 : 22);
        const text = new Text({
          text: label,
          style: new TextStyle({
            fontFamily: "Outfit, Arial, sans-serif",
            fontSize: textSize,
            fontWeight: "bold",
            fill: "#ffffff",
            dropShadow: { color: 0x000000, blur: 2, distance: 1.5 }
          }),
        });
        text.anchor.set(0.5);
        content.addChild(text);
        textObj = text;
      }
    }

    // Interactivity
    btn.on("pointerover", () => {
      gsap.to(btn.scale, { x: 1.08, y: 1.08, duration: 0.15 });
      bg.stroke({ width: 2.5, color: 0xffea00 });
      if (textObj) textObj.style.fill = "#ffea00";
      soundManager.playClick();
    });
    btn.on("pointerout", () => {
      gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.15 });
      bg.stroke({ width: 2, fill: goldGrad });
      if (textObj) textObj.style.fill = "#ffffff";
    });
    btn.on("pointerdown", () => {
      gsap.to(content, { y: 2, duration: 0.05 });
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

  createCircularButton(emojiText, x, y, onClick, parent = this.container) {
    const btn = new Container();
    btn.x = x;
    btn.y = y;
    parent.addChild(btn);

    btn.eventMode = "static";
    btn.cursor = "pointer";

    const content = new Container();
    btn.addChild(content);

    const shadow = new Graphics();
    const bg = new Graphics();
    const highlight = new Graphics();

    content.addChild(shadow);
    content.addChild(bg);
    content.addChild(highlight);

    const label = new Text({
      text: emojiText,
      style: new TextStyle({
        fontFamily: "Outfit, Arial, sans-serif",
        fontSize: 22,
        fill: "#ffffff",
        dropShadow: { color: 0x000000, blur: 2, distance: 1.5 },
      }),
    });
    label.anchor.set(0.5);
    content.addChild(label);

    btn.r = 26;

    btn.updateStyle = (r) => {
      btn.r = r;

      // 1. Soft 3D drop shadow
      shadow.clear().circle(0, 4, r).fill({ color: 0x000000, alpha: 0.45 });

      // 2. 3D Extrusion base
      bg.clear().circle(0, 3, r).fill({ color: 0x4a000a }).stroke({ width: 1, color: 0x240003 });

      // 3. Main button body - premium smooth gradient
      const btnGrad = new FillGradient({
        start: { x: 0, y: -r },
        end: { x: 0, y: r },
        colorStops: [
          { offset: 0, color: 0xff3b4e },
          { offset: 0.4, color: 0xd32f2f },
          { offset: 1, color: 0x6e0912 },
        ],
      });

      const goldGrad = new FillGradient({
        start: { x: -r, y: -r },
        end: { x: r, y: r },
        colorStops: [
          { offset: 0, color: 0xffea00 },
          { offset: 0.5, color: 0xb89326 },
          { offset: 1, color: 0xffea00 },
        ],
      });

      bg.circle(0, 0, r).fill(btnGrad).stroke({ width: 2, fill: goldGrad });

      // 4. Glossy highlight sheen
      highlight.clear().ellipse(0, -r * 0.4, r * 0.7, r * 0.35).fill({ color: 0xffffff, alpha: 0.18 });

      // Adjust label font size
      label.style.fontSize = Math.max(16, Math.min(22, 22 * (r / 26)));
    };

    btn.updateStyle(btn.r);

    btn.on("pointerover", () => {
      gsap.to(btn.scale, { x: 1.08, y: 1.08, duration: 0.15 });
      soundManager.playClick();
    });

    btn.on("pointerout", () => {
      gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.15 });
    });

    btn.on("pointerdown", () => {
      gsap.to(content, { y: 2, duration: 0.05 });
    });

    btn.on("pointerup", () => {
      gsap.to(content, { y: 0, duration: 0.1 });
      onClick();
    });

    btn.on("pointerupoutside", () => {
      gsap.to(content, { y: 0, duration: 0.1 });
    });

    return btn;
  }

  createPlayButton(onClick, parent = this.container) {
    const btn = new Container();
    parent.addChild(btn);
    btn.eventMode = "static";
    btn.cursor = "pointer";

    const content = new Container();
    btn.addChild(content);

    const shadow = new Graphics();
    const bg3d = new Graphics();
    const bg = new Graphics();
    const highlight = new Graphics();
    const icon = new Graphics();

    content.addChild(shadow, bg3d, bg, highlight, icon);

    btn.w = 76;
    btn.h = 76;

    btn.updateStyle = (w, h) => {
      // Force square shape based on height to match the cartoon play icon
      const size = Math.round(h * 1.35);
      btn.w = size;
      btn.h = size;

      // 1. Soft 3D drop shadow (translucent black)
      shadow
        .clear()
        .roundRect(-size / 2, -size / 2 + 6, size, size, 16)
        .fill({ color: 0x000000, alpha: 0.45 });

      // 2. 3D Extrusion base (deep luxurious lacquer burgundy)
      bg3d.clear()
        .roundRect(-size / 2, -size / 2 + 4, size, size, 16)
        .fill({ color: 0x4a000a })
        .stroke({ width: 1, color: 0x240003 });

      // 3. Main button body - premium smooth gradient (light crimson to deep crimson lacquer)
      const btnGrad = new FillGradient({
        start: { x: 0, y: -size / 2 },
        end: { x: 0, y: size / 2 },
        colorStops: [
          { offset: 0, color: 0xff3b4e },
          { offset: 0.4, color: 0xd32f2f },
          { offset: 1, color: 0x6e0912 },
        ],
      });

      const goldGrad = new FillGradient({
        start: { x: -size / 2, y: -size / 2 },
        end: { x: size / 2, y: size / 2 },
        colorStops: [
          { offset: 0, color: 0xffea00 },
          { offset: 0.5, color: 0xb89326 },
          { offset: 1, color: 0xffea00 },
        ],
      });

      bg.clear()
        .roundRect(-size / 2, -size / 2, size, size, 16)
        .fill(btnGrad)
        .stroke({ width: 2, fill: goldGrad });

      // 4. Glossy highlight sheen on top
      highlight
        .clear()
        .roundRect(-size / 2 + 4, -size / 2 + 3, size - 8, size * 0.35, 12)
        .fill({ color: 0xffffff, alpha: 0.18 });

      // 5. Play icon (triangle pointing right in gold with a nice 3D drop shadow)
      const triW = size * 0.35;
      const triH = size * 0.38;
      icon
        .clear()
        // Shadow of the triangle
        .poly([
          -triW * 0.4 + 1,
          -triH / 2 + 1.5,
          triW * 0.6 + 1,
          1.5,
          -triW * 0.4 + 1,
          triH / 2 + 1.5,
        ])
        .fill({ color: 0x000000, alpha: 0.5 })
        // Main triangle in gold
        .poly([-triW * 0.4, -triH / 2, triW * 0.6, 0, -triW * 0.4, triH / 2])
        .fill(goldGrad)
        .stroke({ width: 1.2, color: 0x3d0006 });
    };

    btn.updateStyle(btn.w, btn.h);

    btn.on("pointerover", () => {
      gsap.to(btn.scale, { x: 1.08, y: 1.08, duration: 0.15 });
      soundManager.playClick();
    });

    btn.on("pointerout", () => {
      gsap.to(btn.scale, { x: 1.0, y: 1.0, duration: 0.15 });
    });

    btn.on("pointerdown", () => {
      gsap.to(content, { y: 2, duration: 0.05 });
    });

    btn.on("pointerup", () => {
      gsap.to(content, { y: 0, duration: 0.1 });
      onClick();
    });

    btn.on("pointerupoutside", () => {
      gsap.to(content, { y: 0, duration: 0.1 });
    });

    return btn;
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
    const cardH = 500;

    // Modal bg
    const modalBg = new Graphics();
    modalBg.roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 24);
    modalBg.fill({ color: 0x150103, alpha: 0.95 });
    modalBg.stroke({ color: 0xd4af37, width: 3.5 });
    this.leaderboardModal.addChild(modalBg);

    // Header Title
    const titleText = new Text({
      text: "🏆 BẢNG VÀNG THÀNH TÍCH",
      style: new TextStyle({
        fontFamily: "Outfit, Arial, sans-serif",
        fontSize: 26,
        fill: 0xffea00,
        fontWeight: "bold",
        letterSpacing: 1.5,
        align: "center",
        dropShadow: { color: 0x000000, blur: 4, distance: 2 },
      }),
    });
    titleText.anchor.set(0.5);
    titleText.y = -cardH / 2 + 32;
    this.leaderboardModal.addChild(titleText);

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
        fontFamily: "Outfit, Arial, sans-serif",
        fontSize: 13,
        fontWeight: "bold",
        fill: currentUser ? "#ffea00" : "#aaaaaa",
      }),
    });
    userText.anchor.set(0.5);
    userText.y = -cardH / 2 + 65;
    this.leaderboardModal.addChild(userText);

    // Columns Header row
    const headerY = -120;
    const colRankX = -120;
    const colScoreX = 120;

    const rankHeader = new Text({
      text: "HẠNG",
      style: new TextStyle({
        fontFamily: "Outfit, Arial, sans-serif",
        fontSize: 22,
        fontWeight: "bold",
        fill: 0xffea00,
      }),
    });
    rankHeader.anchor.set(0.5);
    rankHeader.position.set(colRankX, headerY);
    this.leaderboardModal.addChild(rankHeader);

    const scoreHeader = new Text({
      text: "ĐIỂM",
      style: new TextStyle({
        fontFamily: "Outfit, Arial, sans-serif",
        fontSize: 22,
        fontWeight: "bold",
        fill: 0xffea00,
      }),
    });
    scoreHeader.anchor.set(0.5);
    scoreHeader.position.set(colScoreX, headerY);
    this.leaderboardModal.addChild(scoreHeader);

    // Divider line below headers
    const headerDivider = new Graphics()
      .moveTo(-225, headerY + 16)
      .lineTo(225, headerY + 16)
      .stroke({ color: 0xd4af37, width: 1.5, alpha: 0.6 });
    this.leaderboardModal.addChild(headerDivider);

    // Fetch top scores
    const list = saveManager.getLeaderboard();

    if (list.length === 0) {
      const emptyText = new Text({
        text: "Chưa có thành tích nào.\nHãy chơi game để thiết lập kỷ lục nhé! 🚀",
        style: new TextStyle({
          fontFamily: "Outfit, Arial, sans-serif",
          fontSize: 16,
          fill: "#aaaaaa",
          align: "center",
          lineHeight: 22,
        }),
      });
      emptyText.anchor.set(0.5);
      emptyText.y = 10;
      this.leaderboardModal.addChild(emptyText);
    } else {
      // Draw list items
      const startY = -70;
      const rowHeight = 44;

      list.forEach((entry, idx) => {
        const rowY = startY + idx * rowHeight;
        const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
        const rankIcon = medals[idx] || `${idx + 1}`;

        // Row background highlight for top 3 or player highlighted
        const rowBg = new Graphics()
          .roundRect(-225, rowY - rowHeight / 2 + 3, 450, rowHeight - 6, 8)
          .fill({ color: 0x4a000a, alpha: idx === 0 ? 0.35 : idx === 1 ? 0.25 : 0.15 })
          .stroke({ color: 0xffea00, width: 1.5, alpha: idx === 0 ? 0.8 : 0.3 });
        this.leaderboardModal.addChild(rowBg);

        let rankTextStr = rankIcon;
        // Since all scores in this profile list belong to the active user, append silhouette
        rankTextStr = `${rankTextStr} 👤`;

        // Rank Column (Enlarged)
        const rankText = new Text({
          text: rankTextStr,
          style: new TextStyle({
            fontFamily: "Outfit, Arial, sans-serif",
            fontSize: 24,
            fontWeight: "bold",
            fill: idx === 0 ? "#ffd700" : idx === 1 ? "#c0c0c0" : idx === 2 ? "#cd7f32" : "#ffffff",
          }),
        });
        rankText.anchor.set(0.5);
        rankText.position.set(colRankX, rowY);
        this.leaderboardModal.addChild(rankText);

        // Score Column (Enlarged)
        const scoreText = new Text({
          text: entry.score.toLocaleString(),
          style: new TextStyle({
            fontFamily: "Outfit, Arial, sans-serif",
            fontSize: 24,
            fontWeight: "bold",
            fill: idx === 0 ? "#ffd700" : idx === 1 ? "#c0c0c0" : idx === 2 ? "#cd7f32" : "#ffffff",
          }),
        });
        scoreText.anchor.set(0.5);
        scoreText.position.set(colScoreX, rowY);
        this.leaderboardModal.addChild(scoreText);
      });
    }

    if (list.length > 0) {
      // Pinned Best Record Banner at the bottom (formatted exactly like Screenshot 1)
      const footerBg = new Graphics()
        .roundRect(-225, 138, 450, 44, 8)
        .fill({ color: 0x4a000a, alpha: 0.9 })
        .stroke({ color: 0xffea00, width: 1.5 });
      this.leaderboardModal.addChild(footerBg);

      const bestScore = list[0].score;

      const footerRank = new Text({
        text: "🥇",
        style: new TextStyle({
          fontFamily: "Outfit, Arial, sans-serif",
          fontSize: 24,
          fontWeight: "bold",
          fill: 0xffea00,
        }),
      });
      footerRank.anchor.set(0.5);
      footerRank.position.set(colRankX, 160);
      this.leaderboardModal.addChild(footerRank);

      const footerScore = new Text({
        text: bestScore.toLocaleString(),
        style: new TextStyle({
          fontFamily: "Outfit, Arial, sans-serif",
          fontSize: 24,
          fontWeight: "bold",
          fill: 0xffea00,
        }),
      });
      footerScore.anchor.set(0.5);
      footerScore.position.set(colScoreX, 160);
      this.leaderboardModal.addChild(footerScore);
    }

    // CLOSE Button (Red & Gold Lacquer rectangular QUAY LẠI button)
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

    const closeBtn = this.createMenuButton(
      "↩️ QUAY LẠI",
      0,
      215,
      0x5c0612,
      180,
      closePopup,
      this.leaderboardModal,
      38
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
    const cardH = 260;

    // Shadow
    const cardShadow = new Graphics()
      .roundRect(-cardW / 2 + 5, -cardH / 2 + 5, cardW, cardH, 16)
      .fill({ color: 0x000000, alpha: 0.35 });
    this.settingsModal.addChild(cardShadow);

    // Card Bg
    const cardBg = new Graphics()
      .roundRect(-cardW / 2, -cardH / 2, cardW, cardH, 16)
      .fill({ color: 0x150103, alpha: 0.92 })
      .stroke({ width: 1.5, color: 0xd4af37, alpha: 0.85 });
    this.settingsModal.addChild(cardBg);

    // Title
    const titleText = new Text({
      text: "CÀI ĐẶT GAME",
      style: new TextStyle({
        fontFamily: "Outfit, Arial, sans-serif",
        fontSize: 20,
        fill: 0xffea00,
        fontWeight: "bold",
        letterSpacing: 1.8,
        align: "center",
        dropShadow: { color: 0x000000, blur: 4, distance: 2 },
      }),
    });
    titleText.anchor.set(0.5);
    titleText.position.set(0, -cardH / 2 + 32);
    this.settingsModal.addChild(titleText);

    // Circular close btn (✕) in top right
    const closeBtn = new Container();
    closeBtn.eventMode = "static";
    closeBtn.cursor = "pointer";
    closeBtn.position.set(cardW / 2 - 22, -cardH / 2 + 22);

    const closeBg = new Graphics()
      .circle(0, 0, 13)
      .fill({ color: 0x1b0103, alpha: 0.8 })
      .stroke({ width: 1.2, color: 0xd4af37, alpha: 0.8 });
    closeBtn.addChild(closeBg);

    const closeText = new Text({
      text: "✕",
      style: new TextStyle({
        fontFamily: "Outfit, Arial, sans-serif",
        fontSize: 12,
        fill: "#ffffff",
        fontWeight: "bold",
      }),
    });
    closeText.anchor.set(0.5);
    closeBtn.addChild(closeText);

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

    closeBtn.on("pointertap", closePopup);
    closeBtn.on("pointerover", () => {
      gsap.to(closeBtn.scale, { x: 1.15, y: 1.15, duration: 0.15 });
      closeBg.stroke({ width: 1.5, color: 0xffea00 });
    });
    closeBtn.on("pointerout", () => {
      gsap.to(closeBtn.scale, { x: 1.0, y: 1.0, duration: 0.15 });
      closeBg.stroke({ width: 1.2, color: 0xd4af37, alpha: 0.8 });
    });
    this.settingsModal.addChild(closeBtn);

    // Reusable Toggle Row Builder
    const createToggleRow = (labelText, yPos, initialMuteState, onToggle) => {
      const row = new Container();
      row.position.set(0, yPos);

      // Left label (enlarged)
      const label = new Text({
        text: labelText,
        style: new TextStyle({
          fontFamily: "Outfit, Arial, sans-serif",
          fontSize: 18,
          fill: "#ffffff",
          fontWeight: "bold",
          letterSpacing: 0.8,
        }),
      });
      label.anchor.set(0, 0.5);
      label.position.set(-110, 0);
      row.addChild(label);

      // Right slider track (enlarged)
      const trackW = 60;
      const trackH = 30;
      const track = new Container();
      track.eventMode = "static";
      track.cursor = "pointer";
      track.position.set(70, 0);
      row.addChild(track);

      const trackBg = new Graphics();
      track.addChild(trackBg);

      const knob = new Graphics()
        .circle(0, 0, 12)
        .fill({ color: 0xffffff })
        .stroke({ width: 1, color: 0xdddddd });
      knob.position.set(0, 0);
      track.addChild(knob);

      const drawTrack = (isMuted) => {
        trackBg
          .clear()
          .roundRect(-trackW / 2, -trackH / 2, trackW, trackH, trackH / 2)
          .fill({ color: isMuted ? 0x4f4f4f : 0x2ecc71 })
          .stroke({ width: 1.2, color: 0xd4af37, alpha: 0.7 });
      };

      // Initialize
      drawTrack(initialMuteState);
      knob.x = initialMuteState ? -trackW / 2 + 14 : trackW / 2 - 14;

      const handleToggle = () => {
        soundManager.playClick();
        const isMuted = onToggle();
        drawTrack(isMuted);
        const targetKnobX = isMuted ? -trackW / 2 + 14 : trackW / 2 - 14;
        gsap.to(knob, {
          x: targetKnobX,
          duration: 0.2,
          ease: "power2.out",
        });
      };

      track.on("pointertap", handleToggle);
      label.eventMode = "static";
      label.cursor = "pointer";
      label.on("pointertap", handleToggle);

      return row;
    };

    // Add Music and SFX rows
    const musicRowY = -45;
    const sfxRowY = -5;

    const musicRow = createToggleRow(
      "🎵 NHẠC NÈN",
      musicRowY,
      !soundManager.musicEnabled,
      () => {
        soundManager.toggleMusic();
        return !soundManager.musicEnabled;
      }
    );
    const sfxRow = createToggleRow(
      "🔊 HIỆU ỨNG",
      sfxRowY,
      !soundManager.enabled,
      () => {
        soundManager.enabled = !soundManager.enabled;
        return !soundManager.enabled;
      }
    );

    this.settingsModal.addChild(musicRow);
    this.settingsModal.addChild(sfxRow);

    // Modern Outline Reset Data button (smaller and elegant)
    const resetBtn = new Container();
    resetBtn.eventMode = "static";
    resetBtn.cursor = "pointer";
    resetBtn.position.set(0, 50);

    const resetW = 230;
    const resetH = 38;

    const resetBg = new Graphics()
      .roundRect(-resetW / 2, -resetH / 2, resetW, resetH, resetH / 2)
      .fill({ color: 0x1b0103, alpha: 0.5 })
      .stroke({ width: 1.5, color: 0xd32f2f, alpha: 0.8 });
    resetBtn.addChild(resetBg);

    const resetText = new Text({
      text: "🗑️ XÓA DỮ LIỆU THÀNH TÍCH",
      style: new TextStyle({
        fontFamily: "Outfit, Arial, sans-serif",
        fontSize: 13,
        fill: "#fdf5e6",
        fontWeight: "bold",
        letterSpacing: 0.5,
      }),
    });
    resetText.anchor.set(0.5);
    resetBtn.addChild(resetText);

    resetBtn.on("pointertap", async () => {
      soundManager.playClick();
      const confirmDelete = confirm("Bạn có chắc chắn muốn xóa toàn bộ dữ liệu thành tích không?");
      if (confirmDelete) {
        saveManager.reset();
        closePopup();
        await sceneManager.switchTo(MainMenuScene);
      }
    });

    resetBtn.on("pointerover", () => {
      gsap.to(resetBtn.scale, { x: 1.05, y: 1.05, duration: 0.15 });
    });
    resetBtn.on("pointerout", () => {
      gsap.to(resetBtn.scale, { x: 1.0, y: 1.0, duration: 0.15 });
    });

    this.settingsModal.addChild(resetBtn);

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
    // 1. Fullscreen Button (iOS and cross-browser safe)
    const fsBtn = document.getElementById("fullscreen-btn");
    if (fsBtn) {
      fsBtn.onclick = () => {
        const docEl = document.documentElement;
        const appEl = document.getElementById("app");
        const isNativeFS = !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        );
        const isPseudoFS =
          appEl && appEl.classList.contains("pseudo-fullscreen");

        const enterPseudo = () => {
          if (appEl) {
            appEl.classList.add("pseudo-fullscreen");
            setTimeout(() => {
              window.dispatchEvent(new window.Event("resize"));
            }, 100);
          }
        };

        const exitPseudo = () => {
          if (appEl) {
            appEl.classList.remove("pseudo-fullscreen");
            setTimeout(() => {
              window.dispatchEvent(new window.Event("resize"));
            }, 100);
          }
        };

        if (!isNativeFS && !isPseudoFS) {
          if (docEl.requestFullscreen) {
            docEl.requestFullscreen().catch((err) => {
              console.error(
                "Error attempting to enable native fullscreen, falling back to pseudo:",
                err,
              );
              enterPseudo();
            });
          } else if (docEl.webkitRequestFullscreen) {
            docEl.webkitRequestFullscreen();
          } else if (docEl.mozRequestFullScreen) {
            docEl.mozRequestFullScreen();
          } else if (docEl.msRequestFullscreen) {
            docEl.msRequestFullscreen();
          } else {
            enterPseudo();
          }
        } else {
          if (isNativeFS) {
            if (document.exitFullscreen) {
              document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
              document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
              document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
              document.msExitFullscreen();
            }
          }
          if (isPseudoFS) {
            exitPseudo();
          }
        }
      };
    }

    // Clean up pseudo fullscreen if native fullscreen changes
    const onFullscreenChange = () => {
      const isNativeFS = !!(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      if (isNativeFS) {
        const appEl = document.getElementById("app");
        if (appEl && appEl.classList.contains("pseudo-fullscreen")) {
          appEl.classList.remove("pseudo-fullscreen");
          setTimeout(() => {
            window.dispatchEvent(new window.Event("resize"));
          }, 100);
        }
      }
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("webkitfullscreenchange", onFullscreenChange);
    document.addEventListener("mozfullscreenchange", onFullscreenChange);
    document.addEventListener("MSFullscreenChange", onFullscreenChange);

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

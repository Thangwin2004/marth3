import { Container, Graphics, Sprite, Texture, Text, Assets } from "pixi.js";
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
    const title = new Text({
      text: "Bộ Lạc CRUSH",
      style: {
        fontFamily: "Arial",
        fontSize: 48,
        fontWeight: "bold",
        fill: "#ffffff",
        stroke: { color: "#000000", width: 8 },
        dropShadow: { color: "#000000", blur: 6, distance: 3, alpha: 0.8 },
      },
    });
    title.anchor.set(0.5);
    this.titleContent.addChild(title);

    const subtitle = new Text({
      text: "DỄ THƯƠNG MATCH-3",
      style: {
        fontFamily: "Arial",
        fontSize: 22,
        fontWeight: "bold",
        fill: "#ffb300", // golden color to match animal theme
        stroke: { color: "#000000", width: 5 },
        letterSpacing: 6,
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
        fontFamily: "Arial",
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
    this.menuButtons = [];
    const btnStartY = 370;

    // Button 1: Start Game
    this.menuButtons.push(
      this.createMenuButton("🎮 BẮT ĐẦU", 0, btnStartY, 0x4fc3f7, 180, async () => {
        await sceneManager.switchTo(GameScene);
      }),
    );

    // Button 2: Leaderboard
    this.menuButtons.push(
      this.createMenuButton("🏆 BẢNG VÀNG", 0, btnStartY + 70, 0xffb300, 180, () => {
        this.showLeaderboard();
      }),
    );

    // Button 3: Reset Data
    this.menuButtons.push(
      this.createMenuButton(
        "🗑️ XÓA DỮ LIỆU",
        0,
        btnStartY + 140,
        0x8b0000,
        180,
        async () => {
          saveManager.reset();
          // Reload main menu
          await sceneManager.switchTo(MainMenuScene);
        },
      ),
    );

    // Button 4: Google Login
    this.googleLoginBtn = this.createMenuButton(
      "GOOGLE_ICON:ĐĂNG NHẬP GOOGLE",
      0,
      btnStartY + 210,
      0x4285f4,
      180,
      () => {
        this.showGoogleLoginModal();
      },
    );
    this.menuButtons.push(this.googleLoginBtn);

    // === BOTTOM INFO ===
    this.versionText = new Text({
      text: "💎 Pure Match-3 v1.0 | PixiJS v8 | 6 Loại Thú | Bàn Cờ 8x8",
      style: {
        fontFamily: "Arial",
        fontSize: 12,
        fontWeight: "bold",
        fill: "#ffffff",
        stroke: { color: "#000000", width: 3 },
      },
    });
    this.versionText.anchor.set(0.5);
    this.container.addChild(this.versionText);

    // === MUSIC TOGGLE BUTTON ===
    this.musicBtn = new Container();
    this.musicBtn.eventMode = "static";
    this.musicBtn.cursor = "pointer";
    this.container.addChild(this.musicBtn);

    const musicBg = new Graphics();
    musicBg.circle(0, 0, 22);
    musicBg.fill({ color: 0xffffff, alpha: 0.15 });
    musicBg.stroke({ color: 0xffffff, width: 2, alpha: 0.5 });
    this.musicBtn.addChild(musicBg);

    this.musicIcon = new Text({
      text: soundManager.musicEnabled ? "🎵" : "🔇",
      style: { fontFamily: "Arial", fontSize: 18, fill: "#ffffff" },
    });
    this.musicIcon.anchor.set(0.5);
    this.musicBtn.addChild(this.musicIcon);

    this.musicBtn.on("pointerover", () => {
      gsap.to(this.musicBtn.scale, { x: 1.1, y: 1.1, duration: 0.15 });
      gsap.to(musicBg, { alpha: 0.35, duration: 0.15 });
      soundManager.playClick();
    });
    this.musicBtn.on("pointerout", () => {
      gsap.to(this.musicBtn.scale, { x: 1, y: 1, duration: 0.15 });
      gsap.to(musicBg, { alpha: 0.15, duration: 0.15 });
    });
    this.musicBtn.on("pointerdown", () => {
      soundManager.playClick();
      const enabled = soundManager.toggleMusic();
      this.musicIcon.text = enabled ? "🎵" : "🔇";
      gsap
        .timeline()
        .to(musicBg, { alpha: 0.6, duration: 0.08 })
        .to(musicBg, { alpha: 0.15, duration: 0.15 });
    });

    // === ANIMAL SCROLLING BANNER (PARADE) ===
    this.paradeContainer = new Container();
    this.container.addChild(this.paradeContainer);

    // Pick 16 random animal avatars for the scrolling bottom banner
    const paradeFiles = [...ALL_AVATAR_FILES]
      .sort(() => 0.5 - Math.random())
      .slice(0, 16);
    const paradeSprites = [];
    const spacing = 90;

    const paradePromises = paradeFiles.map((file, idx) => {
      const alias = `menu_parade_${idx}`;
      const src = `/assets/imagebldp/${file}`;
      return Assets.load({ alias, src });
    });

    Promise.all(paradePromises).then(() => {
      if (this.paradeContainer.destroyed) return;

      paradeFiles.forEach((file, idx) => {
        const alias = `menu_parade_${idx}`;
        const sprite = Sprite.from(alias);
        sprite.anchor.set(0.5);
        sprite.width = 44;
        sprite.height = 44;
        // Place them spaced out horizontally
        sprite.x = idx * spacing;
        this.paradeContainer.addChild(sprite);
        paradeSprites.push(sprite);
      });

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

    // 1.5. Music Button (aligned horizontally with the top-right HTML fullscreen button)
    if (this.musicBtn) {
      this.musicBtn.x = width - 85;
      this.musicBtn.y = 38;
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

    // 4. Menu Buttons
    const buttonStartPercent = height > width ? 0.52 : 0.56;
    const buttonSpacing = 68;
    if (this.menuButtons) {
      let visibleIdx = 0;
      this.menuButtons.forEach((btn) => {
        if (btn.visible) {
          btn.x = width / 2;
          btn.scale.set(scale);
          btn.y =
            height * buttonStartPercent + visibleIdx * buttonSpacing * scale;
          visibleIdx++;
        }
      });
    }

    // 5. Version text
    if (this.versionText) {
      this.versionText.x = width / 2;
      this.versionText.y = height - 25;
      this.versionText.style.fontSize = Math.max(9, Math.min(12, 12 * scale));
    }

    // 6. Parade bottom banner
    if (this.paradeContainer) {
      this.paradeContainer.y = height - 70;
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
            ? Math.min(1.0, (width - 40) / 520)
            : 1.0;
        this.leaderboardModal.scale.set(modalScale);
      }
    }
  }

  createMenuButton(label, x, y, color, width = 220, onClick) {
    const btn = new Container();
    btn.x = x;
    btn.y = y;
    this.container.addChild(btn);

    // Generate rounded rect texture for bg
    const tempBg = new Graphics();
    tempBg.roundRect(0, 0, width, 48, 12);
    tempBg.fill({ color: 0xffffff });
    const bgTexture = App.app.renderer.generateTexture({ target: tempBg });
    tempBg.destroy();

    const bg = new Sprite(bgTexture);
    bg.anchor.set(0.5);
    bg.tint = color;
    bg.alpha = 0.85;
    bg.eventMode = "static";
    bg.cursor = "pointer";
    btn.addChild(bg);

    // Generate rounded rect texture for shine
    const tempShine = new Graphics();
    tempShine.roundRect(0, 0, width, 24, 12);
    tempShine.fill({ color: 0xffffff });
    const shineTexture = App.app.renderer.generateTexture({
      target: tempShine,
    });
    tempShine.destroy();

    const shine = new Sprite(shineTexture);
    shine.anchor.set(0.5);
    shine.y = -12;
    shine.alpha = 0.08;
    btn.addChild(shine);

    if (label.startsWith("GOOGLE_ICON")) {
      const displayText = label.includes(":") ? label.split(":")[1] : "ĐĂNG NHẬP GOOGLE";

      const text = new Text({
        text: displayText,
        style: {
          fontFamily: "Arial",
          fontSize: 14,
          fontWeight: "bold",
          fill: "#ffffff",
        },
      });
      text.anchor.set(0.5);
      btn.addChild(text);

      const icon = new Sprite();
      btn.addChild(icon);
      btn.icon = icon;
      Assets.load("/google_logo.png")
        .then((texture) => {
          icon.texture = texture;
          icon.anchor.set(0.5);
          icon.width = 18;
          icon.height = 18;

          // Align icon and text horizontally
          const gap = 8;
          const totalW = icon.width + gap + text.width;
          icon.x = -totalW / 2 + icon.width / 2;
          text.x = totalW / 2 - text.width / 2;
        })
        .catch((err) => {
          console.error("Failed to load google_logo.png:", err);
        });
    } else {
      const text = new Text({
        text: label,
        style: {
          fontFamily: "Arial",
          fontSize: 15,
          fontWeight: "bold",
          fill: "#ffffff",
        },
      });
      text.anchor.set(0.5);
      btn.addChild(text);
    }

    bg.on("pointerover", () => {
      gsap.to(btn.scale, { x: 1.05, y: 1.05, duration: 0.15 });
      gsap.to(bg, { alpha: 1, duration: 0.15 });
      soundManager.playClick();
    });
    bg.on("pointerout", () => {
      gsap.to(btn.scale, { x: 1, y: 1, duration: 0.15 });
      gsap.to(bg, { alpha: 0.85, duration: 0.15 });
    });
    bg.on("pointerdown", () => {
      soundManager.playClick();
      onClick();
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

  /**
   * Show high score leaderboard modal.
   */
  showLeaderboard() {
    if (this.leaderboardPopup) return;

    const popup = new Container();
    popup.zIndex = 200;
    this.container.addChild(popup);
    this.leaderboardPopup = popup;

    // Dark modal overlay to capture clicks
    this.leaderboardOverlay = new Graphics();
    this.leaderboardOverlay.rect(
      0,
      0,
      App.app.screen.width,
      App.app.screen.height,
    );
    this.leaderboardOverlay.fill({ color: 0x000000, alpha: 0.75 });
    this.leaderboardOverlay.eventMode = "static";
    popup.addChild(this.leaderboardOverlay);

    this.leaderboardModal = new Container();
    this.leaderboardModal.x = App.app.screen.width / 2;
    this.leaderboardModal.y = App.app.screen.height / 2;
    popup.addChild(this.leaderboardModal);

    // Modal bg
    const modalBg = new Graphics();
    modalBg.roundRect(-240, -200, 480, 400, 24);
    modalBg.fill({ color: 0x121a2e, alpha: 0.96 });
    modalBg.stroke({ color: 0xffb300, width: 3, alpha: 0.95 });
    this.leaderboardModal.addChild(modalBg);

    // Header Title
    const titleText = new Text({
      text: "🏆 BẢNG THÀNH TÍCH",
      style: {
        fontFamily: "Arial",
        fontSize: 32,
        fontWeight: "bold",
        fill: "#ffdd57",
        dropShadow: { color: "#000000", blur: 6, distance: 3 },
      },
    });
    titleText.anchor.set(0.5);
    titleText.y = -140;
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
      style: {
        fontFamily: "Arial",
        fontSize: 13,
        fontWeight: "bold",
        fill: currentUser ? "#ffea00" : "#aaaaaa",
      },
    });
    userText.anchor.set(0.5);
    userText.y = -105;
    this.leaderboardModal.addChild(userText);

    // Fetch top scores
    const list = saveManager.getLeaderboard();

    if (list.length === 0) {
      const emptyText = new Text({
        text: "Chưa có thành tích nào.\nHãy chơi game để thiết lập kỷ lục nhé! 🚀",
        style: {
          fontFamily: "Arial",
          fontSize: 18,
          fill: "#aaaaaa",
          align: "center",
          lineHeight: 28,
        },
      });
      emptyText.anchor.set(0.5);
      emptyText.y = -10;
      this.leaderboardModal.addChild(emptyText);
    } else {
      // Draw list items
      const startY = -80;
      const rowHeight = 42;

      list.forEach((entry, idx) => {
        const rowY = startY + idx * rowHeight;
        const rankIcons = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
        const rankIcon = rankIcons[idx] || "";

        // Rank and Score
        const scoreText = new Text({
          text: `${rankIcon}  HẠNG ${idx + 1}:   ${entry.score}`,
          style: {
            fontFamily: "Arial",
            fontSize: 20,
            fontWeight: "bold",
            fill:
              idx === 0
                ? "#ffdd57"
                : idx === 1
                  ? "#e0e0e0"
                  : idx === 2
                    ? "#cd7f32"
                    : "#ffffff",
          },
        });
        scoreText.anchor.set(0, 0.5);
        scoreText.x = -190;
        scoreText.y = rowY;
        this.leaderboardModal.addChild(scoreText);

        // Date stamp
        const dateText = new Text({
          text: entry.date,
          style: {
            fontFamily: "Arial",
            fontSize: 14,
            fill: "#8892b0",
          },
        });
        dateText.anchor.set(1, 0.5);
        dateText.x = 190;
        dateText.y = rowY;
        this.leaderboardModal.addChild(dateText);

        // Divider line (except for last row)
        if (idx < list.length - 1) {
          const divider = new Graphics();
          divider.moveTo(-190, rowY + rowHeight / 2);
          divider.lineTo(190, rowY + rowHeight / 2);
          divider.stroke({ color: 0x324b8b, width: 1, alpha: 0.3 });
          this.leaderboardModal.addChild(divider);
        }
      });
    }

    // CLOSE Button
    const closeBtn = new Container();
    closeBtn.x = 0;
    closeBtn.y = 145;
    this.leaderboardModal.addChild(closeBtn);

    const btnBg = new Graphics();
    btnBg.circle(0, 0, 20);
    btnBg.fill({ color: 0x324b8b });
    btnBg.alpha = 0.9;
    btnBg.eventMode = "static";
    btnBg.cursor = "pointer";
    closeBtn.addChild(btnBg);

    const btnText = new Text({
      text: "❌",
      style: {
        fontFamily: "Arial",
        fontSize: 16,
        fontWeight: "bold",
        fill: "#ffffff",
      },
    });
    btnText.anchor.set(0.5);
    closeBtn.addChild(btnText);

    const closePopup = () => {
      gsap.to(this.leaderboardModal.scale, { x: 0.7, y: 0.7, duration: 0.25 });
      gsap.to(popup, {
        alpha: 0,
        duration: 0.25,
        onComplete: () => {
          popup.destroy({ children: true });
          this.leaderboardPopup = null;
          this.leaderboardOverlay = null;
          this.leaderboardModal = null;
        },
      });
    };

    btnBg.on("pointerover", () => {
      gsap.to(closeBtn.scale, { x: 1.1, y: 1.1, duration: 0.15 });
      btnBg.alpha = 1.0;
      soundManager.playClick();
    });
    btnBg.on("pointerout", () => {
      gsap.to(closeBtn.scale, { x: 1, y: 1, duration: 0.15 });
      btnBg.alpha = 0.9;
    });
    btnBg.on("pointerdown", () => {
      soundManager.playClick();
      closePopup();
    });

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

  destroy() {
    // Stop ticker function on destroy to avoid memory leak
    if (this.tickerFn && App.app && App.app.ticker) {
      App.app.ticker.remove(this.tickerFn);
    }

    const killTweensRecursive = (obj) => {
      gsap.killTweensOf(obj);
      if (obj.scale) gsap.killTweensOf(obj.scale);
      if (obj.children) {
        obj.children.forEach(killTweensRecursive);
      }
    };
    killTweensRecursive(this.container);

    this.particles.forEach((p) => {
      gsap.killTweensOf(p);
    });

    this.container.destroy({ children: true });
  }

  initDOMOverlays() {
    // 1. Fullscreen Button
    const fsBtn = document.getElementById("fullscreen-btn");
    if (fsBtn) {
      fsBtn.onclick = () => {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen().catch((err) => {
            console.error("Error attempting to enable fullscreen:", err);
          });
        } else {
          document.exitFullscreen();
        }
      };
    }

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
    const avatarImg = document.getElementById("user-avatar");
    const nameSpan = document.getElementById("user-name");

    if (currentUser) {
      if (profileWidget) profileWidget.style.display = "flex";
      if (avatarImg) avatarImg.src = currentUser.avatar;
      if (nameSpan) nameSpan.textContent = currentUser.name;

      if (this.googleLoginBtn) {
        this.googleLoginBtn.visible = false;
      }
    } else {
      if (profileWidget) profileWidget.style.display = "none";

      if (this.googleLoginBtn) {
        this.googleLoginBtn.visible = true;
      }
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

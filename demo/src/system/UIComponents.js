import { Container, Graphics, Text, TextStyle, FillGradient } from "pixi.js";
import gsap from "gsap";
import { soundManager } from "./SoundManager.js";

// Vibrant Cartoon 3D Bubble UI Color Palettes
export const palettes = {
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

/**
 * Maps emojis or text keys to internal icon string identifiers.
 */
export function mapEmojiToIconType(emojiChar) {
  const str = String(emojiChar).trim();
  if (str.includes("🏠") || str.includes("🏡") || str === "home") return "home";
  if (str.includes("⚙️") || str === "settings") return "settings";
  if (str.includes("✕") || str === "x" || str === "close") return "close";
  if (str.includes("🔄") || str === "replay") return "replay";
  if (str.includes("▶️") || str === "play") return "play";
  if (str.includes("🏆") || str === "trophy") return "trophy";
  if (str.includes("↩️") || str === "back") return "back";
  if (str.includes("👤") || str === "profile") return "profile";
  if (str.includes("🔊") || str === "sound_on") return "sound_on";
  if (str.includes("🔇") || str === "sound_off") return "sound_off";
  if (str.includes("🎵") || str === "music") return "music";
  if (str.includes("🛒") || str === "shop" || str === "gift") return "shop";
  if (str.includes("❓") || str === "help" || str === "info") return "help";
  if (str.includes("📺") || str === "video") return "video";
  if (str.includes("🥇") || str === "gold") return "gold";
  if (str.includes("🥈") || str === "silver") return "silver";
  if (str.includes("🥉") || str === "bronze") return "bronze";
  if (str.includes("⏱️") || str === "timer") return "timer";
  return null;
}

/**
 * Draws cartoon vector icons using Graphics paths.
 */
export function drawVectorIcon(g, type, size) {
  g.clear();
  const t = mapEmojiToIconType(type) || type;
  g.lastType = t; // cache for resize calls

  const r = size / 2;
  const strokeWidth = 3;

  switch (t) {
    case "home": {
      // Outer house wall & roof path
      g.moveTo(-r * 0.95, r * 0.1);
      g.lineTo(0, -r * 0.9);
      g.lineTo(r * 0.95, r * 0.1);
      g.lineTo(r * 0.7, r * 0.1);
      g.lineTo(r * 0.7, r * 0.9);
      g.lineTo(-r * 0.7, r * 0.9);
      g.lineTo(-r * 0.7, r * 0.1);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.stroke({
        color: 0x000000,
        width: strokeWidth,
        join: "round",
        cap: "round",
      });

      // Door cutout drawn as solid black to merge with outlines
      g.roundRect(-r * 0.22, r * 0.45, r * 0.44, r * 0.45, 2)
        .fill({ color: 0x000000 })
        .stroke({ color: 0x000000, width: strokeWidth, join: "round" });
      break;
    }
    case "settings": {
      // Outer gear teeth
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        g.save();
        g.rotateTransform(angle);
        g.roundRect(-r * 0.2, -r * 0.95, r * 0.4, r * 0.4, 3);
        g.restore();
      }
      g.circle(0, 0, r * 0.7);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });

      // Center hole drawn as solid black
      g.circle(0, 0, r * 0.24)
        .fill({ color: 0x000000 })
        .stroke({ color: 0x000000, width: strokeWidth });
      break;
    }
    case "close": {
      g.save();
      g.rotateTransform(Math.PI / 4);
      g.roundRect(-r * 0.22, -r * 0.95, r * 0.44, r * 1.9, 4);
      g.roundRect(-r * 0.95, -r * 0.22, r * 1.9, r * 0.44, 4);
      g.restore();
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });
      break;
    }
    case "replay": {
      g.arc(0, 0, r * 0.65, -Math.PI * 0.4, Math.PI * 1.3, false);
      g.stroke({ color: 0x000000, width: r * 0.32 + 6, cap: "round" });
      g.beginPath();
      g.arc(0, 0, r * 0.65, -Math.PI * 0.4, Math.PI * 1.3, false);
      g.stroke({ color: 0xffffff, width: r * 0.32, cap: "round" });

      g.save();
      g.translateTransform(
        r * 0.65 * Math.cos(-Math.PI * 0.4),
        r * 0.65 * Math.sin(-Math.PI * 0.4),
      );
      g.rotateTransform(-Math.PI * 0.12);
      g.poly([-r * 0.35, -r * 0.35, r * 0.35, 0, -r * 0.35, r * 0.35]);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });
      g.restore();
      break;
    }
    case "play": {
      g.poly([-r * 0.5, -r * 0.8, r * 0.8, 0, -r * 0.5, r * 0.8]);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });
      break;
    }
    case "trophy": {
      const goldGrad = new FillGradient({
        start: { x: 0, y: -r * 0.8 },
        end: { x: 0, y: r * 0.85 },
        colorStops: [
          { offset: 0, color: 0xffea00 },
          { offset: 1, color: 0xd4af37 },
        ],
      });

      // Left handle (drawn as a thick C-curve with gold center and burgundy borders)
      g.moveTo(-r * 0.3, -r * 0.65);
      g.quadraticCurveTo(-r * 0.85, -r * 0.65, -r * 0.85, -r * 0.3);
      g.quadraticCurveTo(-r * 0.85, r * 0.05, -r * 0.3, r * 0.05);
      g.stroke({ color: 0x360207, width: strokeWidth + 4, cap: "round" });
      g.moveTo(-r * 0.3, -r * 0.65);
      g.quadraticCurveTo(-r * 0.85, -r * 0.65, -r * 0.85, -r * 0.3);
      g.quadraticCurveTo(-r * 0.85, r * 0.05, -r * 0.3, r * 0.05);
      g.stroke({ color: 0xffea00, width: strokeWidth, cap: "round" });

      // Right handle (drawn as a thick C-curve with gold center and burgundy borders)
      g.moveTo(r * 0.3, -r * 0.65);
      g.quadraticCurveTo(r * 0.85, -r * 0.65, r * 0.85, -r * 0.3);
      g.quadraticCurveTo(r * 0.85, r * 0.05, r * 0.3, r * 0.05);
      g.stroke({ color: 0x360207, width: strokeWidth + 4, cap: "round" });
      g.moveTo(r * 0.3, -r * 0.65);
      g.quadraticCurveTo(r * 0.85, -r * 0.65, r * 0.85, -r * 0.3);
      g.quadraticCurveTo(r * 0.85, r * 0.05, r * 0.3, r * 0.05);
      g.stroke({ color: 0xffea00, width: strokeWidth, cap: "round" });

      // Bowl, Stem, Base
      g.moveTo(-r * 0.6, -r * 0.8);
      g.lineTo(r * 0.6, -r * 0.8);
      g.quadraticCurveTo(r * 0.6, 0, 0, r * 0.25);
      g.quadraticCurveTo(-r * 0.6, 0, -r * 0.6, -r * 0.8);
      g.closePath();
      g.roundRect(-r * 0.15, r * 0.2, r * 0.3, r * 0.4, 2);
      g.roundRect(-r * 0.55, r * 0.55, r * 1.1, r * 0.3, 4);
      g.fill({ fill: goldGrad });
      g.stroke({ color: 0x360207, width: strokeWidth, join: "round" });
      break;
    }
    case "back": {
      g.poly([
        -r * 0.9,
        0,
        0,
        -r * 0.8,
        0,
        -r * 0.3,
        r * 0.9,
        -r * 0.3,
        r * 0.9,
        r * 0.3,
        0,
        r * 0.3,
        0,
        r * 0.8,
      ]);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });
      break;
    }
    case "profile": {
      g.circle(0, -r * 0.3, r * 0.42);
      g.ellipse(0, r * 0.6, r * 0.85, r * 0.4);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });
      break;
    }
    case "sound_on": {
      g.beginPath();
      g.moveTo(-r * 0.7, -r * 0.3);
      g.lineTo(-r * 0.4, -r * 0.3);
      g.lineTo(-r * 0.05, -r * 0.65);
      g.lineTo(-r * 0.05, r * 0.65);
      g.lineTo(-r * 0.4, r * 0.3);
      g.lineTo(-r * 0.7, r * 0.3);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });

      // Wave 1 (small)
      g.beginPath();
      g.arc(r * 0.1, 0, r * 0.35, -Math.PI * 0.3, Math.PI * 0.3);
      g.stroke({ color: 0x000000, width: strokeWidth + 4.5, cap: "round" });

      g.beginPath();
      g.arc(r * 0.1, 0, r * 0.35, -Math.PI * 0.3, Math.PI * 0.3);
      g.stroke({ color: 0xffffff, width: strokeWidth, cap: "round" });

      // Wave 2 (large)
      g.beginPath();
      g.arc(r * 0.1, 0, r * 0.7, -Math.PI * 0.3, Math.PI * 0.3);
      g.stroke({ color: 0x000000, width: strokeWidth + 4.5, cap: "round" });

      g.beginPath();
      g.arc(r * 0.1, 0, r * 0.7, -Math.PI * 0.3, Math.PI * 0.3);
      g.stroke({ color: 0xffffff, width: strokeWidth, cap: "round" });
      break;
    }
    case "sound_off": {
      g.beginPath();
      g.moveTo(-r * 0.7, -r * 0.3);
      g.lineTo(-r * 0.4, -r * 0.3);
      g.lineTo(-r * 0.05, -r * 0.65);
      g.lineTo(-r * 0.05, r * 0.65);
      g.lineTo(-r * 0.4, r * 0.3);
      g.lineTo(-r * 0.7, r * 0.3);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });

      // Mute cross
      g.beginPath();
      g.moveTo(r * 0.2, -r * 0.3);
      g.lineTo(r * 0.8, r * 0.3);
      g.moveTo(r * 0.8, -r * 0.3);
      g.lineTo(r * 0.2, r * 0.3);
      g.stroke({ color: 0x000000, width: strokeWidth + 3, cap: "round" });

      g.beginPath();
      g.moveTo(r * 0.2, -r * 0.3);
      g.lineTo(r * 0.8, r * 0.3);
      g.moveTo(r * 0.8, -r * 0.3);
      g.lineTo(r * 0.2, r * 0.3);
      g.stroke({ color: 0xffffff, width: strokeWidth, cap: "round" });
      break;
    }
    case "music": {
      // Left note head
      g.beginPath();
      g.ellipse(-r * 0.3, r * 0.3, r * 0.25, r * 0.18, Math.PI / 6);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth });

      // Right note head
      g.beginPath();
      g.ellipse(r * 0.3, r * 0.15, r * 0.25, r * 0.18, Math.PI / 6);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth });

      // Left stem
      g.beginPath();
      g.rect(-r * 0.12, -r * 0.45, r * 0.08, r * 0.75);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });

      // Right stem
      g.beginPath();
      g.rect(r * 0.48, -r * 0.6, r * 0.08, r * 0.75);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });

      // Beam connecting them
      g.beginPath();
      g.moveTo(-r * 0.12, -r * 0.45);
      g.lineTo(r * 0.56, -r * 0.6);
      g.lineTo(r * 0.56, -r * 0.4);
      g.lineTo(-r * 0.12, -r * 0.25);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });
      break;
    }
    case "shop": {
      g.beginPath();
      g.moveTo(-r * 0.8, -r * 0.4);
      g.lineTo(-r * 0.55, -r * 0.4);
      g.lineTo(-r * 0.32, r * 0.3);
      g.lineTo(r * 0.5, r * 0.3);
      g.lineTo(r * 0.75, -r * 0.3);
      g.lineTo(-r * 0.4, -r * 0.3);
      g.closePath();
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });

      g.beginPath();
      g.circle(-r * 0.22, r * 0.52, r * 0.16);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth });

      g.beginPath();
      g.circle(r * 0.4, r * 0.52, r * 0.16);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth });
      break;
    }
    case "help": {
      g.beginPath();
      g.arc(0, -r * 0.28, r * 0.4, Math.PI * 0.75, Math.PI * 2.25);
      g.bezierCurveTo(r * 0.4, r * 0.05, 0, r * 0.05, 0, r * 0.3);
      g.stroke({
        color: 0x000000,
        width: r * 0.28 + 6,
        cap: "round",
        join: "round",
      });

      g.beginPath();
      g.arc(0, -r * 0.28, r * 0.4, Math.PI * 0.75, Math.PI * 2.25);
      g.bezierCurveTo(r * 0.4, r * 0.05, 0, r * 0.05, 0, r * 0.3);
      g.stroke({
        color: 0xffffff,
        width: r * 0.28,
        cap: "round",
        join: "round",
      });

      g.beginPath();
      g.circle(0, r * 0.65, r * 0.15);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth });
      break;
    }
    case "video": {
      g.beginPath();
      g.roundRect(-r * 0.75, -r * 0.55, r * 1.5, r * 1.1, 4);
      g.fill({ color: 0xff4d4d });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });

      g.beginPath();
      g.roundRect(-r * 0.55, -r * 0.4, r * 0.9, r * 0.8, 2);
      g.fill({ color: 0x33ccff });
      g.stroke({ color: 0x000000, width: 2, join: "round" });

      g.beginPath();
      g.moveTo(-r * 0.2, -r * 0.55).lineTo(-r * 0.5, -r * 0.9);
      g.moveTo(r * 0.2, -r * 0.55).lineTo(r * 0.5, -r * 0.9);
      g.stroke({ color: 0x000000, width: 3, join: "round" });
      break;
    }
    case "gold":
    case "silver":
    case "bronze": {
      const col =
        t === "gold" ? 0xffea00 : t === "silver" ? 0xd4f0ff : 0xe8c4ff;
      g.beginPath();
      g.circle(0, 0, r * 0.8);
      g.fill({ color: col });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });
      break;
    }
    case "timer": {
      g.beginPath();
      g.circle(0, r * 0.1, r * 0.78);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });

      g.beginPath();
      g.roundRect(-r * 0.18, -r * 0.85, r * 0.36, r * 0.25, 2);
      g.fill({ color: 0xaaaaaa });
      g.stroke({ color: 0x000000, width: 2.2, join: "round" });
      break;
    }
    case "trash":
    case "🗑️": {
      g.beginPath();
      g.roundRect(-r * 0.4, -r * 0.3, r * 0.8, r * 1.0, 4);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });

      g.beginPath();
      g.roundRect(-r * 0.55, -r * 0.5, r * 1.1, r * 0.2, 2);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });

      g.beginPath();
      g.roundRect(-r * 0.18, -r * 0.7, r * 0.36, r * 0.2, 2);
      g.fill({ color: 0xffffff });
      g.stroke({ color: 0x000000, width: strokeWidth, join: "round" });
      break;
    }
    default: {
      const text = new Text({
        text: type,
        style: new TextStyle({
          fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
          fontSize: size * 0.95,
          fill: 0xffffff,
          align: "center",
        }),
      });
      text.anchor.set(0.5);
      g.addChild(text);
      break;
    }
  }
}

/**
 * Creates a Container with the centered vector icon graphic inside it.
 */
export function createVectorIcon(type, size = 28) {
  const container = new Container();
  const g = new Graphics();
  container.addChild(g);
  drawVectorIcon(g, type, size);

  const t = mapEmojiToIconType(type) || type;
  if (
    t === "gold" ||
    t === "silver" ||
    t === "bronze" ||
    type === "🥇" ||
    type === "🥈" ||
    type === "🥉"
  ) {
    const val =
      t === "gold" || type === "🥇"
        ? "1"
        : t === "silver" || type === "🥈"
          ? "2"
          : "3";
    const text = new Text({
      text: val,
      style: {
        fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
        fontSize: size * 0.5,
        fill: 0xffffff,
      },
    });
    text.anchor.set(0.5);
    container.addChild(text);
  }
  return container;
}

/**
 * Programmatic 3D Circular Bubble Button.
 */
export class Colorful3DCircleButton extends Container {
  constructor(options = {}) {
    super();
    const {
      radius = 26,
      iconType = "✕",
      colorStyle = "blue",
      onClick = null,
    } = options;

    this.radius = radius;
    this.colorStyle = colorStyle;
    this.onClick = onClick;

    const color = palettes[colorStyle] || palettes.blue;
    const shadowOffset = 5;

    // 1. Base Shadow Graphics
    this.shadow = new Graphics()
      .circle(0, shadowOffset, radius)
      .fill({ color: color.shadow });
    this.addChild(this.shadow);

    // 2. Button Face Container (for pressing motion)
    this.face = new Container();
    this.addChild(this.face);

    // 3. Face Background with gradient
    this.faceBg = new Graphics();
    const faceGradient = new FillGradient({
      start: { x: 0, y: -radius },
      end: { x: 0, y: radius },
      colorStops: [
        { offset: 0, color: color.top },
        { offset: 1, color: color.bottom },
      ],
    });
    this.faceBg
      .circle(0, 0, radius)
      .fill({ fill: faceGradient })
      .stroke({ color: color.stroke, width: 2.5 });
    this.face.addChild(this.faceBg);

    // 4. White Sheen Highlight
    this.sheen = new Graphics()
      .ellipse(0, -radius * 0.4, radius * 0.72, radius * 0.35)
      .fill({ color: 0xffffff, alpha: 0.28 });
    this.face.addChild(this.sheen);

    // 5. Vector Icon in center (radius * 1.3 to ensure it is large and visible)
    this.iconGraphics = new Graphics();
    this.face.addChild(this.iconGraphics);
    drawVectorIcon(this.iconGraphics, iconType, radius * 1.3);

    // Interactivity
    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerover", () => {
      gsap.to(this.scale, { x: 1.08, y: 1.08, duration: 0.12 });
      // soundManager.playClick();
    });

    this.on("pointerout", () => {
      gsap.to(this.scale, { x: 1.0, y: 1.0, duration: 0.12 });
      gsap.to(this.face, { y: 0, duration: 0.1 });
    });

    this.on("pointerdown", () => {
      gsap.to(this.face, { y: shadowOffset - 2, duration: 0.05 });
    });

    this.on("pointerup", () => {
      gsap.to(this.face, { y: 0, duration: 0.1 });
      if (this.onClick) this.onClick();
    });

    this.on("pointerupoutside", () => {
      gsap.to(this.face, { y: 0, duration: 0.1 });
    });
  }

  updateStyle(r) {
    this.radius = r;
    const color = palettes[this.colorStyle] || palettes.blue;
    const shadowOffset = Math.max(3, r * 0.18);

    this.shadow
      .clear()
      .circle(0, shadowOffset, r)
      .fill({ color: color.shadow });

    const faceGradient = new FillGradient({
      start: { x: 0, y: -r },
      end: { x: 0, y: r },
      colorStops: [
        { offset: 0, color: color.top },
        { offset: 1, color: color.bottom },
      ],
    });
    this.faceBg
      .clear()
      .circle(0, 0, r)
      .fill({ fill: faceGradient })
      .stroke({ color: color.stroke, width: 2.5 });

    this.sheen
      .clear()
      .ellipse(0, -r * 0.4, r * 0.72, r * 0.35)
      .fill({ color: 0xffffff, alpha: 0.28 });

    drawVectorIcon(
      this.iconGraphics,
      this.iconGraphics.lastType || "help",
      r * 1.3,
    );
  }
}

/**
 * Programmatic 3D Capsule Button.
 */
export class Colorful3DButton extends Container {
  constructor(options = {}) {
    super();
    const {
      width = 180,
      height = 50,
      radius = height / 2,
      text = "",
      colorStyle = "yellow",
      fontSize = 20,
      onClick = null,
    } = options;

    this.colorStyle = colorStyle;
    this.onClick = onClick;

    const color = palettes[colorStyle] || palettes.yellow;
    const shadowOffset = 6;

    // 1. Base Shadow
    this.shadow = new Graphics()
      .roundRect(-width / 2, -height / 2 + shadowOffset, width, height, radius)
      .fill({ color: color.shadow });
    this.addChild(this.shadow);

    // 2. Face Container
    this.face = new Container();
    this.addChild(this.face);

    // 3. Face Background
    this.faceBg = new Graphics();
    const faceGradient = new FillGradient({
      start: { x: 0, y: -height / 2 },
      end: { x: 0, y: height / 2 },
      colorStops: [
        { offset: 0, color: color.top },
        { offset: 1, color: color.bottom },
      ],
    });
    this.faceBg
      .roundRect(-width / 2, -height / 2, width, height, radius)
      .fill({ fill: faceGradient })
      .stroke({ color: color.stroke, width: 2.5 });
    this.face.addChild(this.faceBg);

    // 4. Sheen
    this.sheen = new Graphics()
      .ellipse(0, -height / 4, width * 0.42, height * 0.2)
      .fill({ color: 0xffffff, alpha: 0.28 });
    this.face.addChild(this.sheen);

    // 5. Label text
    if (text) {
      this.label = new Text({
        text: text.toUpperCase(),
        style: new TextStyle({
          fontFamily: '"Outfit", "Nunito", "Arial", sans-serif',
          fontSize: fontSize,
          fill: 0xffffff,
          align: "center",
        }),
      });
      this.label.anchor.set(0.5);
      this.face.addChild(this.label);
    }

    // Interactivity
    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerover", () => {
      gsap.to(this.scale, { x: 1.05, y: 1.05, duration: 0.12 });
      // soundManager.playClick();
    });

    this.on("pointerout", () => {
      gsap.to(this.scale, { x: 1.0, y: 1.0, duration: 0.12 });
      gsap.to(this.face, { y: 0, duration: 0.1 });
    });

    this.on("pointerdown", () => {
      gsap.to(this.face, { y: shadowOffset - 2, duration: 0.05 });
    });

    this.on("pointerup", () => {
      gsap.to(this.face, { y: 0, duration: 0.1 });
      if (this.onClick) this.onClick();
    });

    this.on("pointerupoutside", () => {
      gsap.to(this.face, { y: 0, duration: 0.1 });
    });
  }
}

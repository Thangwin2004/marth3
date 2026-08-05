import { Container, Graphics, Text, TextStyle, FillGradient } from "pixi.js";
import gsap from "gsap";
import { soundManager } from "./SoundManager.js";

const ICONS = {
    'home': `<svg viewBox="0 0 24 24" width="40" height="40"><path fill="#ffffff" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
    'settings': `<svg viewBox="0 0 24 24" width="40" height="40"><path fill="#ffffff" d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.06-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.73,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.06,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.43-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.49-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>`,
    'trophy': `<svg viewBox="0 0 24 24" width="40" height="40"><path fill="#ffffff" d="M19,5h-2V3H7v2H5C3.9,5,3,5.9,3,7v1c0,2.55,1.92,4.63,4.39,4.94c0.63,1.5,1.98,2.63,3.61,2.96V19H7v2h10v-2h-4v-3.1 c1.63-0.33,2.98-1.46,3.61-2.96C19.08,12.63,21,10.55,21,8V7C21,5.9,20.1,5,19,5z M5,8V7h2v3.82C5.84,10.4,5,9.3,5,8z M19,8 c0,1.3-0.84,2.4-2,2.82V7h2V8z"/></svg>`,
    'replay': `<svg viewBox="0 0 24 24" width="40" height="40"><path fill="#ffffff" d="M17.65,6.35C16.2,4.9,14.21,4,12,4c-4.42,0-7.99,3.58-7.99,8s3.57,8,7.99,8c3.73,0,6.84-2.55,7.73-6h-2.08 c-0.82,2.33-3.04,4-5.65,4c-3.31,0-6-2.69-6-6s2.69-6,6-6c1.66,0,3.14,0.69,4.22,1.78L13,11h7V4L17.65,6.35z"/></svg>`,
    'close': `<svg viewBox="0 0 24 24" width="40" height="40"><path fill="#ffffff" d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41z"/></svg>`
};

// Vibrant Cartoon 3D Bubble UI Color Palettes
export const palettes = {
  green: { top: 0x88D399, bottom: 0x5CB475, shadow: 0x4A965E, stroke: 0xFFFFFF },
  blue: { top: 0x66C2FF, bottom: 0x2DA9FF, shadow: 0x1B89D4, stroke: 0xFFFFFF },
  red: { top: 0xFF8A8A, bottom: 0xEF5350, shadow: 0xC62828, stroke: 0xFFFFFF },
  grey: { top: 0xE0E0E0, bottom: 0xBDBDBD, shadow: 0x9E9E9E, stroke: 0xFFFFFF },
  orange: { top: 0xFFB347, bottom: 0xFF7B00, shadow: 0xC45600, stroke: 0xFFFFFF },
  purple: { top: 0x88D399, bottom: 0x5CB475, shadow: 0x4A965E, stroke: 0xFFFFFF }
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
    this.iconGraphics.lastType = iconType;

    const t = mapEmojiToIconType(iconType) || iconType;
    if (ICONS[t]) {
      this.iconGraphics.svg(ICONS[t]);
      this.iconGraphics.pivot.set(12, 12);
      this.iconGraphics.scale.set((radius * 1.3) / 24);
      this.iconGraphics.y = 0;
    } else {
      drawVectorIcon(this.iconGraphics, iconType, radius * 1.3);
    }

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

    this.iconGraphics.clear();
    const tType = mapEmojiToIconType(this.iconGraphics.lastType) || this.iconGraphics.lastType;
    if (ICONS[tType]) {
      this.iconGraphics.svg(ICONS[tType]);
      this.iconGraphics.pivot.set(12, 12);
      this.iconGraphics.scale.set((r * 1.3) / 24);
      this.iconGraphics.y = 0;
    } else {
      drawVectorIcon(
        this.iconGraphics,
        this.iconGraphics.lastType || "help",
        r * 1.3,
      );
    }
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

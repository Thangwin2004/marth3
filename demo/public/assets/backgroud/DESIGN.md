---
name: Verdant Strike
colors:
  surface: '#001802'
  surface-dim: '#001802'
  surface-bright: '#243f22'
  surface-container-lowest: '#001201'
  surface-container-low: '#062107'
  surface-container: '#0a250b'
  surface-container-high: '#153014'
  surface-container-highest: '#203b1e'
  on-surface: '#caecc2'
  on-surface-variant: '#becab9'
  inverse-surface: '#caecc2'
  inverse-on-surface: '#1b361a'
  outline: '#899484'
  outline-variant: '#3f4a3c'
  surface-tint: '#78dc77'
  primary: '#78dc77'
  on-primary: '#00390a'
  primary-container: '#4caf50'
  on-primary-container: '#003c0b'
  inverse-primary: '#006e1c'
  secondary: '#ffb3ae'
  on-secondary: '#68000c'
  secondary-container: '#a00118'
  on-secondary-container: '#ffa8a3'
  tertiary: '#c6c6c7'
  on-tertiary: '#2f3131'
  tertiary-container: '#9a9b9b'
  on-tertiary-container: '#313333'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#94f990'
  primary-fixed-dim: '#78dc77'
  on-primary-fixed: '#002204'
  on-primary-fixed-variant: '#005313'
  secondary-fixed: '#ffdad7'
  secondary-fixed-dim: '#ffb3ae'
  on-secondary-fixed: '#410004'
  on-secondary-fixed-variant: '#930015'
  tertiary-fixed: '#e2e2e2'
  tertiary-fixed-dim: '#c6c6c7'
  on-tertiary-fixed: '#1a1c1c'
  on-tertiary-fixed-variant: '#454747'
  background: '#001802'
  on-background: '#caecc2'
  surface-variant: '#203b1e'
typography:
  stat-value-lg:
    fontFamily: Archivo Narrow
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  stat-value-sm:
    fontFamily: Archivo Narrow
    fontSize: 18px
    fontWeight: '700'
    lineHeight: 18px
  character-name:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '800'
    lineHeight: 20px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 12px
    letterSpacing: 0.05em
  stat-value-mobile:
    fontFamily: Archivo Narrow
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 24px
spacing:
  unit: 4px
  gutter: 12px
  margin-edge: 16px
  panel-padding: 12px
  stack-gap: 8px
---

## Brand & Style

The design system is engineered for a high-stakes, mobile RPG environment set within a lush, yet dangerous wilderness. The brand personality is **Tactical, Urgent, and Precise**, designed to keep players focused on rapid decision-making during battle sequences.

The visual style is **High-Contrast Minimalism**. It eschews complex textures and skeuomorphism in favor of sharp geometric shapes and flat color planes. This ensures that critical game data—health, mana, and turn orders—remains legible against the dark, atmospheric background of the "Grassland" environment. The aesthetic draws from modern vector illustration, prioritizing silhouette and clarity to create a "battle-ready" interface that feels both contemporary and authoritative.

## Colors

The palette is optimized for a dark-mode mobile experience to reduce eye strain during long play sessions while making interactive elements "pop."

- **Neutral (Base):** `#0f2a0f` serves as the deep forest floor. All UI panels and backgrounds utilize this shade to provide a low-luminance foundation.
- **Primary (Action/Nature):** `#4caf50` is used for positive states, skill activations, and nature-themed UI accents.
- **Secondary (Warning/Vitality):** `#ff5252` is reserved strictly for HP bars, enemy intents, and critical alerts. Its high vibration against the dark green base signals immediate danger.
- **Surface/Text:** `#ffffff` provides maximum contrast for statistical data and labels.

## Typography

This design system utilizes a tiered typographic approach to separate narrative text from mechanical data.

- **Headlines & Stats:** `Archivo Narrow` is selected for its condensed, vertical presence, allowing large numbers to fit within tight horizontal spaces like HP bars and damage pop-ups.
- **General UI:** `Inter` provides a neutral, highly legible sans-serif for character names and descriptions, ensuring clarity at small sizes.
- **Technical Data:** `JetBrains Mono` is used for small labels and "system" info (e.g., turn counters, cooldown timers) to evoke a sense of precision and mechanical accuracy.

## Layout & Spacing

The layout follows a **Fixed Grid** model tailored for one-handed mobile play. The interface is divided into three primary zones:

1.  **Combat Stage (Top 40%):** A free-form area for character illustrations and battle effects.
2.  **Status Hub (Middle 20%):** A structured grid containing HP/MP bars and buff icons.
3.  **Command Center (Bottom 40%):** A 4-column grid for action buttons or a tactical puzzle board.

The spacing rhythm is built on a 4px base unit. Tight 8px gaps between related elements (like a character name and their HP bar) create clear visual groupings, while a 16px margin ensures interactive elements remain within the "thumb-safe" zone.

## Elevation & Depth

To maintain the flat, geometric aesthetic, depth is communicated through **Tonal Layers** and **Low-Contrast Outlines** rather than shadows.

- **Level 0 (Background):** The base `#0f2a0f` color.
- **Level 1 (Panels):** A slightly lighter tint of the base green with a 1px solid white border at 10% opacity.
- **Level 2 (Interactive):** Buttons and active cards use solid fills of the Primary or Secondary colors.
- **Level 3 (Pop-ups):** Full opacity `#ffffff` text or icons that sit on the highest "z-index" to grab attention.

No blurs or gradients are used. Depth is purely structural.

## Shapes

The shape language is strictly **Sharp (0px roundedness)**. 

Every UI element—from progress bars to action buttons and the battle grid—utilizes 90-degree angles. This geometric rigidity reinforces the "High-Contrast / Battle-Ready" theme, giving the interface an aggressive, intentional, and digital feel. Diagonal cuts (45-degree chamfers) may be used on the corners of larger panels to add tactical flair without sacrificing the sharp-edged philosophy.

## Components

- **Progress Bars (HP/Energy):** Flat rectangular containers. Background is a dark transparency of the bar color. Fill is a 100% solid block of `#ff5252` (HP) or `#4caf50` (Energy). No gradients or gloss.
- **Action Buttons:** Large, square tiles with a 2px solid white internal border. When active/tapped, the background fills with the Primary color and the icon/text flips to the Neutral background color.
- **Tactical Grid:** A series of interconnected squares with 2px gaps. Each cell uses a subtle `#ffffff10` border to define the play area against the dark background.
- **Status Chips:** Small rectangular tags with `label-caps` typography. Used for displaying elemental types (e.g., "GRASS", "FIRE") or active debuffs.
- **Damage Numbers:** High-visibility `stat-value-lg` text that appears briefly on the Combat Stage, using a slight 2px offset "drop-block" (a solid color offset instead of a soft shadow) to separate it from the background.
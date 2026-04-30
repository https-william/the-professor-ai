---
name: The Professor
description: A wizard's study at 3 AM. Midnight Scholar design system.
colors:
  primary: "#F59E0B"
  secondary: "#6366F1"
  neutral-bg: "#08080E"
  neutral-fg: "#F5F0E8"
  card-bg: "#12121F"
typography:
  display:
    fontFamily: "Galaxie Copernicus, Georgia, serif"
    fontSize: "clamp(2.5rem, 8vw, 5.5rem)"
    fontWeight: 500
  headline:
    fontFamily: "Outfit, Inter, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3.5rem)"
    fontWeight: 700
  body:
    fontFamily: "Tiempos Text, Georgia, serif"
    fontSize: "clamp(0.875rem, 1.2vw, 1.125rem)"
    lineHeight: 1.5
rounded:
  sm: "0.5rem"
  md: "0.75rem"
  lg: "1rem"
  xl: "1.25rem"
  "2xl": "1.5rem"
  "3xl": "2rem"
spacing:
  sm: "clamp(0.5rem, 1vw, 0.75rem)"
  md: "clamp(1rem, 2vw, 1.5rem)"
  lg: "clamp(1.5rem, 4vw, 3rem)"
  xl: "clamp(2rem, 6vw, 5rem)"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.xl}"
    padding: "0.75rem 1.5rem"
  card:
    backgroundColor: "{colors.card-bg}"
    rounded: "{rounded.2xl}"
    padding: "1.5rem"
---

# Design System: The Professor

## 1. Overview

**Creative North Star: "The Midnight Scholar's Sanctum"**

The Midnight Scholar's Sanctum is a design system optimized for deep focus and intellectual rigor. It creates a focused, warm atmosphere through a volcanic almost-black palette punctuated by amber gold accents. It rejects the flat, cold aesthetics of generic AI tools in favor of tactile, skeuomorphic "jelly" buttons and refined glass panels that provide a sense of substantial quality and scholarly prestige.

**Key Characteristics:**
- **Midnight Atmosphere**: Deep volcanic backgrounds that minimize eye strain during late-night study sessions.
- **Amber Warmth**: High-contrast gold accents that evoke the feeling of a desk lamp in a dim room.
- **Substantial Tactility**: Skeuomorphic depth and glassmorphism that make UI elements feel like physical objects.
- **Academic Precision**: A sophisticated pairing of serif and sans-serif typography.

## 2. Colors

The palette is characterized by deep, volcanic tones with warm, amber-gold highlights.

### Primary
- **Amber Gold** (#F59E0B): The core identity color. Used for primary actions, success states, and brand highlights. Its rarity is the point.

### Secondary
- **Electric Indigo** (#6366F1): Used for secondary accents, info states, and interactive elements that need to stand out from the amber-gold theme.

### Neutral
- **Volcanic Black** (#08080E): The primary background color. Deep, almost-black with a subtle blue tint.
- **Warm Cream** (#F5F0E8): The primary foreground text color. Softer and warmer than pure white to reduce glare.
- **Midnight Card** (#12121F): Used for card backgrounds and elevated surfaces.

**The Rarity Rule.** The primary Amber Gold accent is used on ≤10% of any given screen. It is a beacon of focus, not a floodlight.

## 3. Typography

**Display Font:** Galaxie Copernicus (Serif)
**Body Font:** Tiempos Text (Serif)
**UI/Heading Font:** Outfit (Sans-Serif)

**Character:** A prestigious pairing that balances the authority of classic academic serifs with the modern clarity of a geometric sans.

### Hierarchy
- **Display** (Medium, clamp(2.5rem, 8vw, 5.5rem), 1.1): Used for main marketing headers and hero sections.
- **Headline** (Bold, clamp(2rem, 5vw, 3.5rem), 1.2): Used for page titles and major sections.
- **Title** (Semi-bold, clamp(1.5rem, 3vw, 2.25rem), 1.3): Used for sub-sections and card headings.
- **Body** (Regular, clamp(0.875rem, 1.2vw, 1.125rem), 1.5): Used for all AI-generated content and long-form text. Cap at 65–75ch.
- **Label** (Semi-bold, 0.75rem, 0.05em): Used for badges, small UI labels, and metadata.

## 4. Elevation

The system uses a hybrid approach of tonal layering and physical 3D extrusion.

### Shadow Vocabulary
- **Scholar Glow** (0 8px 32px rgba(0, 0, 0, 0.5), 0 0 20px rgba(245, 158, 11, 0.08)): Used on hover for active cards to create an ambient, focused glow.
- **Jelly Depth** (0 10px 25px -8px rgba(245, 158, 11, 0.4)): Used for tactile 3D buttons.

**The State-Driven Depth Rule.** Surfaces are flat at rest. Depth and shadows appear as a response to interaction (hover, active) to guide the user's focus.

## 5. Components

### Buttons
- **Shape:** Generously rounded (1.25rem to 1.5rem radius).
- **Skeuomorphic (Default):** 3D extruded look with 2.5px to 4px border-bottom for tactile depth.
- **Jelly Primary:** High-chroma amber with an elastic spring-bounce animation on hover.
- **Glass Ghost:** Frosted background with blur(16px) for secondary actions.

### Cards
- **Corner Style:** Substantial rounding (1.5rem radius).
- **Background:** Deep volcanic (#12121F) with a subtle 1px border.
- **Hover Strategy:** Elevates with translateY(-2px) and a subtle amber glow.

### Navigation
- **Pill Nav**: Floating, centered pill-shaped navigation that morphs on scroll.
- **Frosted Dock**: Mobile bottom nav with blur(50px) and high-contrast active states.

## 6. Do's and Don'ts

### Do:
- **Do** use OKLCH for all new color declarations to maintain consistent chroma levels.
- **Do** tint every neutral toward the volcanic blue hue (chroma 0.005–0.01).
- **Do** cap body line length at 70ch to maintain academic readability.

### Don't:
- **Don't** use pure #000 or #FFF.
- **Don't** use side-stripe borders (border-left/right > 1px) as colored accents.
- **Don't** use generic AI-slop fonts like Inter or Roboto for content.
- **Don't** use purple gradients on white backgrounds.
- **Don't** use "hero-metric" templates (big number, small label).

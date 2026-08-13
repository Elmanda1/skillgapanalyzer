---
name: Industrial Archive
colors:
  surface: '#f9f9ff'
  surface-dim: '#cfdaf2'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d8e3fb'
  on-surface: '#111c2d'
  on-surface-variant: '#404944'
  inverse-surface: '#263143'
  inverse-on-surface: '#ecf1ff'
  outline: '#707974'
  outline-variant: '#bfc9c3'
  surface-tint: '#2b6954'
  primary: '#003527'
  on-primary: '#ffffff'
  primary-container: '#064e3b'
  on-primary-container: '#80bea6'
  inverse-primary: '#95d3ba'
  secondary: '#565e74'
  on-secondary: '#ffffff'
  secondary-container: '#dae2fd'
  on-secondary-container: '#5c647a'
  tertiary: '#2b2f30'
  on-tertiary: '#ffffff'
  tertiary-container: '#424547'
  on-tertiary-container: '#afb2b4'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0f0d6'
  primary-fixed-dim: '#95d3ba'
  on-primary-fixed: '#002117'
  on-primary-fixed-variant: '#0b513d'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#e0e3e5'
  tertiary-fixed-dim: '#c4c7c9'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f9f9ff'
  on-background: '#111c2d'
  surface-variant: '#d8e3fb'
typography:
  display-lg:
    fontFamily: Outfit
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Outfit
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Outfit
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  mono-data:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
spacing:
  base: 4px
  unit-1: 0.25rem
  unit-2: 0.5rem
  unit-4: 1rem
  unit-8: 2rem
  unit-12: 3rem
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 48px
---

## Brand & Style
The design system adopts a **Neo-Brutalist** aesthetic filtered through an academic and industrial lens. It rejects the ethereal gradients of modern tech in favor of structural honesty, high-contrast boundaries, and a "built to last" philosophy. The target audience is researchers, engineers, and institutional professionals who value reliability and information density over decorative trends.

The personality is authoritative and grounded. It utilizes heavy strokes, geometric clarity, and a strict adherence to a modular grid. Every element feels intentional and physically constrained, evoking the sensation of architectural blueprints or vintage technical manuals, updated with a contemporary typographic sharpness.

## Colors
The palette shifts away from generic tech aesthetics toward a **Deep Emerald and Slate Teal** foundation. 

- **Primary:** Deep Emerald (#064e3b) serves as the anchor for interactive elements and brand presence, signifying growth and stability.
- **Secondary:** Slate Teal (#0f172a) provides industrial depth, used for headers and structural text.
- **Surface:** The background uses a slightly "paper-like" off-white or light slate tint to reduce eye strain and reinforce the academic feel.
- **Accents:** A muted amber is used sparingly for critical warnings or highlights, providing a functional contrast to the cool greens and teals.
- **Semantic:** Success is tied to the primary emerald; errors use a desaturated iron-red to maintain the industrial tone.

## Typography
This design system utilizes a streamlined typographic strategy to reinforce its industrial-modern narrative.

1.  **Outfit** is used for headlines. Its geometric construction provides a sense of modern engineering and institutional authority.
2.  **Inter** handles both the bulk of body text and technical labels. It offers high legibility, a neutral systematic feel, and maintains a clean aesthetic across dense data environments.

All type should be set with high contrast against the surface. Headers should use tight tracking to emphasize their structural weight, while labels benefit from slightly expanded tracking to improve scanability in dense layouts.

## Layout & Spacing
The layout follows a **Strict Fluid Grid** model. Elements are locked to an 8px baseline grid to ensure vertical rhythm and mathematical alignment.

- **Desktop:** 12-column grid with 24px gutters. Margins are generous (48px) to frame content as if on a printed page.
- **Tablet:** 8-column grid with 20px gutters.
- **Mobile:** 4-column grid with 16px gutters and margins.

spacing should be used to group related technical data tightly, using larger gaps (unit-8 and unit-12) only to separate major logical sections. This creates a high-density environment that feels efficient rather than cluttered.

## Elevation & Depth
In line with Neo-Brutalism, this design system eschews soft shadows and blurs. Depth is communicated through **Hard Shadows and Layered Offsets**.

- **Level 0 (Floor):** The base surface, typically the "paper" background.
- **Level 1 (Cards/Buttons):** Elements feature a 1px solid border (#0f172a).
- **Level 2 (Active/Hover):** When an element is interacted with, it does not lift with a shadow; instead, it displays a "hard shadow" (an offset solid fill of #0f172a) or shifts its position by 2px to simulate a mechanical press.
- **Outlines:** All containers must have visible 1px or 2px borders. No "invisible" containers are permitted; every area of the UI must be physically bounded.

## Shapes
The shape language is strictly **Sharp (0)**. 

To maintain the industrial and architectural tone, all buttons, input fields, cards, and navigation elements utilize 90-degree corners. This reinforces the "grid-first" philosophy and distinguishes the design from the consumer-centric "softness" of typical web apps. Internal elements like progress bars or status indicators must also adhere to this zero-radius rule.

## Components

### Buttons
Primary buttons use a solid Emerald (#064e3b) fill with white text and a 1px Slate Teal border. On hover, the button translates -2px, -2px and reveals a solid black hard shadow. Secondary buttons use a transparent background with a 2px Emerald border.

### Inputs
Text inputs are rectangular with a 1px border. Labels must be positioned above the field in **Inter** all-caps. Focus states are indicated by a high-contrast 2px Emerald border and a subtle background tint.

### Cards
Cards are defined by 1px borders and a mandatory header section separated by a horizontal rule. They do not use shadows unless they are "Interactive Cards," which follow the button hover logic.

### Lists & Data Tables
Tables are the heart of this system. They use thin 1px horizontal dividers. Header rows are shaded in a light Slate tint with bolded labels in **Inter**. Row hover states should use a subtle tint shift rather than a color change.

### Selection Controls
Checkboxes and Radios are strictly square (no rounded corners for radios). When selected, they fill with the Primary Emerald and display a high-contrast white check or inner square.
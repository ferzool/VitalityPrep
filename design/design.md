Build me an app with screens that look like this. You can hotlink images from the html

---
name: Vibrant Health & Heritage
colors:
  surface: '#f7faf5'
  surface-dim: '#d8dbd6'
  surface-bright: '#f7faf5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4f0'
  surface-container: '#ecefea'
  surface-container-high: '#e6e9e4'
  surface-container-highest: '#e0e3df'
  on-surface: '#191c1a'
  on-surface-variant: '#434844'
  inverse-surface: '#2d312e'
  inverse-on-surface: '#eff2ed'
  outline: '#737873'
  outline-variant: '#c3c8c2'
  surface-tint: '#506356'
  primary: '#4d6054'
  on-primary: '#ffffff'
  primary-container: '#66796c'
  on-primary-container: '#f6fff6'
  inverse-primary: '#b7ccbc'
  secondary: '#58605b'
  on-secondary: '#ffffff'
  secondary-container: '#dae2db'
  on-secondary-container: '#5c645f'
  tertiary: '#595d5b'
  on-tertiary: '#ffffff'
  tertiary-container: '#727574'
  on-tertiary-container: '#fbfdfb'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d2e8d8'
  primary-fixed-dim: '#b7ccbc'
  on-primary-fixed: '#0d1f15'
  on-primary-fixed-variant: '#384b3f'
  secondary-fixed: '#dce4de'
  secondary-fixed-dim: '#c0c8c2'
  on-secondary-fixed: '#161d19'
  on-secondary-fixed-variant: '#414944'
  tertiary-fixed: '#e1e3e1'
  tertiary-fixed-dim: '#c5c7c5'
  on-tertiary-fixed: '#191c1b'
  on-tertiary-fixed-variant: '#444746'
  background: '#f7faf5'
  on-background: '#191c1a'
  surface-variant: '#e0e3df'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 34px
    fontWeight: '700'
    lineHeight: 41px
    letterSpacing: -0.02em
  display-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
  numeric-data:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 22px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  margin-mobile: 20px
  margin-tablet: 40px
  gutter: 16px
  stack-sm: 4px
  stack-md: 12px
  stack-lg: 24px
---

## Brand & Style
The design system is centered on a "Sophisticated Vitality" aesthetic, specifically tailored for a premium iOS meal prep experience. It bridges the gap between high-end culinary editorial and functional health tracking. The personality is disciplined yet nurturing, evoking a sense of calm control over one's nutrition. 

The style is **Minimalist with Tactile Accents**, utilizing generous whitespace to ensure the UI remains breathable even when displaying dense nutritional data. It prioritizes high-quality food photography, using soft UI layers to frame ingredients without competing for attention. The emotional response should be one of "effortless health"—professional, clean, and deeply appetizing.

## Colors
The palette is rooted in organic, earthy tones that reinforce a "farm-to-table" feeling.
- **Primary (Sage Green):** Used for primary actions, active states, and success indicators. It suggests growth and health.
- **Secondary (Soft Mint):** A low-contrast variation used for subtle backgrounds, chip containers, and progress bar tracks.
- **Tertiary (Cloud White):** The primary surface color, providing a crisp, clean canvas that makes ingredient colors pop.
- **Neutral (Charcoal):** Used for primary typography and iconography to ensure high legibility and a professional, grounded feel.

Functional colors for error (warm terracotta) and warning (soft ochre) should be used sparingly to maintain the serene aesthetic.

## Typography
This design system utilizes a dual-font approach to balance character with utility. **Plus Jakarta Sans** provides a friendly, modern geometric touch for headlines, while **Inter** ensures maximum legibility for dense nutritional information and ingredient lists.

**Bilingual Support:** 
- For **German**, ensure hyphenation is enabled to prevent awkward spacing with long compound words. 
- For **Persian (RTL)**, the system must utilize a high-quality Naskh-based typeface (like Vazirmatn or similar) that mirrors the x-height and optical weight of Inter to maintain visual balance between the two languages.
- **Numerical Data:** Always use Tabular Lining figures for calorie counts and weights to ensure vertical alignment in lists.

## Layout & Spacing
The layout follows a fluid 4-column grid for mobile and a 12-column grid for tablet/desktop. 

**RTL Adaptability:** The layout must mirror completely when toggling to Persian. This includes the placement of checkboxes (moving to the right), navigation arrows, and the flow of ingredient quantities. 

**Vertical Rhythm:** Use an 8px base unit. Stacked elements (like ingredient rows) should use 12px padding to maintain a "tappable" feel for iOS devices while keeping the list compact enough for quick scanning.

## Elevation & Depth
Depth is achieved through **Tonal Layering** and subtle, tinted shadows rather than heavy black blurs.
- **Surface Level 0:** The main background (Soft White).
- **Surface Level 1 (Cards):** Pure white with a 1px border of #E8F0E9 and a very soft, diffused shadow (0px 4px 20px rgba(124, 144, 130, 0.08)).
- **Overlays:** Use a background blur (systemMaterial) for the Language Toggle and Navigation Bar to maintain the iOS native feel.
- **Active States:** When an ingredient is checked, the card's elevation should flatten, and the background should shift to a subtle Sage tint.

## Shapes
The shape language is "Substantial & Soft." Standard containers use a 16px radius (rounded-lg) to feel modern and friendly. 
- **Buttons & Language Toggles:** Use the "Pill" shape (32px+) to signify high interactability.
- **Ingredient Images:** Use a consistent 12px radius to frame food photography neatly.
- **Checkboxes:** Instead of sharp corners, use a 4px soft radius to align with the overall organic aesthetic.

## Components
- **Recipe Cards:** Large format with a top-weighted image. Calorie counts and macro-data are positioned in a floating "pill" overlaying the image corner for instant visibility.
- **Ingredient Lists:** Each row is a subtle container. The checkbox is placed on the leading edge (Left for DE, Right for FA). Use a strikethrough and 50% opacity for the label text when the item is checked.
- **Language Toggle:** A prominent floating action button or navigation bar item using a segmented control style. It must clearly display "DE | FA" (or "Deutsch | فارسی") with a smooth sliding animation transition.
- **Calorie/Weight Counters:** Use the `numeric-data` typography style. Weights (g, kg) should be in a lighter weight or secondary color to keep the focus on the primary numeric value.
- **Macro-Nutrient Chips:** Small, color-coded pills (Protein, Carbs, Fat) using low-saturation versions of the primary color palette to categorize nutrition data without overwhelming the visual field.
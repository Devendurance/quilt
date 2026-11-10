# Design System: Payment Wallet Landing Page

Source key used throughout this document:
- **[H]** Hero and header, taken from the supplied payment-wallet landing still.
- **[G]** Glass two-column feature panel, derived from the still and locked to this system.
- **[M]** Bento grid and spotlight grid, carried over from earlier references and re-themed to this palette.
- **(proposed)** Motion that cannot be measured from a single still. Treat as a starting point, not a spec.

Hex values were estimated from one still image. Confirm against the live asset before production.

## 1. Visual Theme & Atmosphere

[H] A calm, airy fintech surface. A cool mist-white base carries a soft, pastel gradient bloom (blush, lilac, sky, peach) that sits behind a single white capsule. The hero illustration is a tilted translucent glass slab resting on a grey plinth, with glossy spheres floating around it. Everything reads as light and trustworthy, not loud.

**Key Characteristics**
- One accent color only: Violet (`#7B5CF0`). Everything else is neutral or pastel.
- Pastel gradient blooms as the atmosphere, never as UI chrome.
- Bold-and-light headline pairing: heavy and light weights of the same family in one line ("**Payment** for…").
- Glassmorphism reserved for the feature panel [G], not for every surface.
- Pill-shaped controls, generous radii, no hard outlines.
- Hero as a sculptural object (glass slab, plinth, spheres), not a screenshot.

## 2. Color Palette & Roles

### Core
- **Mist** `#F7F6F9`: page background, the base surface.
- **Ink** `#0B0B0C`: headlines, logo, primary text.
- **Slate** `#5B5E66`: body copy, secondary text.
- **Stone** `#9AA0AA`: tertiary text, captions, placeholder, dividers at low emphasis.

### Accent
- **Violet** `#7B5CF0`: the sole accent. Primary CTA fill, active states, spotlight glow core.
- **Violet Deep** `#5E3FD6`: CTA hover and pressed state.
- **Violet Tint** `rgba(123,92,240,.14)`: subtle highlight behind icons and selected tiles.

### Atmosphere (gradient blooms only, never for text or buttons)
- **Blush** `#F4C9D6`
- **Lilac** `#D9CCF5`
- **Sky** `#C9D3DC`
- **Peach** `#F7DCCB`

### Glass
- **Glass Fill** `rgba(255,255,255,.62)`: feature panel and capsule surface.
- **Glass Edge** `rgba(255,255,255,.85)`: the inner highlight border.

### Tokens

```css
:root{
  --font-ui:'Satoshi','General Sans',-apple-system,'Segoe UI',sans-serif;
  --font-label:'Georama','Satoshi',system-ui,sans-serif;
  --mist:#F7F6F9; --ink:#0B0B0C; --slate:#5B5E66; --stone:#9AA0AA;
  --violet:#7B5CF0; --violet-deep:#5E3FD6; --violet-tint:rgba(123,92,240,.14);
  --blush:#F4C9D6; --lilac:#D9CCF5; --sky:#C9D3DC; --peach:#F7DCCB;
  --glass:rgba(255,255,255,.62); --glass-edge:rgba(255,255,255,.85);
  --r-input:14px; --r-tile:20px; --r-panel:28px; --r-pill:999px;
  --gap:20px; --section-y:120px;
}
```

### Roles at a glance
| Role | Token | Use |
|------|-------|-----|
| Surface | `--mist` | Page background |
| Text primary | `--ink` | Headlines, nav |
| Text secondary | `--slate` | Body copy |
| Text tertiary | `--stone` | Captions, placeholders |
| Accent | `--violet` | CTA, active, glow |
| Atmosphere | blush / lilac / sky / peach | Background blooms only |

## 3. Typography Rules

### Font Family
**Locked. Do not substitute.**
- **Satoshi** (Fontshare), for headlines and UI. Available weights are 300, 400, 500, 700 and 900. There is no 600, so do not request it.
- **Georama** (Google Fonts), for labels, numerals, the phone field, and tile labels.
- Where a display serif is chosen for a campaign moment, use Instrument Serif or Newsreader. This is optional and not part of the default hero.
- Do not use any other sans in place of the locked families.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display | Satoshi | 96px | 300 + 700 mixed | 92px | -2px | Two lines. Bold word then light word ("**Payment** for…") |
| H2 | Satoshi | 56px | 700 | 60px | -1px | Section headings |
| H3 | Satoshi | 28px | 500 | 34px | -0.4px | Feature titles inside [G] |
| Body | Satoshi | 18px | 400 | 28px | 0 | Paragraph copy, Slate |
| Nav | Satoshi | 15px | 500 | 20px | 0 | Nav links |
| Button | Satoshi | 16px | 500 | 20px | 0 | CTA label |
| Label | Georama | 13px | 500 | 16px | 0.2px | Eyebrow labels, tile labels, captions |
| Numeral | Georama | 40px | 500 | 44px | -0.5px | Stat figures in [M] tiles |
| Phone field | Georama | 16px | 500 | 20px | 0.2px | Country code and number in the capsule |

### Principles
- Mix weights inside one headline. The heavy word carries the action, the light word carries the context.
- Keep Display tracking tight (-2px). Do not loosen it.
- Labels and numerals use Georama so figures feel precise next to Satoshi headlines.
- Tile labels in [M] may be tilted by -4°. Only tile labels rotate, never body copy.

## 4. Component Stylings

### Hero Capsule: Phone and CTA [H]
The signature control. One white pill containing three parts in a row:
1. A flag and country-code selector (Georama 16px).
2. A phone input (Georama 16px, Ink text, Stone placeholder).
3. A violet button, "Get early access" (Satoshi 16px / 500, white text).

- **Container:** background `#FFFFFF`, height `64px`, padding `8px 8px 8px 24px`, radius `999px`, no border, soft shadow `0 12px 40px rgba(11,11,12,.08)`.
- **Button inside:** background `#7B5CF0`, text `#FFFFFF`, height `48px`, padding `0 28px`, radius `999px`.
- **Button hover:** `#5E3FD6`.
- **Input focus:** the capsule gains a `0 0 0 3px rgba(123,92,240,.25)` ring. Do not change the capsule border.

### Hero Illustration [H]
A composed object, not a photo:
- A tilted translucent glass slab (rotated roughly -12° on X, 18° on Z), fill `rgba(255,255,255,.55)`, edge `rgba(255,255,255,.9)`, blur backdrop 20px.
- A grey plinth beneath it, `#C9CDD4` top face to `#9AA0AA` side.
- Three to five glossy spheres floating around the slab, tinted from the bloom palette (lilac, blush, sky), each with a white specular highlight.
- Background gradient bloom from blush, lilac, sky, and peach, with no hard edges.

### Glass Feature Panel [G]
- **Max width:** `1120px`, centered.
- **Surface:** background `var(--glass)`, `backdrop-filter: blur(24px) saturate(140%)`, border `1px solid var(--glass-edge)`, radius `28px`.
- **Padding:** `56px` vertical, `48px` horizontal.
- **Layout:** two columns, 1fr 1fr, column gap `64px`. Each column holds an icon tile, an H3, and a Body paragraph.
- **Icon tile:** `48px` square, radius `14px`, background `--violet-tint`, icon stroke `#7B5CF0` at 2px.

### Bento Grid [M]
Re-themed from the earlier reference to this palette.
- **Grid:** 12 columns, `--gap` 20px between tiles.
- **Row height:** `340px` for standard rows.
- **Tile radius:** `20px`. Tile border `1px solid rgba(11,11,12,.06)`. No shadow.
- **Tile tints:** rotate among Mist (`#FFFFFF` on Mist page), Lilac, Sky, Peach, and one Violet tile (`#7B5CF0`, white text) per grid as the single accent moment.
- **Tile label:** Georama 13px / 500 in Label style, tilted -4° from its anchor point.
- **Tile content:** one Numeral or one H3 plus one line of Body. Do not put more than two elements in a tile.

### Spotlight Grid [M]
Re-themed from the earlier reference.
- **Grid:** 3 columns, hairline cells. Cell borders `1px solid rgba(11,11,12,.08)`, no gaps, shared edges.
- **Crosshairs:** a `+` mark at each internal grid intersection, `12px`, Stone stroke `1px`.
- **Spotlight:** one cell per row can carry a violet glow, a radial gradient from `rgba(123,92,240,.35)` at the center to transparent at 70% radius, positioned following the cursor (proposed).
- **Cell content:** icon at top-left, H3 below, Body at the bottom.

### Buttons
**Primary (violet)**
- Background `#7B5CF0`, text `#FFFFFF`, height `52px`, padding `0 28px`, radius `999px`, font Satoshi 16px / 500, no border, no shadow.
- Hover: `#5E3FD6`. Active: `transform: scale(.98)`.

**Secondary (ghost on Mist)**
- Background transparent, text `#0B0B0C`, border `1px solid rgba(11,11,12,.14)`, height `52px`, radius `999px`.
- Hover: background `rgba(11,11,12,.04)`.

### Navigation [H]
- Background transparent over Mist. Logo at left, links at right, Satoshi 15px / 500, Ink.
- Padding `28px 48px`. No divider rule.
- Hover link: Violet text.

### Motion (proposed)
Not measurable from a single still. Use these as the starting spec and refine against a real recording.
- **Beat:** `1200ms`.
- **Capsule entrance:** translateY 16px to 0 and opacity 0 to 1, `600ms`, `cubic-bezier(.2,.8,.2,1)`.
- **Hero slab:** slow float, translateY ±8px over `4 beats`, `ease-in-out`. Reduced motion: static.
- **Spheres:** staggered float at different periods (`3.2s`, `4.1s`, `5.0s`), amplitude 6 to 12px.
- **Feature panel:** reveal on scroll via ScrollTrigger, opacity and translateY 24px, `800ms`, stagger 120ms between columns.
- **Bento tiles:** rise on scroll, stagger `60ms` per tile in reading order.
- **Button hover:** background `200ms ease-out`, `transform` `120ms`.
- **Reduced motion:** disable all float and parallax, keep opacity fades at 200ms.

## 5. Layout Principles

### Spacing System
**Base unit:** `4px`.
- `4` caption line gap
- `8` icon-to-label gap
- `12` chip padding
- `20` grid gap (`--gap`)
- `24` card internal gap
- `32` nav-to-content, button padding
- `48` headline-to-body
- `64` body-to-CTA, column gap in [G]
- `120` section vertical rhythm (`--section-y`)

### Grid and Container
- **Max content width:** `1200px`, centered. The glass panel [G] is capped at `1120px`.
- **Hero:** centered single column. Headline, one paragraph, capsule, then the illustration below or behind.
- **Feature band:** the [G] panel, centered.
- **Bento:** 12-column grid, 20px gap, rows of 340px.
- **Spotlight:** 3-column grid, full content width, hairline cells.

### Whitespace Philosophy
Space does the separating. Nothing is boxed except the glass panel, the capsule, and bento tiles. Give the hero illustration room to breathe, and let the gradient bloom run past the content edge.

### Radius Scale
- `14px` inputs and icon tiles
- `20px` bento tiles
- `28px` glass panel
- `999px` capsule, buttons, pills

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat | No shadow, hairline border | Bento tiles, spotlight cells |
| Lift | `0 12px 40px rgba(11,11,12,.08)` | Hero capsule |
| Glass | `backdrop-filter: blur(24px)`, glass fill, glass edge | Feature panel [G] |
| Object | Gradient shading and specular highlights | Hero illustration [H] |

**Philosophy:** depth comes from glass and light, not from heavy shadows. There is exactly one soft lift in the system (the capsule). Do not add shadows to bento tiles or spotlight cells.

## 7. Do's and Don'ts

### Do
- Keep Violet as the only accent. Use it on the CTA, active states, and at most one bento tile.
- Mix weights in every Display headline.
- Keep the glass panel to one per page section.
- Use Georama for numerals, labels, and the phone field.
- Mark every motion decision that came from the still as proposed until checked against a recording.

### Don't
- Don't introduce a second saturated color. Pastels are atmosphere only.
- Don't put text directly on a bloom gradient at small sizes. Use Ink on Mist or white on Violet.
- Don't put Satoshi or Georama at weights they don't have (no 600 for Satoshi).
- Don't substitute any other sans for the locked families.
- Don't add shadows to bento tiles or spotlight cells.
- Don't rotate body copy. Only tile labels tilt.

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile | 375px to 599px | Capsule stacks: phone field full width, button full width below it. Illustration sits behind the headline at 60% opacity. Glass panel becomes single column. Bento becomes 1 column. Spotlight becomes 1 column. |
| Tablet | 600px to 1023px | Bento 6 columns (2-col tiles). Spotlight 2 columns. Glass panel stays two columns at 40px padding. |
| Desktop | 1024px to 1439px | Full layout as specified. |
| Wide | 1440px+ | Content max width 1200px. Illustration scales up, not out. |

### Typography by Breakpoint
- **Mobile:** Display `48px / 52px`, H2 `36px`, Body `16px / 26px`.
- **Tablet:** Display `68px / 68px`, H2 `44px`.
- **Desktop:** Display `96px / 92px`, H2 `56px`.

### Touch Targets
- Minimum `44px` square. Capsule button is `48px` tall, so it already clears the minimum.

### Collapsing Strategy
- Below `768px`, the hero illustration moves behind the headline and the capsule stacks.
- Nav links collapse to a menu button at `768px`. The logo stays visible.
- Keep the glass panel readable: never let it fall below 16px body text.
- Below `600px`, reduce the number of visible spheres from five to three.

## 9. Agent Prompt Guide

### Quick Color Reference
- Page surface: Mist `#F7F6F9`
- Primary text: Ink `#0B0B0C`
- Secondary text: Slate `#5B5E66`
- Accent and CTA: Violet `#7B5CF0`, hover `#5E3FD6`
- Atmosphere only: Blush `#F4C9D6`, Lilac `#D9CCF5`, Sky `#C9D3DC`, Peach `#F7DCCB`
- Glass: `rgba(255,255,255,.62)` with edge `rgba(255,255,255,.85)`

### Iteration Guide
1. **Fonts are locked.** Satoshi for headlines and UI (weights 300, 400, 500, 700, 900; no 600). Georama for labels, numerals, the phone field, and tile labels. Do not substitute any other sans.
2. **Violet is the only accent.** Pastels are background atmosphere, never text or button colors.
3. **The hero capsule is one white pill** holding flag, phone field, and the violet "Get early access" button, in that order.
4. **Display headlines mix weights.** Bold word, then light word, in the same line.
5. **The glass panel [G] is capped at 1120px**, with 56/48 padding and two columns.
6. **Bento [M]** uses a 12-column grid, 20px gap, 340px rows, and 20px radius. Only one tile is violet.
7. **Spotlight [M]** uses a 3-column hairline grid with `+` crosshairs. Its glow is violet and sits on one cell per row.
8. **Motion is proposed.** Use the beat (1200ms) and the easings listed in section 4. Respect reduced motion.
9. **Hex values are estimates** from one still. Keep them in the `:root` token block so they can be swapped in one place.

### Verification Checklist
- Grep the output for the banned legacy sans name as a whole word. Expected count: zero.
- Count the level-two headings matching `## [1-9].`. Expected count: nine.
- Confirm Satoshi is never requested at weight 600.

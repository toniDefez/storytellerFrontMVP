# Design Spec: Living Folio UI Redesign
**Date:** 2026-03-20
**Status:** Approved
**Scope:** Visual personality overhaul — Design Direction B (Living Folio Parcial)

---

## 1. Problem Statement

The current StoryTeller UI uses a generic purple SaaS aesthetic (`bg-slate-50`, violet primary, cold gray borders) that is visually indistinguishable from admin dashboards like Notion, Linear, or Vercel. The brand intent is "warm literary elegance — like opening a beautifully bound journal," but the implementation communicates clinical documentation.

**Root causes identified:**
- `MainLayout` hardcodes `bg-slate-50` (#f8fafc — cold blue-white) instead of the warm `bg-background` token
- `--border: 220 13% 91%` is a blue-gray that reads as scaffolding
- `--primary: 263 70% 50%` (electric violet) is a tech/SaaS color
- Typography only uses the display font (Lora) on h1–h3; all prose, descriptions, and labels fall back to Source Sans 3
- Cards use `border shadow-sm` (1px hairline border + tiny shadow) — identical to GitHub issue list items
- Empty states use the icon-in-circle SaaS pattern

---

## 2. Design Direction: Living Folio (Direction B)

The redesign adopts the "Living Folio" design system already defined in Stitch, applying it to the React implementation. The emotional target: **a well-used Moleskine from someone who travels and writes** — warm, material, private, handcrafted.

**Confirmed decisions:**
- Sidebar: warm dark burgundy (#2d1a17), NOT cold slate-950
- Buttons/CTAs: terracotta (#712d28 → #8e443d gradient), NOT purple
- Typography: Newsreader serif replaces Lora for display elements
- Vellum texture on content surfaces
- Entity colors shift to "manuscript ink" palette

---

## 3. Design Tokens

### 3.1 Color System Changes (index.css `:root` block)

All values below are **bare HSL channels** (no `hsl()` wrapper) because they are consumed via `hsl(var(--token))` in the `@theme {}` block. This matches the existing `:root` convention in the project.

```css
/* Current → New */
--background:   40 20% 98%     /* keep — already correct warm cream */
--foreground:   30 8% 11%      /* was 222 47% 11% — warm near-black #1b1c1a */
--card:         40 12% 97%     /* was 0 0% 100% — barely warm white */
--card-foreground: 30 8% 11%   /* was 222 47% 11% */
--primary:      5 47% 30%      /* was 263 70% 50% — #712d28 terracotta */
--primary-foreground: 0 0% 100% /* keep white */
--secondary:    35 12% 94%     /* was 220 14% 96% — warm light #efede7 */
--secondary-foreground: 30 8% 40% /* was 220 9% 46% */
--muted:        35 12% 94%     /* was 220 14% 96% */
--muted-foreground: 30 6% 47%  /* was 215 16% 47% — warm mid-tone */
--border:       35 12% 88%     /* was 220 13% 91% — warm sand, NOT blue-gray */
--input:        35 12% 88%     /* was 220 13% 91% */
--ring:         5 47% 30%      /* was 263 70% 50% — terracotta focus ring */
--accent:       35 15% 94%     /* was 263 80% 95% */
--accent-foreground: 5 47% 30% /* was 263 70% 50% */
/* --radius: keep at 0.5rem — do NOT change; would break all shadcn components globally.
   Border-radius overrides are applied per-component via rounded-[4px] Tailwind class. */
```

### 3.2 Entity Colors (`@theme {}` block)

Entity color tokens live inside the **`@theme {}`** block (not `:root`), using direct `hsl()` values — this matches the existing project pattern for entity colors in `index.css` lines 29–37.

```css
/* Add/replace inside @theme {} */

/* Worlds — deep violet ink (warmer, richer than current electric purple) */
--color-entity-world:           hsl(260 38% 40%);   /* #5a3e8a */
--color-entity-world-light:     hsl(260 35% 93%);   /* #e8e0f5 */
--color-entity-world-muted:     hsl(260 30% 58%);   /* #8b72b8 */

/* Characters — vermillion/siena (replaces generic orange) */
--color-entity-character:       hsl(17 63% 37%);    /* #9e3d22 */
--color-entity-character-light: hsl(18 55% 94%);    /* #f7ece6 */
--color-entity-character-muted: hsl(17 50% 60%);    /* #c87858 */

/* Scenes — verdigris (deep teal-green, replaces neon cyan) */
--color-entity-scene:           hsl(180 55% 30%);   /* #1f6e6e */
--color-entity-scene-light:     hsl(180 40% 93%);   /* #e3f3f3 */
--color-entity-scene-muted:     hsl(180 40% 50%);   /* #4aadad */
```

### 3.3 Typography (`@theme {}` block)

```css
/* Add inside @theme {} — replaces existing --font-display and --font-body */
--font-display: 'Newsreader', Georgia, 'Times New Roman', serif;
--font-body:    'Source Sans 3', system-ui, -apple-system, sans-serif;
--font-ui:      'Work Sans', system-ui, sans-serif;  /* NEW */
```

With `--font-ui` registered in `@theme {}`, use it as `font-ui` Tailwind utility class (e.g. `className="font-ui"`). Do NOT use `font-[var(--font-ui)]` — the canonical form is `font-ui` once registered in `@theme`.

Google Fonts URL (replace existing in `index.html`):
```html
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,300;1,6..72,400;1,6..72,500&family=Source+Sans+3:wght@300;400;500;600&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

Typography rules (add to `@layer base` in `index.css`):
```css
h1, h2, h3, h4 { font-family: var(--font-display); }
h1 { font-size: 2.2rem; font-weight: 400; letter-spacing: -0.025em; }
h2 { font-size: 1.5rem; font-weight: 400; letter-spacing: -0.015em; }
h3 { font-size: 1.2rem; font-weight: 500; }
h4 { font-size: 1rem; font-weight: 300; font-style: italic; }
```

### 3.4 Vellum Texture

```css
.vellum-texture {
  background-image: radial-gradient(
    circle,
    hsl(35 15% 82% / 0.45) 0.5px,
    transparent 0.5px
  );
  background-size: 24px 24px;
}
```

### 3.5 Ambient Shadow System

These are plain CSS utility classes (not Tailwind `@theme` tokens). They work with `className="shadow-ambient"` directly. **They cannot be used with framer-motion `whileHover`** — for animated hover in WorldCard, inline the box-shadow string directly into the `whileHover` prop (see section 4.2).

```css
.shadow-ambient {
  box-shadow:
    0 0 0 1px rgba(27, 28, 26, 0.04),
    0 2px 6px rgba(27, 28, 26, 0.05),
    0 8px 24px rgba(27, 28, 26, 0.04);
}
.shadow-ambient-hover {
  box-shadow:
    0 0 0 1px rgba(27, 28, 26, 0.05),
    0 4px 12px rgba(27, 28, 26, 0.08),
    0 16px 40px rgba(27, 28, 26, 0.06);
}
```

Hover shadow string for framer-motion `whileHover`:
```
"0 0 0 1px rgba(27,28,26,0.05), 0 4px 12px rgba(27,28,26,0.08), 0 16px 40px rgba(27,28,26,0.06)"
```

---

## 4. Component Changes

### 4.1 MainLayout (src/layouts/MainLayout.tsx)

**Sidebar:**
- Background: `bg-slate-950` → `bg-[#2d1a17]`
- Border: `border-slate-800/60` → `border-[#4a2e28]/60`
- Logo: remove the violet square icon box; replace with pure Newsreader italic wordmark: `<span className="font-display italic text-[#e8d5c8] text-base font-normal">StoryTeller</span>`
- Nav active state: remove `bg-violet-600/20 border border-violet-600/30`; replace with left-border bookmark: `border-l-2 border-[#c4622d] bg-[rgba(196,98,45,0.10)] text-[#e8d5c8]`
- Nav inactive: `text-[#9a7a6e] hover:text-[#c9b8ae] hover:bg-[rgba(255,255,255,0.04)]`
- Section label "NAVEGACIÓN": `text-[#6b4a42]`

**Mobile topbar** (lines 110–120 in current file):
- `bg-slate-950` → `bg-[#2d1a17]`
- `border-slate-800` → `border-[#4a2e28]`

**Content area:**
- `bg-slate-50` → `bg-background` (root cause fix — 1 token change)
- Add `vellum-texture` class to the main content wrapper div

### 4.2 WorldCard (src/components/WorldCard.tsx)

- Remove `border` class → no visible border
- Replace `shadow-sm` with `shadow-ambient` class
- Framer-motion `whileHover`: replace current `boxShadow` value with `"0 0 0 1px rgba(27,28,26,0.05), 0 4px 12px rgba(27,28,26,0.08), 0 16px 40px rgba(27,28,26,0.06)"`
- Card background: `bg-card` (resolved to warm white via token)
- Card `rounded-xl` → `rounded-[4px]` (the `overflow-hidden` on the card handles inner header corners)
- World name (`h3`): already gets Newsreader via the global `h3` rule — no explicit class needed
- Description text: add `italic font-display` for Newsreader italic style
- Climate header: add genre/type label — `<span className="font-ui text-[0.65rem] uppercase tracking-widest text-white/65">` below existing gradient
- Faction chips: change to `bg-[rgba(27,28,26,0.05)] text-[#6b6860] font-ui` (neutral warm, not entity-colored)

### 4.3 WorldDetailPage (src/pages/home/WorldDetailPage.tsx)

**Hero section:**
- World name: `text-[2.5rem] font-display font-normal tracking-[-0.03em] leading-tight`
- Entity badge: `bg-[hsl(260_35%_93%)] text-[#5a3e8a] font-ui text-xs uppercase tracking-widest`

**Description area:**
- The description text (`world.description`) is currently rendered inside the gradient hero band as white text. **Move it out of the gradient hero section** into the content area below (where `bg-card`/warm background applies) before applying drop cap.
- Add `prose-drop-cap prose-literary` classes to the description `<p>` element

**Section dividers:**
- Use inline JSX (not the `.section-ornament` CSS class): `<div className="text-center py-4 text-[rgba(27,28,26,0.2)] font-display tracking-[0.4em]">✦ ✦ ✦</div>`

**World field cards (environment, tone, tensions, etc.):**
- Background: `bg-[#f0ede7] rounded-[4px]` (no border)
- Label: `font-ui text-xs uppercase tracking-[0.08em] text-[#9a8880]`
- Value: `font-display text-sm text-[#2a2826]`

**Character cards in world:**
- Remove `border border-l-4 shadow-sm` → `bg-[#f7ece6] shadow-ambient rounded-[4px]`
- Character name: `font-display text-[#7a2d18]`
- No left-border stripe — entity identity via background tint

**Scene cards in world:**
- `bg-[#e3f3f3] shadow-ambient rounded-[4px]`
- Scene title: `font-display text-[#155555]`

**Empty states:**
- Remove icon-in-circle pattern
- Character empty: `<p className="font-display italic text-[#877270] text-center">Este mundo aún no tiene voces. Crea el primer personaje que lo habite.</p>`
- Scene empty: `<p className="font-display italic text-[#877270] text-center">Las historias esperan ser contadas. Crea la primera escena.</p>`

### 4.4 Buttons (src/components/ui/button.tsx)

`button.tsx` uses `class-variance-authority` (CVA). Apply changes inside the CVA variant strings using Tailwind arbitrary values — do NOT use raw CSS.

**Primary variant** — replace the `default` CVA variant string:
```
"bg-gradient-to-br from-[#712d28] to-[#8e443d] text-white shadow-[0_2px_8px_rgba(113,45,40,0.25)] hover:from-[#8e443d] hover:to-[#9a5040] rounded-[4px] font-ui tracking-[0.02em]"
```

**Ghost variant** — update to warm border:
```
"border border-[rgba(27,28,26,0.15)] text-[#4a4840] hover:bg-[rgba(27,28,26,0.04)] rounded-[4px]"
```

### 4.5 Form Pages (CreateWorldPage, CreateCharacterPage)

Form field labels:
- Replace `text-[11px] font-semibold text-muted-foreground uppercase tracking-widest`
- With: `font-ui text-xs font-medium text-[#9a8880] uppercase tracking-[0.08em]`

Input focus state — add to `index.css` inside `@layer base`:
```css
input:focus, textarea:focus {
  border-left-width: 2px;
  outline: none;
  box-shadow: none;
}
```
(Entity-specific left-border colors are applied per-page via className on the input: `focus:border-l-entity-world` etc.)

### 4.6 CharacterDetailPage (src/pages/characters/CharacterDetailPage.tsx)

- Biography/description field: add `prose-drop-cap prose-literary` classes; drop cap color uses `--color-entity-character` (#9e3d22 siena)
  - In CSS add a `.prose-drop-cap-character::first-letter { color: var(--color-entity-character); }` variant
- Related scene cards: `bg-[#e3f3f3] shadow-ambient rounded-[4px]`, title `font-display text-[#155555]`
- Character stats/attribute cards: `bg-[#f7ece6] rounded-[4px]` (siena tint, no border)

---

## 5. Global CSS Additions (index.css)

All additions go in `index.css`. Token overrides in `:root`/`@theme {}` as noted in Section 3. Utility classes below go after the existing `@layer base` block.

```css
/* Vellum texture — page background grain */
.vellum-texture {
  background-image: radial-gradient(circle, hsl(35 15% 82% / 0.45) 0.5px, transparent 0.5px);
  background-size: 24px 24px;
}

/* Ambient shadow system — replaces shadow-sm */
.shadow-ambient {
  box-shadow:
    0 0 0 1px rgba(27, 28, 26, 0.04),
    0 2px 6px rgba(27, 28, 26, 0.05),
    0 8px 24px rgba(27, 28, 26, 0.04);
}
.shadow-ambient-hover {
  box-shadow:
    0 0 0 1px rgba(27, 28, 26, 0.05),
    0 4px 12px rgba(27, 28, 26, 0.08),
    0 16px 40px rgba(27, 28, 26, 0.06);
}

/* Drop cap — apply to <p> containing description text, OUTSIDE gradient headers */
.prose-drop-cap::first-letter {
  font-family: var(--font-display);
  font-size: 5rem;
  font-weight: 300;
  font-style: italic;
  float: left;
  line-height: 0.78;
  margin-right: 0.08em;
  margin-top: 0.06em;
  color: var(--color-entity-world);   /* default: world violet */
}
/* Per-entity variants */
.prose-drop-cap-character::first-letter {
  color: var(--color-entity-character);
}
.prose-drop-cap-scene::first-letter {
  color: var(--color-entity-scene);
}

/* Literary prose — for world/character/scene description body text */
.prose-literary {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 300;
  line-height: 1.75;
  color: hsl(30 8% 28%); /* #4a4840 */
}

/* Focus ring — warm terracotta instead of blue/violet */
:focus-visible {
  outline: 2px solid #712d28;
  outline-offset: 2px;
}
```

---

## 6. Files to Change

| File | Type of change | Priority |
|------|---------------|----------|
| `src/index.css` | Token overrides + utility classes | P0 — unblocks everything |
| `index.html` | Replace Google Fonts URL (Lora → Newsreader + Work Sans) | P0 |
| `src/layouts/MainLayout.tsx` | Sidebar bg, logo, nav states, mobile topbar, content bg fix | P0 |
| `src/components/WorldCard.tsx` | Shadow, border removal, framer-motion hover, typography | P1 |
| `src/pages/home/WorldDetailPage.tsx` | Move description out of hero, drop cap, dividers, field cards, entity cards, empty states | P1 |
| `src/components/ui/button.tsx` | Primary + ghost CVA variant strings | P1 |
| `src/pages/home/CreateWorldPage.tsx` | Form label styles, input focus | P2 |
| `src/pages/characters/CreateCharacterPage.tsx` | Form label styles | P2 |
| `src/pages/characters/CharacterDetailPage.tsx` | Drop cap (siena), entity/scene cards | P2 |
| `src/pages/scenes/SceneDetailPage.tsx` | Scene entity colors (verdigris), drop cap | P2 |
| `src/components/skeletons/*.tsx` | Warm shimmer colors | P3 |

---

## 7. Out of Scope

- Layout restructuring (no codex two-column layout — Direction C only)
- New pages or routes
- Backend changes
- i18n string changes
- Animation system overhaul (framer-motion stays, only `whileHover` box-shadow values change)
- Full shadcn component theme migration (only `button.tsx` CVA strings change)
- Global `--radius` change (would break all shadcn components; per-component `rounded-[4px]` is used instead)

---

## 8. Success Criteria

1. Main layout background is warm cream (#faf9f5), not cold blue-white
2. Sidebar reads as "dark warm library shelf," not "developer terminal"
3. World/character/scene names render in Newsreader serif
4. Primary buttons are terracotta gradient, not purple
5. Cards have no visible 1px borders — depth via background shift and ambient shadow
6. World/character/scene descriptions feel like literary excerpts, not form field help text
7. Drop cap visible on WorldDetailPage and CharacterDetailPage description text, outside gradient hero
8. Entity colors (world=violet #5a3e8a, char=siena #9e3d22, scene=verdigris #1f6e6e) consistent and warm
9. Mobile topbar matches sidebar warm dark (#2d1a17)

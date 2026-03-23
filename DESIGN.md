# DESIGN.md — StoryTeller Design System

Visual design reference for all contributors. This document defines the language of the app so every new screen feels like it belongs to the same world.

---

## Brand Personality

**"Imaginative, refined, inviting."**

StoryTeller should feel like opening a beautifully bound journal — warm, literary, full of possibility. Not cold SaaS. Not childish. Not generic AI aesthetics.

**Anti-references (never do these):**
- Glassmorphism (blur cards, glow borders)
- Cyan-on-dark neon accents
- Purple-to-blue gradients
- Icon in a rounded rectangle above every heading
- Gradient text on headings or metrics
- Identical card grids (icon + heading + text repeated)
- Dark mode with glowing accents as a substitute for real design decisions

---

## Color Palette

### Base (CSS tokens in `src/index.css`)

| Token | Value | Use |
|---|---|---|
| `--background` | `hsl(40 20% 98%)` | Page background — warm off-white |
| `--foreground` | `hsl(30 8% 11%)` | Primary text — warm near-black |
| `--card` | `hsl(40 12% 97%)` | Card surfaces |
| `--muted-foreground` | `hsl(30 6% 47%)` | Secondary text, labels |
| `--border` | `hsl(35 12% 88%)` | Dividers, input borders |
| `--primary` | `hsl(5 47% 30%)` | Terracotta — destructive actions, legacy |

### Entity Colors — the core wayfinding system

Every entity type has its own color family. Users orient by color — be consistent.

| Entity | Dark | Light | Muted |
|---|---|---|---|
| **Worlds** | `hsl(260 38% 40%)` | `hsl(260 35% 93%)` | `hsl(260 30% 58%)` |
| **Characters** | `hsl(17 63% 37%)` | `hsl(18 55% 94%)` | `hsl(17 50% 60%)` |
| **Scenes** | `hsl(180 55% 30%)` | `hsl(180 40% 93%)` | `hsl(180 40% 50%)` |

Available via Tailwind as `text-entity-world`, `bg-entity-world/[0.12]`, `text-entity-character`, etc.

**Rule:** Every screen should make it immediately clear what entity type the user is looking at — from color alone.

### Structural Darks

| Role | Value | Use |
|---|---|---|
| Sidebar background | `#100d16` | Deep purple-black — DO NOT lighten |
| Sidebar border | `#1c1926` | Subtle purple-dark separator |
| Sidebar active bg | `bg-entity-world/[0.12]` | Purple tint — unifies nav with entity system |
| Sidebar active accent | `text-entity-world-muted` | Border + icon on active nav item |
| Sidebar inactive text | `#8a7a9e` | Purple-tinted gray |
| Sidebar section label | `#5a4a72` | Purple-dark muted label |

**Rule:** The sidebar dark palette and the auth page dark panel share the same purple-black vocabulary. `#100d16` ≈ `hsl(260 25% 7%)`. They are intentionally the same family.

---

## Typography

Three font roles — never swap them:

| Role | Font | Token | Use |
|---|---|---|---|
| Display | Newsreader | `--font-display` | Titles, world names, literary headings, pull quotes |
| Body | Source Sans 3 | `--font-body` | Descriptions, prose, paragraphs |
| UI | Work Sans | `--font-ui` | Labels, badges, tags, navigation, buttons |

### Scale guidelines

- **Page title (h1):** `text-3xl font-normal tracking-[-0.02em]` — Newsreader, `color: hsl(30 8% 11%)`
- **Detail world title:** `text-[2.5rem] font-normal tracking-[-0.03em]` — Newsreader, white on gradient
- **Section heading (h2):** `text-2xl font-bold` — Newsreader, entity color
- **Card title (h3):** `text-xl font-bold` — Newsreader
- **Body prose:** `text-base` or `text-sm`, Source Sans 3, `line-height: 1.75`
- **Micro labels:** `text-[10px] tracking-[0.2em] uppercase` — Work Sans
- **Italic premise/quote:** Newsreader italic, `text-white/60` on gradients or `text-muted-foreground`

**Weight contrast matters:** Pair `font-bold` headings with `font-normal` body. Don't use bold everywhere.

---

## Shadows

Two ambient shadow utilities (defined in `src/index.css`):

```css
.shadow-ambient       /* resting state — subtle depth */
.shadow-ambient-hover /* hover state — more pronounced */
```

Use these for entity cards. Do NOT use `shadow-md`, `shadow-lg` (they're cold and generic).

---

## Layout Patterns

### In-app (with sidebar)

- Sidebar: fixed left, `w-60`, `#100d16` background
- Content area: `flex-1`, warm cream background, `vellum-texture` utility applied
- Content max-width: `max-w-4xl` or `max-w-6xl` centered
- Page padding: `p-6 md:p-8`
- Page transitions: framer-motion `y: 10 → 0`, `opacity: 0 → 1`, `duration: 0.22s`

### Auth pages (login / register)

Two-column split, no sidebar:

- **Left panel (58%):** `hsl(260 25% 7%)` — dark atmospheric panel
  - Shows floating entity preview cards (World, Character, Scene) demonstrating app value
  - Brand name in large Newsreader serif
  - Tagline below brand name
  - Subtle dot texture overlay
  - Footer italic quote
- **Right panel (42%):** `hsl(40 20% 98%)` — warm cream form panel
  - No card wrapper — form breathes directly on cream
  - Heading: `text-4xl font-bold` Newsreader
  - CTA button: `hsl(260 38% 40%)` purple (not terracotta primary)
  - Links: same purple

Mobile: left panel hidden, form only with brand name in header.

---

## Entity Card Patterns

### WorldCard

- Full gradient header (climate-inferred or default violet-purple)
- Gradient is the visual identity — make it tall (`pt-6 pb-10`)
- World name: `text-xl font-bold text-white` Newsreader
- Premise/description: `text-sm italic text-white/60` Newsreader, `line-clamp-3`
- Footer strip: warm cream, `text-[10px] uppercase tracking-[0.2em]` entity-world label + `→`
- Hover: `y: -4` lift with deeper shadow-ambient-hover
- No rounded corners: `rounded-[4px]` — intentionally sharp, literary

**Climate gradient inference:** Check premise/description for keywords:
- volcanic/fuego → `from-red-600 to-orange-700`
- glaciar/nieve/hielo → `from-cyan-500 to-blue-700`
- océano/agua/lluvia → `from-blue-500 to-indigo-700`
- bosque/selva/verde → `from-emerald-500 to-teal-700`
- desierto/arena/sol → `from-amber-500 to-orange-700`
- oscuridad/sombra → `from-slate-600 to-slate-900`
- magia/hechizo → `from-violet-500 to-purple-800`
- default → `from-violet-600 to-purple-800`

### Character items

- Background: `bg-[#f7ece6]` (warm amber-cream)
- Title: Newsreader, `text-[#7a2d18]`
- Role badge: `bg-[rgba(158,61,34,0.1)] text-[#9e3d22]` rounded-full `text-[10px] uppercase`

### Scene items

- Background: `bg-[#e3f3f3]` (cool mint-cream)
- Title: Newsreader, `text-[#155555]`
- Position number: `bg-entity-scene/10 text-[#155555]` circular badge
- Tags: `bg-[rgba(21,85,85,0.1)] text-[#155555]` rounded-full

---

## Interactive States

Every interactive element needs all states. Never skip:

- **Hover:** Color shift or `y: -2...-4` lift for cards
- **Active/pressed:** `scale: 0.98`
- **Focus:** `outline: 2px solid hsl(5 47% 30%)` offset 2px (global, defined in `index.css`)
- **Disabled:** `opacity-60`, `cursor-not-allowed`
- **Loading:** `<Loader2 className="animate-spin" />` inline

---

## Motion

framer-motion for all animations. Rules:

- **Page enter:** `opacity: 0→1, y: 10→0`, `duration: 0.22s, ease: easeOut`
- **Card hover:** spring `stiffness: 300, damping: 22`
- **Staggered lists:** `staggerChildren: 0.07s`
- **Panel entrances:** `opacity: 0→1`, custom ease `[0.22, 1, 0.36, 1]` (expo out)
- **Easing:** `[0.25, 0.46, 0.45, 0.94]` for standard, `[0.22, 1, 0.36, 1]` for dramatic
- **Never:** bounce or elastic — they feel cheap
- **Always:** respect `prefers-reduced-motion` (handled globally in `index.css`)

---

## Section Dividers

Between major sections in detail pages:

```tsx
<div className="flex items-center gap-4 py-4 select-none">
  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
  <span className="text-[rgba(27,28,26,0.25)] font-display tracking-[0.5em] text-xs">✦ ✦ ✦</span>
  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
</div>
```

---

## Empty States

Never show a blank screen. Empty states should:

1. **Avoid** icon-in-rounded-square above the heading (generic SaaS pattern)
2. Use large Newsreader display text as the focal point
3. Include a brand label above the heading (`text-[11px] tracking-[0.35em] uppercase entity-world-muted`)
4. Provide exactly one or two actions — not more

**Pattern:**
```tsx
<p className="text-[11px] tracking-[0.35em] uppercase mb-5" style={{ color: 'hsl(260 30% 58%)' }}>
  StoryTeller
</p>
<h2 className="text-4xl font-normal tracking-[-0.02em] mb-4" style={{ fontFamily: 'var(--font-display)' }}>
  {emptyTitle}
</h2>
<p className="text-base text-muted-foreground max-w-sm leading-relaxed mb-10">{emptyDescription}</p>
<Button size="lg">Primary action</Button>
```

---

## Buttons

The primary button uses the terracotta `--primary` by default. For auth pages and entity-world CTAs, use the world purple explicitly:

```tsx
style={{ background: 'hsl(260 38% 40%)', boxShadow: '0 2px 14px hsl(260 38% 40% / 0.35)' }}
```

Button hierarchy (use all levels — don't make everything primary):
- **Primary:** Solid, high contrast — one per major action
- **Secondary:** `variant="secondary"` — supporting actions
- **Outline:** `variant="outline"` — equal-weight alternatives
- **Ghost:** `variant="ghost"` — low-weight, contextual (e.g., on gradient headers)
- **Link:** `variant="link"` — inline text actions

---

## Dos and Don'ts Summary

| DO | DON'T |
|---|---|
| Use Newsreader for all headings | Use Inter, Roboto, or system fonts for titles |
| Use entity colors consistently for wayfinding | Use entity colors randomly or decoratively |
| Use `shadow-ambient` / `shadow-ambient-hover` | Use `shadow-md`, `shadow-xl` generically |
| Use `rounded-[4px]` for entity cards | Use `rounded-2xl` everywhere (too soft) |
| Tint all neutrals (no pure grays) | Put gray text on colored backgrounds |
| Display typography with dramatic scale jumps | Use uniform font sizes with no hierarchy |
| Climate gradients on world cards | Flat solid colors on world card headers |
| Auth pages: purple CTA + purple links | Auth pages: terracotta primary button |
| Sidebar: purple accent for active states | Sidebar: disconnected orange accent |
| Empty states: display text as hero | Empty states: icon-in-rounded-square |

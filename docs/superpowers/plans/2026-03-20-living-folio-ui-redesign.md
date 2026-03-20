# Living Folio UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform StoryTeller's generic purple SaaS aesthetic into a warm literary interface aligned with the "Living Folio" design system — terracotta buttons, warm dark sidebar, Newsreader serif, vellum texture, ambient shadows.

**Architecture:** Pure CSS/className changes across 6 files. No new components, no new routes. Token changes in `index.css` cascade everywhere; component changes are local className edits. No test framework exists — verification is visual via `npm run dev` and `npm run build` for type safety.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, shadcn/ui (CVA buttons), framer-motion, Google Fonts

---

## File Map

| File | What changes |
|------|-------------|
| `index.html` | Replace Google Fonts URL (Lora → Newsreader + Work Sans) |
| `src/index.css` | `:root` token overrides, `@theme {}` entity colors + `--font-ui`, utility classes |
| `src/layouts/MainLayout.tsx` | Sidebar bg/logo/nav, mobile topbar, content area bg + vellum |
| `src/components/WorldCard.tsx` | Remove border, ambient shadow, rounded-[4px], chip styles |
| `src/components/ui/button.tsx` | Primary CVA variant → terracotta gradient, ghost → warm |
| `src/pages/home/WorldDetailPage.tsx` | Hero, description drop cap, field cards, entity cards, empty states |
| `src/pages/characters/CharacterDetailPage.tsx` | Drop cap (siena), entity/scene cards |

> **Note (P2, deferred):** `CreateWorldPage.tsx`, `CreateCharacterPage.tsx`, and `SceneDetailPage.tsx` have P2 form/label styling from the spec. These are intentionally excluded from this plan to keep scope focused. They can be addressed in a follow-up task.

---

## Task 1: Fonts + Design Tokens

**Files:**
- Modify: `index.html` line 10
- Modify: `src/index.css` (`:root`, `@theme {}`, `@layer base`, utility classes)

- [ ] **Step 1.1: Replace Google Fonts URL in index.html**

Replace the existing fonts link on line 10:
```html
<!-- Before (exact match) -->
<link href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700&family=Source+Sans+3:wght@400;500;600;700&display=swap" rel="stylesheet">

<!-- After -->
<link href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,300;0,6..72,400;0,6..72,500;1,6..72,300;1,6..72,400;1,6..72,500&family=Source+Sans+3:wght@300;400;500;600&family=Work+Sans:wght@400;500;600&display=swap" rel="stylesheet">
```

- [ ] **Step 1.2: Update `:root` color tokens in src/index.css**

The `:root` block lives inside `@layer base {}` (lines 49–75). Replace just the `:root { ... }` block:

```css
/* Before — inside @layer base */
  :root {
    --background: 40 20% 98%;
    --foreground: 222 47% 11%;
    --card: 0 0% 100%;
    --card-foreground: 222 47% 11%;
    --popover: 0 0% 100%;
    --popover-foreground: 222 47% 11%;
    --primary: 263 70% 50%;
    --primary-foreground: 0 0% 100%;
    --secondary: 220 14% 96%;
    --secondary-foreground: 220 9% 46%;
    --muted: 220 14% 96%;
    --muted-foreground: 215 16% 47%;
    --accent: 263 80% 95%;
    --accent-foreground: 263 70% 50%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 263 70% 50%;
    --radius: 0.5rem;
    --chart-1: 263 70% 50%;
    --chart-2: 160 84% 39%;
    --chart-3: 38 92% 50%;
    --chart-4: 217 91% 60%;
    --chart-5: 0 84% 60%;
  }

/* After — keep inside @layer base */
  :root {
    --background: 40 20% 98%;
    --foreground: 30 8% 11%;
    --card: 40 12% 97%;
    --card-foreground: 30 8% 11%;
    --popover: 40 12% 97%;
    --popover-foreground: 30 8% 11%;
    --primary: 5 47% 30%;
    --primary-foreground: 0 0% 100%;
    --secondary: 35 12% 94%;
    --secondary-foreground: 30 8% 40%;
    --muted: 35 12% 94%;
    --muted-foreground: 30 6% 47%;
    --accent: 35 15% 94%;
    --accent-foreground: 5 47% 30%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 35 12% 88%;
    --input: 35 12% 88%;
    --ring: 5 47% 30%;
    --radius: 0.5rem;
    --chart-1: 5 47% 30%;
    --chart-2: 180 55% 30%;
    --chart-3: 17 63% 37%;
    --chart-4: 260 38% 40%;
    --chart-5: 0 84% 60%;
  }
```

- [ ] **Step 1.3: Update `@theme {}` fonts and entity colors**

Make three separate edits inside the `@theme {}` block:

**Edit A — replace font-display line:**
```css
/* Before */
  --font-display: 'Lora', Georgia, 'Times New Roman', serif;

/* After */
  --font-display: 'Newsreader', Georgia, 'Times New Roman', serif;
```

**Edit B — add --font-ui after --font-body:**
```css
/* Before */
  --font-body: 'Source Sans 3', system-ui, -apple-system, sans-serif;

/* After */
  --font-body: 'Source Sans 3', system-ui, -apple-system, sans-serif;
  --font-ui: 'Work Sans', system-ui, sans-serif;
```

**Edit C — replace entity color block (lines 29–37 in @theme {}):**
```css
/* Before */
  /* Semantic entity colors */
  --color-entity-world: hsl(var(--primary));
  --color-entity-world-light: hsl(263 80% 95%);
  --color-entity-character: hsl(25 95% 53%);
  --color-entity-character-light: hsl(33 100% 96%);
  --color-entity-character-muted: hsl(25 90% 42%);
  --color-entity-scene: hsl(199 89% 48%);
  --color-entity-scene-light: hsl(199 100% 95%);
  --color-entity-scene-muted: hsl(199 80% 38%);

/* After */
  /* Semantic entity colors */
  --color-entity-world: hsl(260 38% 40%);
  --color-entity-world-light: hsl(260 35% 93%);
  --color-entity-world-muted: hsl(260 30% 58%);
  --color-entity-character: hsl(17 63% 37%);
  --color-entity-character-light: hsl(18 55% 94%);
  --color-entity-character-muted: hsl(17 50% 60%);
  --color-entity-scene: hsl(180 55% 30%);
  --color-entity-scene-light: hsl(180 40% 93%);
  --color-entity-scene-muted: hsl(180 40% 50%);
```

- [ ] **Step 1.4: Add h4 to heading font rule in `@layer base`**

Find the existing heading font rule and add h4:
```css
/* Before */
  h1, h2, h3 {
    font-family: var(--font-display);
  }

/* After */
  h1, h2, h3, h4 {
    font-family: var(--font-display);
  }
```

> **Note:** Do NOT add global `font-size` or `font-weight` overrides to h1/h2/h3. Those would conflict with Tailwind utility classes like `text-4xl` used on WorldDetailPage. Font size changes are handled per-component in later tasks.

- [ ] **Step 1.5: Update focus-visible to terracotta**

```css
/* Before */
:focus-visible {
  outline: 2px solid #7c3aed;
  outline-offset: 2px;
}

/* After */
:focus-visible {
  outline: 2px solid #712d28;
  outline-offset: 2px;
}
```

- [ ] **Step 1.6: Add utility classes at the end of src/index.css**

Append after the existing `@media (prefers-reduced-motion: reduce)` block:
```css
/* ── Living Folio utilities ── */

.vellum-texture {
  background-image: radial-gradient(circle, hsl(35 15% 82% / 0.45) 0.5px, transparent 0.5px);
  background-size: 24px 24px;
}

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

.prose-literary {
  font-family: var(--font-body);
  font-size: 1rem;
  font-weight: 300;
  line-height: 1.75;
  color: hsl(30 8% 28%);
}

.prose-drop-cap::first-letter {
  font-family: var(--font-display);
  font-size: 5rem;
  font-weight: 300;
  font-style: italic;
  float: left;
  line-height: 0.78;
  margin-right: 0.08em;
  margin-top: 0.06em;
  color: var(--color-entity-world);
}

.prose-drop-cap-character::first-letter {
  font-family: var(--font-display);
  font-size: 5rem;
  font-weight: 300;
  font-style: italic;
  float: left;
  line-height: 0.78;
  margin-right: 0.08em;
  margin-top: 0.06em;
  color: var(--color-entity-character);
}
```

- [ ] **Step 1.7: Verify build passes**

```bash
npm run build
```
Expected: no TypeScript errors. (CSS changes don't affect TS.)

- [ ] **Step 1.8: Open dev server and verify visually**

```bash
npm run dev
```
Open http://localhost:5173. Check:
- Background is warm cream, not cold blue-white
- Font in headings looks like Newsreader (serif with ink quality, richer than Lora)
- Focus ring on any button/link is terracotta, not purple/blue

- [ ] **Step 1.9: Commit**

```bash
git add index.html src/index.css
git commit -m "feat(ui): apply Living Folio tokens — Newsreader, terracotta, warm borders"
```

---

## Task 2: Sidebar + Layout

**Files:**
- Modify: `src/layouts/MainLayout.tsx`

- [ ] **Step 2.1: Update sidebar background and border**

```tsx
// Before:
<aside aria-label={t('a11y.sidebar')} className="flex flex-col h-full bg-slate-950 border-r border-slate-800/60 w-60">

// After:
<aside aria-label={t('a11y.sidebar')} className="flex flex-col h-full bg-[#2d1a17] border-r border-[#4a2e28]/60 w-60">
```

- [ ] **Step 2.2: Replace logo (remove violet icon box, use Newsreader wordmark)**

Find the logo block inside `<aside>` and replace:
```tsx
// Before:
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center shrink-0">
            <svg aria-hidden="true" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <span className="font-bold text-white text-sm tracking-tight font-[var(--font-display)]">StoryTeller</span>
        </div>
      </div>

// After:
      <div className="px-5 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="font-display italic text-[#e8d5c8] text-base font-normal tracking-tight">
            StoryTeller
          </span>
        </div>
      </div>
```

- [ ] **Step 2.3: Update nav section label color**

```tsx
// Before:
<p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-4 mb-3">{t('a11y.sidebarNav')}</p>

// After:
<p className="text-[10px] font-semibold text-[#6b4a42] uppercase tracking-widest px-4 mb-3">{t('a11y.sidebarNav')}</p>
```

- [ ] **Step 2.4: Update NavItem active and inactive styles**

Replace the `className` prop in the `<Link>` inside `NavItem` (lines 21–25):
```tsx
// Before:
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'bg-violet-600/20 text-violet-300 border border-violet-600/30'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
      }`}

// After:
      className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium transition-all duration-150 ${
        isActive
          ? 'border-l-2 border-[#c4622d] bg-[rgba(196,98,45,0.10)] text-[#e8d5c8]'
          : 'text-[#9a7a6e] hover:text-[#c9b8ae] hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
      }`}
```

Also update the icon color for active state:
```tsx
// Before:
      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-violet-400' : ''}`} />

// After:
      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#c4622d]' : ''}`} />
```

- [ ] **Step 2.5: Update logout button and sidebar footer**

```tsx
// Before:
      <div className="px-3 pb-6 border-t border-slate-800/60 pt-4">
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-800/60 rounded-lg transition-all duration-150"
        >

// After:
      <div className="px-3 pb-6 border-t border-[#4a2e28]/60 pt-4">
        <button
          onClick={onLogout}
          className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#6b4a42] hover:text-[#9a7a6e] hover:bg-[rgba(255,255,255,0.04)] rounded-sm transition-all duration-150"
        >
```

- [ ] **Step 2.6: Fix content area background + add vellum texture**

```tsx
// Before:
    <div className="flex min-h-screen bg-slate-50">

// After:
    <div className="flex min-h-screen bg-background">
```

```tsx
// Before:
      <main id="main-content" aria-label={t('a11y.mainContent')} className="flex-1 md:ml-60 min-h-screen">

// After:
      <main id="main-content" aria-label={t('a11y.mainContent')} className="flex-1 md:ml-60 min-h-screen vellum-texture">
```

- [ ] **Step 2.7: Update mobile topbar**

```tsx
// Before:
        <div className="md:hidden flex items-center gap-4 bg-slate-950 border-b border-slate-800 px-4 py-3 sticky top-0 z-20">

// After:
        <div className="md:hidden flex items-center gap-4 bg-[#2d1a17] border-b border-[#4a2e28] px-4 py-3 sticky top-0 z-20">
```

- [ ] **Step 2.8: Verify visually**

```bash
npm run dev
```
Check:
- Sidebar is warm dark brown (#2d1a17), not cold black
- Logo is "StoryTeller" in italic serif, no violet box
- Active nav item has left terracotta border, no purple pill
- Main content area has subtle dot texture on warm cream background

- [ ] **Step 2.9: Commit**

```bash
git add src/layouts/MainLayout.tsx
git commit -m "feat(ui): Living Folio sidebar — warm dark, Newsreader wordmark, terracotta bookmark nav"
```

---

## Task 3: WorldCard

**Files:**
- Modify: `src/components/WorldCard.tsx`

- [ ] **Step 3.1: Update card container**

```tsx
// Before:
    <motion.div
      className="rounded-2xl bg-white shadow-sm border border-gray-100 cursor-pointer overflow-hidden"
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onClick={() => navigate(`/worlds/${id}`)}
    >

// After:
    <motion.div
      className="rounded-[4px] bg-card shadow-ambient cursor-pointer overflow-hidden"
      whileHover={{ y: -3, boxShadow: '0 0 0 1px rgba(27,28,26,0.05), 0 4px 12px rgba(27,28,26,0.08), 0 16px 40px rgba(27,28,26,0.06)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onClick={() => navigate(`/worlds/${id}`)}
    >
```

> **Note:** `whileHover.boxShadow` requires an inline string value — it cannot be a CSS class. The value above is the correct inline string.

- [ ] **Step 3.2: Update description text style**

```tsx
// Before:
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{description}</p>

// After:
          <p className="text-xs italic font-display text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{description}</p>
```

- [ ] **Step 3.3: Update factions section**

Replace the entire factions block. The current code uses `Badge` from shadcn:

```tsx
// Before:
        {factions.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('world.factionsLabel')}</p>
            <div className="flex flex-wrap gap-1">
              {factions.slice(0, 3).map(f => (
                <Badge key={f} variant="outline">{f}</Badge>
              ))}
              {factions.length > 3 && (
                <span className="text-[11px] text-gray-400 px-2 py-0.5">+{factions.length - 3}</span>
              )}
            </div>
          </div>
        )}

// After:
        {factions.length > 0 && (
          <div className="pt-3 border-t border-border/50">
            <p className="text-[10px] font-ui font-medium text-muted-foreground uppercase tracking-[0.08em] mb-1.5">{t('world.factionsLabel')}</p>
            <div className="flex flex-wrap gap-1">
              {factions.slice(0, 3).map(f => (
                <span key={f} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui bg-[rgba(27,28,26,0.05)] text-[#6b6860]">{f}</span>
              ))}
              {factions.length > 3 && (
                <span className="text-[11px] text-muted-foreground px-2 py-0.5">+{factions.length - 3}</span>
              )}
            </div>
          </div>
        )}
```

After this change, `Badge` is no longer used in `WorldCard.tsx`. Remove the Badge import:
```tsx
// Before:
import { Badge } from '@/components/ui/badge'

// After:
(delete this line)
```

- [ ] **Step 3.4: Verify visually**

```bash
npm run dev
```
Navigate to /worlds. Check:
- Cards have no hairline border
- Cards have warm cream background
- Hover lifts card with warm shadow
- Faction chips are neutral warm spans, not outlined Badge components

- [ ] **Step 3.5: Commit**

```bash
git add src/components/WorldCard.tsx
git commit -m "feat(ui): WorldCard — ambient shadow, warm card bg, no borders, Newsreader italic desc"
```

---

## Task 4: Button Primary → Terracotta

**Files:**
- Modify: `src/components/ui/button.tsx`

- [ ] **Step 4.1: No base change needed**

The base string in `buttonVariants` includes `rounded-md`. Do NOT remove it — size variants (`sm`, `lg`, `xs`, `icon-xs`) depend on it. The `default` and `ghost` replacements in Steps 4.2–4.3 include `rounded-[4px]`, and since shadcn's `cn()` uses `tailwind-merge`, `rounded-[4px]` will correctly override `rounded-md` for those two variants only.

No file changes in this step — proceed to Step 4.2.

- [ ] **Step 4.2: Update default variant**

```tsx
// Before:
      default: "bg-primary text-primary-foreground hover:bg-primary/90",

// After:
      default: "bg-gradient-to-br from-[#712d28] to-[#8e443d] text-white shadow-[0_2px_8px_rgba(113,45,40,0.25)] hover:from-[#8e443d] hover:to-[#9a5040] rounded-[4px] font-ui tracking-[0.02em]",
```

- [ ] **Step 4.3: Update ghost variant**

```tsx
// Before:
      ghost: "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",

// After:
      ghost: "border border-[rgba(27,28,26,0.15)] text-[#4a4840] hover:bg-[rgba(27,28,26,0.04)] rounded-[4px]",
```

- [ ] **Step 4.4: Verify build and visual**

```bash
npm run build
```
Then:
```bash
npm run dev
```
Check any page with a primary button (e.g. "Nuevo Mundo" on /worlds, "Guardar" on create pages). Button should be warm terracotta gradient, not purple. Ghost buttons should have warm subtle border.

- [ ] **Step 4.5: Commit**

```bash
git add src/components/ui/button.tsx
git commit -m "feat(ui): button primary terracotta gradient, ghost warm border"
```

---

## Task 5: WorldDetailPage

**Files:**
- Modify: `src/pages/home/WorldDetailPage.tsx`

- [ ] **Step 5.1: Update hero world name**

```tsx
// Before:
          <h1 className="text-4xl font-bold text-white font-display leading-tight">
            {world.name}
          </h1>

// After:
          <h1 className="text-[2.5rem] font-display font-normal tracking-[-0.03em] leading-tight text-white">
            {world.name}
          </h1>
```

- [ ] **Step 5.2: Move description out of gradient hero and add drop cap**

Remove description from inside the gradient div:
```tsx
// Before (inside the gradient div, after <h1>):
          {world.description && (
            <p className="mt-3 text-white/80 text-lg max-w-2xl leading-relaxed">
              {world.description}
            </p>
          )}

// After: (delete these lines — description moves to the card body below)
```

Then add it at the top of the `bg-card` div (just after the opening `<div className="bg-card ...">` tag on line 209):
```tsx
// Add after: <div className="bg-card border border-t-0 border-border rounded-b-xl px-8 py-5 space-y-4">
        {world.description && (
          <p className="prose-drop-cap prose-literary mb-6 overflow-hidden">
            {world.description}
          </p>
        )}
```

- [ ] **Step 5.3: Update world layer field cards**

Replace the card div inside the `.map(layer => (...))`:
```tsx
// Before:
                  <div key={layer.key} className={`rounded-xl bg-white border border-gray-100 p-4 border-l-4 border-l-${layer.color}-500`}>
                    <h4 className={`text-xs font-semibold uppercase tracking-widest text-${layer.color}-600 mb-1`}>
                      {layer.label}
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                      {world[layer.key]}
                    </p>
                  </div>

// After:
                  <div key={layer.key} className="rounded-[4px] bg-[#f0ede7] p-4 shadow-ambient">
                    <h4 className="font-ui text-[10px] font-medium uppercase tracking-[0.1em] text-[#9a8880] mb-1">
                      {layer.label}
                    </h4>
                    <p className="font-display text-sm text-[#2a2826] leading-relaxed line-clamp-4">
                      {world[layer.key]}
                    </p>
                  </div>
```

- [ ] **Step 5.4: Add section ornament divider before characters section**

Find the `{/* ── Characters Section ── */}` comment and add a divider before it:
```tsx
// Before:
      {/* ── Characters Section ── */}
      <section className="space-y-4">

// After:
      <div className="text-center py-2 text-[rgba(27,28,26,0.2)] font-display tracking-[0.4em] text-sm select-none">
        ✦ ✦ ✦
      </div>
      {/* ── Characters Section ── */}
      <section className="space-y-4">
```

- [ ] **Step 5.5: Update character empty state**

Replace the character empty state. The current code uses a `<Card>` from shadcn:

```tsx
// Before:
        {!characters || characters.length === 0 ? (
          <Card className="border-entity-character/20 bg-entity-character-light/40">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-entity-character/10 p-4 mb-4">
                <Users className="h-8 w-8 text-entity-character" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">
                {t('world.detail.noCharactersTitle')}
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {t('world.detail.noCharactersDesc')}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/worlds/${id}/characters/create`}>
                    {t('world.detail.createCharacterManual')}
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link to={`/worlds/${id}/characters/create`}>
                    {t('world.detail.createCharacterAi')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (

// After:
        {!characters || characters.length === 0 ? (
          <div className="rounded-[4px] bg-[#f7ece6]/50 shadow-ambient px-8 py-12 text-center">
            <p className="font-display italic text-lg text-[#877270] mb-2">
              {t('world.detail.noCharactersTitle')}
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {t('world.detail.noCharactersDesc')}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/worlds/${id}/characters/create`}>
                  {t('world.detail.createCharacterManual')}
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to={`/worlds/${id}/characters/create`}>
                  {t('world.detail.createCharacterAi')}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
```

- [ ] **Step 5.6: Update character cards**

The character cards are wrapped in a `<Link>` — preserve the `<Link>` wrapper but replace `<Card>` + `<CardContent>` with a styled `<div>`:

```tsx
// Before (inside the Link):
                <Card className="border-l-4 border-l-entity-character hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-foreground">{c.name}</h3>
                    {c.role && (
                      <Badge className="mt-1.5 bg-entity-character/10 text-entity-character-muted border-entity-character/20 hover:bg-entity-character/15">
                        {c.role}
                      </Badge>
                    )}
                    {c.personality && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {c.personality}
                      </p>
                    )}
                    {c.goals && c.goals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.goals.slice(0, 2).map((g: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

// After (inside the Link, keep the Link intact):
                <div className="rounded-[4px] bg-[#f7ece6] shadow-ambient p-4 h-full transition-all hover:shadow-ambient-hover">
                  <h3 className="font-display font-medium text-[#7a2d18]">{c.name}</h3>
                  {c.role && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-ui uppercase tracking-[0.06em] bg-[rgba(158,61,34,0.1)] text-[#9e3d22]">
                      {c.role}
                    </span>
                  )}
                  {c.personality && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 font-display italic">
                      {c.personality}
                    </p>
                  )}
                  {c.goals && c.goals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.goals.slice(0, 2).map((g: string, i: number) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui bg-[rgba(27,28,26,0.05)] text-[#6b6860]">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
```

After this change, `Card` and `CardContent` may still be used for scene cards — check before removing their imports.

- [ ] **Step 5.7: Update scene empty state**

```tsx
// Before:
        {!scenes || scenes.length === 0 ? (
          <Card className="border-entity-scene/20 bg-entity-scene-light/40">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-entity-scene/10 p-4 mb-4">
                <Clapperboard className="h-8 w-8 text-entity-scene" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">
                {t('world.detail.noScenesTitle')}
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {t('world.detail.noScenesDesc')}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/worlds/${id}/scenes/create`}>
                    {t('world.detail.createSceneManual')}
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link to={`/worlds/${id}/scenes/create`}>
                    {t('world.detail.createSceneAi')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (

// After:
        {!scenes || scenes.length === 0 ? (
          <div className="rounded-[4px] bg-[#e3f3f3]/50 shadow-ambient px-8 py-12 text-center">
            <p className="font-display italic text-lg text-[#3d7a7a] mb-2">
              {t('world.detail.noScenesTitle')}
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {t('world.detail.noScenesDesc')}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/worlds/${id}/scenes/create`}>
                  {t('world.detail.createSceneManual')}
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to={`/worlds/${id}/scenes/create`}>
                  {t('world.detail.createSceneAi')}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
```

- [ ] **Step 5.8: Update scene cards**

Scene cards are also wrapped in `<Link>` — preserve links, replace `<Card>` + `<CardContent>`:

```tsx
// Before (inside the Link):
                  <Card className="border-l-4 border-l-entity-scene hover:shadow-md transition-shadow">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-entity-scene/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-entity-scene">{pos}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-foreground">{s.title}</h3>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {s.location && (
                            <Badge className="bg-entity-scene/10 text-entity-scene-muted border-entity-scene/20 hover:bg-entity-scene/15">
                              {s.location}
                            </Badge>
                          )}
                          {s.time && (
                            <Badge className="bg-entity-scene/10 text-entity-scene-muted border-entity-scene/20 hover:bg-entity-scene/15">
                              {s.time}
                            </Badge>
                          )}
                          {s.tone && (
                            <Badge className="bg-entity-scene/10 text-entity-scene-muted border-entity-scene/20 hover:bg-entity-scene/15">
                              {s.tone}
                            </Badge>
                          )}
                        </div>
                        {s.context && (
                          <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                            {s.context}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

// After (inside the Link):
                  <div className="rounded-[4px] bg-[#e3f3f3] shadow-ambient p-4 flex items-center gap-4 transition-all hover:shadow-ambient-hover">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-entity-scene/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-[#155555]">{pos}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-medium text-[#155555]">{s.title}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {s.location && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui bg-[rgba(21,85,85,0.1)] text-[#155555]">
                            {s.location}
                          </span>
                        )}
                        {s.time && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui bg-[rgba(21,85,85,0.1)] text-[#155555]">
                            {s.time}
                          </span>
                        )}
                        {s.tone && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui bg-[rgba(21,85,85,0.1)] text-[#155555]">
                            {s.tone}
                          </span>
                        )}
                      </div>
                      {s.context && (
                        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                          {s.context}
                        </p>
                      )}
                    </div>
                  </div>
```

After completing Steps 5.5–5.8, check if `Card`, `CardContent`, and `Badge` are still used anywhere in the file. If not, remove their imports.

- [ ] **Step 5.9: Verify build**

```bash
npm run build
```
Expected: no TypeScript errors.

- [ ] **Step 5.10: Verify visually**

```bash
npm run dev
```
Navigate to a world detail page. Check:
- World name is large Newsreader, not bold
- Description shows drop cap (large first letter in violet/world color)
- Field cards are warm tan (#f0ede7), no colorful left borders
- ✦ ✦ ✦ ornament divider appears before characters section
- Character cards are siena-tinted (#f7ece6), no border-l-4
- Scene cards are verdigris-tinted (#e3f3f3)
- Empty states use italic Newsreader text, no icon-in-circle

- [ ] **Step 5.11: Commit**

```bash
git add src/pages/home/WorldDetailPage.tsx
git commit -m "feat(ui): WorldDetailPage — drop cap, field cards, entity cards, literary empty states"
```

---

## Task 6: CharacterDetailPage

**Files:**
- Modify: `src/pages/characters/CharacterDetailPage.tsx`

- [ ] **Step 6.1: Read the file first**

Read `src/pages/characters/CharacterDetailPage.tsx` fully to understand the current structure before making changes.

- [ ] **Step 6.2: Add drop cap to character biography/description**

Find the character description/biography text paragraph. Add classes `prose-drop-cap-character prose-literary overflow-hidden` to it. The drop cap will use the siena character color (#9e3d22).

- [ ] **Step 6.3: Apply entity tint to attribute/stat cards**

Find any attribute, personality, motivation, or trait cards. Replace:
- `bg-white border` or `bg-card border` → `bg-[#f7ece6] shadow-ambient rounded-[4px]`
- Labels: `font-ui text-[10px] uppercase tracking-[0.1em] text-[#9a8880]`
- Values: `font-display text-sm text-[#2a2826]`

- [ ] **Step 6.4: Apply verdigris tint to scene appearance cards**

Find any scene cards listed under the character. Apply:
- `bg-[#e3f3f3] shadow-ambient rounded-[4px]`
- Scene title: `font-display text-[#155555]`

- [ ] **Step 6.5: Verify build and visual**

```bash
npm run build
npm run dev
```
Navigate to a character detail page. Check drop cap appears in siena, attribute cards are warm siena-tinted.

- [ ] **Step 6.6: Commit**

```bash
git add src/pages/characters/CharacterDetailPage.tsx
git commit -m "feat(ui): CharacterDetailPage — siena drop cap, warm attribute cards"
```

---

## Task 7: Final verification

- [ ] **Step 7.1: Full build check**

```bash
npm run build
```
Expected: exits 0, no TypeScript errors, no Tailwind warnings.

- [ ] **Step 7.2: Lint check**

```bash
npm run lint
```
Expected: no errors (warnings from existing code are acceptable, no new errors from our changes).

- [ ] **Step 7.3: Visual regression walkthrough**

Open `npm run dev` and verify each route:

| Route | What to check |
|-------|--------------|
| `/worlds` | Warm cream bg, sidebar dark warm, cards no border, terracotta "Nuevo Mundo" button |
| `/worlds/:id` | Drop cap on description, tan field cards, siena char cards, verdigris scene cards, ✦ ✦ ✦ divider |
| `/worlds/:id/characters/:id` | Siena drop cap, warm attribute cards |
| `/settings` | Sidebar consistent, content area warm cream texture |
| Mobile (resize to 375px) | Mobile topbar is warm dark (#2d1a17), not slate |

- [ ] **Step 7.4: Final commit**

```bash
git add -A
git commit -m "feat(ui): Living Folio redesign complete — P0/P1 changes"
```

# Collapsible Sidebar — Design Spec
**Date:** 2026-03-23
**Status:** Approved

---

## Overview

Add a collapsible sidebar to `MainLayout` that lets users recover horizontal screen space when not actively navigating. The sidebar collapses to a 48px icon rail — navigation remains always accessible, never disappears.

This is especially valuable on `WorldDetailPage`, where the graph canvas and right-side panel together consume most of the viewport.

---

## Approach: Icon Rail (Option A)

The sidebar shrinks from 240px to 48px. Text labels hide, icons remain. A toggle button at the bottom of the sidebar controls the state. Preference persists across sessions via `localStorage`.

Rejected alternatives:
- **Full hide (B)**: extra click cost on every navigation, disorienting in long sessions
- **Topbar swap (C)**: drastic layout shift that fights the "writing desk" aesthetic of the dark sidebar

---

## Architecture

**Single file changed:** `src/layouts/MainLayout.tsx`

No new files, no new dependencies (Lucide `PanelLeftClose`/`PanelLeftOpen` already available).

### State

```ts
// In MainLayout
const [collapsed, setCollapsed] = useState<boolean>(
  () => localStorage.getItem('sidebar_collapsed') === 'true'
)

const handleToggle = () => {
  const next = !collapsed
  setCollapsed(next)
  localStorage.setItem('sidebar_collapsed', String(next))
}
```

### Sidebar props

```ts
function Sidebar({ onLogout, collapsed, onToggle }: {
  onLogout: () => void
  collapsed: boolean
  onToggle: () => void
})
```

The mobile `Sheet` renders `<Sidebar>` as well. To avoid breaking it, pass `collapsed={false}` and a no-op `onToggle={() => {}}` to the Sheet instance — the toggle button inside `Sidebar` is hidden on mobile anyway (`hidden md:flex`).

---

## Layout structure

### Desktop sidebar wrapper

The outer wrapper `div` in `MainLayout` (currently `hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-60`) becomes a `motion.div`. The static `md:w-60` Tailwind class is removed; width is controlled entirely by the motion value.

```tsx
<motion.div
  className="hidden md:flex md:flex-col md:fixed md:inset-y-0 z-20 overflow-hidden"
  animate={{ width: collapsed ? 48 : 240 }}
  transition={sidebarSpring}
>
  <Sidebar onLogout={handleLogout} collapsed={collapsed} onToggle={handleToggle} />
</motion.div>
```

`overflow: hidden` is required on this wrapper so text labels do not bleed outside the sidebar bounds during the width animation.

### Main content area

The `main` element gets `marginLeft` driven by a matching spring animation. The static `md:ml-60` Tailwind class must be removed from `<main>` — if left in place it will conflict with the animated `marginLeft`.

```tsx
<motion.main
  animate={{ marginLeft: collapsed ? 48 : 240 }}
  transition={sidebarSpring}
  onAnimationComplete={() => window.dispatchEvent(new Event('resize'))}
>
```

The `onAnimationComplete` resize dispatch is required (not optional) to trigger ReactFlow's ResizeObserver on `WorldDetailPage`, which uses `calc(100vh - 170px)` height and would otherwise misalign the canvas controls until the user interacts.

The inner page content wrapper (`p-6 md:p-8 max-w-6xl mx-auto`) should have `mx-auto` replaced with `ml-0` to prevent centering asymmetry caused by the left margin change. Content aligns flush left to the margin.

---

## Components

### Sidebar — `<aside>`

The `aside` itself keeps its current styling. The static `w-60` class must be removed from `<aside>` — width is now controlled entirely by the outer `motion.div` wrapper. The width animation lives on that outer wrapper in `MainLayout` (see above).

- Logo: show `"ST"` when collapsed, full `"StoryTeller"` when expanded. Use `overflow-hidden whitespace-nowrap` on the text container.
- Nav section label (`NAVIGATION`): conditionally rendered — `{!collapsed && <p>...</p>}`

### NavItem

When collapsed:
- Render only the icon, no label text (conditional render, not opacity hide)
- Add `aria-label={t(labelKey)}` to the `<Link>` (required for screen reader accessibility)
- Add `title={t(labelKey)}` as well for sighted mouse users
- Center the icon with `justify-center` when collapsed

Active state in collapsed mode:
- The `border-l-2` left border indicator is kept but padding is reduced to `px-2` when collapsed (from `px-4`) so the icon has room to breathe. Background highlight remains unchanged.

### Logout button

When collapsed: show only the `LogOut` icon with `aria-label={t('nav.logout')}` and `title={t('nav.logout')}`. Use conditional render for the label text.

### Toggle button

Pinned at the bottom of the sidebar nav area, above the Logout section divider:

```tsx
<button
  onClick={onToggle}
  className="hidden md:flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#5a4a72] hover:text-[#8a7a9e] hover:bg-white/[0.04] rounded-sm transition-all duration-150"
  aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
>
  {collapsed ? <PanelLeftOpen className="w-4 h-4 shrink-0" /> : <PanelLeftClose className="w-4 h-4 shrink-0" />}
  {!collapsed && <span>{t('nav.collapseSidebar')}</span>}
</button>
```

`hidden md:flex` ensures it never appears on mobile.

---

## Animation

```ts
const sidebarSpring = { type: 'spring', stiffness: 300, damping: 30 } as const
```

- **Sidebar width**: spring 300/30 on the outer `motion.div` wrapper
- **Labels**: use conditional render (`{!collapsed && ...}`) rather than opacity fade — avoids the mid-animation text-wrapping artifact entirely. Labels disappear immediately on collapse start and appear immediately on expand complete.
- **Main margin-left**: same spring constant, ensuring content expands in sync with sidebar

### Reduced motion

Use framer-motion's `useReducedMotion()` hook inside `MainLayout`:

```ts
import { useReducedMotion } from 'framer-motion'

// inside MainLayout component:
const prefersReducedMotion = useReducedMotion()

const sidebarSpring = prefersReducedMotion
  ? { duration: 0 }
  : { type: 'spring', stiffness: 300, damping: 30 }
```

---

## Persistence

- Key: `sidebar_collapsed` in `localStorage`
- Value: `"true"` | `"false"`
- Read on `MainLayout` mount via lazy `useState` initializer
- Write on every toggle

Local UI preference only — not synced to backend or user account.

---

## Mobile

No changes to mobile behavior. Mobile continues to use the existing `Sheet` drawer. The toggle button has `hidden md:flex`, so it never renders on mobile. The `Sheet` instance passes `collapsed={false}` and `onToggle={() => {}}` to `Sidebar`.

---

## i18n keys required

Add to `es.json` and `en.json`:

```json
"nav": {
  "collapseSidebar": "Contraer menú",
  "expandSidebar": "Expandir menú"
}
```

---

## Edge Cases

### Graph canvas reflow

ReactFlow on `WorldDetailPage` uses `calc(100vh - 170px)` height and a ResizeObserver. The `onAnimationComplete` resize dispatch (on the `main` motion element) is the prescribed solution — it fires after the spring settles and triggers ReactFlow to measure its container correctly.

### Tooltip / aria-label on collapsed nav

`aria-label` is required (not just `title`) on collapsed nav links. `title` alone is not announced by screen readers consistently.

### Active state at 48px

`border-l-2` left border is kept. Padding reduced to `px-2` in collapsed mode to give the icon visual breathing room.

### Text overflow during animation

`overflow: hidden` on the outer `motion.div` wrapper prevents label text from bleeding outside sidebar bounds at any point during the width transition.

---

## Out of Scope

- Per-user server-side persistence of sidebar state
- Drag-to-resize sidebar
- ARIA tooltip upgrade (future polish pass)
- Sidebar sections beyond the current two nav items

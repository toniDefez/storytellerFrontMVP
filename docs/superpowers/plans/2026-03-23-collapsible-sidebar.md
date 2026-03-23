# Collapsible Sidebar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a collapsible icon-rail sidebar to `MainLayout` that saves horizontal space while keeping navigation always accessible.

**Architecture:** The outer desktop sidebar wrapper becomes a `motion.div` that animates its width between 240px (expanded) and 48px (collapsed). The `main` content area mirrors the animation with `marginLeft`. Collapsed state persists in `localStorage`. Only `MainLayout.tsx` and the two locale JSON files are touched.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, framer-motion (`motion`, `useReducedMotion`), Lucide icons, react-i18next

---

## File Map

| File | Change |
|------|--------|
| `src/layouts/MainLayout.tsx` | All component changes — state, animation, Sidebar, NavItem, Logout, toggle |
| `src/i18n/locales/es.json` | Add `nav.collapseSidebar` and `nav.expandSidebar` |
| `src/i18n/locales/en.json` | Add `nav.collapseSidebar` and `nav.expandSidebar` |

---

### Task 1: Add i18n keys for the toggle button

**Files:**
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`

- [ ] **Step 1: Add keys to es.json**

Find the `"nav"` block (currently lines 17-21) and add two keys:

```json
"nav": {
  "worlds": "Mundos",
  "settings": "Configuración",
  "logout": "Cerrar sesión",
  "collapseSidebar": "Contraer menú",
  "expandSidebar": "Expandir menú"
},
```

- [ ] **Step 2: Add keys to en.json**

Find the `"nav"` block in `en.json` and add the same keys in English:

```json
"nav": {
  "worlds": "Worlds",
  "settings": "Settings",
  "logout": "Log out",
  "collapseSidebar": "Collapse menu",
  "expandSidebar": "Expand menu"
},
```

- [ ] **Step 3: Verify the app still builds**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/es.json src/i18n/locales/en.json
git commit -m "feat: add i18n keys for sidebar collapse toggle"
```

---

### Task 2: Add collapsed state and animation infrastructure to MainLayout

**Files:**
- Modify: `src/layouts/MainLayout.tsx`

This task wires up the state, localStorage persistence, reduced-motion detection, and the spring config. No visual change yet — it just sets up the plumbing.

- [ ] **Step 1: Update imports**

At the top of `MainLayout.tsx`, update the framer-motion import and add Lucide icons:

```tsx
import { motion, useReducedMotion } from 'framer-motion'
import { Globe, Settings, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
```

- [ ] **Step 2: Add state and spring config inside `MainLayout`**

Inside the `MainLayout` function body, after the existing `useState(false)` for `sidebarOpen`, add:

```tsx
const prefersReducedMotion = useReducedMotion()
const sidebarSpring = prefersReducedMotion
  ? { duration: 0 }
  : { type: 'spring' as const, stiffness: 300, damping: 30 }

const [collapsed, setCollapsed] = useState<boolean>(
  () => localStorage.getItem('sidebar_collapsed') === 'true'
)

const handleToggle = () => {
  const next = !collapsed
  setCollapsed(next)
  localStorage.setItem('sidebar_collapsed', String(next))
}
```

- [ ] **Step 3: Replace the desktop sidebar wrapper div with motion.div**

Find this block in the JSX:

```tsx
{/* Sidebar desktop */}
<div className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:w-60 z-20">
  <Sidebar onLogout={handleLogout} />
</div>
```

Replace with:

```tsx
{/* Sidebar desktop */}
<motion.div
  className="hidden md:flex md:flex-col md:fixed md:inset-y-0 z-20 overflow-hidden"
  animate={{ width: collapsed ? 48 : 240 }}
  transition={sidebarSpring}
>
  <Sidebar onLogout={handleLogout} collapsed={collapsed} onToggle={handleToggle} />
</motion.div>
```

- [ ] **Step 4: Pass props to the mobile Sheet Sidebar instance**

Find:

```tsx
<Sidebar onLogout={handleLogout} />
```

inside the `<SheetContent>` block and update it:

```tsx
<Sidebar onLogout={handleLogout} collapsed={false} onToggle={() => {}} />
```

- [ ] **Step 5: Replace main element with motion.main**

Find:

```tsx
<main id="main-content" aria-label={t('a11y.mainContent')} className="flex-1 md:ml-60 min-h-screen vellum-texture">
```

Replace with:

```tsx
<motion.main
  id="main-content"
  aria-label={t('a11y.mainContent')}
  className="flex-1 min-h-screen vellum-texture"
  animate={{ marginLeft: collapsed ? 48 : 240 }}
  transition={sidebarSpring}
  onAnimationComplete={() => window.dispatchEvent(new Event('resize'))}
>
```

And update the closing tag from `</main>` to `</motion.main>`.

- [ ] **Step 6: Fix inner page content wrapper**

Find inside the `motion.main`:

```tsx
className="p-6 md:p-8 max-w-6xl mx-auto"
```

Replace `mx-auto` with `ml-0`:

```tsx
className="p-6 md:p-8 max-w-6xl ml-0"
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
npm run build
```

Expected: TypeScript error about `Sidebar` missing `collapsed` and `onToggle` props. That is expected — we haven't updated `Sidebar`'s signature yet. Confirm the error mentions those props specifically, then move to Task 3.

---

### Task 3: Update Sidebar component signature and internals

**Files:**
- Modify: `src/layouts/MainLayout.tsx` (Sidebar function only)

- [ ] **Step 1: Update Sidebar props signature**

Find:

```tsx
function Sidebar({ onLogout }: { onLogout: () => void }) {
```

Replace with:

```tsx
function Sidebar({ onLogout, collapsed, onToggle }: {
  onLogout: () => void
  collapsed: boolean
  onToggle: () => void
}) {
```

- [ ] **Step 2: Remove static w-60 from the aside element**

Find:

```tsx
<aside aria-label={t('a11y.sidebar')} className="flex flex-col h-full bg-[#100d16] border-r border-[#1c1926]/60 w-60">
```

Remove `w-60`:

```tsx
<aside aria-label={t('a11y.sidebar')} className="flex flex-col h-full bg-[#100d16] border-r border-[#1c1926]/60">
```

- [ ] **Step 3: Update the logo to show "ST" when collapsed**

Find the logo block inside `Sidebar`:

```tsx
<div className="px-5 pt-7 pb-6">
  <div className="flex items-center gap-2.5">
    <span className="font-display italic text-[#e8d5c8] text-base font-normal tracking-tight">
      StoryTeller
    </span>
  </div>
</div>
```

Replace with:

```tsx
<div className="px-3 pt-7 pb-6 overflow-hidden whitespace-nowrap">
  <div className="flex items-center gap-2.5">
    <span className="font-display italic text-[#e8d5c8] text-base font-normal tracking-tight">
      {collapsed ? 'ST' : 'StoryTeller'}
    </span>
  </div>
</div>
```

- [ ] **Step 4: Hide the nav section label when collapsed**

Find:

```tsx
<p className="text-[10px] font-semibold text-[#5a4a72] uppercase tracking-widest px-4 mb-3">{t('a11y.sidebarNav')}</p>
```

Wrap with a conditional:

```tsx
{!collapsed && (
  <p className="text-[10px] font-semibold text-[#5a4a72] uppercase tracking-widest px-4 mb-3">{t('a11y.sidebarNav')}</p>
)}
```

- [ ] **Step 5: Add toggle button above the logout section**

Find the logout `<div>`:

```tsx
<div className="px-3 pb-6 border-t border-[#1c1926]/60 pt-4">
```

Insert the toggle button immediately before it:

```tsx
<div className="px-3 pb-2">
  <button
    onClick={onToggle}
    className="hidden md:flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#5a4a72] hover:text-[#8a7a9e] hover:bg-white/[0.04] rounded-sm transition-all duration-150"
    aria-label={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
    title={collapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
  >
    {collapsed
      ? <PanelLeftOpen className="w-4 h-4 shrink-0" />
      : <PanelLeftClose className="w-4 h-4 shrink-0" />
    }
    {!collapsed && <span>{t('nav.collapseSidebar')}</span>}
  </button>
</div>
```

- [ ] **Step 6: Update Logout button for collapsed state**

Find the logout button:

```tsx
<button
  onClick={onLogout}
  className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-[#5a4a72] hover:text-[#8a7a9e] hover:bg-white/[0.04] rounded-sm transition-all duration-150"
>
  <LogOut className="w-4 h-4 shrink-0" />
  {t('nav.logout')}
</button>
```

Replace with:

```tsx
<button
  onClick={onLogout}
  aria-label={t('nav.logout')}
  title={t('nav.logout')}
  className={`flex items-center gap-2.5 w-full py-2.5 text-sm text-[#5a4a72] hover:text-[#8a7a9e] hover:bg-white/[0.04] rounded-sm transition-all duration-150 ${collapsed ? 'justify-center px-2' : 'px-4'}`}
>
  <LogOut className="w-4 h-4 shrink-0" />
  {!collapsed && t('nav.logout')}
</button>
```

- [ ] **Step 7: Pass collapsed to NavItem**

Find:

```tsx
{NAV_ITEM_DEFS.map(item => (
  <NavItem key={item.to} {...item} />
))}
```

Replace with:

```tsx
{NAV_ITEM_DEFS.map(item => (
  <NavItem key={item.to} {...item} collapsed={collapsed} />
))}
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
npm run build
```

Expected: TypeScript error about `NavItem` missing `collapsed` prop. Confirm and move to Task 4.

---

### Task 4: Update NavItem for collapsed state

**Files:**
- Modify: `src/layouts/MainLayout.tsx` (NavItem function only)

- [ ] **Step 1: Update NavItem props signature**

Find:

```tsx
function NavItem({ to, labelKey, Icon }: { to: string; labelKey: string; Icon: React.FC<{ className?: string }> }) {
```

Replace with:

```tsx
function NavItem({ to, labelKey, Icon, collapsed }: { to: string; labelKey: string; Icon: React.FC<{ className?: string }>; collapsed: boolean }) {
```

- [ ] **Step 2: Update NavItem render for collapsed state**

Find the `<Link>` element inside `NavItem`:

```tsx
<Link
  to={to}
  className={`flex items-center gap-3 px-4 py-2.5 rounded-sm text-sm font-medium transition-all duration-150 ${
    isActive
      ? 'border-l-2 border-entity-world-muted bg-entity-world/[0.12] text-[#e8d5c8]'
      : 'text-[#8a7a9e] hover:text-[#c9b8ae] hover:bg-white/[0.04] border border-transparent'
  }`}
  aria-current={isActive ? 'page' : undefined}
>
  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-entity-world-muted' : ''}`} />
  {t(labelKey)}
</Link>
```

Replace with:

```tsx
<Link
  to={to}
  aria-label={collapsed ? t(labelKey) : undefined}
  title={collapsed ? t(labelKey) : undefined}
  className={`flex items-center gap-3 py-2.5 rounded-sm text-sm font-medium transition-all duration-150 ${
    collapsed ? 'justify-center px-2' : 'px-4'
  } ${
    isActive
      ? 'border-l-2 border-entity-world-muted bg-entity-world/[0.12] text-[#e8d5c8]'
      : 'text-[#8a7a9e] hover:text-[#c9b8ae] hover:bg-white/[0.04] border border-transparent'
  }`}
  aria-current={isActive ? 'page' : undefined}
>
  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-entity-world-muted' : ''}`} />
  {!collapsed && t(labelKey)}
</Link>
```

- [ ] **Step 3: Build and verify no TypeScript errors**

```bash
npm run build
```

Expected: build succeeds with zero errors.

- [ ] **Step 4: Start dev server and manually test**

```bash
npm run dev
```

Open `http://localhost:5173` in the browser. Log in and verify:

1. Sidebar is visible at ~240px wide with labels showing
2. Click the toggle button (bottom of sidebar, `PanelLeftClose` icon) — sidebar animates to ~48px, labels disappear, only icons visible
3. Hover over an icon — native tooltip shows the nav item name
4. Active nav item still shows left border indicator at 48px width
5. Click the toggle again — sidebar expands back to 240px with labels
6. Refresh the page — collapsed state is remembered (localStorage persists)
7. Shrink the browser to mobile width — the toggle button disappears, the Sheet drawer still works via the `☰` button in the topbar

- [ ] **Step 5: Test on WorldDetailPage**

Navigate to a world's detail page (with the graph canvas visible). Toggle the sidebar collapsed and expanded. Verify:

1. The graph canvas resizes correctly — no clipped controls, no misaligned minimap
2. The canvas redraws without requiring a user interaction (the `onAnimationComplete` resize dispatch handles this)

- [ ] **Step 6: Commit**

```bash
git add src/layouts/MainLayout.tsx
git commit -m "feat: collapsible icon-rail sidebar with localStorage persistence"
```

---

### Task 5: Smoke test and final verification

- [ ] **Step 1: Run linter**

```bash
npm run lint
```

Expected: no errors.

- [ ] **Step 2: Run production build**

```bash
npm run build
```

Expected: build succeeds, no TypeScript errors, no warnings about missing imports.

- [ ] **Step 3: Test reduced motion**

In browser DevTools → Rendering tab → enable "Emulate CSS prefers-reduced-motion: reduce". Toggle the sidebar. Verify the width change is instant with no spring animation.

- [ ] **Step 4: Test both languages**

In Settings → General, switch between Spanish and English. Toggle the sidebar. Verify the toggle button's tooltip (`aria-label` / `title`) shows in the correct language.

- [ ] **Step 5: Final commit if any lint fixes needed**

```bash
git add -p
git commit -m "chore: lint fixes for collapsible sidebar"
```

Only needed if Step 1 found issues.

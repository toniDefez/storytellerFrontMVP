# World Detail 4-Tab Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the sidebar world sub-navigation with four inline tabs (Causal, Locs, Personajes, Escenas) inside WorldDetailPage, restoring the original sidebar and adding character/scene list views backed by `/world-detail/get`.

**Architecture:** Extend `WorldDetailPage` state to hold a `GraphView` of 4 options and load `WorldDetail` on mount alongside existing graph loads. Personajes/Escenas tabs render inline list views with the world's `summary`/`premise` as a reference header. The sidebar reverts to its original two-item form.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, React Router v7, Lucide React, framer-motion

---

### Task 1: Add WorldDetail types and getWorldDetail to api.ts

**Files:**
- Modify: `src/services/api.ts` (after the `World` interface, ~line 58)

- [ ] **Step 1: Add types and function**

Open `src/services/api.ts`. After the `World` interface (line 58), add:

```ts
export interface CharacterBrief {
  id: number
  name: string
}

export interface SceneBrief {
  id: number
  title: string
  position: number
}

export interface WorldDetail {
  id: number
  name: string
  summary: string
  premise: string
  characters: CharacterBrief[]
  scenes: SceneBrief[]
}

export function getWorldDetail(id: number) {
  return request<WorldDetail>(`/world-detail/get?id=${id}`)
}
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add src/services/api.ts
git commit -m "feat(api): add WorldDetail types and getWorldDetail"
```

---

### Task 2: Revert MainLayout to original simple sidebar

**Files:**
- Modify: `src/layouts/MainLayout.tsx`

The current file has a `WorldSubNav` component and contextual `SidebarNav` logic that needs to be removed. The original sidebar only shows Worlds + Settings.

- [ ] **Step 1: Replace the imports line**

Find:
```ts
import { Globe, Settings, LogOut, Menu, PanelLeftClose, PanelLeftOpen, GitBranch, Users, Clapperboard } from 'lucide-react'
```

Replace with:
```ts
import { Globe, Settings, LogOut, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
```

- [ ] **Step 2: Remove WorldSubNav component**

Delete the entire `WorldSubNav` function (lines 38–82):
```ts
function WorldSubNav({ worldId, collapsed }: { worldId: string; collapsed: boolean }) {
  ...
}
```

- [ ] **Step 3: Replace SidebarNav with the simple version**

Find and replace the entire `SidebarNav` function with:
```ts
function SidebarNav({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation()

  return (
    <nav aria-label={t('a11y.sidebarNav')} className="flex-1 px-3 space-y-1">
      {!collapsed && (
        <p className="text-[10px] font-semibold text-[#5a4a72] uppercase tracking-widest px-4 mb-3">{t('a11y.sidebarNav')}</p>
      )}
      {NAV_ITEM_DEFS.map(item => (
        <NavItem key={item.to} {...item} collapsed={collapsed} />
      ))}
    </nav>
  )
}
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/MainLayout.tsx
git commit -m "fix(layout): revert sidebar to original simple nav"
```

---

### Task 3: Extend WorldDetailPage state and load WorldDetail

**Files:**
- Modify: `src/pages/home/WorldDetailPage.tsx`

- [ ] **Step 1: Add WorldDetail import**

In `WorldDetailPage.tsx`, find the import from `../../services/api`:
```ts
import { getWorldById, deleteWorld } from '../../services/api'
import type { World, WorldNode } from '../../services/api'
```

Replace with:
```ts
import { getWorldById, deleteWorld, getWorldDetail } from '../../services/api'
import type { World, WorldNode, WorldDetail } from '../../services/api'
```

- [ ] **Step 2: Extend graphView type and add worldDetail state**

Find:
```ts
const [graphView, setGraphView] = useState<'causal' | 'locations'>('causal')
```

Replace with:
```ts
const [graphView, setGraphView] = useState<'causal' | 'locations' | 'characters' | 'scenes'>('causal')
const [worldDetail, setWorldDetail] = useState<WorldDetail | null>(null)
```

- [ ] **Step 3: Load worldDetail alongside existing data**

Find the `Promise.all` in the mount `useEffect`:
```ts
Promise.all([
  getWorldById(worldId),
  graph.loadGraph(worldId),
])
  .then(([w]) => {
    setWorld(w)
    document.title = `${w.name} — StoryTeller`
  })
  .catch(err => setError(err.message))
  .finally(() => setLoading(false))
```

Replace with:
```ts
Promise.all([
  getWorldById(worldId),
  graph.loadGraph(worldId),
  getWorldDetail(worldId),
])
  .then(([w, , detail]) => {
    setWorld(w)
    setWorldDetail(detail)
    document.title = `${w.name} — StoryTeller`
  })
  .catch(err => setError(err.message))
  .finally(() => setLoading(false))
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/pages/home/WorldDetailPage.tsx
git commit -m "feat(world-detail): load WorldDetail data on mount"
```

---

### Task 4: Update toolbar tabs to 4 options

**Files:**
- Modify: `src/pages/home/WorldDetailPage.tsx`

- [ ] **Step 1: Replace the tab switcher in the toolbar**

Find the tab switcher div (the one with Causal and Locs buttons):
```tsx
{/* Tab switcher */}
<div className="flex items-center gap-0 shrink-0">
  <button
    onClick={() => setGraphView('causal')}
    className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
      graphView === 'causal'
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`}
  >
    Causal
  </button>
  <button
    onClick={() => setGraphView('locations')}
    className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
      graphView === 'locations'
        ? 'bg-[#14b8a6]/10 text-[#0f766e]'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`}
  >
    Locs
  </button>
</div>
```

Replace with:
```tsx
{/* Tab switcher */}
<div className="flex items-center gap-0 shrink-0">
  <button
    onClick={() => setGraphView('causal')}
    className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
      graphView === 'causal'
        ? 'bg-primary/10 text-primary'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`}
  >
    Causal
  </button>
  <button
    onClick={() => setGraphView('locations')}
    className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
      graphView === 'locations'
        ? 'bg-[#14b8a6]/10 text-[#0f766e]'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`}
  >
    Locs
  </button>
  <button
    onClick={() => setGraphView('characters')}
    className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
      graphView === 'characters'
        ? 'bg-[#f97316]/10 text-[#c2410c]'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`}
  >
    Personajes
  </button>
  <button
    onClick={() => setGraphView('scenes')}
    className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
      graphView === 'scenes'
        ? 'bg-[#06b6d4]/10 text-[#0e7490]'
        : 'text-muted-foreground hover:text-foreground hover:bg-accent'
    }`}
  >
    Escenas
  </button>
</div>
```

- [ ] **Step 2: Verify build passes**

```bash
npm run build
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/home/WorldDetailPage.tsx
git commit -m "feat(world-detail): add Personajes and Escenas tabs to toolbar"
```

---

### Task 5: Build Personajes and Escenas list views

**Files:**
- Create: `src/components/world-detail/WorldCharactersList.tsx`
- Create: `src/components/world-detail/WorldScenesList.tsx`
- Modify: `src/pages/home/WorldDetailPage.tsx`

- [ ] **Step 1: Create WorldCharactersList component**

Create `src/components/world-detail/WorldCharactersList.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { Users, Plus } from 'lucide-react'
import type { CharacterBrief } from '@/services/api'

interface Props {
  worldId: number
  characters: CharacterBrief[]
  worldSummary: string
}

export function WorldCharactersList({ worldId, characters, worldSummary }: Props) {
  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      {/* World reference */}
      {worldSummary && (
        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10 max-w-2xl">
          <p className="text-xs font-semibold text-primary/60 uppercase tracking-widest mb-1">Referencia del mundo</p>
          <p className="text-sm text-foreground/70 leading-relaxed">{worldSummary}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5 max-w-2xl">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#f97316]" />
          <h2 className="text-sm font-semibold text-foreground">
            Personajes
            {characters.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">({characters.length})</span>
            )}
          </h2>
        </div>
        <Link
          to={`/worlds/${worldId}/characters/create`}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-[#f97316]/10 text-[#c2410c] hover:bg-[#f97316]/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo personaje
        </Link>
      </div>

      {/* List */}
      {characters.length === 0 ? (
        <div className="max-w-2xl flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No hay personajes todavía.</p>
          <Link
            to={`/worlds/${worldId}/characters/create`}
            className="mt-3 text-xs text-[#c2410c] hover:underline"
          >
            Crea el primero
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl">
          {characters.map(c => (
            <Link
              key={c.id}
              to={`/worlds/${worldId}/characters/${c.id}`}
              className="group flex items-center gap-3 p-3.5 rounded-lg border border-border/60 bg-background hover:border-[#f97316]/30 hover:bg-[#f97316]/5 transition-all duration-150"
            >
              <div className="w-8 h-8 rounded-full bg-[#f97316]/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#f97316]" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-[#c2410c] transition-colors truncate">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Create WorldScenesList component**

Create `src/components/world-detail/WorldScenesList.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { Clapperboard, Plus } from 'lucide-react'
import type { SceneBrief } from '@/services/api'

interface Props {
  worldId: number
  scenes: SceneBrief[]
  worldSummary: string
}

export function WorldScenesList({ worldId, scenes, worldSummary }: Props) {
  const sorted = [...scenes].sort((a, b) => a.position - b.position)

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      {/* World reference */}
      {worldSummary && (
        <div className="mb-6 p-4 rounded-lg bg-[#06b6d4]/5 border border-[#06b6d4]/10 max-w-2xl">
          <p className="text-xs font-semibold text-[#0e7490]/60 uppercase tracking-widest mb-1">Referencia del mundo</p>
          <p className="text-sm text-foreground/70 leading-relaxed">{worldSummary}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5 max-w-2xl">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-[#06b6d4]" />
          <h2 className="text-sm font-semibold text-foreground">
            Escenas
            {scenes.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">({scenes.length})</span>
            )}
          </h2>
        </div>
        <Link
          to={`/worlds/${worldId}/scenes/create`}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-[#06b6d4]/10 text-[#0e7490] hover:bg-[#06b6d4]/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva escena
        </Link>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="max-w-2xl flex flex-col items-center justify-center py-16 text-center">
          <Clapperboard className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No hay escenas todavía.</p>
          <Link
            to={`/worlds/${worldId}/scenes/create`}
            className="mt-3 text-xs text-[#0e7490] hover:underline"
          >
            Crea la primera
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-w-2xl">
          {sorted.map(s => (
            <Link
              key={s.id}
              to={`/worlds/${worldId}/scenes/${s.id}`}
              className="group flex items-center gap-3 p-3.5 rounded-lg border border-border/60 bg-background hover:border-[#06b6d4]/30 hover:bg-[#06b6d4]/5 transition-all duration-150"
            >
              <div className="w-6 h-6 rounded bg-[#06b6d4]/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-[#0e7490]">
                {s.position + 1}
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-[#0e7490] transition-colors truncate">
                {s.title}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Wire up list views in WorldDetailPage**

In `WorldDetailPage.tsx`, add the imports at the top:
```tsx
import { WorldCharactersList } from '@/components/world-detail/WorldCharactersList'
import { WorldScenesList } from '@/components/world-detail/WorldScenesList'
```

Then find the full-viewport graph div (the one with `style={{ height: 'calc(100vh - 44px)' }}`):

Inside `<div className="relative h-full">`, after the closing `</div>` of the Locations canvas block, add:

```tsx
{/* Characters view */}
{graphView === 'characters' && (
  <div style={{ position: 'absolute', inset: 0 }}>
    <WorldCharactersList
      worldId={Number(id)}
      characters={worldDetail?.characters ?? []}
      worldSummary={worldDetail?.summary || world?.premise || ''}
    />
  </div>
)}

{/* Scenes view */}
{graphView === 'scenes' && (
  <div style={{ position: 'absolute', inset: 0 }}>
    <WorldScenesList
      worldId={Number(id)}
      scenes={worldDetail?.scenes ?? []}
      worldSummary={worldDetail?.summary || world?.premise || ''}
    />
  </div>
)}
```

- [ ] **Step 4: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/world-detail/WorldCharactersList.tsx src/components/world-detail/WorldScenesList.tsx src/pages/home/WorldDetailPage.tsx
git commit -m "feat(world-detail): add Personajes and Escenas list views"
```

---

### Task 6: Visual polish

**Files:**
- Modify: `src/components/world-detail/WorldCharactersList.tsx`
- Modify: `src/components/world-detail/WorldScenesList.tsx`

- [ ] **Step 1: Run /bolder on the list components**

Invoke the `bolder` skill targeting the two new components.

- [ ] **Step 2: Run /polish for final quality pass**

Invoke the `polish` skill for final alignment and consistency check.

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

- [ ] **Step 4: Final commit**

```bash
git add src/components/world-detail/WorldCharactersList.tsx src/components/world-detail/WorldScenesList.tsx
git commit -m "design: bolder + polish on world detail list views"
```

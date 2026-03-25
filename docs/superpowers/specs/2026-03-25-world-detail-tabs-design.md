# World Detail — 4-Tab Navigation Design

**Date:** 2026-03-25
**Status:** Approved

## Problem

The sidebar (`MainLayout`) was modified to add contextual world navigation (WorldSubNav with Grafos/Personajes/Escenas), which broke the existing sidebar design. Personajes and Escenas have no listing views accessible from the world context.

## Solution

1. Revert `MainLayout` to its original simple state (Worlds + Settings only).
2. Add Personajes and Escenas as tabs in the `WorldDetailPage` toolbar, at the same level as Causal and Locs.
3. Use the existing `/world-detail/get?id={id}` endpoint (already returns `characters[]` and `scenes[]`) — no backend changes needed.

## Architecture

### api.ts additions

```ts
export interface CharacterBrief { id: number; name: string }
export interface SceneBrief     { id: number; title: string; position: number }
export interface WorldDetail {
  id: number; name: string; summary: string; premise: string
  characters: CharacterBrief[]
  scenes: SceneBrief[]
}
export function getWorldDetail(id: number): Promise<WorldDetail>
```

### MainLayout.tsx changes

- Remove `WorldSubNav` component
- Remove `GitBranch`, `Users`, `Clapperboard` imports
- Remove world-context detection logic from `SidebarNav`
- Restore simple nav: Worlds + Settings

### WorldDetailPage.tsx changes

**State:**
```ts
type GraphView = 'causal' | 'locations' | 'characters' | 'scenes'
const [graphView, setGraphView] = useState<GraphView>('causal')
const [worldDetail, setWorldDetail] = useState<WorldDetail | null>(null)
```

**Data loading:** Add `getWorldDetail(worldId)` call alongside existing `getWorldById` + graph loads on mount.

**Toolbar:** 4 tabs inline — Causal · Locs · Personajes · Escenas. Each tab has its own active color:
- Causal → primary purple
- Locs → teal (`#14b8a6`)
- Personajes → warm orange (entity-character)
- Escenas → cyan (entity-scene)

**Personajes view:**
- World summary (`worldDetail.summary` or `world.premise`) shown as a reference card at the top
- Grid of character cards: name, link to `/worlds/:id/characters/:characterId`
- "Nuevo personaje" button → `/worlds/:id/characters/create`
- Empty state if no characters yet

**Escenas view:**
- Same world summary reference card
- List of scene cards: title, position badge, link to `/worlds/:worldId/scenes/:sceneId`
- "Nueva escena" button → `/worlds/:id/scenes/create`
- Empty state if no scenes yet

## Data Flow

```
WorldDetailPage mounts
  ├── getWorldById(id)          → world (name, premise, description)
  ├── graph.loadGraph(id)       → causal tree nodes
  ├── loadLocationGraph()       → location graph nodes/edges
  └── getWorldDetail(id)        → worldDetail (summary, characters[], scenes[])
```

The four data sources are independent — all fetched in parallel on mount.

## Visual Polish

- UI Designer agent for character/scene list components
- `/bolder` to amplify visual impact
- `/polish` for final quality pass

## Out of Scope

- Pagination for characters/scenes lists (acceptable for MVP scale)
- Character/scene search or filtering
- Backend changes (endpoint already exists)

# Character Graph — Edges + Warmth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the character psychology graph canvas (`CharacterGraphCanvas.tsx`) with floating edges, literary flow labels with animated particles, an official MiniMap, per-domain glyphs, a layered paper background, and a fistful of Fase 0 cleanup fixes (collision scoping, drag persistence, drawer-aware `fitView`, outline rename, a11y).

**Architecture:** All work is inside `src/components/character-graph/*`. Two new custom edge types live under `src/components/character-graph/edges/` with a shared geometry helper. The existing `GraphMinimap` is renamed (it's actually a decision flow outline). No backend, no data model, no routing changes.

**Tech Stack:** React 19, TypeScript, `@xyflow/react@12.10.1`, Tailwind 4, `framer-motion` (for `useReducedMotion`), `lucide-react`. No test framework is configured — verification is via `npm run lint`, `npm run build`, and specific manual browser checks per task.

**Spec:** `docs/superpowers/specs/2026-04-16-character-graph-edges-warmth-design.md` (commit `c9bd9d4`).

**Convention — canvas position persistence:** `canvas_x=0 && canvas_y=0` means "never persisted, compute from layout". Any non-zero pair means "user-placed, respect it". This mirrors `LocationGraphCanvas.tsx:82`.

**Convention — verification instead of TDD:** No test runner exists. Each task ends with (a) `npm run lint`, (b) in some cases `npm run build`, (c) a specific browser action + observable. Do not skip the browser check: the only way a CSS or positional regression surfaces is visually.

---

## File structure

### New files

- `src/components/character-graph/edges/getEdgeParams.ts` — geometry helper shared by all floating-style edges (v12 `useInternalNode` based).
- `src/components/character-graph/edges/FloatingEdge.tsx` — custom edge: bezier path anchored at intersections with source/target node rects. Used by orbital ↔ container edges.
- `src/components/character-graph/edges/LiteraryFlowEdge.tsx` — custom edge: smoothstep path + `EdgeLabelRenderer` label in real Lora + SVG ink-pool dot + optional `animateMotion` particle. Used by the 4 domain-chain edges.
- `src/components/character-graph/edges/index.ts` — barrel export so `CharacterGraphCanvas` imports from a single place.

### Renamed files

- `src/components/character-graph/GraphMinimap.tsx` → `src/components/character-graph/DecisionFlowOutline.tsx` (export `DecisionFlowOutline`). Use `git mv` so rename is preserved in history.

### Modified files

- `src/components/character-graph/CharacterGraphCanvas.tsx` — register `edgeTypes`, wrap in `ReactFlowProvider`, new props (`drawerOpen`, `onPersistPosition`), `resolveCollisions` scoped to orbitals, a11y on custom nodes, `<MiniMap />`, double `<Background />`, prefer persisted orbital positions, per-domain `lucide-react` icon, background tint.
- `src/components/character-graph/CharacterGraphPage.tsx` — pass `drawerOpen` and `onPersistPosition`, update rename import.
- `src/components/character-graph/useCharacterGraph.ts` — no changes (pre-existing `moveNode` already persists).

---

## Phase 0 — Trivial wins

### Task 0.1: Scope `resolveCollisions` to orbital nodes only

**Files:**
- Modify: `src/components/character-graph/CharacterGraphCanvas.tsx:327-369`

- [ ] **Step 1: Replace `resolveCollisions`**

Replace the body of `resolveCollisions` (lines 327-369) so containers, entry, and exit nodes are excluded from the collision pass. Only `type === 'child'` nodes are pushed around.

Target state of the function:

```ts
function resolveCollisions(nodes: Node[]): Node[] {
  type Box = { id: string; x: number; y: number; w: number; h: number }

  // Only orbital child nodes participate in collision resolution.
  // Containers (type 'container') and entry/exit pills stay anchored.
  const movable = nodes.filter(n => n.type === 'child')

  const boxes: Box[] = movable.map(n => ({
    id: n.id,
    x: n.position.x,
    y: n.position.y,
    w: (n.measured?.width  ?? 60) + MARGIN,
    h: (n.measured?.height ?? 60) + MARGIN,
  }))

  const MAX_ITER = 20
  for (let iter = 0; iter < MAX_ITER; iter++) {
    let moved = false
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        const a = boxes[i], b = boxes[j]
        const ax = a.x + a.w / 2, ay = a.y + a.h / 2
        const bx = b.x + b.w / 2, by = b.y + b.h / 2
        const dx = bx - ax, dy = by - ay
        const overlapX = (a.w + b.w) / 2 - Math.abs(dx)
        const overlapY = (a.h + b.h) / 2 - Math.abs(dy)
        if (overlapX > 0 && overlapY > 0) {
          moved = true
          if (overlapX < overlapY) {
            const push = overlapX / 2 * (dx > 0 ? 1 : -1)
            a.x -= push; b.x += push
          } else {
            const push = overlapY / 2 * (dy > 0 ? 1 : -1)
            a.y -= push; b.y += push
          }
        }
      }
    }
    if (!moved) break
  }

  const boxById = new Map(boxes.map(b => [b.id, b]))
  return nodes.map(n => {
    const box = boxById.get(n.id)
    if (!box) return n   // containers + pills pass through untouched
    return { ...n, position: { x: box.x, y: box.y } }
  })
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no errors introduced; warnings unchanged.

- [ ] **Step 3: Browser check**

Run `npm run dev`, open a character with ≥ 5 orbitals, drag an orbital forcefully over a container. **Expected:** container and entry/exit pills do NOT move; only the dragged orbital (and any other orbitals it pushes) shift.

- [ ] **Step 4: Commit**

```bash
git add src/components/character-graph/CharacterGraphCanvas.tsx
git commit -m "fix(character-graph): scope drag collisions to orbital nodes"
```

---

### Task 0.2: Persist orbital drag positions

**Files:**
- Modify: `src/components/character-graph/CharacterGraphCanvas.tsx` (props, `buildElements`, `handleNodeDragStop`)
- Modify: `src/components/character-graph/CharacterGraphPage.tsx` (pass `moveNode` as prop)

- [ ] **Step 1: Add `onPersistPosition` prop to `CharacterGraphCanvas`**

In `CharacterGraphCanvas.tsx`, extend the `Props` interface (around line 577):

```ts
interface Props {
  nodes: CharacterNode[]
  selectedNodeId: number | null
  synthesis: DomainSynthesis[]
  synthesisLoading: string | null
  onSelectNode: (id: number | null) => void
  onContainerClick: (domain: CharacterNodeDomain) => void
  onContextMenu?: (event: ContextMenuEvent) => void
  /** Persists orbital drag-stop position. Pass `moveNode` from useCharacterGraph. */
  onPersistPosition?: (id: number, x: number, y: number) => void
}
```

And in the destructure (around line 587):

```ts
export function CharacterGraphCanvas({
  nodes: charNodes,
  selectedNodeId,
  synthesis,
  synthesisLoading,
  onSelectNode,
  onContainerClick,
  onContextMenu,
  onPersistPosition,
}: Props) {
```

- [ ] **Step 2: Prefer persisted orbital positions in `buildElements`**

In `buildElements` (lines 464-483), replace the orbital node creation block so it falls back to `getOrbitalPositions` only when `canvas_x === 0 && canvas_y === 0`. Target state:

```ts
    for (let i = 0; i < domainNodes.length; i++) {
      const cn = domainNodes[i]
      const size = getSalienceSize(cn.salience)

      // Persisted position wins; fallback to computed layout if never dragged.
      const hasPersisted = cn.canvas_x !== 0 || cn.canvas_y !== 0
      const layoutPos = orbitalPos[i]
      const position = hasPersisted
        ? { x: cn.canvas_x, y: cn.canvas_y }
        : { x: layoutPos.x - size / 2, y: layoutPos.y - size / 2 }

      nodes.push({
        id: `node-${cn.id}`,
        type: 'child',
        position,
        draggable: true,
        selectable: true,
        data: {
          nodeId: cn.id,
          label: cn.label,
          color: meta.color,
          salience: cn.salience,
          isSelected: cn.id === selectedId,
          onSelect,
        },
      })

      edges.push({
        id: `orbital-edge-${cn.id}`,
        source: `node-${cn.id}`,
        target: `container-${meta.domain}`,
        targetHandle: 'right',
        type: 'straight',
        animated: false,
        style: {
          stroke: meta.color,
          strokeWidth: 1,
          opacity: 0.3,
        },
      })
    }
```

(The edge block is kept as-is for now. Task 1.3 migrates it to `floating`.)

- [ ] **Step 3: Replace `handleNodeDragStop` to also persist**

In `CharacterGraphCanvas.tsx` (lines 628-630), replace:

```ts
  const handleNodeDragStop = useCallback(() => {
    setNodes(nds => resolveCollisions(nds))
  }, [setNodes])
```

with:

```ts
  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      setNodes(nds => resolveCollisions(nds))
      // Only persist orbital positions. Containers/pills are not user-positioned yet (Fase 2).
      if (draggedNode.type === 'child' && draggedNode.id.startsWith('node-') && onPersistPosition) {
        const nodeId = parseInt(draggedNode.id.slice(5), 10)
        if (!Number.isNaN(nodeId)) {
          onPersistPosition(nodeId, draggedNode.position.x, draggedNode.position.y)
        }
      }
    },
    [setNodes, onPersistPosition],
  )
```

Note: React Flow's `onNodeDragStop` signature is `(event, node, nodes) => void` — we use only `node`.

- [ ] **Step 4: Wire `moveNode` from `CharacterGraphPage`**

In `CharacterGraphPage.tsx`, destructure `moveNode` from `useCharacterGraph` (around line 32):

```ts
  const {
    nodes, voiceRegister, chatMessages, characterName,
    mode, selectedNodeId, loading, chatLoading, generating, error,
    synthesis, synthesisLoading,
    soul, soulLoading,
    voiceExamples, premise, speechPattern, generatingExamples,
    loadGraph, removeNode, editNode, moveNode,
    updateVoice, saveExamples, generateExamples, sendMessage, generateNodes, clearChat,
    toggleMode, setSelectedNodeId,
    addFromCatalog, addFromContextual, regenerateSynthesis,
    regenerateSoul,
  } = useCharacterGraph(characterId)
```

Then pass it to the canvas (around line 211-219):

```tsx
              <CharacterGraphCanvas
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                synthesis={synthesis}
                synthesisLoading={synthesisLoading}
                onSelectNode={handleSelectNode}
                onContainerClick={handleContainerClick}
                onContextMenu={handleContextMenu}
                onPersistPosition={moveNode}
              />
```

- [ ] **Step 5: Lint + build**

Run: `npm run lint && npm run build`
Expected: no TS errors, no new lint errors.

- [ ] **Step 6: Browser check**

Open a character with ≥ 3 orbitals. Drag one orbital 200px in any direction. **Hard refresh** (Ctrl+Shift+R). **Expected:** the orbital reappears at its dragged position, not back in the layout slot.

- [ ] **Step 7: Commit**

```bash
git add src/components/character-graph/CharacterGraphCanvas.tsx src/components/character-graph/CharacterGraphPage.tsx
git commit -m "feat(character-graph): persist orbital drag positions"
```

---

### Task 0.3: Drawer-aware `fitView`

**Files:**
- Modify: `src/components/character-graph/CharacterGraphCanvas.tsx`

- [ ] **Step 1: Add `drawerOpen` prop**

Extend `Props` (from Task 0.2):

```ts
interface Props {
  // ...existing props
  onPersistPosition?: (id: number, x: number, y: number) => void
  /** When the right-side drawer opens/closes, canvas refits to compensate. */
  drawerOpen: boolean
}
```

And destructure it:

```ts
export function CharacterGraphCanvas({
  ...,
  onPersistPosition,
  drawerOpen,
}: Props) {
```

- [ ] **Step 2: Split the component into outer + inner, wrap in `ReactFlowProvider`**

`useReactFlow()` only works inside `<ReactFlowProvider>`. Today the canvas is one component; the cheapest refactor is to split it.

Add to the imports at the top of the file:

```ts
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  Panel,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeToolbar,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react'
```

Then rename the exported function `CharacterGraphCanvas` to `CharacterGraphCanvasInner` (keep everything the same internally), and add a new wrapper export below it:

```ts
function CharacterGraphCanvasInner(props: Props) {
  // ...all the existing logic unchanged, up to and including the <ReactFlow>…</ReactFlow> return
}

export function CharacterGraphCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CharacterGraphCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
```

Internal name change is invisible to `CharacterGraphPage.tsx` — only the exported `CharacterGraphCanvas` is imported.

- [ ] **Step 3: Refit canvas on drawer toggle**

Inside `CharacterGraphCanvasInner`, import `useReducedMotion` from framer-motion at the top of the file if not already imported:

```ts
import { useReducedMotion } from 'framer-motion'
```

Add the effect near the other `useEffect`s (around line 623):

```ts
  const reactFlow = useReactFlow()
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    // Debounced slightly so it runs AFTER the drawer's transition starts occupying space.
    const t = window.setTimeout(() => {
      reactFlow.fitView({
        padding: 0.12,
        duration: prefersReducedMotion ? 0 : 250,
      })
    }, 120)
    return () => window.clearTimeout(t)
  }, [drawerOpen, reactFlow, prefersReducedMotion])
```

The 120ms delay roughly matches shadcn's default Sheet animation so the canvas refits once the drawer is visually in place.

- [ ] **Step 4: Pass `drawerOpen` from the page**

In `CharacterGraphPage.tsx`, pass the prop alongside the others (update the block you changed in Task 0.2):

```tsx
              <CharacterGraphCanvas
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                synthesis={synthesis}
                synthesisLoading={synthesisLoading}
                onSelectNode={handleSelectNode}
                onContainerClick={handleContainerClick}
                onContextMenu={handleContextMenu}
                onPersistPosition={moveNode}
                drawerOpen={selectedContainer !== null}
              />
```

- [ ] **Step 5: Lint + build**

Run: `npm run lint && npm run build`
Expected: no TS errors.

- [ ] **Step 6: Browser check**

Open a character, click a container to open the catalog drawer. **Expected:** the canvas smoothly refits within ~250ms so all 5 containers remain visible (not cut off by the drawer). Close the drawer — the canvas refits again to fill the freed space.

- [ ] **Step 7: Commit**

```bash
git add src/components/character-graph/CharacterGraphCanvas.tsx src/components/character-graph/CharacterGraphPage.tsx
git commit -m "feat(character-graph): refit canvas when catalog drawer toggles"
```

---

### Task 0.4: Rename `GraphMinimap` → `DecisionFlowOutline`

**Files:**
- Rename: `src/components/character-graph/GraphMinimap.tsx` → `src/components/character-graph/DecisionFlowOutline.tsx`
- Modify: `src/components/character-graph/CharacterGraphPage.tsx` (import)

- [ ] **Step 1: Git-rename the file**

Run: `git mv src/components/character-graph/GraphMinimap.tsx src/components/character-graph/DecisionFlowOutline.tsx`

- [ ] **Step 2: Rename the exported component inside the file**

Open `src/components/character-graph/DecisionFlowOutline.tsx`. Replace the export line (was line 22):

```ts
export function GraphMinimap({ nodes, selectedNodeId, onSelectNode, onRemoveNode }: Props) {
```

with:

```ts
export function DecisionFlowOutline({ nodes, selectedNodeId, onSelectNode, onRemoveNode }: Props) {
```

No other references to `GraphMinimap` exist inside the file (it's self-contained).

- [ ] **Step 3: Update the import in the page**

In `src/components/character-graph/CharacterGraphPage.tsx`, change line 8:

```ts
import { GraphMinimap } from './GraphMinimap'
```

to:

```ts
import { DecisionFlowOutline } from './DecisionFlowOutline'
```

And change the usage at line 346:

```tsx
                <GraphMinimap
                  nodes={nodes}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={(id) => setSelectedNodeId(id)}
                  onRemoveNode={handleRemoveNode}
                />
```

to:

```tsx
                <DecisionFlowOutline
                  nodes={nodes}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={(id) => setSelectedNodeId(id)}
                  onRemoveNode={handleRemoveNode}
                />
```

- [ ] **Step 4: Grep for stragglers**

Run: `git grep -n "GraphMinimap"`
Expected: no results. If any remain, update them (no other call sites are known).

- [ ] **Step 5: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 6: Browser check**

Switch to "Hablar" mode for a character with nodes. **Expected:** the vertical pipeline outline on the left still renders identically.

- [ ] **Step 7: Commit**

```bash
git add src/components/character-graph/
git commit -m "refactor(character-graph): rename GraphMinimap to DecisionFlowOutline"
```

---

### Task 0.5: Keyboard and screen-reader affordances on custom nodes

**Files:**
- Modify: `src/components/character-graph/CharacterGraphCanvas.tsx` (`ContainerNode`, `OrbitalNode`)

- [ ] **Step 1: Make `ContainerNode` keyboard-accessible**

Target state of the outer `<div>` in `ContainerNode` (around lines 126-139). Replace with:

```tsx
    <div
      role="button"
      tabIndex={0}
      aria-label={`Dominio ${data.label as string}, ${data.childCount as number} nodos`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
          // Container click is handled at ReactFlow level via onNodeClick; simulate the same by
          // dispatching a click on self — React Flow catches it through event bubbling.
          ;(e.currentTarget as HTMLElement).click()
        }
      }}
      className="rounded-xl overflow-hidden transition-all duration-300 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-2"
      style={{
        width: CONTAINER_WIDTH,
        height: CONTAINER_HEIGHT,
        background: data.bg as string,
        border: isEmpty
          ? `2px dashed ${data.color}28`
          : isStale
          ? `2px solid #F59E0B`
          : `2px solid ${data.color}35`,
        opacity: isEmpty ? 0.5 : 1,
      }}
    >
```

(The `click()` dispatch is how we trigger the existing `handleNodeClick` without duplicating logic. React Flow's `onNodeClick` listens for clicks inside the node element.)

- [ ] **Step 2: Make `OrbitalNode` keyboard-accessible**

Replace the outer `<div>` in `OrbitalNode` (around lines 252-281) with:

```tsx
      <div
        role="button"
        tabIndex={0}
        aria-label={`${data.label as string}, intensidad ${data.salience as number}/10`}
        aria-pressed={isSelected}
        className="cursor-pointer rounded-full transition-all duration-150 hover:scale-110 flex items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-amber-500 focus-visible:outline-offset-2"
        style={{
          width: size,
          height: size,
          background: color,
          boxShadow: isSelected
            ? `0 0 0 3px white, 0 0 0 5px ${color}`
            : `0 2px 8px ${color}40`,
        }}
        onClick={(e) => { e.stopPropagation(); data.onSelect(data.nodeId as number) }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            data.onSelect(data.nodeId as number)
          }
        }}
      >
```

- [ ] **Step 3: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 4: Browser check**

With the dev server open, click anywhere in the canvas area, then repeatedly press Tab. When focus lands on a container or orbital, observe a visible amber focus ring. Press Enter — the orbital should toggle selection; the container should open the catalog drawer. Verify nothing you Tab-focus is invisible.

- [ ] **Step 5: Commit**

```bash
git add src/components/character-graph/CharacterGraphCanvas.tsx
git commit -m "feat(character-graph): keyboard + screen-reader affordances on custom nodes"
```

---

## Phase 1 — Edges + Warmth

### Task 1.1: Geometry helper for floating edges

**Files:**
- Create: `src/components/character-graph/edges/getEdgeParams.ts`

- [ ] **Step 1: Create the directory and helper file**

Write the full content of `src/components/character-graph/edges/getEdgeParams.ts`:

```ts
import { Position } from '@xyflow/react'
import type { InternalNode, Node } from '@xyflow/react'

/**
 * Ported from React Flow's "Simple Floating Edges" example, adapted to v12:
 *   - `node.internals.positionAbsolute` replaces v11's `nodeInternals.get().positionAbsolute`.
 *   - `node.measured` supersedes `node.width/height`.
 * The helper computes the intersection of the line connecting two node centers
 * with each node's bounding box, so edges attach to the nearest side instead of
 * a fixed handle.
 */

function getNodeIntersection(
  intersectionNode: InternalNode<Node>,
  targetNode: InternalNode<Node>,
): { x: number; y: number } {
  const iw = intersectionNode.measured?.width ?? 0
  const ih = intersectionNode.measured?.height ?? 0
  const tw = targetNode.measured?.width ?? 0
  const th = targetNode.measured?.height ?? 0

  const ipos = intersectionNode.internals.positionAbsolute
  const tpos = targetNode.internals.positionAbsolute

  const w = iw / 2
  const h = ih / 2

  const x2 = ipos.x + w
  const y2 = ipos.y + h
  const x1 = tpos.x + tw / 2
  const y1 = tpos.y + th / 2

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1)
  const xx3 = a * xx1
  const yy3 = a * yy1
  const x = w * (xx3 + yy3) + x2
  const y = h * (yy3 - xx3) + y2

  return { x, y }
}

function getEdgePosition(
  node: InternalNode<Node>,
  intersectionPoint: { x: number; y: number },
): Position {
  const nx = Math.round(node.internals.positionAbsolute.x)
  const ny = Math.round(node.internals.positionAbsolute.y)
  const nw = node.measured?.width ?? 0
  const nh = node.measured?.height ?? 0
  const px = Math.round(intersectionPoint.x)
  const py = Math.round(intersectionPoint.y)

  if (px <= nx + 1) return Position.Left
  if (px >= nx + nw - 1) return Position.Right
  if (py <= ny + 1) return Position.Top
  if (py >= ny + nh - 1) return Position.Bottom
  return Position.Top
}

export function getEdgeParams(
  source: InternalNode<Node>,
  target: InternalNode<Node>,
): {
  sx: number; sy: number
  tx: number; ty: number
  sourcePos: Position; targetPos: Position
} {
  const sourceIntersectionPoint = getNodeIntersection(source, target)
  const targetIntersectionPoint = getNodeIntersection(target, source)
  const sourcePos = getEdgePosition(source, sourceIntersectionPoint)
  const targetPos = getEdgePosition(target, targetIntersectionPoint)
  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  }
}
```

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors (file is unused by anything yet, so this is a type-check only).

- [ ] **Step 3: Commit**

```bash
git add src/components/character-graph/edges/getEdgeParams.ts
git commit -m "feat(character-graph): add floating-edge geometry helper (v12)"
```

---

### Task 1.2: `FloatingEdge` component

**Files:**
- Create: `src/components/character-graph/edges/FloatingEdge.tsx`

- [ ] **Step 1: Create the component**

Write the full content of `src/components/character-graph/edges/FloatingEdge.tsx`:

```tsx
import { BaseEdge, getBezierPath, useInternalNode } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import { getEdgeParams } from './getEdgeParams'

/**
 * Bezier edge anchored at the intersection of the source/target node bounding
 * boxes. Use for orbital ↔ container edges so lines never pile onto a single
 * handle point.
 */
export function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  markerStart,
  style,
}: EdgeProps) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) return null

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode)

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  })

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      markerStart={markerStart}
      style={style}
    />
  )
}
```

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/character-graph/edges/FloatingEdge.tsx
git commit -m "feat(character-graph): add FloatingEdge custom edge component"
```

---

### Task 1.3: Migrate orbital edges to `floating` type

**Files:**
- Modify: `src/components/character-graph/CharacterGraphCanvas.tsx`

- [ ] **Step 1: Register `edgeTypes`**

Near the top of `CharacterGraphCanvas.tsx`, after the `nodeTypes` declaration (around line 290-295), add:

```ts
import { FloatingEdge } from './edges/FloatingEdge'

const nodeTypes = {
  container: ContainerNode,
  child: OrbitalNode,
  entry: EntryNode,
  exit: ExitNode,
}

const edgeTypes = {
  floating: FloatingEdge,
}
```

The `import` line must be hoisted to the top of the file with the other imports — do not leave it mid-file. Move it up alongside the existing `@xyflow/react` import.

- [ ] **Step 2: Pass `edgeTypes` to `<ReactFlow>`**

In the JSX return (around line 678), add the prop:

```tsx
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onPaneClick={handlePaneClick}
      onNodeClick={handleNodeClick}
      onNodeDragStop={handleNodeDragStop}
      onNodeContextMenu={handleNodeContextMenu}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      minZoom={0.5}
      maxZoom={1.5}
      className="bg-[hsl(40_20%_97%)]"
      proOptions={{ hideAttribution: true }}
    >
```

- [ ] **Step 3: Switch orbital edges to `floating`**

Inside `buildElements`, replace the orbital edge push (lines 486-498) with:

```ts
      edges.push({
        id: `orbital-edge-${cn.id}`,
        source: `node-${cn.id}`,
        target: `container-${meta.domain}`,
        type: 'floating',
        style: {
          stroke: meta.color,
          strokeWidth: 1,
          opacity: 0.35,
        },
      })
```

Note: `targetHandle: 'right'` is intentionally removed — floating edges compute anchor points themselves. `animated: false` is also removed; it was the default.

- [ ] **Step 4: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 5: Browser check**

Open a character with orbitals in ≥ 2 domains. Drag an orbital above the container midline, then below it. **Expected:** the edge re-anchors to the nearest side of the container (top vs. bottom) instead of always going to the right-middle point. With 5+ orbitals stacked, edges no longer converge on one spot.

- [ ] **Step 6: Commit**

```bash
git add src/components/character-graph/CharacterGraphCanvas.tsx
git commit -m "feat(character-graph): orbital edges now float to nearest container side"
```

---

### Task 1.4: `LiteraryFlowEdge` component

**Files:**
- Create: `src/components/character-graph/edges/LiteraryFlowEdge.tsx`

- [ ] **Step 1: Create the component**

Write the full content of `src/components/character-graph/edges/LiteraryFlowEdge.tsx`:

```tsx
import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import { useReducedMotion } from 'framer-motion'

interface LiteraryFlowEdgeData extends Record<string, unknown> {
  label: string
  /** Hex color of the source domain — drives ink-pool and particle color. */
  domainColor: string
  /** Index of this edge in the chain (0..3); staggers the particle animation. */
  chainIndex: number
}

/**
 * Custom edge for the 4 domain-chain edges (CREENCIAS → MIEDOS → … → MASCARAS).
 * - Path: smoothstep (preserves the existing vertical cascade).
 * - Label: rendered in the HTML layer via EdgeLabelRenderer so real Lora italic
 *   can be used (SVG <text> rendered the serif poorly).
 * - Ink-pool: small SVG circle at 20% of the path in the domain color.
 * - Particle: an animated circle gliding from source to target, reinforcing
 *   the "causation flows downward" metaphor. Respects prefers-reduced-motion.
 */
export function LiteraryFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const prefersReducedMotion = useReducedMotion()
  const edgeData = (data ?? {}) as Partial<LiteraryFlowEdgeData>
  const label = edgeData.label ?? ''
  const domainColor = edgeData.domainColor ?? '#a8a29e'
  const chainIndex = edgeData.chainIndex ?? 0

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />

      {/* Ink-pool: static dot at 20% of the path so the label has a visual anchor. */}
      <circle r={3} fill={domainColor}>
        <animateMotion
          dur="0.001s"
          repeatCount="1"
          fill="freeze"
          keyPoints="0.2;0.2"
          keyTimes="0;1"
          path={edgePath}
        />
      </circle>

      {/* Animated particle — or static dot if reduced-motion. */}
      {prefersReducedMotion ? (
        <circle r={3} fill={domainColor} opacity={0.7}>
          <animateMotion
            dur="0.001s"
            repeatCount="1"
            fill="freeze"
            keyPoints="0.5;0.5"
            keyTimes="0;1"
            path={edgePath}
          />
        </circle>
      ) : (
        <circle r={3} fill={domainColor} opacity={0.85}>
          <animateMotion
            dur="4s"
            repeatCount="indefinite"
            path={edgePath}
            begin={`${chainIndex}s`}
          />
        </circle>
      )}

      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-auto font-display italic text-[11px] leading-snug text-stone-500 bg-[hsl(40_20%_97%)]/90 px-2 py-0.5 rounded-sm"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}
```

- [ ] **Step 2: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/character-graph/edges/LiteraryFlowEdge.tsx
git commit -m "feat(character-graph): add LiteraryFlowEdge with EdgeLabelRenderer"
```

---

### Task 1.5: Migrate domain-chain edges to `literaryFlow`

**Files:**
- Modify: `src/components/character-graph/CharacterGraphCanvas.tsx`

- [ ] **Step 1: Register the new edge type**

Extend the import and `edgeTypes` declaration from Task 1.3:

```ts
import { FloatingEdge } from './edges/FloatingEdge'
import { LiteraryFlowEdge } from './edges/LiteraryFlowEdge'

// ...

const edgeTypes = {
  floating: FloatingEdge,
  literaryFlow: LiteraryFlowEdge,
}
```

- [ ] **Step 2: Replace the `flowPath` edge push**

In `buildElements`, find the `for (const { from, to, label } of flowPath)` loop (lines 522-556). Replace it with:

```ts
  for (let idx = 0; idx < flowPath.length; idx++) {
    const { from, to, label } = flowPath[idx]
    const fromMeta = ALL_CONTAINERS.find(c => c.domain === from)
    const color = fromMeta?.color ?? '#a8a29e'
    edges.push({
      id: `flow-${from}-${to}`,
      source: `container-${from}`,
      target: `container-${to}`,
      sourceHandle: 'bottom',
      targetHandle: 'top',
      type: 'literaryFlow',
      data: {
        label,
        domainColor: color,
        chainIndex: idx,
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: `${color}90`,
        width: 16,
        height: 16,
      },
      style: {
        stroke: `${color}70`,
        strokeWidth: 2,
      },
    })
  }
```

Note: the `label`, `labelStyle`, `labelBgStyle`, `labelBgPadding`, `labelBgBorderRadius` fields are removed — `LiteraryFlowEdge` renders the label itself via `EdgeLabelRenderer`. `animated: false` is removed (default).

- [ ] **Step 3: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 4: Browser check**

Open a character with ≥ 3 domain containers populated. **Expected:**
1. The 4 chain labels ("lo que da por hecho define lo que teme perder", …) render in **real Lora italic** (serif with proper kerning), not SVG text.
2. A small colored ink-dot sits near the start of each chain edge.
3. A second colored dot glides from source container to target container on a 4s loop, staggered across the 4 edges.
4. With DevTools → Rendering → "Emulate CSS prefers-reduced-motion" set to "reduce", the moving dot freezes at the path midpoint.

- [ ] **Step 5: Commit**

```bash
git add src/components/character-graph/CharacterGraphCanvas.tsx
git commit -m "feat(character-graph): domain chain uses literaryFlow edge with animated particle"
```

---

### Task 1.6: Barrel export for edges

**Files:**
- Create: `src/components/character-graph/edges/index.ts`

- [ ] **Step 1: Create the barrel**

Write the full content of `src/components/character-graph/edges/index.ts`:

```ts
export { FloatingEdge } from './FloatingEdge'
export { LiteraryFlowEdge } from './LiteraryFlowEdge'
export { getEdgeParams } from './getEdgeParams'
```

- [ ] **Step 2: Collapse imports in `CharacterGraphCanvas.tsx`**

Replace the two separate imports from Tasks 1.3 and 1.5:

```ts
import { FloatingEdge } from './edges/FloatingEdge'
import { LiteraryFlowEdge } from './edges/LiteraryFlowEdge'
```

with:

```ts
import { FloatingEdge, LiteraryFlowEdge } from './edges'
```

- [ ] **Step 3: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/character-graph/edges/index.ts src/components/character-graph/CharacterGraphCanvas.tsx
git commit -m "refactor(character-graph): barrel-export edge components"
```

---

### Task 1.7: Official `<MiniMap />`

**Files:**
- Modify: `src/components/character-graph/CharacterGraphCanvas.tsx`

- [ ] **Step 1: Import `MiniMap`**

Extend the existing `@xyflow/react` import block:

```ts
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeToolbar,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react'
```

- [ ] **Step 2: Render `<MiniMap />`**

Inside `<ReactFlow>`, before the existing `<Background>`, add:

```tsx
      <MiniMap
        position="bottom-right"
        nodeColor={(n) => (n.data?.color as string | undefined) ?? '#c4b9ae'}
        nodeStrokeWidth={0}
        maskColor="rgba(120, 113, 108, 0.12)"
        bgColor="hsl(40 20% 97%)"
        pannable
        zoomable
        style={{ border: '1px solid #e7e0d8', borderRadius: 8 }}
      />
```

`n.data?.color` exists for both `ContainerNode` and `OrbitalNode`. Entry/exit pills return the fallback beige.

- [ ] **Step 3: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 4: Browser check**

Open a character graph. **Expected:** a minimap appears at the bottom-right, showing all 5 containers as small colored rectangles (indigo/red/amber/emerald/violet — matching the domain colors) and orbitals as small colored dots. Drag inside the minimap to pan the main canvas; scroll over the minimap to zoom.

- [ ] **Step 5: Commit**

```bash
git add src/components/character-graph/CharacterGraphCanvas.tsx
git commit -m "feat(character-graph): add official MiniMap with domain coloring"
```

---

### Task 1.8: Per-domain glyphs

**Files:**
- Modify: `src/components/character-graph/CharacterGraphCanvas.tsx`

- [ ] **Step 1: Import the icons, verify `VenetianMask` exists**

Replace the existing `lucide-react` import (line 17) with:

```ts
import { BookOpen, RefreshCw, Sprout, Flame, Compass, Zap, VenetianMask } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
```

Run `npm run build` immediately. If `VenetianMask` is not exported by the installed `lucide-react` version, the build fails with a clear TS error. In that case, replace `VenetianMask` with `Drama` in both the import and the `ALL_CONTAINERS` mapping below. If `Drama` also fails, fall back to `Shield`.

- [ ] **Step 2: Extend `ContainerMeta` with an `icon` field**

Replace the `ContainerMeta` interface (around lines 22-28) and the `ALL_CONTAINERS` array (lines 30-36):

```ts
interface ContainerMeta {
  domain: CharacterNodeDomain
  label: string
  subtitle: string
  color: string
  bg: string
  icon: LucideIcon
}

const ALL_CONTAINERS: ContainerMeta[] = [
  { domain: 'origin', label: 'CREENCIAS', subtitle: '¿Que da por hecho?', color: '#6366F1', bg: '#eef2ff', icon: Sprout },
  { domain: 'fear',   label: 'MIEDOS',    subtitle: '¿Que evita?',        color: '#EF4444', bg: '#fef2f2', icon: Flame },
  { domain: 'drive',  label: 'DESEOS',    subtitle: '¿Que persigue?',     color: '#F59E0B', bg: '#fffbeb', icon: Compass },
  { domain: 'bond',   label: 'GRIETAS',   subtitle: '¿Donde se rompe?',   color: '#8B5CF6', bg: '#f5f3ff', icon: Zap },
  { domain: 'mask',   label: 'MASCARAS',  subtitle: '¿Que muestra?',      color: '#10B981', bg: '#ecfdf5', icon: VenetianMask },
]
```

- [ ] **Step 3: Pass the icon through `ContainerData` and render it**

Extend the `ContainerData` interface (around lines 107-117) with:

```ts
interface ContainerData extends Record<string, unknown> {
  domain: string
  label: string
  subtitle: string
  color: string
  bg: string
  childCount: number
  synthesis: string
  isStale: boolean
  isSynthesisLoading: boolean
  icon: LucideIcon
}
```

Then in `ContainerNode`, replace the header `<BookOpen />` (line 153):

```tsx
        <BookOpen className="w-4 h-4 shrink-0 opacity-40" style={{ color: data.color as string }} />
```

with:

```tsx
        {(() => {
          const Icon = data.icon as LucideIcon
          return <Icon className="w-4 h-4 shrink-0 opacity-40" style={{ color: data.color as string }} />
        })()}
```

The IIFE is there because `data.icon` isn't a capitalized identifier in scope — JSX needs a capitalized component reference.

- [ ] **Step 4: Pass `icon` into the node data**

In `buildElements`, update the container node data block (lines 447-458):

```ts
    nodes.push({
      id: `container-${meta.domain}`,
      type: 'container',
      position: pos,
      draggable: true,
      selectable: true,
      data: {
        domain: meta.domain,
        label: meta.label,
        subtitle: meta.subtitle,
        color: meta.color,
        bg: meta.bg,
        childCount,
        synthesis: domainSynth?.synthesis || '',
        isStale: domainSynth?.is_stale ?? false,
        isSynthesisLoading: synthesisLoading === meta.domain,
        icon: meta.icon,
      },
    })
```

- [ ] **Step 5: Remove the now-unused `BookOpen` import**

Adjust the import line from Step 1:

```ts
import { RefreshCw, Sprout, Flame, Compass, Zap, VenetianMask } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
```

- [ ] **Step 6: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors; no unused-import warnings.

- [ ] **Step 7: Browser check**

Open a character graph. **Expected:** each of the 5 container headers shows a unique icon in its domain color — sprout for CREENCIAS, flame for MIEDOS, compass for DESEOS, zap for GRIETAS, mask for MASCARAS. No `BookOpen` anywhere.

- [ ] **Step 8: Commit**

```bash
git add src/components/character-graph/CharacterGraphCanvas.tsx
git commit -m "feat(character-graph): per-domain lucide glyphs replace repeated BookOpen"
```

---

### Task 1.9: Layered paper background

**Files:**
- Modify: `src/components/character-graph/CharacterGraphCanvas.tsx`

- [ ] **Step 1: Import `BackgroundVariant`**

Extend the `@xyflow/react` import:

```ts
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Panel,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  NodeToolbar,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react'
```

- [ ] **Step 2: Replace the single `<Background />` with two layers**

In the JSX return, replace:

```tsx
      <Background color="#e8e0d4" gap={20} size={1} />
```

with:

```tsx
      <Background
        id="paper"
        variant={BackgroundVariant.Lines}
        color="#efe6d7"
        lineWidth={0.4}
        gap={32}
      />
      <Background
        id="dots"
        variant={BackgroundVariant.Dots}
        color="#d6cdbe"
        gap={20}
        size={1}
      />
```

- [ ] **Step 3: Warm up the canvas base tint**

Change the `className` on `<ReactFlow>` (around line 691) from:

```tsx
      className="bg-[hsl(40_20%_97%)]"
```

to:

```tsx
      className="bg-[hsl(40_30%_96%)]"
```

- [ ] **Step 4: Lint + build**

Run: `npm run lint && npm run build`
Expected: no errors.

- [ ] **Step 5: Browser check**

Open a character graph, pan around. **Expected:** background shows a subtle horizontal-line rule (like journal paper) with sparse dots overlaid. Base color is clearly warm-cream, not gray. No moiré at default zoom.

- [ ] **Step 6: Commit**

```bash
git add src/components/character-graph/CharacterGraphCanvas.tsx
git commit -m "feat(character-graph): layered paper + dots background and warmer base tint"
```

---

## Final verification

### Task 2.0: End-to-end browser pass

- [ ] **Step 1: Run the full pipeline**

```bash
npm run lint
npm run build
npm run dev
```

- [ ] **Step 2: Walk the 12-point spec verification list**

Open a character with ≥ 10 nodes across ≥ 3 domains and walk through §7 of `docs/superpowers/specs/2026-04-16-character-graph-edges-warmth-design.md`:

1. Drag an orbital near a container → container does NOT move.
2. Click container → catalog drawer opens → canvas refits within ~250ms.
3. Drag an orbital, hard-refresh → position persists.
4. `npm run build` passes (already run above).
5. Tab into canvas → orbital focus ring visible → Enter selects it.
6. Drag orbital above container midline → orbital edge re-anchors to top.
7. Zoom to 1.0 over a flow label → renders in Lora italic.
8. Watch 4 gotas flow across the chain, staggered. DevTools reduced-motion → freezes at midpoint.
9. Minimap shows 5 colored containers + dots.
10. Each container has its distinct glyph.
11. Background shows paper lines + dots, warm tint.

- [ ] **Step 3: Close out the branch cleanly**

No commit. If any step above fails, fix it before declaring the phase shipped. If everything passes, the branch is ready for PR review per the `superpowers:finishing-a-development-branch` skill.

---

## Self-review notes

**Spec coverage:** Every section of the spec (§4.1.1–§4.1.5 and §4.2.1–§4.2.6) maps to at least one task:
- §4.1.1 → Task 0.1
- §4.1.2 → Task 0.3
- §4.1.3 → Task 0.2
- §4.1.4 → Task 0.4
- §4.1.5 → Task 0.5
- §4.2.1 → Tasks 1.1, 1.2, 1.3
- §4.2.2 → Tasks 1.4, 1.5
- §4.2.3 → Task 1.4 (particle) + Task 1.5 (wiring)
- §4.2.4 → Task 1.7
- §4.2.5 → Task 1.8
- §4.2.6 → Task 1.9

Barrel export (Task 1.6) is a housekeeping step not in the spec but implied by the three-file edge module layout.

**Placeholder scan:** No TBDs. The one "if VenetianMask doesn't exist, fall back to Drama then Shield" in Task 1.8 is a concrete fallback ladder with a clear trigger, not a placeholder.

**Type consistency:** `ContainerData`/`ContainerMeta` both gain `icon` with identical typing (`LucideIcon`). `LiteraryFlowEdgeData` fields (`label`, `domainColor`, `chainIndex`) are read from `edge.data` in the edge component and set in `buildElements` — names match exactly. `onPersistPosition: (id: number, x: number, y: number) => void` matches the signature of `moveNode` in `useCharacterGraph.ts:103`.

**Scope:** Two phases, 13 tasks, ~8 hours of work. Independent from backend, from Voz/Hablar modes, from VoiceTab. Could be split at the Phase 0/1 boundary but the spec explicitly asked for both together.

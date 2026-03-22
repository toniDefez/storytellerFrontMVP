# Graph Manual Controls — Design Spec

## Goal

Give writers full control over the causal tree graph: create nodes manually, edit existing nodes, and access all actions through contextual, ReactFlow-native interactions.

## Context

Currently the graph only allows AI-driven node creation (expand → pick from 3 candidates). `addNodeManually` already exists in `useWorldGraph` and calls the existing `POST /world/nodes` API. Editing nodes has no API endpoint yet (`updateNode` does not exist in `api.ts` or the backend).

---

## Interaction Model

**Hybrid: visible shortcut + full context menu**

### "+" button (shortcut — selected node only)
- Appears below a node **only when it is selected**
- On an **empty graph**, the existing empty-state placeholder shows a "Crear raíz manualmente" button (same form, no parent, no edge type)
- Clicking opens `NodeFormDialog` in create mode

### One-time tooltip hint
- On first 3 interactions, a small badge appears near the "+" reading *"clic derecho para más opciones"*
- Counter stored in `localStorage` under key `'graph_ctx_hint_count'`
- After 3, the badge never appears again

### Right-click context menu
`CausalTreeCanvas` handles `onNodeContextMenu` from ReactFlow (canvas level — not inside `TreeNode`). `TreeNode` does NOT manage menu state. The canvas opens `NodeContextMenu` as an overlay positioned at the screen coordinates provided by ReactFlow's event.

| Item | Action |
|---|---|
| ✏️ Editar nodo | Opens `NodeFormDialog` in edit mode, pre-filled |
| ➕ Añadir hijo manual | Opens `NodeFormDialog` in create mode (identical to "+") |
| ✨ Expandir con IA | Triggers existing `GhostCandidates` flow |
| — | divider |
| 🗑️ Eliminar subárbol | Existing delete confirmation flow |

The "+" button and "Añadir hijo manual" call the same handler with identical arguments. No behavioral flag distinguishes them.

---

## NodeFormDialog Component

Single reusable component for create and edit. Rendered as a fixed-position overlay (not inside the ReactFlow canvas DOM) anchored near the target node.

### Positioning
- Anchor: top-right corner of the node (`flowToScreenPosition({ x: node.x + 180, y: node.y })`)
- Dialog dimensions assumed: 260px wide × 320px tall
- If `anchorX + 260 > window.innerWidth - 16`: flip to left (`anchorX - 260 - 16`)
- If `anchorY + 320 > window.innerHeight - 16`: clamp to `window.innerHeight - 336`
- Z-index above ReactFlow controls (use `z-50`)

### Props
```ts
interface NodeFormDialogProps {
  mode: 'create' | 'edit'
  worldId: number
  parentNode: WorldNode | null  // null when creating root
  editingNode?: WorldNode       // present only in edit mode
  anchorPosition: { x: number; y: number }  // screen coords
  onConfirm: (input: NodeFormInput) => Promise<void>
  onClose: () => void
}

interface NodeFormInput {
  label: string
  domain: NodeDomain
  role: NodeRole
  parentEdgeType?: EdgeType  // undefined when creating root
  description: string        // covers both description + causalSummary (see below)
}
```

### causalSummary handling
The form exposes a single "Descripción" field. On submit, the value is passed as both `description` and `causalSummary` in the `addNodeManually` call. This avoids adding a second textarea that confuses writers. The backend stores them separately but the form treats them as one.

### Field layout (label + edge type visible simultaneously)

```
┌─────────────────────────────────────────┐
│ Nuevo hijo de: [parent label]           │  ← create mode
│ Editando: [node label]                  │  ← edit mode
├─────────────────────────────────────────┤
│ Nombre del nodo   │ Relación con padre  │
│ [text input]      │ [select ▾]         │  ← edge hidden if root
├─────────────────────────────────────────┤
│ Dominio                                 │
│ [pill selector — 6 existing domains]   │
├─────────────────────────────────────────┤
│ Rol                                     │
│ [Estado] [Evento] [Ruptura]             │
├─────────────────────────────────────────┤
│ Descripción (opcional)                  │
│ [textarea 2 rows]                       │
├─────────────────────────────────────────┤
│ [Crear nodo / Guardar cambios] [✨ IA]  │
└─────────────────────────────────────────┘
```

### "✨ IA" button behavior
1. Calls `expandNodeCandidates(worldId, parentNode.id)`
2. Shows 3 candidate pills **inline below the button** (small cards with label + domain badge)
3. Selecting a candidate **replaces** all form fields with candidate values (label, domain, role, edge type, description)
4. A "✕ limpiar" link appears to reset to empty form
5. User must click "Crear nodo" to confirm — the IA button never auto-submits
6. If no parentNode (root creation), the "✨ IA" button is hidden

---

## CausalTreeCanvas — new prop signature

```ts
interface CausalTreeCanvasProps {
  nodes: WorldNode[]
  worldId: number | null           // NEW — needed for form + IA calls
  selectedNodeId?: number
  onSelectNode: (node: WorldNode | null) => void
  onAddNode: (input: NodeFormInput, parentNode: WorldNode | null) => Promise<void>  // NEW
}
```

`onAddNode` is called by both "+" and "Añadir hijo manual". `CreateWorldPage` passes `worldId` (guarded: form is disabled when `worldId` is null). `WorldDetailPage` passes `worldId` from its route param.

---

## Scope: Two Phases

### Phase 1 — Frontend only (this plan)
All work in `storytellerFrontMVP`. Uses existing `createNode` API and `addNodeManually` hook. **Covers create only — no edit mode yet.**

### Phase 2 — Edit existing nodes (requires backend)
Needs `PUT /world/nodes/{id}` in Go backend, then `updateNode` in `api.ts`, `updateNodeManually` in `useWorldGraph`, and edit mode wired in `NodeFormDialog`.

### Not in scope
New domains (Parentesco, Psicológico) and new edge type (co-constituye) require backend schema changes. Separate project.

---

## Files Touched (Phase 1)

| File | Change |
|---|---|
| `src/components/world-graph/TreeNode.tsx` | Add "+" button (selected state only), hint badge |
| `src/components/world-graph/NodeFormDialog.tsx` | **New** — create form component |
| `src/components/world-graph/NodeContextMenu.tsx` | **New** — right-click menu overlay |
| `src/components/world-graph/CausalTreeCanvas.tsx` | New props (`worldId`, `onAddNode`), wire `onNodeContextMenu`, show `NodeFormDialog` + `NodeContextMenu` |
| `src/pages/home/CreateWorldPage.tsx` | Pass `worldId` and `onAddNode` to canvas; add "Crear raíz manualmente" to empty state |
| `src/pages/home/WorldDetailPage.tsx` | Same prop wiring |
| `src/hooks/useWorldGraph.ts` | No changes |
| `src/services/api.ts` | No changes |
| `src/i18n/locales/es.json` | Add new UI strings |
| `src/i18n/locales/en.json` | Add same strings in English |

# Graph Manual Controls — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add contextual manual node creation to the causal tree graph — a "+" button on selected nodes + right-click context menu, both opening the same `NodeFormDialog`.

**Architecture:** A `GraphActionsContext` bridges callbacks from `CausalTreeCanvas` (which owns state) down into `TreeNode` (which renders inside ReactFlow and uses `useReactFlow()` to compute screen coordinates). `NodeFormDialog` and `NodeContextMenu` are fixed-position overlays rendered outside the ReactFlow DOM. All create paths call the existing `addNodeManually` hook — no backend changes needed.

**Tech Stack:** React 19, TypeScript, @xyflow/react, Tailwind CSS v4, react-i18next

**Spec:** `docs/superpowers/specs/2026-03-23-graph-manual-controls-design.md`

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `src/components/world-graph/GraphActionsContext.ts` | **Create** | React context for TreeNode→Canvas callbacks |
| `src/components/world-graph/NodeFormDialog.tsx` | **Create** | Create/edit form overlay |
| `src/components/world-graph/NodeContextMenu.tsx` | **Create** | Right-click menu overlay |
| `src/components/world-graph/TreeNode.tsx` | **Modify** | Add "+" button + hint badge |
| `src/components/world-graph/CausalTreeCanvas.tsx` | **Modify** | New props, context provider, form/menu state |
| `src/pages/home/CreateWorldPage.tsx` | **Modify** | Pass `worldId` + `onAddNode` |
| `src/pages/home/WorldDetailPage.tsx` | **Modify** | Pass `worldId` + `onAddNode` |
| `src/i18n/locales/es.json` | **Modify** | New graph strings |
| `src/i18n/locales/en.json` | **Modify** | New graph strings |

---

## Task 1: i18n strings + GraphActionsContext

**Files:**
- Modify: `src/i18n/locales/es.json`
- Modify: `src/i18n/locales/en.json`
- Create: `src/components/world-graph/GraphActionsContext.ts`

---

- [ ] **Step 1: Add graph strings to es.json**

Find the closing `}` of the JSON and add a new `"graph"` key before it. The file currently has keys like `"common"`, `"nav"`, `"settings"` etc. Add after the last existing section:

```json
"graph": {
  "addChildManual": "Añadir hijo manual",
  "editNode": "Editar nodo",
  "expandAI": "Expandir con IA",
  "deleteSubtree": "Eliminar subárbol",
  "createRoot": "Crear raíz manualmente",
  "newChildOf": "Nuevo hijo de",
  "editing": "Editando",
  "nodeName": "Nombre del nodo",
  "relation": "Relación con el padre",
  "domain": "Dominio",
  "role": "Rol",
  "description": "Descripción",
  "optional": "(opcional)",
  "createNode": "Crear nodo",
  "saveChanges": "Guardar cambios",
  "fillWithAI": "Rellenar con IA",
  "clearSuggestion": "✕ Limpiar sugerencia",
  "aiSuggestions": "Sugerencias IA"
}
```

- [ ] **Step 2: Add graph strings to en.json**

Same location, same structure:

```json
"graph": {
  "addChildManual": "Add child manually",
  "editNode": "Edit node",
  "expandAI": "Expand with AI",
  "deleteSubtree": "Delete subtree",
  "createRoot": "Create root manually",
  "newChildOf": "New child of",
  "editing": "Editing",
  "nodeName": "Node name",
  "relation": "Relation to parent",
  "domain": "Domain",
  "role": "Role",
  "description": "Description",
  "optional": "(optional)",
  "createNode": "Create node",
  "saveChanges": "Save changes",
  "fillWithAI": "Fill with AI",
  "clearSuggestion": "✕ Clear suggestion",
  "aiSuggestions": "AI suggestions"
}
```

- [ ] **Step 3: Create GraphActionsContext.ts**

Create `src/components/world-graph/GraphActionsContext.ts`:

```ts
import { createContext, useContext } from 'react'

export interface GraphActionsContextValue {
  /** Called by TreeNode when "+" is clicked. screenAnchor is in viewport px. */
  onPlusClick: (nodeId: string, screenAnchor: { x: number; y: number }) => void
}

export const GraphActionsContext = createContext<GraphActionsContextValue | null>(null)

export function useGraphActions(): GraphActionsContextValue {
  const ctx = useContext(GraphActionsContext)
  if (!ctx) throw new Error('useGraphActions must be used within GraphActionsContext.Provider')
  return ctx
}
```

- [ ] **Step 4: Verify build passes**

```bash
cd /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP && npm run build
```

Expected: Build succeeds (or only pre-existing errors, no new ones).

- [ ] **Step 5: Commit**

```bash
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP add \
  src/i18n/locales/es.json \
  src/i18n/locales/en.json \
  src/components/world-graph/GraphActionsContext.ts
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP commit -m "feat: add graph i18n strings and GraphActionsContext"
```

---

## Task 2: NodeContextMenu

**Files:**
- Create: `src/components/world-graph/NodeContextMenu.tsx`

---

- [ ] **Step 1: Create NodeContextMenu.tsx**

```tsx
import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'

interface NodeContextMenuProps {
  x: number
  y: number
  onEdit: () => void
  onAddChild: () => void
  onExpandAI: () => void
  onDeleteSubtree: () => void
  onClose: () => void
}

export function NodeContextMenu({
  x, y, onEdit, onAddChild, onExpandAI, onDeleteSubtree, onClose,
}: NodeContextMenuProps) {
  const { t } = useTranslation()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onMouse)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onMouse)
    }
  }, [onClose])

  const menuW = 200
  const menuH = 148
  const left = Math.min(x, window.innerWidth - menuW - 8)
  const top = Math.min(y, window.innerHeight - menuH - 8)

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left, top, zIndex: 100, width: menuW }}
      className="bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1"
    >
      <button
        onClick={() => { onEdit(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-left"
      >
        <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {t('graph.editNode')}
      </button>
      <button
        onClick={() => { onAddChild(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-left"
      >
        <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {t('graph.addChildManual')}
      </button>
      <button
        onClick={() => { onExpandAI(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-left text-primary"
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        {t('graph.expandAI')}
      </button>
      <div className="h-px bg-border/50 my-1" />
      <button
        onClick={() => { onDeleteSubtree(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-destructive/10 transition-colors text-left text-destructive"
      >
        <Trash2 className="w-3.5 h-3.5 shrink-0" />
        {t('graph.deleteSubtree')}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP && npm run build
```

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP add src/components/world-graph/NodeContextMenu.tsx
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP commit -m "feat: add NodeContextMenu overlay"
```

---

## Task 3: NodeFormDialog

**Files:**
- Create: `src/components/world-graph/NodeFormDialog.tsx`

This component handles both create and edit modes. It exports `NodeFormInput` type (needed by CausalTreeCanvas in the next task).

**Key behavior:**
- Label + edge type are shown side-by-side at the top (writer fills in either order)
- "✨ IA" calls `expandNodeCandidates` and shows candidates inline for selection
- Selecting a candidate replaces all fields; "✕ Limpiar" resets candidates list
- Component never auto-submits — writer must click "Crear nodo"
- `causalSummary` is not a separate field: `description` value is passed as both `description` and `causalSummary` to `addNodeManually`
- Dialog is positioned with collision detection: prefers right of anchor, flips left if near viewport edge

---

- [ ] **Step 1: Create NodeFormDialog.tsx**

```tsx
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { WorldNode, NodeDomain, NodeRole, EdgeType, CandidateNode } from '@/services/api'
import { expandNodeCandidates } from '@/services/api'
import { DOMAIN_COLOR, DOMAIN_LABEL, ROLE_LABEL, EDGE_LABEL } from './treeLayout'

export interface NodeFormInput {
  label: string
  domain: NodeDomain
  role: NodeRole
  parentEdgeType?: EdgeType
  description: string
}

interface NodeFormDialogProps {
  mode: 'create' | 'edit'
  worldId: number
  parentNode: WorldNode | null
  editingNode?: WorldNode
  anchorPosition: { x: number; y: number }
  onConfirm: (input: NodeFormInput) => Promise<void>
  onClose: () => void
}

const DOMAINS: NodeDomain[] = ['core', 'physical', 'biological', 'social', 'symbolic', 'technic']
const ROLES: NodeRole[] = ['state', 'event', 'rupture']
const EDGE_TYPES: EdgeType[] = ['produces', 'requires', 'enables', 'undermines', 'gives_rise_to']

export function NodeFormDialog({
  mode, worldId, parentNode, editingNode,
  anchorPosition, onConfirm, onClose,
}: NodeFormDialogProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)

  const [label, setLabel] = useState(editingNode?.label ?? '')
  const [domain, setDomain] = useState<NodeDomain>(
    editingNode?.domain ?? parentNode?.domain ?? 'core'
  )
  const [role, setRole] = useState<NodeRole>(editingNode?.role ?? 'state')
  const [edgeType, setEdgeType] = useState<EdgeType>(
    editingNode?.parent_edge_type ?? 'produces'
  )
  const [description, setDescription] = useState(editingNode?.content?.description ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [candidates, setCandidates] = useState<CandidateNode[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Positioning: prefer right of anchor, flip left if near edge
  const dialogW = 264
  const dialogH = 360
  const left = anchorPosition.x + dialogW + 16 > window.innerWidth - 8
    ? anchorPosition.x - dialogW - 16
    : anchorPosition.x + 16
  const top = Math.min(anchorPosition.y, window.innerHeight - dialogH - 16)

  const handleAIFill = async () => {
    if (!parentNode) return
    setAiLoading(true)
    try {
      const result = await expandNodeCandidates(worldId, parentNode.id)
      setCandidates(result.candidates ?? [])
    } catch {
      // best-effort
    } finally {
      setAiLoading(false)
    }
  }

  const applyCandidate = (c: CandidateNode) => {
    setLabel(c.label)
    setDomain(c.domain)
    setRole(c.role)
    setEdgeType(c.parent_edge_type)
    setDescription(c.description)
    setCandidates([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    setSubmitting(true)
    try {
      await onConfirm({
        label: label.trim(),
        domain,
        role,
        parentEdgeType: parentNode ? edgeType : undefined,
        description: description.trim(),
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const isCreate = mode === 'create'

  return (
    <div
      ref={dialogRef}
      style={{ position: 'fixed', left, top, zIndex: 50, width: dialogW }}
      className="bg-card border border-border rounded-xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/30">
        <p className="text-[10px] font-semibold text-muted-foreground truncate max-w-[210px]">
          {isCreate
            ? parentNode
              ? `${t('graph.newChildOf')}: ${parentNode.label}`
              : t('graph.createRoot')
            : `${t('graph.editing')}: ${editingNode?.label}`
          }
        </p>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground ml-2 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-3 py-3 space-y-2.5">
        {/* Label + Edge type side-by-side */}
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <label className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
              {t('graph.nodeName')}
            </label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Label..."
              className="h-7 text-xs"
              autoFocus
              required
            />
          </div>
          {parentNode && (
            <div style={{ width: 96 }} className="shrink-0">
              <label className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                {t('graph.relation')}
              </label>
              <select
                value={edgeType}
                onChange={e => setEdgeType(e.target.value as EdgeType)}
                className="h-7 w-full text-[10px] border border-input rounded-md px-1.5 bg-background text-foreground"
              >
                {EDGE_TYPES.map(et => (
                  <option key={et} value={et}>{EDGE_LABEL[et] ?? et}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Domain */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
            {t('graph.domain')}
          </label>
          <div className="flex flex-wrap gap-1">
            {DOMAINS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => setDomain(d)}
                className="text-[9px] px-2 py-0.5 rounded-full border transition-all font-medium"
                style={domain === d
                  ? { background: DOMAIN_COLOR[d], borderColor: DOMAIN_COLOR[d], color: 'white' }
                  : { borderColor: (DOMAIN_COLOR[d] ?? '#a855f7') + '60', color: DOMAIN_COLOR[d] ?? '#a855f7' }
                }
              >
                {DOMAIN_LABEL[d] ?? d}
              </button>
            ))}
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
            {t('graph.role')}
          </label>
          <div className="flex gap-1">
            {ROLES.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`text-[9px] px-2.5 py-0.5 rounded-full border transition-all ${
                  role === r
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/40'
                }`}
              >
                {ROLE_LABEL[r] ?? r}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
            {t('graph.description')}{' '}
            <span className="font-normal normal-case">{t('graph.optional')}</span>
          </label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Qué es, qué implica..."
            className="min-h-[48px] text-xs resize-none"
            rows={2}
          />
        </div>

        {/* AI candidates (inline, after filling) */}
        {candidates.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('graph.aiSuggestions')}
              </p>
              <button
                type="button"
                onClick={() => setCandidates([])}
                className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('graph.clearSuggestion')}
              </button>
            </div>
            {candidates.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyCandidate(c)}
                className="w-full text-left p-2 rounded-lg border border-dashed text-[10px] hover:bg-accent/50 transition-colors"
                style={{ borderColor: (DOMAIN_COLOR[c.domain] ?? '#a855f7') + '60' }}
              >
                <span className="font-semibold text-foreground">{c.label}</span>
                <span className="text-muted-foreground ml-1.5">
                  — {DOMAIN_LABEL[c.domain] ?? c.domain}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            size="sm"
            className="flex-1 h-7 text-xs"
            disabled={submitting || !label.trim()}
          >
            {submitting
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : isCreate ? t('graph.createNode') : t('graph.saveChanges')
            }
          </Button>
          {parentNode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={handleAIFill}
              disabled={aiLoading}
            >
              {aiLoading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <><Sparkles className="w-3 h-3 mr-1" />{t('graph.fillWithAI')}</>
              }
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: Verify build passes**

```bash
cd /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP && npm run build
```

Expected: No new errors.

- [ ] **Step 3: Commit**

```bash
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP add src/components/world-graph/NodeFormDialog.tsx
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP commit -m "feat: add NodeFormDialog for manual node creation"
```

---

## Task 4: TreeNode — "+" button and hint badge

**Files:**
- Modify: `src/components/world-graph/TreeNode.tsx`

**Context:** `TreeNode` is rendered inside ReactFlow's node renderer, so it can use `useReactFlow()`. When "+" is clicked, it computes the screen anchor using `flowToScreenPosition` and passes it up to `CausalTreeCanvas` via `GraphActionsContext`. The hint badge visibility comes from `data.showCtxHint` (set by CausalTreeCanvas in `buildFlowGraph`).

---

- [ ] **Step 1: Rewrite TreeNode.tsx**

Replace the full file content:

```tsx
import { memo, useCallback } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import { Plus } from 'lucide-react'
import { DOMAIN_COLOR, DOMAIN_LABEL, ROLE_LABEL } from './treeLayout'
import type { NodeDomain, NodeRole } from '@/services/api'
import { useGraphActions } from './GraphActionsContext'

export interface TreeNodeData extends Record<string, unknown> {
  label: string
  domain: NodeDomain
  role: NodeRole
  description: string
  causal_summary: string
  isSelected?: boolean
  isRoot?: boolean
  showCtxHint?: boolean
}

export const TreeNode = memo(function TreeNode({
  data, id, positionAbsoluteX, positionAbsoluteY,
}: NodeProps<Node<TreeNodeData>>) {
  const color = DOMAIN_COLOR[data.domain] ?? '#a855f7'
  const { flowToScreenPosition } = useReactFlow()
  const actions = useGraphActions()

  const handlePlusClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    // Anchor to the right edge of the node at its top
    const screen = flowToScreenPosition({
      x: positionAbsoluteX + 190,
      y: positionAbsoluteY,
    })
    actions.onPlusClick(id, screen)
  }, [id, positionAbsoluteX, positionAbsoluteY, flowToScreenPosition, actions])

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <div
        className={`
          w-[180px] rounded-lg border bg-card shadow-sm transition-all
          ${data.isSelected ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'}
        `}
        style={{ borderColor: color + '60' }}
      >
        <div className="h-1 w-full rounded-t-lg" style={{ backgroundColor: color }} />
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: color }}
            >
              {DOMAIN_LABEL[data.domain] ?? data.domain}
            </span>
            {data.role !== 'state' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide bg-muted text-muted-foreground">
                {ROLE_LABEL[data.role] ?? data.role}
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
            {data.label}
          </p>
        </div>
      </div>

      {/* "+" button — only when selected */}
      {data.isSelected && (
        <div className="flex flex-col items-center mt-1.5">
          <button
            onClick={handlePlusClick}
            className="w-5 h-5 rounded-full flex items-center justify-center bg-primary text-primary-foreground shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-primary/50"
            aria-label="Añadir nodo hijo"
          >
            <Plus className="w-3 h-3" />
          </button>
          {data.showCtxHint && (
            <span className="mt-1 text-[8px] text-muted-foreground bg-background border border-border/50 rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none">
              clic derecho para más
            </span>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
})
```

- [ ] **Step 2: Verify build passes**

```bash
cd /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP && npm run build
```

Expected: Build may fail with "useGraphActions must be used within..." — this is expected until CausalTreeCanvas provides the context in Task 5. If the only error is about context, that's fine. If there are TypeScript errors in the file itself, fix those first.

- [ ] **Step 3: Commit**

```bash
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP add src/components/world-graph/TreeNode.tsx
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP commit -m "feat: add + button and hint badge to TreeNode"
```

---

## Task 5: CausalTreeCanvas — wire context, form, and menu

**Files:**
- Modify: `src/components/world-graph/CausalTreeCanvas.tsx`

This is the orchestrator. Key changes:
1. New props: `worldId: number | null`, `onAddNode: (input, parentNode) => Promise<void>`
2. New state: `formState` (controls NodeFormDialog), `contextMenu` (controls NodeContextMenu), `ctxHintCount`
3. Provides `GraphActionsContext` wrapping `<ReactFlow>`
4. Handles `onNodeContextMenu` at canvas level
5. `buildFlowGraph` gets `showHint: boolean` param → sets `showCtxHint` in node data
6. Empty state shows "Crear raíz manualmente" link when `worldId` is available

---

- [ ] **Step 1: Rewrite CausalTreeCanvas.tsx**

```tsx
import { useMemo, useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react'

// NodeMouseHandler is not in @xyflow/react's public exports — define inline:
type NodeMouseHandler = (e: React.MouseEvent, node: Node) => void
import '@xyflow/react/dist/style.css'
import { TreeNode } from './TreeNode'
import type { TreeNodeData } from './TreeNode'
import { computeTreeLayout, DOMAIN_COLOR, EDGE_LABEL } from './treeLayout'
import type { WorldNode } from '@/services/api'
import { GraphActionsContext } from './GraphActionsContext'
import { NodeFormDialog } from './NodeFormDialog'
import type { NodeFormInput } from './NodeFormDialog'
import { NodeContextMenu } from './NodeContextMenu'

const nodeTypes = { tree: TreeNode }

interface FormState {
  anchorPosition: { x: number; y: number }
  parentNode: WorldNode | null
  mode: 'create'
}

interface ContextMenuState {
  x: number
  y: number
  nodeId: string
}

interface CausalTreeCanvasProps {
  nodes: WorldNode[]
  worldId: number | null
  selectedNodeId?: number
  onSelectNode: (node: WorldNode | null) => void
  onAddNode: (input: NodeFormInput, parentNode: WorldNode | null) => Promise<void>
}

function buildFlowGraph(
  worldNodes: WorldNode[],
  selectedId?: number,
  showHint = false,
): { nodes: Node<TreeNodeData>[]; edges: Edge[] } {
  const positions = computeTreeLayout(worldNodes)

  const flowNodes: Node<TreeNodeData>[] = worldNodes.map(n => {
    const pos = positions.get(n.id) ?? { x: 0, y: 0 }
    return {
      id: String(n.id),
      type: 'tree',
      position: { x: pos.x, y: pos.y },
      data: {
        label: n.label,
        domain: n.domain,
        role: n.role,
        description: n.content?.description ?? '',
        causal_summary: n.content?.causal_summary ?? '',
        isSelected: n.id === selectedId,
        isRoot: !n.parent_id,
        showCtxHint: n.id === selectedId && showHint,
      },
    }
  })

  const flowEdges: Edge[] = worldNodes
    .filter(n => n.parent_id != null)
    .map(n => ({
      id: `e-${n.parent_id}-${n.id}`,
      source: String(n.parent_id),
      target: String(n.id),
      type: 'smoothstep',
      label: n.parent_edge_type ? EDGE_LABEL[n.parent_edge_type] ?? n.parent_edge_type : undefined,
      labelStyle: { fontSize: 9, fill: '#94a3b8' },
      style: { stroke: (DOMAIN_COLOR[n.domain] ?? '#a855f7') + '80', strokeWidth: 1.5 },
    }))

  return { nodes: flowNodes, edges: flowEdges }
}

export function CausalTreeCanvas({
  nodes: worldNodes,
  worldId,
  selectedNodeId,
  onSelectNode,
  onAddNode,
}: CausalTreeCanvasProps) {
  const { t } = useTranslation()

  const [ctxHintCount, setCtxHintCount] = useState(() =>
    parseInt(localStorage.getItem('graph_ctx_hint_count') ?? '0', 10)
  )
  const [formState, setFormState] = useState<FormState | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)

  const nodeMap = useMemo(() => {
    const m = new Map<number, WorldNode>()
    for (const n of worldNodes) m.set(n.id, n)
    return m
  }, [worldNodes])

  const { nodes: flowNodes, edges: flowEdges } = useMemo(
    () => buildFlowGraph(worldNodes, selectedNodeId, ctxHintCount < 3),
    [worldNodes, selectedNodeId, ctxHintCount],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  const openCreateForm = useCallback((parentNode: WorldNode | null, screenAnchor: { x: number; y: number }) => {
    setFormState({ anchorPosition: screenAnchor, parentNode, mode: 'create' })
    setContextMenu(null)
  }, [])

  // GraphActionsContext handler — called from TreeNode "+" button
  const handlePlusClick = useCallback((nodeId: string, screenAnchor: { x: number; y: number }) => {
    const worldNode = nodeMap.get(Number(nodeId))
    if (!worldNode) return
    if (ctxHintCount < 3) {
      const next = ctxHintCount + 1
      setCtxHintCount(next)
      localStorage.setItem('graph_ctx_hint_count', String(next))
    }
    openCreateForm(worldNode, screenAnchor)
  }, [nodeMap, ctxHintCount, openCreateForm])

  const graphActions = useMemo(() => ({ onPlusClick: handlePlusClick }), [handlePlusClick])

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const id = Number(node.id)
      const worldNode = nodeMap.get(id)
      if (!worldNode) return
      onSelectNode(selectedNodeId === id ? null : worldNode)
    },
    [nodeMap, selectedNodeId, onSelectNode],
  )

  const handlePaneClick = useCallback(() => {
    onSelectNode(null)
    setContextMenu(null)
  }, [onSelectNode])

  const handleNodeContextMenu: NodeMouseHandler = useCallback((e, node) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id })
    // Select the node so the side panel opens
    const worldNode = nodeMap.get(Number(node.id))
    if (worldNode) onSelectNode(worldNode)
  }, [nodeMap, onSelectNode])

  const handleFormConfirm = useCallback(async (input: NodeFormInput) => {
    if (!worldId) return
    await onAddNode(input, formState?.parentNode ?? null)
  }, [worldId, onAddNode, formState])

  // Context menu actions
  const ctxNode = contextMenu ? nodeMap.get(Number(contextMenu.nodeId)) : null

  if (worldNodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/50 text-center p-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-display italic">
            El árbol está vacío
          </p>
          <p className="text-xs text-muted-foreground">
            Genera el nodo raíz para empezar
          </p>
          {worldId != null && (
            <button
              onClick={() => openCreateForm(null, {
                x: window.innerWidth / 2 - 148,
                y: 80,
              })}
              className="text-xs text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {t('graph.createRoot')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <GraphActionsContext.Provider value={graphActions}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        onNodeContextMenu={handleNodeContextMenu}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        className="bg-slate-50/50"
        nodesDraggable={false}
      >
        <Background color="#e2e8f0" gap={20} />
        <Controls />
        <MiniMap
          nodeColor={n => DOMAIN_COLOR[(n.data as TreeNodeData).domain] ?? '#a855f7'}
          className="!bg-background/90 !border-border/50"
        />
      </ReactFlow>

      {contextMenu && ctxNode && (
        <NodeContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onEdit={() => {
            // Edit mode is Phase 2 — show a toast or no-op for now
            setContextMenu(null)
          }}
          onAddChild={() => openCreateForm(ctxNode, { x: contextMenu.x, y: contextMenu.y })}
          onExpandAI={() => {
            // Trigger existing expand flow via onSelectNode (side panel Expand button)
            // The user can click "Expandir" in the NodeDetailPanel
            setContextMenu(null)
          }}
          onDeleteSubtree={() => {
            // Existing delete flow is in NodeDetailPanel — user must use the side panel
            setContextMenu(null)
          }}
          onClose={() => setContextMenu(null)}
        />
      )}

      {formState && worldId != null && (
        <NodeFormDialog
          mode={formState.mode}
          worldId={worldId}
          parentNode={formState.parentNode}
          anchorPosition={formState.anchorPosition}
          onConfirm={handleFormConfirm}
          onClose={() => setFormState(null)}
        />
      )}
    </GraphActionsContext.Provider>
  )
}
```

**Note on context menu actions:** `onEdit` and `onDeleteSubtree` / `onExpandAI` currently no-op or defer to the side panel. This is intentional for Phase 1 — the existing `NodeDetailPanel` handles expand and delete. Full wiring can be done in a follow-up. `onAddChild` is fully wired.

- [ ] **Step 2: Verify build passes**

```bash
cd /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP && npm run build
```

Expected: Build succeeds. Fix any TypeScript errors before proceeding.

- [ ] **Step 3: Commit**

```bash
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP add src/components/world-graph/CausalTreeCanvas.tsx
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP commit -m "feat: wire GraphActionsContext, NodeFormDialog, NodeContextMenu in CausalTreeCanvas"
```

---

## Task 6: Page wiring — CreateWorldPage + WorldDetailPage

**Files:**
- Modify: `src/pages/home/CreateWorldPage.tsx`
- Modify: `src/pages/home/WorldDetailPage.tsx`

Both pages need to pass `worldId` and `onAddNode` to `<CausalTreeCanvas>`. `onAddNode` calls `graph.addNodeManually` from `useWorldGraph`.

---

- [ ] **Step 1: Add onAddNode to CreateWorldPage**

**1a. Replace the React import line (line 1):**

Old:
```tsx
import { useState, useEffect } from 'react'
```
New:
```tsx
import { useState, useEffect, useCallback } from 'react'
```

**1b. Replace the `@/services/api` import block (lines 18-23):**

Old:
```tsx
import {
  createWorld,
  interpretTensions,
  generateRoot,
  type TensionOption,
} from '@/services/api'
```
New:
```tsx
import {
  createWorld,
  interpretTensions,
  generateRoot,
  type TensionOption,
  type WorldNode,
} from '@/services/api'
import type { NodeFormInput } from '@/components/world-graph/NodeFormDialog'
```

**1c. Add `handleAddNode` after `handleSkipTension` (around line 87). The current code at that location is:**

```tsx
  const handleSkipTension = () => {
    if (worldId) {
      graph.loadGraph(worldId)
      setStep('canvas')
    }
  }

  const handleExpand = async () => {
```

Insert between `handleSkipTension` and `handleExpand`:

```tsx
  const handleAddNode = useCallback(async (input: NodeFormInput, parentNode: WorldNode | null) => {
    if (!worldId) return
    await graph.addNodeManually(worldId, {
      parentId: parentNode?.id,
      parentEdgeType: input.parentEdgeType,
      domain: input.domain,
      role: input.role,
      label: input.label,
      description: input.description,
      causalSummary: input.description,
    })
  }, [worldId, graph])

```

**1d. Update `<CausalTreeCanvas>` in the canvas block (around line 158). Current JSX:**

```tsx
              <CausalTreeCanvas
                nodes={graph.nodes}
                selectedNodeId={graph.selectedNode?.id}
                onSelectNode={graph.selectNode}
              />
```

Replace with:

```tsx
              <CausalTreeCanvas
                nodes={graph.nodes}
                worldId={worldId}
                selectedNodeId={graph.selectedNode?.id}
                onSelectNode={graph.selectNode}
                onAddNode={handleAddNode}
              />
```

- [ ] **Step 2: Add onAddNode to WorldDetailPage**

**2a. Replace the React import line (line 2):**

Old:
```tsx
import { useEffect, useState } from 'react'
```
New:
```tsx
import { useEffect, useState, useCallback } from 'react'
```

**2b. Replace the `../../services/api` import block (lines 4-5):**

Old:
```tsx
import { getWorldById, deleteWorld } from '../../services/api'
import type { World } from '../../services/api'
```
New:
```tsx
import { getWorldById, deleteWorld } from '../../services/api'
import type { World, WorldNode } from '../../services/api'
import type { NodeFormInput } from '@/components/world-graph/NodeFormDialog'
```

**2c. Add `handleAddNode` inside the component, right after `const graph = useWorldGraph()` (line 66):**

```tsx
  const handleAddNode = useCallback(async (input: NodeFormInput, parentNode: WorldNode | null) => {
    const wid = Number(id)
    if (!id || Number.isNaN(wid)) return
    await graph.addNodeManually(wid, {
      parentId: parentNode?.id,
      parentEdgeType: input.parentEdgeType,
      domain: input.domain,
      role: input.role,
      label: input.label,
      description: input.description,
      causalSummary: input.description,
    })
  }, [id, graph])
```

**2d. Update `<CausalTreeCanvas>` (around line 229). Current JSX:**

```tsx
                <CausalTreeCanvas
                  nodes={graph.nodes}
                  selectedNodeId={graph.selectedNode?.id}
                  onSelectNode={graph.selectNode}
                />
```

Replace with:

```tsx
                <CausalTreeCanvas
                  nodes={graph.nodes}
                  worldId={Number(id)}
                  selectedNodeId={graph.selectedNode?.id}
                  onSelectNode={graph.selectNode}
                  onAddNode={handleAddNode}
                />
```

- [ ] **Step 3: Verify full build passes**

```bash
cd /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP && npm run build
```

Expected: Clean build, no TypeScript errors.

- [ ] **Step 4: Manual smoke test**

1. Run dev server: `npm run dev`
2. Navigate to a world's creation flow, reach the canvas step
3. Click a node — verify "+" appears below it and hint badge appears
4. Click "+" — verify `NodeFormDialog` opens anchored near the node
5. Fill in label, pick a domain and role, submit — verify node appears on canvas
6. Right-click a node — verify `NodeContextMenu` appears with all 4 items
7. Click "Añadir hijo manual" from the menu — verify the same form opens
8. Navigate to an existing world detail page — verify same interactions work
9. On empty graph, verify "Crear raíz manualmente" link appears and opens the form with no edge type field

- [ ] **Step 5: Commit and push**

```bash
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP add \
  src/pages/home/CreateWorldPage.tsx \
  src/pages/home/WorldDetailPage.tsx
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP commit -m "feat: wire manual node controls to CreateWorldPage and WorldDetailPage"
git -C /c/Users/tonid/Desktop/dojoCode/storytellerFrontMVP push origin main
```

---

## What Phase 2 adds (not in this plan)

- `PUT /world/nodes/{id}` endpoint in Go backend
- `updateNode` in `api.ts` + `updateNodeManually` in `useWorldGraph`
- Edit mode in `NodeFormDialog` (props already defined, just needs wiring)
- "Editar nodo" in `NodeContextMenu` opens form pre-filled (currently no-ops)

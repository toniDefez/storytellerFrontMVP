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
import '@xyflow/react/dist/style.css'
import { TreeNode } from './TreeNode'
import type { TreeNodeData } from './TreeNode'
import { computeTreeLayout, DOMAIN_COLOR, EDGE_LABEL } from './treeLayout'
import type { WorldNode } from '@/services/api'
import { GraphActionsContext } from './GraphActionsContext'
import { NodeFormDialog } from './NodeFormDialog'
import type { NodeFormInput } from './NodeFormDialog'
import { NodeContextMenu } from './NodeContextMenu'

// NodeMouseHandler is not in @xyflow/react's public exports — define inline:
type NodeMouseHandler = (e: React.MouseEvent, node: Node) => void

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
            // Edit mode is Phase 2 — no-op for now
            setContextMenu(null)
          }}
          onAddChild={() => openCreateForm(ctxNode, { x: contextMenu.x, y: contextMenu.y })}
          onExpandAI={() => {
            // Triggers existing expand flow via side panel — user clicks "Expandir" there
            setContextMenu(null)
          }}
          onDeleteSubtree={() => {
            // Existing delete flow is in NodeDetailPanel
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

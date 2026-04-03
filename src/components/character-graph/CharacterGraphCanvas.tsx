import { useMemo, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
  type OnConnect,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type {
  CharacterNode,
  CharacterEdge,
  CharacterNodeDomain,
  CharacterNodeRole,
  CharacterEdgeType,
} from '@/services/api'

/* ── Pipeline metadata (5-node character model) ───────────────── */

const PIPELINE_META: Record<string, { label: string; emoji: string; bg: string; border: string; text: string; description: string }> = {
  fear:    { label: 'MIEDO',     emoji: '◆', bg: '#fef2f2', border: '#dc2626', text: '#991b1b', description: 'Lo que cree del mundo' },
  drive:   { label: 'NECESIDAD', emoji: '▶', bg: '#ecfdf5', border: '#059669', text: '#065f46', description: 'Lo que persigue' },
  mask:    { label: 'ARMADURA',  emoji: '◎', bg: '#f8fafc', border: '#64748b', text: '#334155', description: 'Cómo se protege' },
  tension: { label: 'SEÑAL',     emoji: '◇', bg: '#fffbeb', border: '#d97706', text: '#92400e', description: 'Cómo lo ven los demás' },
  bond:    { label: 'QUIEBRE',   emoji: '✦', bg: '#faf5ff', border: '#9333ea', text: '#6b21a8', description: 'Lo que lo rompe' },
}

/* ── Edge styles per type ──────────────────────────────────────── */

const EDGE_STYLES: Record<CharacterEdgeType, Partial<Edge['style']> & { strokeDasharray?: string }> = {
  contradicts:  { stroke: '#e11d48', strokeDasharray: '6 3' },
  fuels:        { stroke: '#059669' },
  masks:        { stroke: '#64748b', strokeDasharray: '2 3' },
  forged_by:    { stroke: '#78716c' },
  costs:        { stroke: '#dc2626' },
  constrains:   { stroke: '#d97706' },
  evolved_from: { stroke: '#6366f1', strokeDasharray: '6 3' },
  could_resolve:{ stroke: '#059669', strokeDasharray: '2 3' },
}

/* ── Custom node component ─────────────────────────────────────── */

interface PsycheNodeData extends Record<string, unknown> {
  label: string
  domain: CharacterNodeDomain
  role: CharacterNodeRole
  description: string
  isSelected: boolean
}

function PsycheNode({ data }: NodeProps<Node<PsycheNodeData>>) {
  const meta = PIPELINE_META[data.domain] || { label: data.domain, emoji: '●', bg: '#f5f5f4', border: '#a8a29e', text: '#57534e', description: '' }
  return (
    <div
      className="relative rounded-xl min-w-[200px] max-w-[280px] transition-shadow overflow-hidden"
      style={{
        background: meta.bg,
        borderColor: meta.border,
        borderWidth: 2,
        borderStyle: 'solid',
        boxShadow: data.isSelected ? `0 0 0 3px ${meta.border}44, 0 4px 12px ${meta.border}22` : '0 1px 3px rgba(0,0,0,0.08)',
      }}
    >
      <Handle type="target" position={Position.Left} className="!w-2.5 !h-2.5 !bg-stone-400 !border-stone-300" />

      {/* Header with pipeline label */}
      <div className="px-3 py-1.5 border-b" style={{ borderColor: `${meta.border}30`, background: `${meta.border}08` }}>
        <span className="text-[9px] font-bold uppercase tracking-[0.15em]" style={{ color: meta.border }}>
          {meta.emoji} {meta.label}
        </span>
        <span className="text-[8px] ml-2 opacity-50" style={{ color: meta.text }}>
          {meta.description}
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-2">
        <p className="text-xs font-semibold leading-tight" style={{ color: meta.text }}>
          {data.label}
        </p>
        {data.description && (
          <p className="text-[10px] mt-1 leading-snug opacity-70" style={{ color: meta.text }}>
            {data.description}
          </p>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-2.5 !h-2.5 !bg-stone-400 !border-stone-300" />
    </div>
  )
}

const nodeTypes = { psyche: PsycheNode }

/* ── Convert domain data → React Flow ──────────────────────────── */

function toFlowElements(
  charNodes: CharacterNode[],
  charEdges: CharacterEdge[],
  selectedId: number | null,
): { nodes: Node<PsycheNodeData>[]; edges: Edge[] } {
  const nodes: Node<PsycheNodeData>[] = charNodes.map(n => ({
    id: String(n.id),
    type: 'psyche',
    position: { x: n.canvas_x, y: n.canvas_y },
    data: {
      label: n.label,
      domain: n.domain,
      role: n.role,
      description: n.description,
      isSelected: n.id === selectedId,
    },
  }))

  const edges: Edge[] = charEdges.map(e => {
    const style = EDGE_STYLES[e.edge_type] ?? {}
    return {
      id: String(e.id),
      source: String(e.source_node_id),
      target: String(e.target_node_id),
      type: 'smoothstep',
      label: e.edge_type.replace(/_/g, ' '),
      labelStyle: { fontSize: 9, fill: '#94a3b8' },
      style: { strokeWidth: 1.5, ...style },
    }
  })

  return { nodes, edges }
}

/* ── Canvas component ──────────────────────────────────────────── */

interface Props {
  nodes: CharacterNode[]
  edges: CharacterEdge[]
  selectedNodeId: number | null
  onSelectNode: (id: number | null) => void
  onMoveNode: (id: number, x: number, y: number) => void
  onAddNode: () => void
  onAddEdge: (sourceId: number, targetId: number) => void
}

export function CharacterGraphCanvas({
  nodes: charNodes,
  edges: charEdges,
  selectedNodeId,
  onSelectNode,
  onMoveNode,
  onAddNode,
  onAddEdge,
}: Props) {
  const { nodes: flowNodes, edges: flowEdges } = useMemo(
    () => toFlowElements(charNodes, charEdges, selectedNodeId),
    [charNodes, charEdges, selectedNodeId],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const id = Number(node.id)
    onSelectNode(selectedNodeId === id ? null : id)
  }, [selectedNodeId, onSelectNode])

  const handlePaneClick = useCallback(() => onSelectNode(null), [onSelectNode])

  const handlePaneDoubleClick = useCallback(() => onAddNode(), [onAddNode])

  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    onMoveNode(Number(node.id), node.position.x, node.position.y)
  }, [onMoveNode])

  const handleConnect: OnConnect = useCallback((conn) => {
    if (conn.source && conn.target) {
      onAddEdge(Number(conn.source), Number(conn.target))
    }
  }, [onAddEdge])

  if (charNodes.length === 0) {
    return (
      <div
        className="flex-1 flex items-center justify-center bg-[hsl(40_20%_97%)] text-center p-8 cursor-pointer"
        onDoubleClick={onAddNode}
      >
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-display italic">El grafo psicologico esta vacio</p>
          <p className="text-xs text-muted-foreground">Doble-click para agregar el primer nodo</p>
        </div>
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      onDoubleClick={handlePaneDoubleClick}
      onNodeDragStop={handleNodeDragStop}
      onConnect={handleConnect}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      className="bg-[hsl(40_20%_97%)]"
    >
      <Background color="#d8cfc4" gap={24} size={1} />
      <Controls />
      <MiniMap
        nodeColor={n => PIPELINE_META[(n.data as PsycheNodeData).domain]?.border ?? '#a855f7'}
        className="!bg-background/90 !border-border/50"
      />
    </ReactFlow>
  )
}

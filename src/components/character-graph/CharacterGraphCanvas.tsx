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

/* ── Domain colors ─────────────────────────────────────────────── */

const DOMAIN_COLORS: Record<CharacterNodeDomain, { bg: string; border: string; text: string }> = {
  origin:  { bg: '#f5f5f4', border: '#a8a29e', text: '#57534e' },
  belief:  { bg: '#fef3c7', border: '#d97706', text: '#92400e' },
  drive:   { bg: '#d1fae5', border: '#059669', text: '#065f46' },
  fear:    { bg: '#ffe4e6', border: '#e11d48', text: '#9f1239' },
  mask:    { bg: '#f1f5f9', border: '#64748b', text: '#334155' },
  tension: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b' },
  bond:    { bg: '#f3e8ff', border: '#9333ea', text: '#6b21a8' },
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

/* ── Role → border style ──────────────────────────────────────── */

function roleBorderStyle(role: CharacterNodeRole): React.CSSProperties {
  switch (role) {
    case 'trait':    return { borderStyle: 'solid', borderWidth: 2 }
    case 'wound':    return { borderStyle: 'dashed', borderWidth: 2 }
    case 'arc_seed': return { borderStyle: 'dotted', borderWidth: 2, boxShadow: '0 0 8px rgba(99,102,241,0.35)' }
  }
}

/* ── Custom node component ─────────────────────────────────────── */

interface PsycheNodeData extends Record<string, unknown> {
  label: string
  domain: CharacterNodeDomain
  role: CharacterNodeRole
  isSelected: boolean
}

function PsycheNode({ data }: NodeProps<Node<PsycheNodeData>>) {
  const colors = DOMAIN_COLORS[data.domain]
  return (
    <div
      className="relative px-3 py-2 rounded-lg min-w-[80px] max-w-[160px] text-center transition-shadow"
      style={{
        background: colors.bg,
        borderColor: colors.border,
        color: colors.text,
        ...roleBorderStyle(data.role),
        ...(data.isSelected ? { boxShadow: `0 0 0 3px ${colors.border}55, 0 0 12px ${colors.border}33` } : {}),
      }}
    >
      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-stone-400" />
      <span className="text-xs font-medium leading-tight block truncate">{data.label}</span>
      <span className="text-[9px] opacity-60 capitalize">{data.role.replace('_', ' ')}</span>
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-stone-400" />
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
        nodeColor={n => DOMAIN_COLORS[(n.data as PsycheNodeData).domain]?.border ?? '#a855f7'}
        className="!bg-background/90 !border-border/50"
      />
    </ReactFlow>
  )
}

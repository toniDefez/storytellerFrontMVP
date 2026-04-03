import { useMemo, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Plus, Pencil } from 'lucide-react'
import type { CharacterNode, CharacterNodeDomain } from '@/services/api'

/* ── Container metadata ────────────────────────────────────────── */

interface ContainerMeta {
  domain: CharacterNodeDomain
  label: string
  subtitle: string
  color: string
  bg: string
  lightBg: string
}

const CONTAINERS: ContainerMeta[] = [
  { domain: 'fear',    label: 'MIEDOS',     subtitle: '¿Qué evita?',           color: '#EF4444', bg: '#fef2f2', lightBg: '#fef2f2' },
  { domain: 'drive',   label: 'DESEOS',     subtitle: '¿Qué persigue?',        color: '#F59E0B', bg: '#fffbeb', lightBg: '#fffbeb' },
  { domain: 'mask',    label: 'MÁSCARAS',   subtitle: '¿Qué muestra?',         color: '#10B981', bg: '#ecfdf5', lightBg: '#ecfdf5' },
  { domain: 'bond',    label: 'GRIETAS',    subtitle: '¿Dónde se rompe?',      color: '#8B5CF6', bg: '#f5f3ff', lightBg: '#f5f3ff' },
]

// We add CREENCIAS as first container
const ALL_CONTAINERS: ContainerMeta[] = [
  { domain: 'origin',  label: 'CREENCIAS',  subtitle: '¿Qué da por hecho?',    color: '#6366F1', bg: '#eef2ff', lightBg: '#eef2ff' },
  ...CONTAINERS,
]

// Zigzag layout positions (px)
const CONTAINER_POSITIONS: Record<string, { x: number; y: number }> = {
  origin: { x: 50,  y: 50 },   // Row 1, left
  fear:   { x: 350, y: 50 },   // Row 1, center
  drive:  { x: 650, y: 50 },   // Row 1, right
  bond:   { x: 500, y: 380 },  // Row 2, right
  mask:   { x: 200, y: 380 },  // Row 2, left
}

const CONTAINER_WIDTH = 250
const CONTAINER_HEIGHT = 300

/* ── Custom container node ─────────────────────────────────────── */

interface ContainerData extends Record<string, unknown> {
  meta: ContainerMeta
  childCount: number
  onAdd: () => void
}

function ContainerNode({ data }: NodeProps<Node<ContainerData>>) {
  const { meta, childCount, onAdd } = data
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        width: CONTAINER_WIDTH,
        height: CONTAINER_HEIGHT,
        background: meta.bg,
        border: `2px solid ${meta.color}30`,
      }}
    >
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ background: `${meta.color}15`, borderBottom: `1px solid ${meta.color}20` }}
      >
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: meta.color }}>
            {meta.label}
          </span>
          <span className="text-[9px] ml-2 opacity-50" style={{ color: meta.color }}>
            {meta.subtitle}
          </span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onAdd() }}
          className="w-6 h-6 rounded-md flex items-center justify-center transition-colors hover:bg-white/50"
          style={{ color: meta.color }}
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Empty state hint */}
      {childCount === 0 && (
        <div className="flex items-center justify-center h-[calc(100%-40px)] opacity-30">
          <span className="text-[11px]" style={{ color: meta.color }}>
            Pulsa + para añadir
          </span>
        </div>
      )}

      {/* Source/Target handles for flow edges */}
      <Handle type="source" position={Position.Right} className="!w-0 !h-0 !opacity-0" />
      <Handle type="target" position={Position.Left} className="!w-0 !h-0 !opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-0 !h-0 !opacity-0" />
      <Handle type="target" position={Position.Top} id="top" className="!w-0 !h-0 !opacity-0" />
    </div>
  )
}

/* ── Custom child node (draggable within container) ───────────── */

interface ChildData extends Record<string, unknown> {
  label: string
  description: string
  containerColor: string
  isSelected: boolean
  onClick: () => void
}

function ChildNode({ data }: NodeProps<Node<ChildData>>) {
  return (
    <div
      onClick={data.onClick}
      className={`group cursor-pointer rounded-lg px-3 py-2 transition-all duration-150 hover:shadow-md ${
        data.isSelected ? 'ring-2 shadow-md' : 'hover:scale-[1.02]'
      }`}
      style={{
        width: CONTAINER_WIDTH - 24,
        background: 'white',
        border: `1px solid ${data.containerColor}${data.isSelected ? '' : '30'}`,
        boxShadow: data.isSelected ? `0 0 0 2px ${data.containerColor}` : undefined,
      }}
    >
      <p className="text-[12px] font-semibold leading-tight text-stone-800 truncate">
        {data.label}
      </p>
      {data.description && (
        <p className="text-[10px] mt-0.5 leading-snug text-stone-500 line-clamp-2">
          {data.description}
        </p>
      )}
      <Pencil
        className="w-3 h-3 absolute top-2 right-2 opacity-0 group-hover:opacity-40 transition-opacity"
        style={{ color: data.containerColor }}
      />
    </div>
  )
}

/* ── Node types ────────────────────────────────────────────────── */

const nodeTypes = {
  container: ContainerNode,
  child: ChildNode,
}

/* ── Build ReactFlow elements ──────────────────────────────────── */

function buildElements(
  charNodes: CharacterNode[],
  selectedId: number | null,
  onSelectNode: (id: number) => void,
  onAddToContainer: (domain: CharacterNodeDomain) => void,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // 1. Container nodes (fixed, non-draggable)
  for (const meta of ALL_CONTAINERS) {
    const childCount = charNodes.filter(n => n.domain === meta.domain).length
    const pos = CONTAINER_POSITIONS[meta.domain] || { x: 0, y: 0 }

    nodes.push({
      id: `container-${meta.domain}`,
      type: 'container',
      position: pos,
      draggable: false,
      selectable: false,
      data: {
        meta,
        childCount,
        onAdd: () => onAddToContainer(meta.domain),
      },
    })
  }

  // 2. Child nodes (draggable, inside containers)
  const domainChildIndex: Record<string, number> = {}
  for (const cn of charNodes) {
    const idx = domainChildIndex[cn.domain] || 0
    domainChildIndex[cn.domain] = idx + 1

    const meta = ALL_CONTAINERS.find(c => c.domain === cn.domain)

    nodes.push({
      id: `node-${cn.id}`,
      type: 'child',
      position: { x: 12, y: 48 + idx * 68 },
      parentId: `container-${cn.domain}`,
      extent: 'parent' as const,
      draggable: true,
      data: {
        label: cn.label,
        description: cn.description,
        containerColor: meta?.color || '#999',
        isSelected: cn.id === selectedId,
        onClick: () => onSelectNode(cn.id),
      },
    })
  }

  // 3. Flow edges between containers (animated!)
  const flowPath = [
    { from: 'origin', to: 'fear',  sourceHandle: undefined, targetHandle: undefined },
    { from: 'fear',   to: 'drive', sourceHandle: undefined, targetHandle: undefined },
    { from: 'drive',  to: 'bond',  sourceHandle: 'bottom',  targetHandle: 'top' },
    { from: 'bond',   to: 'mask',  sourceHandle: undefined, targetHandle: undefined },
  ]

  for (const { from, to, sourceHandle, targetHandle } of flowPath) {
    const fromMeta = ALL_CONTAINERS.find(c => c.domain === from)
    edges.push({
      id: `flow-${from}-${to}`,
      source: `container-${from}`,
      target: `container-${to}`,
      sourceHandle: sourceHandle || undefined,
      targetHandle: targetHandle || undefined,
      type: 'smoothstep',
      animated: true,
      style: {
        stroke: fromMeta?.color || '#999',
        strokeWidth: 2,
        opacity: 0.4,
      },
    })
  }

  return { nodes, edges }
}

/* ── Main canvas component ─────────────────────────────────────── */

interface Props {
  nodes: CharacterNode[]
  selectedNodeId: number | null
  onSelectNode: (id: number | null) => void
  onSelectStage: (domain: CharacterNodeDomain) => void
}

export function CharacterGraphCanvas({ nodes: charNodes, selectedNodeId, onSelectNode, onSelectStage }: Props) {
  const { nodes: flowNodes, edges: flowEdges } = useMemo(
    () => buildElements(charNodes, selectedNodeId, (id) => onSelectNode(id), onSelectStage),
    [charNodes, selectedNodeId, onSelectNode, onSelectStage],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges] = useEdgesState(flowEdges)

  useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  const handlePaneClick = useCallback(() => onSelectNode(null), [onSelectNode])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      onPaneClick={handlePaneClick}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      minZoom={0.5}
      maxZoom={1.5}
      className="bg-[hsl(40_20%_97%)]"
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e8e0d4" gap={20} size={1} />
    </ReactFlow>
  )
}

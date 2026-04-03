import { useMemo, useCallback, useEffect, createContext, useContext } from 'react'
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

/* ── Callbacks context (avoids passing functions through ReactFlow data) ── */

interface FlowCallbacks {
  onAddToContainer: (domain: CharacterNodeDomain) => void
  onSelectNode: (id: number) => void
}

const CallbacksContext = createContext<FlowCallbacks>({
  onAddToContainer: () => {},
  onSelectNode: () => {},
})

/* ── Container metadata ────────────────────────────────────────── */

interface ContainerMeta {
  domain: CharacterNodeDomain
  label: string
  subtitle: string
  color: string
  bg: string
}

const ALL_CONTAINERS: ContainerMeta[] = [
  { domain: 'origin', label: 'CREENCIAS',  subtitle: '¿Qué da por hecho?',  color: '#6366F1', bg: '#eef2ff' },
  { domain: 'fear',   label: 'MIEDOS',     subtitle: '¿Qué evita?',         color: '#EF4444', bg: '#fef2f2' },
  { domain: 'drive',  label: 'DESEOS',     subtitle: '¿Qué persigue?',      color: '#F59E0B', bg: '#fffbeb' },
  { domain: 'mask',   label: 'MÁSCARAS',   subtitle: '¿Qué muestra?',       color: '#10B981', bg: '#ecfdf5' },
  { domain: 'bond',   label: 'GRIETAS',    subtitle: '¿Dónde se rompe?',    color: '#8B5CF6', bg: '#f5f3ff' },
]

const CONTAINER_POSITIONS: Record<string, { x: number; y: number }> = {
  origin: { x: 50,  y: 50 },
  fear:   { x: 350, y: 50 },
  drive:  { x: 650, y: 50 },
  bond:   { x: 500, y: 380 },
  mask:   { x: 200, y: 380 },
}

const CONTAINER_WIDTH = 250
const CONTAINER_HEIGHT = 300

/* ── Custom container node ─────────────────────────────────────── */

interface ContainerData extends Record<string, unknown> {
  domain: string
  label: string
  subtitle: string
  color: string
  bg: string
  childCount: number
}

function ContainerNode({ data }: NodeProps<Node<ContainerData>>) {
  const callbacks = useContext(CallbacksContext)

  const handleAdd = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    callbacks.onAddToContainer(data.domain as CharacterNodeDomain)
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        width: CONTAINER_WIDTH,
        height: CONTAINER_HEIGHT,
        background: data.bg,
        border: `2px solid ${data.color}30`,
      }}
    >
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ background: `${data.color}15`, borderBottom: `1px solid ${data.color}20` }}
      >
        <div>
          <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: data.color }}>
            {data.label}
          </span>
          <span className="text-[9px] ml-2 opacity-50" style={{ color: data.color }}>
            {data.subtitle}
          </span>
        </div>
        <div
          role="button"
          className="nopan nodrag w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-white/60 transition-colors"
          style={{ color: data.color }}
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onClick={handleAdd}
        >
          <Plus className="w-4 h-4" />
        </div>
      </div>

      {data.childCount === 0 && (
        <div
          className="nopan nodrag flex items-center justify-center cursor-pointer hover:opacity-60 transition-opacity"
          style={{ height: CONTAINER_HEIGHT - 44, color: `${data.color}40` }}
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onClick={handleAdd}
        >
          <span className="text-[12px]">+ Añadir</span>
        </div>
      )}

      <Handle type="source" position={Position.Right} className="!w-0 !h-0 !opacity-0" />
      <Handle type="target" position={Position.Left} className="!w-0 !h-0 !opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-0 !h-0 !opacity-0" />
      <Handle type="target" position={Position.Top} id="top" className="!w-0 !h-0 !opacity-0" />
    </div>
  )
}

/* ── Custom child node ─────────────────────────────────────────── */

interface ChildData extends Record<string, unknown> {
  nodeId: number
  label: string
  description: string
  containerColor: string
  isSelected: boolean
}

function ChildNode({ data }: NodeProps<Node<ChildData>>) {
  const callbacks = useContext(CallbacksContext)

  return (
    <div
      className={`nopan nodrag group cursor-pointer rounded-lg px-3 py-2 transition-all duration-150 hover:shadow-md relative ${
        data.isSelected ? 'shadow-md' : 'hover:scale-[1.02]'
      }`}
      style={{
        width: CONTAINER_WIDTH - 24,
        background: 'white',
        border: `1px solid ${data.containerColor}${data.isSelected ? '' : '30'}`,
        boxShadow: data.isSelected ? `0 0 0 2px ${data.containerColor}` : undefined,
      }}
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); callbacks.onSelectNode(data.nodeId) }}
    >
      <p className="text-[12px] font-semibold leading-tight text-stone-800 truncate pr-4">
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
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

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
        domain: meta.domain,
        label: meta.label,
        subtitle: meta.subtitle,
        color: meta.color,
        bg: meta.bg,
        childCount,
      },
    })
  }

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
        nodeId: cn.id,
        label: cn.label,
        description: cn.description,
        containerColor: meta?.color || '#999',
        isSelected: cn.id === selectedId,
      },
    })
  }

  // Flow edges between containers (animated)
  const flowPath = [
    { from: 'origin', to: 'fear' },
    { from: 'fear',   to: 'drive' },
    { from: 'drive',  to: 'bond',  sourceHandle: 'bottom', targetHandle: 'top' },
    { from: 'bond',   to: 'mask' },
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
        opacity: 0.35,
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
    () => buildElements(charNodes, selectedNodeId),
    [charNodes, selectedNodeId],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges] = useEdgesState(flowEdges)

  useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  const handlePaneClick = useCallback(() => onSelectNode(null), [onSelectNode])

  const callbacks = useMemo<FlowCallbacks>(() => ({
    onAddToContainer: onSelectStage,
    onSelectNode: (id: number) => onSelectNode(id === selectedNodeId ? null : id),
  }), [onSelectStage, onSelectNode, selectedNodeId])

  return (
    <CallbacksContext.Provider value={callbacks}>
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
    </CallbacksContext.Provider>
  )
}

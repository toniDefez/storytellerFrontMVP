import { useMemo, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { BookOpen, RefreshCw } from 'lucide-react'
import type { CharacterNode, CharacterNodeDomain, DomainSynthesis } from '@/services/api'

/* ── Container metadata ────────────────────────────────────────── */

interface ContainerMeta {
  domain: CharacterNodeDomain
  label: string
  subtitle: string
  color: string
  bg: string
}

const ALL_CONTAINERS: ContainerMeta[] = [
  { domain: 'origin', label: 'CREENCIAS', subtitle: '¿Que da por hecho?', color: '#6366F1', bg: '#eef2ff' },
  { domain: 'fear',   label: 'MIEDOS',    subtitle: '¿Que evita?',        color: '#EF4444', bg: '#fef2f2' },
  { domain: 'drive',  label: 'DESEOS',    subtitle: '¿Que persigue?',     color: '#F59E0B', bg: '#fffbeb' },
  { domain: 'bond',   label: 'GRIETAS',   subtitle: '¿Donde se rompe?',   color: '#8B5CF6', bg: '#f5f3ff' },
  { domain: 'mask',   label: 'MASCARAS',  subtitle: '¿Que muestra?',      color: '#10B981', bg: '#ecfdf5' },
]

// Snake layout positions
const CONTAINER_POSITIONS: Record<string, { x: number; y: number }> = {
  origin: { x: 50,  y: 80 },
  fear:   { x: 350, y: 80 },
  drive:  { x: 650, y: 80 },
  bond:   { x: 650, y: 420 },
  mask:   { x: 50,  y: 420 },
}

const CONTAINER_WIDTH = 250
const CONTAINER_HEIGHT = 300

/* ── Orbital sizing ─────────────────────────────────────────────── */

const SALIENCE_SIZE: Record<string, number> = {
  high: 44,
  medium: 32,
  low: 22,
}

const ORBITAL_RADIUS = 150

/* ── Label node (entry / exit markers) ────────────────────────── */

interface LabelData extends Record<string, unknown> {
  text: string
}

function LabelNode({ data }: NodeProps<Node<LabelData>>) {
  return (
    <div className="text-[9px] font-semibold tracking-[0.12em] uppercase text-stone-400/50 select-none whitespace-nowrap">
      {data.text as string}
    </div>
  )
}

/* ── Custom container node ─────────────────────────────────────── */

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
  onContainerClick: (domain: CharacterNodeDomain) => void
  onRegenerate: (domain: CharacterNodeDomain) => void
}

function ContainerNode({ data }: NodeProps<Node<ContainerData>>) {
  const isEmpty = data.childCount === 0
  const hasSynthesis = !!(data.synthesis as string)
  const isStale = data.isStale as boolean
  const isLoading = data.isSynthesisLoading as boolean

  const handleClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation()
    e.preventDefault()
    data.onContainerClick(data.domain as CharacterNodeDomain)
  }

  const handleRegenerate = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    data.onRegenerate(data.domain as CharacterNodeDomain)
  }

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300"
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
      {/* Header */}
      <div
        className="px-3 py-2 flex items-center justify-between"
        style={{ background: `${data.color}15`, borderBottom: `1px solid ${data.color}20` }}
      >
        <div className="min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: data.color as string }}>
            {data.label as string}
          </span>
          <span className="text-[9px] ml-2 opacity-50" style={{ color: data.color as string }}>
            {data.subtitle as string}
          </span>
        </div>
        <div
          role="button"
          className="nopan nodrag w-7 h-7 rounded-md flex items-center justify-center cursor-pointer hover:bg-white/60 transition-colors shrink-0"
          style={{ color: data.color as string }}
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onClick={handleClick}
        >
          <BookOpen className="w-4 h-4" />
        </div>
      </div>

      {/* Stale banner */}
      {isStale && !isLoading && (
        <div
          className="nopan nodrag px-3 py-1.5 flex items-center justify-between bg-amber-50 border-b border-amber-200"
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <span className="text-[10px] text-amber-700">Sintesis desactualizada</span>
          <button
            onClick={handleRegenerate}
            className="text-[10px] font-medium text-amber-600 hover:text-amber-800 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Regenerar
          </button>
        </div>
      )}

      {/* Body */}
      <div
        className="nopan nodrag px-3 py-2 overflow-y-auto"
        style={{ height: CONTAINER_HEIGHT - 44 - (isStale && !isLoading ? 32 : 0) }}
        onPointerDown={e => e.stopPropagation()}
        onMouseDown={e => e.stopPropagation()}
      >
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 rounded bg-stone-200/60 w-full" />
            <div className="h-3 rounded bg-stone-200/40 w-3/4" />
            <div className="h-3 rounded bg-stone-200/30 w-1/2" />
            {hasSynthesis && (
              <p className="text-[10px] leading-relaxed text-stone-400 mt-2 opacity-60">
                {data.synthesis as string}
              </p>
            )}
          </div>
        ) : hasSynthesis ? (
          <p className="text-[11px] leading-relaxed text-stone-600">
            {data.synthesis as string}
          </p>
        ) : isEmpty ? (
          <div
            className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity h-full"
            style={{ color: `${data.color}35` }}
            onClick={handleClick}
          >
            <span className="text-[11px]">Click para anadir {(data.label as string).toLowerCase()}</span>
          </div>
        ) : (
          <div
            className="flex items-center justify-center cursor-pointer hover:opacity-80 transition-opacity h-full"
            style={{ color: `${data.color}50` }}
            onClick={handleClick}
          >
            <span className="text-[11px]">Abrir catalogo para sintetizar</span>
          </div>
        )}
      </div>

      {/* All handles */}
      <Handle type="source" position={Position.Right} className="!w-0 !h-0 !opacity-0" />
      <Handle type="target" position={Position.Left} className="!w-0 !h-0 !opacity-0" />
      <Handle type="source" position={Position.Left}   id="left"  className="!w-0 !h-0 !opacity-0" />
      <Handle type="target" position={Position.Right}  id="right" className="!w-0 !h-0 !opacity-0" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-0 !h-0 !opacity-0" />
      <Handle type="target" position={Position.Top}    id="top"   className="!w-0 !h-0 !opacity-0" />
    </div>
  )
}

/* ── Orbital node ────────────────────────────────────────────────── */

interface OrbitalData extends Record<string, unknown> {
  nodeId: number
  label: string
  color: string
  size: number
  isSelected: boolean
  onSelect: (id: number) => void
}

function OrbitalNode({ data }: NodeProps<Node<OrbitalData>>) {
  const size = data.size as number
  const fontSize = size >= 44 ? 10 : size >= 32 ? 9 : 7

  return (
    <div
      className="nopan nodrag cursor-pointer flex items-center justify-center rounded-full transition-all duration-150 hover:scale-110"
      style={{
        width: size,
        height: size,
        background: data.color as string,
        boxShadow: data.isSelected
          ? `0 0 0 3px white, 0 0 0 5px ${data.color}`
          : `0 2px 8px ${data.color}40`,
        color: 'white',
      }}
      onPointerDown={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      onClick={(e) => { e.stopPropagation(); data.onSelect(data.nodeId) }}
    >
      <span
        className="font-semibold leading-tight text-center overflow-hidden text-ellipsis px-0.5"
        style={{
          fontSize: `${fontSize}px`,
          maxWidth: size - 6,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {data.label as string}
      </span>
      <Handle type="source" position={Position.Bottom} className="!w-0 !h-0 !opacity-0" />
      <Handle type="target" position={Position.Bottom} id="orbital-target" className="!w-0 !h-0 !opacity-0" />
    </div>
  )
}

/* ── Node types ────────────────────────────────────────────────── */

const nodeTypes = {
  container: ContainerNode,
  child: OrbitalNode,
  label: LabelNode,
}

/* ── Calculate orbital positions ─────────────────────────────────── */

function getOrbitalPositions(
  count: number,
  containerX: number,
  containerY: number,
): { x: number; y: number }[] {
  if (count === 0) return []

  const centerX = containerX + CONTAINER_WIDTH / 2
  const radius = ORBITAL_RADIUS

  if (count === 1) {
    return [{ x: centerX, y: containerY - radius }]
  }

  // Spread from 30 to 150 degrees (arc above container)
  const totalSpread = Math.min(120, 30 + count * 25)
  const startAngle = 90 - totalSpread / 2
  const step = count > 1 ? totalSpread / (count - 1) : 0

  return Array.from({ length: count }, (_, i) => {
    const angleDeg = startAngle + i * step
    const angleRad = (angleDeg * Math.PI) / 180
    return {
      x: centerX + radius * Math.cos(angleRad),
      y: containerY - radius * Math.sin(angleRad),
    }
  })
}

/* ── Build ReactFlow elements ──────────────────────────────────── */

function buildElements(
  charNodes: CharacterNode[],
  selectedId: number | null,
  synthesis: DomainSynthesis[],
  synthesisLoading: string | null,
  onContainerClick: (domain: CharacterNodeDomain) => void,
  onRegenerate: (domain: CharacterNodeDomain) => void,
  onSelect: (id: number) => void,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Entry / exit labels
  nodes.push({
    id: 'label-entry',
    type: 'label',
    position: { x: 50, y: 56 },
    draggable: false,
    selectable: false,
    data: { text: '<- estimulo externo' },
  })
  nodes.push({
    id: 'label-exit',
    type: 'label',
    position: { x: 50, y: 420 + CONTAINER_HEIGHT + 10 },
    draggable: false,
    selectable: false,
    data: { text: 'reaccion al mundo ->' },
  })

  // Containers
  for (const meta of ALL_CONTAINERS) {
    const childCount = charNodes.filter(n => n.domain === meta.domain).length
    const pos = CONTAINER_POSITIONS[meta.domain] || { x: 0, y: 0 }
    const domainSynth = synthesis.find(s => s.domain === meta.domain)

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
        synthesis: domainSynth?.synthesis || '',
        isStale: domainSynth?.is_stale ?? false,
        isSynthesisLoading: synthesisLoading === meta.domain,
        onContainerClick,
        onRegenerate,
      },
    })

    // Orbital child nodes for this container
    const domainNodes = charNodes.filter(n => n.domain === meta.domain)
    const orbitalPos = getOrbitalPositions(domainNodes.length, pos.x, pos.y)

    for (let i = 0; i < domainNodes.length; i++) {
      const cn = domainNodes[i]
      const oPos = orbitalPos[i]
      const size = SALIENCE_SIZE[cn.salience] || SALIENCE_SIZE.medium

      nodes.push({
        id: `node-${cn.id}`,
        type: 'child',
        position: { x: oPos.x - size / 2, y: oPos.y - size / 2 },
        draggable: false,
        selectable: false,
        data: {
          nodeId: cn.id,
          label: cn.label,
          color: meta.color,
          size,
          isSelected: cn.id === selectedId,
          onSelect,
        },
      })

      // Edge from orbital to container
      edges.push({
        id: `orbital-edge-${cn.id}`,
        source: `node-${cn.id}`,
        target: `container-${meta.domain}`,
        targetHandle: 'top',
        type: 'straight',
        animated: false,
        style: {
          stroke: meta.color,
          strokeWidth: 1,
          opacity: 0.3,
        },
      })
    }
  }

  // Flow edges — snake pattern with solid arrows
  const flowPath = [
    { from: 'origin', to: 'fear',  sourceHandle: undefined, targetHandle: undefined },
    { from: 'fear',   to: 'drive', sourceHandle: undefined, targetHandle: undefined },
    { from: 'drive',  to: 'bond',  sourceHandle: 'bottom',  targetHandle: 'top'    },
    { from: 'bond',   to: 'mask',  sourceHandle: 'left',    targetHandle: 'right'  },
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
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: `${fromMeta?.color}70`,
        width: 14,
        height: 14,
      },
      style: {
        stroke: `${fromMeta?.color}55`,
        strokeWidth: 1.5,
      },
    })
  }

  return { nodes, edges }
}

/* ── Main canvas component ─────────────────────────────────────── */

interface Props {
  nodes: CharacterNode[]
  selectedNodeId: number | null
  synthesis: DomainSynthesis[]
  synthesisLoading: string | null
  onSelectNode: (id: number | null) => void
  onContainerClick: (domain: CharacterNodeDomain) => void
  onRegenerateSynthesis: (domain: CharacterNodeDomain) => void
}

export function CharacterGraphCanvas({
  nodes: charNodes,
  selectedNodeId,
  synthesis,
  synthesisLoading,
  onSelectNode,
  onContainerClick,
  onRegenerateSynthesis,
}: Props) {
  const handleSelectNode = useCallback(
    (id: number) => onSelectNode(id === selectedNodeId ? null : id),
    [onSelectNode, selectedNodeId],
  )

  const { nodes: flowNodes, edges: flowEdges } = useMemo(
    () => buildElements(
      charNodes,
      selectedNodeId,
      synthesis,
      synthesisLoading,
      onContainerClick,
      onRegenerateSynthesis,
      handleSelectNode,
    ),
    [charNodes, selectedNodeId, synthesis, synthesisLoading, onContainerClick, onRegenerateSynthesis, handleSelectNode],
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
      fitViewOptions={{ padding: 0.18 }}
      minZoom={0.5}
      maxZoom={1.5}
      className="bg-[hsl(40_20%_97%)]"
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e8e0d4" gap={20} size={1} />
    </ReactFlow>
  )
}

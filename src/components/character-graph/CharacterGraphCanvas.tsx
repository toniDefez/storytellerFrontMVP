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

// Vertical flow — top to bottom, orbitals to the right
const CONTAINER_POSITIONS: Record<string, { x: number; y: number }> = {
  origin: { x: 100, y: 60 },
  fear:   { x: 100, y: 430 },
  drive:  { x: 100, y: 800 },
  bond:   { x: 100, y: 1170 },
  mask:   { x: 100, y: 1540 },
}

const CONTAINER_WIDTH = 250
const CONTAINER_HEIGHT = 300

/* ── Orbital sizing ─────────────────────────────────────────────── */

const SALIENCE_SIZE: Record<string, number> = {
  high: 44,
  medium: 32,
  low: 22,
}


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
}

function ContainerNode({ data }: NodeProps<Node<ContainerData>>) {
  const isEmpty = data.childCount === 0
  const hasSynthesis = !!(data.synthesis as string)
  const isStale = data.isStale as boolean
  const isLoading = data.isSynthesisLoading as boolean

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300 cursor-pointer"
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
        <BookOpen className="w-4 h-4 shrink-0 opacity-40" style={{ color: data.color as string }} />
      </div>

      {/* Stale banner */}
      {isStale && !isLoading && (
        <div className="px-3 py-1.5 flex items-center gap-2 bg-amber-50 border-b border-amber-200">
          <RefreshCw className="w-3 h-3 text-amber-600" />
          <span className="text-[10px] text-amber-700">Sintesis desactualizada — click para regenerar</span>
        </div>
      )}

      {/* Body — purely visual, no event handlers */}
      <div
        className="px-3 py-2 overflow-y-auto"
        style={{ height: CONTAINER_HEIGHT - 44 - (isStale && !isLoading ? 32 : 0) }}
      >
        {isLoading ? (
          <div className="space-y-2 animate-pulse">
            <div className="h-3 rounded bg-stone-200/60 w-full" />
            <div className="h-3 rounded bg-stone-200/40 w-3/4" />
            <div className="h-3 rounded bg-stone-200/30 w-1/2" />
          </div>
        ) : hasSynthesis ? (
          <p className="text-[11px] leading-relaxed text-stone-600">
            {data.synthesis as string}
          </p>
        ) : isEmpty ? (
          <div className="flex items-center justify-center h-full" style={{ color: `${data.color}35` }}>
            <span className="text-[11px]">Click para anadir {(data.label as string).toLowerCase()}</span>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full" style={{ color: `${data.color}50` }}>
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
      className="cursor-pointer flex items-center justify-center rounded-full transition-all duration-150 hover:scale-110"
      style={{
        width: size,
        height: size,
        background: data.color as string,
        boxShadow: data.isSelected
          ? `0 0 0 3px white, 0 0 0 5px ${data.color}`
          : `0 2px 8px ${data.color}40`,
        color: 'white',
      }}
      onClick={(e) => { e.stopPropagation(); data.onSelect(data.nodeId as number) }}
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

  const baseX = containerX + CONTAINER_WIDTH + 40
  const centerY = containerY + CONTAINER_HEIGHT / 2

  if (count === 1) {
    return [{ x: baseX + 60, y: centerY }]
  }

  // Spread vertically alongside the container
  const spacing = Math.min(65, (CONTAINER_HEIGHT - 20) / (count - 1))
  const startY = centerY - (count - 1) * spacing / 2

  return Array.from({ length: count }, (_, i) => ({
    x: baseX + 50 + (i % 2 === 0 ? 0 : 35),
    y: startY + i * spacing,
  }))
}

/* ── Build ReactFlow elements ──────────────────────────────────── */

function buildElements(
  charNodes: CharacterNode[],
  selectedId: number | null,
  synthesis: DomainSynthesis[],
  synthesisLoading: string | null,
  onSelect: (id: number) => void,
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Entry / exit labels
  nodes.push({
    id: 'label-entry',
    type: 'label',
    position: { x: 50, y: 176 },
    draggable: false,
    selectable: false,
    data: { text: '<- estimulo externo' },
  })
  nodes.push({
    id: 'label-exit',
    type: 'label',
    position: { x: 50, y: 600 + CONTAINER_HEIGHT + 10 },
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
        draggable: true,
        selectable: true,
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
  // Vertical flow: all arrows go bottom→top
  const flowPath = [
    { from: 'origin', to: 'fear',  sourceHandle: 'bottom', targetHandle: 'top' },
    { from: 'fear',   to: 'drive', sourceHandle: 'bottom', targetHandle: 'top' },
    { from: 'drive',  to: 'bond',  sourceHandle: 'bottom', targetHandle: 'top' },
    { from: 'bond',   to: 'mask',  sourceHandle: 'bottom', targetHandle: 'top' },
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

export interface ContextMenuEvent {
  type: 'container' | 'orbital'
  x: number
  y: number
  // Container fields
  domain?: CharacterNodeDomain
  domainLabel?: string
  hasNodes?: boolean
  isStale?: boolean
  // Orbital fields
  nodeId?: number
  nodeLabel?: string
}

interface Props {
  nodes: CharacterNode[]
  selectedNodeId: number | null
  synthesis: DomainSynthesis[]
  synthesisLoading: string | null
  onSelectNode: (id: number | null) => void
  onContainerClick: (domain: CharacterNodeDomain) => void
  onContextMenu?: (event: ContextMenuEvent) => void
}

export function CharacterGraphCanvas({
  nodes: charNodes,
  selectedNodeId,
  synthesis,
  synthesisLoading,
  onSelectNode,
  onContainerClick,
  onContextMenu,
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
      handleSelectNode,
    ),
    [charNodes, selectedNodeId, synthesis, synthesisLoading, handleSelectNode],
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges] = useEdgesState(flowEdges)

  useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  const handlePaneClick = useCallback(() => onSelectNode(null), [onSelectNode])

  // ReactFlow-level click — works reliably unlike onClick inside custom nodes
  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.id.startsWith('container-')) {
      const domain = node.id.replace('container-', '') as CharacterNodeDomain
      onContainerClick(domain)
    } else if (node.id.startsWith('node-')) {
      const nodeId = parseInt(node.id.replace('node-', ''), 10)
      if (!isNaN(nodeId)) handleSelectNode(nodeId)
    }
  }, [onContainerClick, handleSelectNode])

  // Right-click context menu
  const handleNodeContextMenu = useCallback((e: React.MouseEvent, node: Node) => {
    e.preventDefault()
    if (!onContextMenu) return

    if (node.id.startsWith('container-')) {
      const domain = node.id.replace('container-', '') as CharacterNodeDomain
      const meta = ALL_CONTAINERS.find(c => c.domain === domain)
      const domainNodes = charNodes.filter(n => n.domain === domain)
      const syn = synthesis.find(s => s.domain === domain)
      onContextMenu({
        type: 'container',
        x: e.clientX,
        y: e.clientY,
        domain,
        domainLabel: meta?.label || domain,
        hasNodes: domainNodes.length > 0,
        isStale: syn?.is_stale ?? false,
      })
    } else if (node.id.startsWith('node-')) {
      const nodeId = parseInt(node.id.replace('node-', ''), 10)
      const charNode = charNodes.find(n => n.id === nodeId)
      if (charNode) {
        onContextMenu({
          type: 'orbital',
          x: e.clientX,
          y: e.clientY,
          nodeId: charNode.id,
          nodeLabel: charNode.label,
        })
      }
    }
  }, [onContextMenu, charNodes, synthesis])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      nodeTypes={nodeTypes}
      onPaneClick={handlePaneClick}
      onNodeClick={handleNodeClick}
      onNodeContextMenu={handleNodeContextMenu}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      minZoom={0.5}
      maxZoom={1.5}
      className="bg-[hsl(40_20%_97%)]"
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#e8e0d4" gap={20} size={1} />
    </ReactFlow>
  )
}

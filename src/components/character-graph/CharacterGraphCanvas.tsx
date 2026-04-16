import { useMemo, useCallback, useEffect, useRef } from 'react'
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
import '@xyflow/react/dist/style.css'
import { FloatingEdge, LiteraryFlowEdge } from './edges'
import { useReducedMotion } from 'framer-motion'
import { RefreshCw, Sprout, Flame, Compass, Zap, VenetianMask } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CharacterNode, CharacterNodeDomain, DomainSynthesis } from '@/services/api'

/* ── Container metadata ────────────────────────────────────────── */

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


/* ── Entry node ────────────────────────────────────────────────── */

function EntryNode() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      borderRadius: 999,
      background: '#f5f0eb',
      border: '1.5px dashed #c4b9ae',
      color: '#a8a29e',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      userSelect: 'none',
    }}>
      <span style={{ fontSize: 13 }}>↓</span>
      Estímulo externo
      <Handle type="source" position={Position.Bottom} className="!w-0 !h-0 !opacity-0" />
    </div>
  )
}

/* ── Exit node ──────────────────────────────────────────────────── */

function ExitNode() {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '6px 14px',
      borderRadius: 999,
      background: '#f5f0eb',
      border: '1.5px dashed #c4b9ae',
      color: '#a8a29e',
      fontSize: 10,
      fontWeight: 600,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      whiteSpace: 'nowrap',
      userSelect: 'none',
    }}>
      Reacción al mundo
      <span style={{ fontSize: 13 }}>↓</span>
      <Handle type="target" position={Position.Top} className="!w-0 !h-0 !opacity-0" />
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
  icon: LucideIcon
}

function ContainerNode({ data }: NodeProps<Node<ContainerData>>) {
  const isEmpty = data.childCount === 0
  const hasSynthesis = !!(data.synthesis as string)
  const isStale = data.isStale as boolean
  const isLoading = data.isSynthesisLoading as boolean

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Dominio ${data.label as string}, ${data.childCount as number} nodos`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          e.stopPropagation()
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
        {(() => {
          const Icon = data.icon as LucideIcon
          return <Icon className="w-4 h-4 shrink-0 opacity-40" style={{ color: data.color as string }} />
        })()}
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

/* ── Orbital sizing ─────────────────────────────────────────────── */

function getSalienceSize(salience: number): number {
  const clamped = Math.max(1, Math.min(10, salience))
  return Math.round(48 + (clamped - 1) * 8)  // 48px → 120px
}

/* ── Orbital node ────────────────────────────────────────────────── */

interface OrbitalData extends Record<string, unknown> {
  nodeId: number
  label: string
  color: string
  salience: number
  isSelected: boolean
  onSelect: (id: number) => void
}

function OrbitalNode({ data }: NodeProps<Node<OrbitalData>>) {
  const size       = getSalienceSize(data.salience as number)
  const color      = data.color as string
  const isSelected = data.isSelected as boolean
  const fontSize   = size >= 96 ? 11 : size >= 72 ? 10 : 9

  return (
    <>
      {/* Tooltip with full label — only on hover via CSS */}
      <NodeToolbar
        isVisible={isSelected}
        position={Position.Top}
        offset={6}
        style={{ pointerEvents: 'none' }}
      >
        <div
          style={{
            background: 'white',
            border: `1px solid ${color}40`,
            borderRadius: 6,
            padding: '4px 8px',
            fontSize: 11,
            fontWeight: 500,
            color: '#292524',
            boxShadow: `0 2px 8px ${color}20`,
            whiteSpace: 'nowrap',
            maxWidth: 220,
          }}
        >
          {data.label as string}
        </div>
      </NodeToolbar>

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
        <span
          style={{
            fontSize,
            fontWeight: 600,
            color: 'white',
            textAlign: 'center',
            lineHeight: 1.25,
            padding: '0 6px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {data.label as string}
        </span>
      </div>

      <Handle type="source" position={Position.Left} className="!w-0 !h-0 !opacity-0" />
      <Handle type="target" position={Position.Left} id="orbital-target" className="!w-0 !h-0 !opacity-0" />
    </>
  )
}

/* ── Node types ────────────────────────────────────────────────── */

const nodeTypes = {
  container: ContainerNode,
  child: OrbitalNode,
  entry: EntryNode,
  exit: ExitNode,
}

const edgeTypes = {
  floating: FloatingEdge,
  literaryFlow: LiteraryFlowEdge,
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

/* ── Collision resolution ────────────────────────────────────────── */

const MARGIN = 12

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

  // Entry node — sits above CREENCIAS
  const originPos = CONTAINER_POSITIONS['origin']
  const maskPos   = CONTAINER_POSITIONS['mask']
  nodes.push({
    id: 'entry',
    type: 'entry',
    position: { x: originPos.x + CONTAINER_WIDTH / 2 - 80, y: originPos.y - 60 },
    draggable: false,
    selectable: false,
    data: {},
  })
  edges.push({
    id: 'edge-entry',
    source: 'entry',
    target: 'container-origin',
    targetHandle: 'top',
    type: 'smoothstep',
    animated: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#c4b9ae',
      width: 14,
      height: 14,
    },
    style: { stroke: '#c4b9ae', strokeWidth: 1.5, strokeDasharray: '5 4' },
  })

  // Exit node — sits below MÁSCARAS
  nodes.push({
    id: 'exit',
    type: 'exit',
    position: { x: maskPos.x + CONTAINER_WIDTH / 2 - 80, y: maskPos.y + CONTAINER_HEIGHT + 20 },
    draggable: false,
    selectable: false,
    data: {},
  })
  edges.push({
    id: 'edge-exit',
    source: 'container-mask',
    target: 'exit',
    sourceHandle: 'bottom',
    type: 'smoothstep',
    animated: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#c4b9ae',
      width: 14,
      height: 14,
    },
    style: { stroke: '#c4b9ae', strokeWidth: 1.5, strokeDasharray: '5 4' },
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

    // Orbital child nodes for this container
    const domainNodes = charNodes.filter(n => n.domain === meta.domain)
    const orbitalPos = getOrbitalPositions(domainNodes.length, pos.x, pos.y)

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
        type: 'floating',
        style: {
          stroke: meta.color,
          strokeWidth: 1,
          opacity: 0.35,
        },
      })
    }
  }

  // Flow edges — psychological chain, top to bottom
  const flowPath = [
    {
      from: 'origin', to: 'fear',
      label: 'lo que da por hecho define lo que teme perder',
    },
    {
      from: 'fear', to: 'drive',
      label: 'el miedo se convierte en impulso y obsesión',
    },
    {
      from: 'drive', to: 'bond',
      label: 'perseguir sin descanso abre grietas profundas',
    },
    {
      from: 'bond', to: 'mask',
      label: 'las grietas exigen una máscara para seguir',
    },
  ]

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
  /** Persists orbital drag-stop position. Pass `moveNode` from useCharacterGraph. */
  onPersistPosition?: (id: number, x: number, y: number) => void
  /** When the right-side drawer opens/closes, canvas refits to compensate. */
  drawerOpen: boolean
}

function CharacterGraphCanvasInner({
  nodes: charNodes,
  selectedNodeId,
  synthesis,
  synthesisLoading,
  onSelectNode,
  onContainerClick,
  onContextMenu,
  onPersistPosition,
  drawerOpen,
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

  useEffect(() => {
    setNodes(prev => {
      const posMap = new Map(prev.map(n => [n.id, n.position]))
      return flowNodes.map(n => ({
        ...n,
        position: posMap.has(n.id) ? posMap.get(n.id)! : n.position,
      }))
    })
  }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  const { fitView } = useReactFlow()
  const prefersReducedMotion = useReducedMotion()
  const didMountRef = useRef(false)

  useEffect(() => {
    // Skip the first run: <ReactFlow fitView /> already handles initial layout.
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }
    // The drawer is a fixed-position Sheet portal — the canvas container does
    // not reflow. This fitView re-centers so graph content is not occluded by
    // the drawer overlay. 120ms matches the Sheet enter/exit cadence.
    const t = window.setTimeout(() => {
      fitView({
        padding: 0.12,
        duration: prefersReducedMotion ? 0 : 250,
      })
    }, 120)
    return () => window.clearTimeout(t)
  }, [drawerOpen, fitView, prefersReducedMotion])

  const handlePaneClick = useCallback(() => onSelectNode(null), [onSelectNode])

  const handleNodeDragStop = useCallback(
    (_: React.MouseEvent, draggedNode: Node) => {
      setNodes(nds => {
        const resolved = resolveCollisions(nds)
        // Only persist orbital positions. Containers/pills are not user-positioned yet (Fase 2).
        if (draggedNode.type === 'child' && draggedNode.id.startsWith('node-') && onPersistPosition) {
          const nodeId = parseInt(draggedNode.id.slice(5), 10)
          if (!Number.isNaN(nodeId)) {
            const resolvedNode = resolved.find(n => n.id === draggedNode.id)
            const pos = resolvedNode?.position ?? draggedNode.position
            // Defer so the side effect runs after React commits this state update.
            Promise.resolve().then(() => onPersistPosition(nodeId, pos.x, pos.y))
          }
        }
        return resolved
      })
    },
    [setNodes, onPersistPosition],
  )

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
      edgeTypes={edgeTypes}
      onPaneClick={handlePaneClick}
      onNodeClick={handleNodeClick}
      onNodeDragStop={handleNodeDragStop}
      onNodeContextMenu={handleNodeContextMenu}
      fitView
      fitViewOptions={{ padding: 0.12 }}
      minZoom={0.5}
      maxZoom={1.5}
      className="bg-[hsl(40_30%_96%)]"
      proOptions={{ hideAttribution: true }}
    >
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

      <Panel position="top-right">
        <div style={{
          background: 'white',
          border: '1px solid #e7e0d8',
          borderRadius: 10,
          padding: '12px 16px',
          maxWidth: 200,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#78716c',
            marginBottom: 8,
          }}>
            Arquitectura psicológica
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {ALL_CONTAINERS.map(m => (
              <div key={m.domain} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <div style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: m.color, flexShrink: 0,
                }} />
                <span style={{ fontSize: 10, color: '#57534e', lineHeight: 1.3 }}>
                  <strong style={{ color: m.color, fontWeight: 600 }}>{m.label}</strong>
                  {' — '}{m.subtitle}
                </span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 10,
            paddingTop: 8,
            borderTop: '1px solid #f0ebe4',
            fontSize: 9,
            color: '#a8a29e',
            fontStyle: 'italic',
            lineHeight: 1.5,
          }}>
            Los nodos orbitales representan creencias concretas. Su tamaño indica cuánto peso tienen en la psicología del personaje.
          </div>
        </div>
      </Panel>
    </ReactFlow>
  )
}

export function CharacterGraphCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <CharacterGraphCanvasInner {...props} />
    </ReactFlowProvider>
  )
}

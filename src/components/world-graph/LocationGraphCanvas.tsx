import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  ConnectionMode,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Ellipsis, Map as MapIcon, Plus, RefreshCw, Users } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { LocationNode as LocationNodeComponent } from './LocationNode'
import { WaterwayEdge, WildernessEdge, RoadEdge, HierarchyEdge } from './LocationEdges'
import { LocationSidePanel } from './LocationSidePanel'
import { PlaceNameDraft } from './PlaceNameDraft'
import { notifyPlaceError } from './placeErrors'
import type { LocationNode, LocationEdge, LocationNodePatch } from '@/services/api'
import type { SelectedLocation } from '@/hooks/useLocationGraph'
import { RegionNode, computeRegionBounds } from './RegionNode'
import { MapBackdropNode } from './MapBackdropNode'
import { RegionLabelNode } from './RegionLabelNode'
import { polygonArea, polygonCentroid } from './regionPath'
import { regionLabelNodeId, regionNodeId } from './regionCanvasNodes'
import { zIndexForRegion, Z_INDEX } from './physicalMapPalette'
import type { Faction, Region } from '@/services/factionApi'

// Define outside component to avoid re-renders
const nodeTypes = {
  mapBackdrop: MapBackdropNode,
  location: LocationNodeComponent,
  region: RegionNode,
  regionLabel: RegionLabelNode,
}
const edgeTypes = { waterway: WaterwayEdge, wilderness: WildernessEdge, road: RoadEdge, hierarchy: HierarchyEdge }

// Ancho del panel lateral en px; debe coincidir con la clase `w-80` del panel.
// Se usa para centrar el lugar seleccionado en la parte visible del lienzo.
const PANEL_WIDTH_PX = 320

/**
 * El backend guarda (canvas_x, canvas_y) como la esquina superior izquierda de
 * la antigua tarjeta de 150x60 y coloca los lugares desplazándolos media
 * tarjeta (`halfCardW/halfCardH` en storytellerMVP internal/location/app/
 * placement.go). El punto del lugar va en el centro de esa tarjeta, que es el
 * punto del terreno que eligió el mapa.
 */
const PIN_OFFSET = { x: 75, y: 30 }
const pinPosition = (n: { canvas_x: number; canvas_y: number }) => ({
  x: n.canvas_x + PIN_OFFSET.x,
  y: n.canvas_y + PIN_OFFSET.y,
})

/** Los nodos del terreno no se seleccionan ni capturan clics. */
const TERRAIN_NODE = {
  draggable: false,
  selectable: false,
  focusable: false,
  connectable: false,
  style: { pointerEvents: 'none' as const },
}

type Confirm = 'map' | 'places' | 'factions' | null
type Placing = { parentId?: number; parentName?: string } | null
type Draft = { x: number; y: number; parentId?: number } | null

interface Props {
  worldId: number | null
  locationNodes: LocationNode[]
  locationEdges: LocationEdge[]
  regions: Region[]
  factions: Faction[]
  selected: SelectedLocation
  visible?: boolean
  onSelectNode: (node: LocationNode | null) => void
  onSelectEdge: (edge: LocationEdge | null) => void
  onMoveNode: (id: number, x: number, y: number) => Promise<void>
  onConnect: (source: number, target: number) => void
  /** Crea un lugar en (x, y) del lienzo, ya en coordenadas de canvas_x/canvas_y. */
  onCreatePlace: (input: { name: string; x: number; y: number; parentId?: number }) => Promise<LocationNode>
  onUpdatePlace: (id: number, patch: LocationNodePatch) => Promise<void>
  onDeletePlace: (id: number) => Promise<void>
  onUpdateEdge: (id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'dramatic_charge' | 'bidirectional' | 'note'>) => Promise<void>
  onDeleteEdge: (id: number) => void
  /** Genera (o regenera) los lugares desde el grafo causal. */
  onGenerate: () => void
  onAddRegions: () => void
  /** Regenera la capa social. Llama al LLM, así que puede tardar. */
  onGenerateFactions: () => void
  /** Generando localizaciones desde el grafo causal. */
  generating: boolean
  /** Fase real de esa generación («corrigiendo localizaciones…» · 12 s). */
  generatingProgress?: string
  /** Generando el mapa físico: estado aparte, para que cada acción diga lo suyo. */
  generatingMap?: boolean
  onExpandWithAI: (node: LocationNode) => void
  expandingNodeId: number | null
  onEnrichWithAI: (node: LocationNode) => void
  enrichingNodeId: number | null
}

function buildFlowNodes(
  locationNodes: LocationNode[],
  factionsById: Map<number, Faction>,
  selectedId?: number
): Node[] {
  const needsLayout = locationNodes.length > 1 &&
    locationNodes.every(n => n.canvas_x === 0 && n.canvas_y === 0)

  return locationNodes.map((n, i) => {
    let position = pinPosition(n)
    if (needsLayout) {
      const cols = Math.ceil(Math.sqrt(locationNodes.length))
      position = { x: (i % cols) * 260, y: Math.floor(i / cols) * 180 }
    }
    const factionColor = n.faction_id != null
      ? factionsById.get(n.faction_id)?.color ?? null
      : null
    return {
      id: String(n.id),
      type: 'location',
      position,
      // El punto del lugar es su posición: el nodo se ancla por el centro.
      origin: [0.5, 0.5] as [number, number],
      zIndex: n.id === selectedId ? Z_INDEX.selected : Z_INDEX.civic,
      data: {
        name: n.name,
        node_type: n.node_type,
        narrative_function: n.narrative_function,
        source_hint: n.source_hint,
        isSelected: n.id === selectedId,
        factionColor,
      } as unknown as Record<string, unknown>,
    }
  })
}

function buildRegionFlowNodes(regions: Region[]): Node[] {
  return regions.map(r => {
    const bounds = computeRegionBounds(r.vertices)
    return {
      id: regionNodeId(r.id),
      type: 'region',
      position: { x: bounds.x, y: bounds.y },
      ...TERRAIN_NODE,
      // Orden manual por tipo; solo vale con elevateNodesOnSelect={false}.
      zIndex: zIndexForRegion(r),
      data: {
        region: r,
        width: bounds.width,
        height: bounds.height,
        offsetX: bounds.x,
        offsetY: bounds.y,
      } as unknown as Record<string, unknown>,
    }
  })
}

/**
 * Área mínima, en unidades del lienzo, para que un nombre quepa en su región.
 * Cada celda del motor mide unas 39 unidades², así que esto son ~350 celdas.
 */
const LABEL_MIN_AREA = 14_000
const LABEL_AREA_FOR_MAX_SIZE = 160_000

/**
 * Tipos que se etiquetan. El mar queda fuera a propósito: su nombre caería en
 * medio del océano, lejos de cualquier costa, y no informa de nada. Los ríos
 * tampoco: un nombre recto sobre un cauce sinuoso se lee peor que ninguno, y
 * harían falta `textPath` sobre la propia curva.
 */
const LABELLED_TYPES: ReadonlySet<string> = new Set([
  'forest', 'jungle', 'desert', 'plain', 'tundra', 'mountain', 'lake',
])

/**
 * Rectángulo del color del mar que cubre la extensión del mapa, por debajo de
 * todo lo demás. Se deriva de los propios vértices en vez de codificar el
 * tamaño del lienzo, que es cosa del motor.
 */
function buildMapBackdropNode(regions: Region[]): Node[] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const r of regions) {
    for (const v of r.vertices) {
      if (v.canvas_x < minX) minX = v.canvas_x
      if (v.canvas_y < minY) minY = v.canvas_y
      if (v.canvas_x > maxX) maxX = v.canvas_x
      if (v.canvas_y > maxY) maxY = v.canvas_y
    }
  }
  if (!Number.isFinite(minX) || maxX <= minX || maxY <= minY) return []

  // Se sobresale un poco de los vértices observados. La simplificación puede
  // eliminar el vértice exacto de una esquina del lienzo —en un ángulo recto
  // de brazos cortos el área del triángulo es mínima—, y entonces ni el
  // polígono de mar ni un fondo ajustado a los vértices llegan hasta ella.
  // Sobresalir en un fondo decorativo no cuesta nada.
  const MARGEN = 32
  const width = maxX - minX + MARGEN * 2
  const height = maxY - minY + MARGEN * 2

  return [{
    id: 'map-backdrop',
    type: 'mapBackdrop',
    position: { x: minX - MARGEN, y: minY - MARGEN },
    ...TERRAIN_NODE,
    zIndex: Z_INDEX.backdrop,
    // El tamaño se declara además de pasarlo en `data`. React Flow mantiene un
    // nodo con `visibility: hidden` hasta haberlo medido con un
    // ResizeObserver, y un nodo de 1600x1600 puede no llegar a medirse antes
    // del primer pintado: se queda invisible sin error ninguno.
    width,
    height,
    data: { width, height } as unknown as Record<string, unknown>,
  }]
}

/**
 * Coloca los topónimos de mayor a menor evitando solapes.
 *
 * Se recorren por área descendente y se descarta el que choque con uno ya
 * puesto: dos etiquetas encimadas son peores que ninguna de las dos, y la
 * región más grande es la que más merece el nombre.
 */
function buildRegionLabelNodes(regions: Region[]): Node[] {
  const candidates = regions
    .filter(r => r.is_closed && LABELLED_TYPES.has(r.region_type) && r.vertices.length >= 3)
    .map(r => {
      const pts = r.vertices
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map(v => ({ x: v.canvas_x, y: v.canvas_y }))
      return { region: r, centroid: polygonCentroid(pts), area: polygonArea(pts) }
    })
    .filter(c => c.area >= LABEL_MIN_AREA)
    .sort((a, b) => b.area - a.area)

  const placed: { x0: number; y0: number; x1: number; y1: number }[] = []
  const nodes: Node[] = []

  for (const c of candidates) {
    const fontSize = 12 + 12 * Math.min(1, c.area / LABEL_AREA_FOR_MAX_SIZE)
    // Media eme por carácter basta para decidir colisiones sin medir la fuente.
    const halfW = c.region.name.length * fontSize * 0.26
    const halfH = fontSize * 0.62
    const box = {
      x0: c.centroid.x - halfW,
      y0: c.centroid.y - halfH,
      x1: c.centroid.x + halfW,
      y1: c.centroid.y + halfH,
    }
    if (placed.some(p => box.x0 < p.x1 && box.x1 > p.x0 && box.y0 < p.y1 && box.y1 > p.y0)) {
      continue
    }
    placed.push(box)

    nodes.push({
      id: regionLabelNodeId(c.region.id),
      type: 'regionLabel',
      position: c.centroid,
      ...TERRAIN_NODE,
      zIndex: Z_INDEX.label,
      data: { text: c.region.name, fontSize } as unknown as Record<string, unknown>,
    })
  }

  return nodes
}

function buildFlowEdges(locationEdges: LocationEdge[], locationNodes: LocationNode[], selectedId?: number): Edge[] {
  const geographic: Edge[] = locationEdges.map(e => ({
    id: String(e.id),
    source: String(e.source_node_id),
    target: String(e.target_node_id),
    type: e.edge_type,
    selected: e.id === selectedId,
    data: { effort: e.effort, dramatic_charge: e.dramatic_charge, bidirectional: e.bidirectional, note: e.note },
    markerEnd: e.bidirectional ? undefined : { type: MarkerType.ArrowClosed, color: 'var(--color-entity-location)' },
  }))

  const hierarchy: Edge[] = locationNodes
    .filter(n => n.parent_id != null)
    .map(n => ({
      id: `parent-${n.parent_id}-${n.id}`,
      source: String(n.parent_id),
      target: String(n.id),
      type: 'hierarchy',
      selectable: false,
      data: {},
    }))

  return [...geographic, ...hierarchy]
}

function LocationGraphInner({
  worldId, locationNodes, locationEdges,
  regions, factions,
  selected, visible,
  onSelectNode, onSelectEdge,
  onMoveNode, onConnect: onConnectProp,
  onCreatePlace, onUpdatePlace, onDeletePlace, onUpdateEdge, onDeleteEdge,
  onGenerate, onAddRegions, onGenerateFactions, generating, generatingProgress = '', generatingMap = false,
  onExpandWithAI, expandingNodeId,
  onEnrichWithAI, enrichingNodeId,
}: Props) {
  const { t } = useTranslation()
  const { fitView, setCenter, getZoom, screenToFlowPosition } = useReactFlow()
  const reducedMotion = useReducedMotion()
  const [placing, setPlacing] = useState<Placing>(null)
  const [draft, setDraft] = useState<Draft>(null)
  const [confirm, setConfirm] = useState<Confirm>(null)

  const selectedNodeId = selected?.type === 'node' ? selected.item.id : undefined
  const selectedEdgeId = selected?.type === 'edge' ? selected.item.id : undefined

  // El panel lee siempre la versión viva del lugar: al guardar un campo se
  // actualiza la lista, no la copia que se guardó al seleccionarlo.
  const liveSelected = useMemo<SelectedLocation>(() => {
    if (selected?.type === 'node') {
      const item = locationNodes.find(n => n.id === selected.item.id)
      return item ? { type: 'node', item } : null
    }
    if (selected?.type === 'edge') {
      const item = locationEdges.find(e => e.id === selected.item.id)
      return item ? { type: 'edge', item } : null
    }
    return null
  }, [selected, locationNodes, locationEdges])

  const factionsById = useMemo(() => {
    const m = new Map<number, Faction>()
    for (const f of factions) m.set(f.id, f)
    return m
  }, [factions])

  const civicFlowNodes = useMemo(
    () => buildFlowNodes(locationNodes, factionsById, selectedNodeId),
    [locationNodes, factionsById, selectedNodeId]
  )
  const terrainFlowNodes = useMemo(
    () => [...buildMapBackdropNode(regions), ...buildRegionFlowNodes(regions), ...buildRegionLabelNodes(regions)],
    [regions]
  )
  const flowNodes = useMemo(
    () => [...terrainFlowNodes, ...civicFlowNodes],
    [terrainFlowNodes, civicFlowNodes]
  )
  const flowEdges = useMemo(() => buildFlowEdges(locationEdges, locationNodes, selectedEdgeId), [locationEdges, locationNodes, selectedEdgeId])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  // Id of the node React Flow is currently dragging, if any. A ref because it
  // is only ever read inside callbacks and effects, never rendered.
  const draggingNodeIdRef = useRef<string | null>(null)

  // Sync data changes (name, type, selection) without overwriting drag positions.
  //
  // Locations keep the canvas position unless the server moved them: the map
  // places them on the terrain, and the canvas kept painting them in the sea
  // until the page was reloaded.
  const lastServerPos = useRef(new Map<string, { x: number; y: number }>())
  useEffect(() => {
    setNodes(prev => {
      const posMap = new Map(prev.map(n => [n.id, n.position]))
      return flowNodes.map(fn => {
        let keepPosition = fn.id === draggingNodeIdRef.current
        if (fn.type === 'location' && !keepPosition) {
          const seen = lastServerPos.current.get(fn.id)
          keepPosition = !!seen && seen.x === fn.position.x && seen.y === fn.position.y
          lastServerPos.current.set(fn.id, fn.position)
        }
        return {
          ...fn,
          position: keepPosition ? posMap.get(fn.id) ?? fn.position : fn.position,
        }
      })
    })
  }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  // When this canvas becomes visible, remeasure nodes and refit
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
        fitView({ padding: 0.15, duration: 300 })
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [visible, fitView])

  // Auto-pan: al seleccionar un lugar (o crearlo), centrarlo en la parte del
  // lienzo que deja libre el panel.
  useEffect(() => {
    if (selected?.type !== 'node') return
    const zoom = getZoom()
    const pin = pinPosition(selected.item)
    setCenter(pin.x + PANEL_WIDTH_PX / 2 / zoom, pin.y, {
      duration: reducedMotion ? 0 : 300,
      zoom,
    })
    // Dep: solo el id del lugar seleccionado; editar sus campos no re-panea.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId])

  // Esc sale del modo «colocar lugar».
  useEffect(() => {
    if (!placing) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setPlacing(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [placing])

  const dragTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    const timers = dragTimers.current
    return () => {
      timers.forEach(timer => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const handleNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    draggingNodeIdRef.current = node.id
  }, [])

  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    draggingNodeIdRef.current = null
    if (node.type !== 'location') return
    const id = node.id
    const prev = dragTimers.current.get(id)
    if (prev) clearTimeout(prev)
    dragTimers.current.set(id, setTimeout(() => {
      dragTimers.current.delete(id)
      onMoveNode(Number(id), node.position.x - PIN_OFFSET.x, node.position.y - PIN_OFFSET.y)
    }, 500))
  }, [onMoveNode])

  const startDraft = useCallback((clientX: number, clientY: number, parentId?: number) => {
    const p = screenToFlowPosition({ x: clientX, y: clientY })
    setPlacing(null)
    setDraft({ x: p.x, y: p.y, parentId })
  }, [screenToFlowPosition])

  const handleCreate = useCallback(async (name: string) => {
    if (!draft) return false
    try {
      const created = await onCreatePlace({
        name,
        x: draft.x - PIN_OFFSET.x,
        y: draft.y - PIN_OFFSET.y,
        parentId: draft.parentId,
      })
      setDraft(null)
      onSelectNode(created)
      return true
    } catch (err) {
      notifyPlaceError(t, err, 'location.map.createError')
      return false
    }
  }, [draft, onCreatePlace, onSelectNode, t])

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    if (node.type !== 'location') return
    const loc = locationNodes.find(n => n.id === Number(node.id))
    if (!loc) return
    setPlacing(null)
    setDraft(null)
    onSelectNode(selected?.type === 'node' && selected.item.id === loc.id ? null : loc)
  }, [locationNodes, selected, onSelectNode])

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    const loc = locationEdges.find(e => e.id === Number(edge.id))
    if (!loc) return
    onSelectEdge(selected?.type === 'edge' && selected.item.id === loc.id ? null : loc)
  }, [locationEdges, selected, onSelectEdge])

  const handleConnect: OnConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return
    if (connection.source === connection.target) return
    onConnectProp(Number(connection.source), Number(connection.target))
  }, [onConnectProp])

  const handlePaneClick = useCallback((e: React.MouseEvent) => {
    if (placing) {
      startDraft(e.clientX, e.clientY, placing.parentId)
      return
    }
    if (draft) {
      setDraft(null)
      return
    }
    onSelectNode(null)
  }, [placing, draft, startDraft, onSelectNode])

  // React Flow no tiene doble clic en el lienzo: se escucha en el contenedor y
  // solo cuenta si cae en el fondo (el terreno no captura clics).
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (!(e.target as HTMLElement).classList.contains('react-flow__pane')) return
    startDraft(e.clientX, e.clientY)
  }, [startDraft])

  /**
   * Generar el mapa solo pregunta si hay geometría del usuario, y el aviso dice
   * lo que de verdad pasa: el backend conserva lo editado a mano, pero el
   * terreno nuevo se genera por debajo y puede quedar solapado. Si todo el
   * mapa es derivado no se molesta: la generación es determinista.
   */
  const userRegions = useMemo(() => regions.filter(r => r.origin === 'user').length, [regions])
  const requestGenerateMap = useCallback(() => {
    if (userRegions > 0) setConfirm('map')
    else onAddRegions()
  }, [userRegions, onAddRegions])
  const requestGeneratePlaces = useCallback(() => {
    if (locationNodes.length > 0) setConfirm('places')
    else onGenerate()
  }, [locationNodes.length, onGenerate])

  const runConfirmed = useCallback(() => {
    if (confirm === 'map') onAddRegions()
    else if (confirm === 'places') onGenerate()
    else if (confirm === 'factions') onGenerateFactions()
    setConfirm(null)
  }, [confirm, onAddRegions, onGenerate, onGenerateFactions])

  const confirmCopy = confirm === 'map'
    ? { title: t('location.map.confirmMapTitle'), body: t('location.map.confirmMapBody', { count: userRegions }) }
    : confirm === 'places'
      ? { title: t('location.map.confirmPlacesTitle'), body: t('location.map.confirmPlacesBody', { count: locationNodes.length }) }
      : { title: t('location.map.confirmFactionsTitle'), body: t('location.map.confirmFactionsBody') }

  const status = generatingMap
    ? t('location.map.generatingMap')
    : generating
      ? generatingProgress || t('location.map.generatingPlaces')
      : ''

  const isEmpty = locationNodes.length === 0 && !draft && !placing

  return (
    <div className="relative h-full">
      <div
        className={`absolute inset-0 min-w-0 ${placing ? '[&_.react-flow__pane]:!cursor-crosshair' : ''}`}
        onDoubleClick={handleDoubleClick}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onNodeDragStart={handleNodeDragStart}
          onNodeDragStop={handleNodeDragStop}
          onConnect={handleConnect}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          // Doble clic crea un lugar, no acerca la vista.
          zoomOnDoubleClick={false}
          // Necesario para el orden manual de capas de physicalMapPalette.
          elevateNodesOnSelect={false}
          deleteKeyCode={null}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          className="bg-[hsl(40_20%_97%)]"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e8e0d4" gap={20} size={1} />
          <Controls showInteractive={false} className="!border-stone-200 !shadow-sm" />
        </ReactFlow>

        {draft && (
          <PlaceNameDraft
            // Un borrador nuevo empieza con el campo vacío.
            key={`${draft.x},${draft.y}`}
            x={draft.x}
            y={draft.y}
            onSubmit={handleCreate}
            onCancel={() => setDraft(null)}
          />
        )}
      </div>

      {/* ── Barra: una acción principal y el resto en «⋯» ─────────────── */}
      <div className="absolute left-3 top-3 z-10 flex items-center gap-2">
        <Button
          size="sm"
          aria-pressed={!!placing}
          onClick={() => { setDraft(null); setPlacing(p => (p ? null : {})) }}
          className={placing ? 'ring-2 ring-ring/40' : undefined}
        >
          <Plus className="size-4" /> {t('location.map.addPlace')}
        </Button>

        {worldId != null && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon-sm" aria-label={t('location.map.more')} className="bg-background/95">
                <Ellipsis className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-60">
              <DropdownMenuItem onSelect={requestGenerateMap} disabled={generating || generatingMap}>
                <MapIcon className="size-4" /> {t('location.map.generateMap')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={requestGeneratePlaces} disabled={generating || generatingMap}>
                <RefreshCw className="size-4" />
                {locationNodes.length > 0 ? t('location.map.regeneratePlaces') : t('location.map.generatePlaces')}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setConfirm('factions')} disabled={generating}>
                <Users className="size-4" /> {t('location.map.generateFactions')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {status && (
          <span
            role="status"
            aria-live="polite"
            title={status}
            className="max-w-[320px] truncate rounded-md bg-background/90 px-2 py-1 text-sm italic text-muted-foreground"
          >
            {status}
          </span>
        )}
      </div>

      {placing && (
        <div className="pointer-events-none absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-md border border-border/60 bg-background/95 px-3 py-1.5 text-sm text-foreground shadow-sm">
          {placing.parentName
            ? t('location.map.addInsideHint', { name: placing.parentName })
            : t('location.map.addPlaceHint')}
        </div>
      )}

      {isEmpty && (
        <div className="pointer-events-none absolute inset-0 z-[5] flex items-center justify-center">
          <div className="space-y-2 rounded-lg bg-background/85 px-5 py-4 text-center">
            {regions.length === 0 && (
              <p className="font-display text-lg italic text-muted-foreground">{t('location.map.emptyMap')}</p>
            )}
            <p className="text-sm text-muted-foreground">{t('location.map.emptyHint')}</p>
            {regions.length === 0 && worldId != null && (
              <Button
                variant="link"
                size="sm"
                className="pointer-events-auto"
                onClick={requestGenerateMap}
                disabled={generating || generatingMap}
              >
                {t('location.map.generateMap')}
              </Button>
            )}
          </div>
        </div>
      )}

      <AnimatePresence>
        {liveSelected && (
          <motion.div
            key="locs-side-panel"
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 34 }}
            className="absolute bottom-0 right-0 top-0 z-20 w-80 border-l border-border/50 bg-background"
          >
            <LocationSidePanel
              selected={liveSelected}
              nodes={locationNodes}
              edges={locationEdges}
              onUpdateNode={onUpdatePlace}
              onDeleteNode={onDeletePlace}
              onAddInside={node => { setDraft(null); setPlacing({ parentId: node.id, parentName: node.name }) }}
              onExpandWithAI={onExpandWithAI}
              expandingNodeId={expandingNodeId}
              onEnrichWithAI={onEnrichWithAI}
              enrichingNodeId={enrichingNodeId}
              onSelectNode={node => onSelectNode(node)}
              onUpdateEdge={onUpdateEdge}
              onDeleteEdge={onDeleteEdge}
              onClose={() => { onSelectNode(null) }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AlertDialog open={confirm !== null} onOpenChange={open => { if (!open) setConfirm(null) }}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{confirmCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{confirmCopy.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('location.map.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={runConfirmed}>{t('location.map.confirmRegenerate')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export function LocationGraphCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <LocationGraphInner {...props} />
    </ReactFlowProvider>
  )
}

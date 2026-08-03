import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
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
import { Plus, Sparkles, Users } from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { LocationNode as LocationNodeComponent } from './LocationNode'
import { WaterwayEdge, WildernessEdge, RoadEdge, HierarchyEdge } from './LocationEdges'
import { LocationSidePanel } from './LocationSidePanel'
import { LocationNodeFormDialog, type LocationNodeFormInput } from './LocationNodeFormDialog'
import { LocationGraphProvider, type LocationGraphContextValue } from './LocationGraphContext'
import type { LocationNode, LocationEdge } from '@/services/api'
import type { SelectedLocation } from '@/hooks/useLocationGraph'
import { RegionNode, computeRegionBounds } from './RegionNode'
import { MapBackdropNode } from './MapBackdropNode'
import { RegionLabelNode } from './RegionLabelNode'
import { polygonArea, polygonCentroid } from './regionPath'
import { VertexNode } from './VertexNode'
import {
  buildVertexFlowNodes,
  parseRegionNodeId,
  parseVertexNodeId,
  regionLabelNodeId,
  regionNodeId,
  vertexCenterFromNodePosition,
} from './regionCanvasNodes'
import { getRegionVisual, zIndexForRegion, Z_INDEX } from './physicalMapPalette'
import { useRegionVertexDraft } from '@/hooks/useRegionVertexDraft'
import type { Faction, Region } from '@/services/factionApi'

// Define outside component to avoid re-renders
const nodeTypes = {
  mapBackdrop: MapBackdropNode,
  location: LocationNodeComponent,
  region: RegionNode,
  regionLabel: RegionLabelNode,
  vertex: VertexNode,
}
const edgeTypes = { waterway: WaterwayEdge, wilderness: WildernessEdge, road: RoadEdge, hierarchy: HierarchyEdge }

// Side panel width in px. Must stay in sync with the `w-72` Tailwind class on
// the panel motion.div. Used by auto-pan math so the selected node is centered
// in the visible (non-panel) portion of the canvas.
const PANEL_WIDTH_PX = 288

type FormState =
  | { mode: 'create'; parentId?: number; parentName?: string }
  | { mode: 'edit'; node: LocationNode }
  | null

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
  onAddNode: (input: LocationNodeFormInput, parentId?: number) => Promise<void>
  onEditNode: (id: number, input: LocationNodeFormInput) => Promise<void>
  onDeleteNode: (id: number) => void
  onUpdateEdge: (id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'dramatic_charge' | 'bidirectional' | 'note'>) => Promise<void>
  onDeleteEdge: (id: number) => void
  onGenerate: () => void
  onAddRegions: () => void
  /** Regenera la capa social. Llama al LLM, así que puede tardar. */
  onGenerateFactions: () => void
  /** Refetch regions after their geometry has been persisted. */
  onRegionsChanged: () => Promise<void>
  generating: boolean
  onExpandWithAI: (node: LocationNode) => void
  expandingNodeId: number | null
  onEnrichWithAI: (node: LocationNode) => void
  enrichingNodeId: number | null
}

function buildDepthMap(locationNodes: LocationNode[]): Map<number, number> {
  const depthMap = new Map<number, number>()
  locationNodes.forEach(n => { if (!n.parent_id) depthMap.set(n.id, 0) })
  // Resolve children iteratively (handles up to arbitrary depth)
  let changed = true
  while (changed) {
    changed = false
    locationNodes.forEach(n => {
      if (n.parent_id != null && !depthMap.has(n.id)) {
        const parentDepth = depthMap.get(n.parent_id)
        if (parentDepth !== undefined) {
          depthMap.set(n.id, parentDepth + 1)
          changed = true
        }
      }
    })
  }
  return depthMap
}

function buildFlowNodes(
  locationNodes: LocationNode[],
  factionsById: Map<number, Faction>,
  selectedId?: number
): Node[] {
  const needsLayout = locationNodes.length > 1 &&
    locationNodes.every(n => n.canvas_x === 0 && n.canvas_y === 0)
  const depthMap = buildDepthMap(locationNodes)
  const childCounts = new Map<number, number>()
  locationNodes.forEach(n => {
    if (n.parent_id != null) {
      childCounts.set(n.parent_id, (childCounts.get(n.parent_id) ?? 0) + 1)
    }
  })

  return locationNodes.map((n, i) => {
    let position = { x: n.canvas_x, y: n.canvas_y }
    if (needsLayout) {
      const cols = Math.ceil(Math.sqrt(locationNodes.length))
      position = { x: (i % cols) * 420, y: Math.floor(i / cols) * 260 }
    }
    const factionColor = n.faction_id != null
      ? factionsById.get(n.faction_id)?.color ?? null
      : null
    return {
      id: String(n.id),
      type: 'location',
      position,
      zIndex: n.id === selectedId ? Z_INDEX.selected : Z_INDEX.civic,
      data: {
        name: n.name,
        node_type: n.node_type,
        description: n.description,
        narrative_function: n.narrative_function,
        source_hint: n.source_hint,
        isSelected: n.id === selectedId,
        depth: depthMap.get(n.id) ?? 0,
        childCount: childCounts.get(n.id) ?? 0,
        factionColor,
      } as unknown as Record<string, unknown>,
    }
  })
}

/**
 * Color de cada nodo en el minimapa.
 *
 * Con un color único para todo, el rectángulo del fondo del mapa —que cubre el
 * lienzo entero— pintaba el minimapa de un bloque macizo y lo dejaba inútil.
 * Dando a cada región su color de terreno, el minimapa pasa a ser lo que
 * debería: una versión pequeña del mapa.
 */
function miniMapNodeColor(node: Node): string {
  if (node.type === 'region') {
    const data = node.data as unknown as { region?: Region }
    return data.region ? getRegionVisual(data.region.region_type).fill : '#14b8a6'
  }
  if (node.type === 'mapBackdrop') return getRegionVisual('sea').fill
  // Las etiquetas y los tiradores de vértice no aportan nada a un mapa de
  // conjunto y, siendo diminutos, solo lo ensucian.
  if (node.type === 'regionLabel' || node.type === 'vertex') return 'transparent'
  return '#14b8a6'
}

function buildRegionFlowNodes(regions: Region[], selectedRegionId?: number): Node[] {
  return regions.map(r => {
    const bounds = computeRegionBounds(r.vertices)
    return {
      id: regionNodeId(r.id),
      type: 'region',
      position: { x: bounds.x, y: bounds.y },
      // The region itself never moves as a unit: its position is derived from
      // its vertices' bounding box. Shape is edited through the vertex handles.
      draggable: false,
      selectable: true,
      selected: r.id === selectedRegionId,
      // Manual z-index ordering; only takes effect with
      // <ReactFlow elevateNodesOnSelect={false}>.
      zIndex: r.id === selectedRegionId ? Z_INDEX.selected : zIndexForRegion(r),
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
 * Coloca los topónimos de mayor a menor evitando solapes.
 *
 * Se recorren por área descendente y se descarta el que choque con uno ya
 * puesto: dos etiquetas encimadas son peores que ninguna de las dos, y la
 * región más grande es la que más merece el nombre.
 */
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
    draggable: false,
    selectable: false,
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
      draggable: false,
      selectable: false,
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
    markerEnd: e.bidirectional ? undefined : { type: MarkerType.ArrowClosed, color: '#14b8a6' },
  }))

  const hierarchy: Edge[] = locationNodes
    .filter(n => n.parent_id != null)
    .map(n => ({
      id: `parent-${n.parent_id}-${n.id}`,
      source: String(n.parent_id),
      target: String(n.id),
      type: 'hierarchy',
      markerEnd: { type: MarkerType.ArrowClosed, color: '#94a3b8' },
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
  onAddNode, onEditNode, onDeleteNode, onUpdateEdge, onDeleteEdge,
  onGenerate, onAddRegions, onGenerateFactions, onRegionsChanged, generating,
  onExpandWithAI, expandingNodeId,
  onEnrichWithAI, enrichingNodeId,
}: Props) {
  const { fitView, setCenter, getZoom } = useReactFlow()
  const reducedMotion = useReducedMotion()
  const [formState, setFormState] = useState<FormState>(null)
  const [selectedRegionId, setSelectedRegionId] = useState<number | null>(null)

  const {
    effectiveRegions,
    error: vertexError,
    saving: savingVertices,
    dismissError: dismissVertexError,
    moveVertex,
    commitRegion,
  } = useRegionVertexDraft(regions, onRegionsChanged)

  const selectedNodeId = selected?.type === 'node' ? selected.item.id : undefined
  const selectedEdgeId = selected?.type === 'edge' ? selected.item.id : undefined

  const contextValue = useMemo<LocationGraphContextValue>(() => ({
    onEditNode: (nodeId: number) => {
      const node = locationNodes.find(n => n.id === nodeId)
      if (node) setFormState({ mode: 'edit', node })
    },
    onDeleteNode: (nodeId: number) => {
      if (window.confirm('¿Eliminar esta localización? Se perderán sus conexiones.')) {
        onDeleteNode(nodeId)
      }
    },
  }), [locationNodes, onDeleteNode])

  const factionsById = useMemo(() => {
    const m = new Map<number, Faction>()
    for (const f of factions) m.set(f.id, f)
    return m
  }, [factions])

  const civicFlowNodes = useMemo(
    () => buildFlowNodes(locationNodes, factionsById, selectedNodeId),
    [locationNodes, factionsById, selectedNodeId]
  )
  // Resolved from `effectiveRegions` so a region deleted or replaced by a
  // regeneration can't leave a dangling selection behind.
  const selectedRegion = useMemo(
    () => effectiveRegions.find(r => r.id === selectedRegionId) ?? null,
    [effectiveRegions, selectedRegionId]
  )

  const regionFlowNodes = useMemo(
    () => buildRegionFlowNodes(effectiveRegions, selectedRegion?.id),
    [effectiveRegions, selectedRegion]
  )
  const mapBackdropNode = useMemo(
    () => buildMapBackdropNode(effectiveRegions),
    [effectiveRegions]
  )
  const regionLabelNodes = useMemo(
    () => buildRegionLabelNodes(effectiveRegions),
    [effectiveRegions]
  )
  const vertexFlowNodes = useMemo(
    () => buildVertexFlowNodes(selectedRegion),
    [selectedRegion]
  )
  const flowNodes = useMemo(
    () => [...mapBackdropNode, ...regionFlowNodes, ...regionLabelNodes, ...vertexFlowNodes, ...civicFlowNodes],
    [mapBackdropNode, regionFlowNodes, regionLabelNodes, vertexFlowNodes, civicFlowNodes]
  )
  const flowEdges = useMemo(() => buildFlowEdges(locationEdges, locationNodes, selectedEdgeId), [locationEdges, locationNodes, selectedEdgeId])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  // Id of the node React Flow is currently dragging, if any. A ref because it
  // is only ever read inside callbacks and effects, never rendered.
  const draggingNodeIdRef = useRef<string | null>(null)

  // Sync data changes (name, type, selection) without overwriting drag positions.
  //
  // Region positions are *derived*: a region's origin is its vertices' bounding
  // box, so it must be recomputed on every drag frame or the polygon slides out
  // from under the handle being dragged. Vertex positions are likewise derived,
  // except for the one currently under the cursor — React Flow owns that one
  // mid-drag, and replacing it would fight its internal drag state.
  useEffect(() => {
    setNodes(prev => {
      const posMap = new Map(prev.map(n => [n.id, n.position]))
      return flowNodes.map(fn => {
        const keepPosition = fn.type === 'location' || fn.id === draggingNodeIdRef.current
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
      const t = setTimeout(() => {
        window.dispatchEvent(new Event('resize'))
        fitView({ padding: 0.3, duration: 300 })
      }, 50)
      return () => clearTimeout(t)
    }
  }, [visible, fitView])

  // Auto-pan: al seleccionar un nodo, centrar el viewport para que el nodo
  // quede a la izquierda del panel (que cubre los 288px derechos cuando se abre).
  // Solo para nodos; los edges no tienen "centro" obvio.
  // En el mount inicial `selected` es null, así que el early-return filtra ese caso.
  useEffect(() => {
    if (selected?.type !== 'node') return
    const n = selected.item
    const zoom = getZoom()
    // Shift viewport target right by half the panel width (converted to world
    // coords via zoom) so the node ends up centered in the visible area left
    // of the panel instead of directly under it.
    setCenter(n.canvas_x + PANEL_WIDTH_PX / 2 / zoom, n.canvas_y, {
      duration: reducedMotion ? 0 : 300,
      zoom,
    })
    // Dep: solo el id del nodo seleccionado. Ignoramos cambios en el objeto
    // `selected` (ej. cuando enrich actualiza item con mismo id) para no re-panear.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedNodeId])

  const dragTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    return () => {
      dragTimers.current.forEach(t => clearTimeout(t))
      dragTimers.current.clear()
    }
  }, [])

  const handleNodeDragStart = useCallback((_: React.MouseEvent, node: Node) => {
    draggingNodeIdRef.current = node.id
  }, [])

  // Live geometry update: runs on every drag frame so the polygon follows the
  // handle instead of jumping when the drag ends.
  const handleNodeDrag = useCallback((_: React.MouseEvent, node: Node) => {
    const v = parseVertexNodeId(node.id)
    if (!v) return
    const center = vertexCenterFromNodePosition(node.position)
    moveVertex(v.regionId, v.orderIndex, center.x, center.y)
  }, [moveVertex])

  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    draggingNodeIdRef.current = null
    const v = parseVertexNodeId(node.id)
    if (v) {
      const center = vertexCenterFromNodePosition(node.position)
      moveVertex(v.regionId, v.orderIndex, center.x, center.y)
      commitRegion(v.regionId)
      return
    }
    // Only persist drag for civic nodes. Region node types don't own a
    // numeric LocationNode id.
    if (node.type !== 'location') return
    const id = node.id
    const prev = dragTimers.current.get(id)
    if (prev) clearTimeout(prev)
    dragTimers.current.set(id, setTimeout(() => {
      dragTimers.current.delete(id)
      onMoveNode(Number(id), node.position.x, node.position.y)
    }, 500))
  }, [onMoveNode, moveVertex, commitRegion])

  /**
   * Generar el mapa sustituye la geografía entera del mundo, incluidas las
   * regiones que el usuario haya redibujado a mano vértice a vértice.
   *
   * El motor procedural es determinista y tarda milisegundos, así que este
   * botón se va a pulsar mucho más que antes: sin confirmación, una sola
   * pulsación distraída se lleva por delante todo el trabajo manual. La
   * protección buena es que el backend distinga la geometría derivada de la
   * editada y respete la segunda; mientras eso no exista, se pregunta.
   */
  const handleGenerateMap = useCallback(() => {
    const propias = effectiveRegions.filter(r => r.origin === 'user').length

    // Solo se pregunta si hay geometría del usuario, y el aviso dice lo que
    // de verdad pasa: el backend conserva lo editado a mano, así que no se
    // pierde nada. Lo que sí ocurre es que el terreno nuevo se genera por
    // debajo, y esas regiones pueden acabar solapando terreno que ya no les
    // corresponde.
    //
    // Si todo el mapa es derivado no se molesta al usuario: la generación es
    // determinista, así que volver a pulsar da el mismo mapa.
    if (propias > 0) {
      const ok = window.confirm(
        `Se va a regenerar el mapa físico. Tus ${propias} ` +
          `${propias === 1 ? 'región editada' : 'regiones editadas'} a mano se conservan, ` +
          'pero el terreno nuevo se genera por debajo y pueden quedar solapadas.' +
          '\n\n¿Continuar?'
      )
      if (!ok) return
    }
    onAddRegions()
  }, [effectiveRegions, onAddRegions])

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    // Clicking a handle must not disturb the selection that produced it.
    if (parseVertexNodeId(node.id)) return

    // Region nodes use string IDs like `region-42`. Selecting one reveals its
    // vertex handles; clicking it again hides them.
    const regionId = parseRegionNodeId(node.id)
    if (regionId != null) {
      setSelectedRegionId(prev => (prev === regionId ? null : regionId))
      onSelectNode(null)
      return
    }

    if (node.type !== 'location') return
    const loc = locationNodes.find(n => n.id === Number(node.id))
    if (!loc) return
    // A civic selection and a region selection are mutually exclusive — two
    // side panels' worth of context at once is noise.
    setSelectedRegionId(null)
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

  const handlePaneClick = useCallback(() => {
    onSelectNode(null)
    setSelectedRegionId(null)
  }, [onSelectNode])

  const handleFormConfirm = useCallback(async (input: LocationNodeFormInput) => {
    if (formState?.mode === 'edit') {
      await onEditNode(formState.node.id, input)
    } else if (formState?.mode === 'create') {
      await onAddNode(input, formState.parentId)
    }
  }, [formState, onAddNode, onEditNode])

  // El estado vacío se decide por TODO lo que puede haber en el lienzo, no
  // solo por las localizaciones.
  //
  // Antes bastaba con no tener nodos civiles para saltarse el canvas entero, y
  // un mundo con su mapa físico completo —decenas de regiones, ríos y
  // cordilleras en la base de datos— mostraba "el mapa está vacío" y no
  // dibujaba nada. Y como la barra de herramientas vive dentro del canvas, ese
  // mismo atajo dejaba sin forma de generar el mapa desde un mundo nuevo: el
  // botón estaba detrás de la pantalla que decía que no había nada.
  if (locationNodes.length === 0 && effectiveRegions.length === 0) {
    return (
      <LocationGraphProvider value={contextValue}>
        <div className="flex h-full">
          <div className="flex-1 flex items-center justify-center bg-[hsl(180_8%_97%)] text-center p-8">
            <div className="space-y-3 max-w-xs">
              <p className="text-sm text-muted-foreground font-[var(--font-display)] italic">
                El mapa está vacío
              </p>
              <p className="text-xs text-muted-foreground">
                Empieza por el terreno, o genera las localizaciones a partir del grafo causal
              </p>
              <div className="flex flex-col items-center gap-2">
                {worldId != null && (
                  <button
                    onClick={handleGenerateMap}
                    disabled={generating}
                    className="text-xs text-[#14b8a6] underline underline-offset-2 hover:text-[#0f766e] transition-colors disabled:opacity-50"
                  >
                    {generating ? 'Generando...' : 'Generar el mapa físico →'}
                  </button>
                )}
                {worldId != null && (
                  <button
                    onClick={onGenerate}
                    disabled={generating}
                    className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {generating ? 'Generando...' : 'Generar localizaciones desde el grafo causal →'}
                  </button>
                )}
                <button
                  onClick={() => setFormState({ mode: 'create' })}
                  className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors"
                >
                  Crear localización manualmente →
                </button>
              </div>
            </div>
          </div>

          {formState && (
            <LocationNodeFormDialog
              mode={formState.mode}
              editingNode={formState.mode === 'edit' ? formState.node : undefined}
              parentName={formState.mode === 'create' ? formState.parentName : undefined}
              onConfirm={handleFormConfirm}
              onClose={() => setFormState(null)}
            />
          )}
        </div>
      </LocationGraphProvider>
    )
  }

  return (
    <LocationGraphProvider value={contextValue}>
      <div className="relative h-full">
        <div className="absolute inset-0 min-w-0">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={handleNodeClick}
            onEdgeClick={handleEdgeClick}
            onNodeDragStart={handleNodeDragStart}
            onNodeDrag={handleNodeDrag}
            onNodeDragStop={handleNodeDragStop}
            onConnect={handleConnect}
            onPaneClick={handlePaneClick}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            connectionMode={ConnectionMode.Loose}
            nodesDraggable={true}
            // Required for the manual per-node zIndex in physicalMapPalette to
            // hold: React Flow otherwise lifts the selected node to the top,
            // which would drop a selected sea over the coastline it contains.
            elevateNodesOnSelect={false}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            className="bg-[#efe9db]"
          >
            <Background color="#ded7c6" gap={28} size={1} />
            <Controls />
            <MiniMap
              position="bottom-left"
              nodeColor={miniMapNodeColor}
              nodeStrokeWidth={0}
              className="!bg-background/90 !border-border/50"
            />
            <div className="absolute top-2 left-2 z-10 flex gap-1.5">
              <button
                onClick={() => setFormState({ mode: 'create' })}
                className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 hover:border-[#14b8a6] text-muted-foreground hover:text-[#14b8a6] transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Añadir
              </button>
              <button
                onClick={handleGenerateMap}
                disabled={generating}
                className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 hover:border-violet-400 text-muted-foreground hover:text-violet-600 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {generating ? 'Generando...' : 'Generar mapa'}
              </button>
              <button
                onClick={onGenerate}
                disabled={generating}
                className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 hover:border-[#14b8a6] text-muted-foreground hover:text-[#14b8a6] transition-colors disabled:opacity-50"
              >
                {generating ? 'Generando...' : '↺ Regenerar'}
              </button>
              <button
                onClick={onGenerateFactions}
                disabled={generating}
                title="Regenera la capa social. Usa el modelo de lenguaje, así que tarda."
                className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 hover:border-violet-400 text-muted-foreground hover:text-violet-600 transition-colors disabled:opacity-50 flex items-center gap-1"
              >
                <Users className="w-3.5 h-3.5" />
                Facciones
              </button>
            </div>

            {selectedRegion && (
              <div className="absolute top-12 left-2 z-10 flex items-center gap-2 rounded-lg border border-[#14b8a6]/40 bg-background/95 px-2.5 py-1.5 text-xs text-muted-foreground">
                <span>
                  Editando <strong className="text-foreground">{selectedRegion.name}</strong> —
                  arrastra los puntos para corregir la forma
                </span>
                {savingVertices && <span className="text-[#14b8a6]">guardando…</span>}
              </div>
            )}

            {vertexError && (
              <div
                role="alert"
                className="absolute top-12 right-2 z-10 flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 px-2.5 py-1.5 text-xs text-red-800 max-w-xs"
              >
                <span>{vertexError} La forma se ha revertido a la última guardada.</span>
                <button
                  onClick={dismissVertexError}
                  aria-label="Cerrar aviso"
                  className="text-red-500 hover:text-red-800 transition-colors"
                >
                  ✕
                </button>
              </div>
            )}
          </ReactFlow>
        </div>

        <AnimatePresence>
          {selected && (
            <motion.div
              key="locs-side-panel"
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 300, damping: 34 }}
              className="absolute right-0 top-0 bottom-0 w-72 z-20 bg-background border-l border-border/50"
            >
              <LocationSidePanel
                selected={selected}
                nodes={locationNodes}
                edges={locationEdges}
                onAddChildNode={node => setFormState({ mode: 'create', parentId: node.id, parentName: node.name })}
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

        {formState && (
          <LocationNodeFormDialog
            mode={formState.mode}
            editingNode={formState.mode === 'edit' ? formState.node : undefined}
            parentName={formState.mode === 'create' ? formState.parentName : undefined}
            onConfirm={handleFormConfirm}
            onClose={() => setFormState(null)}
          />
        )}
      </div>
    </LocationGraphProvider>
  )
}

export function LocationGraphCanvas(props: Props) {
  return (
    <ReactFlowProvider>
      <LocationGraphInner {...props} />
    </ReactFlowProvider>
  )
}

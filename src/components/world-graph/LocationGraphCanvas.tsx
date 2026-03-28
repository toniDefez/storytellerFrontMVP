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
import { Plus } from 'lucide-react'
import { LocationNode as LocationNodeComponent } from './LocationNode'
import { WaterwayEdge, WildernessEdge, RoadEdge } from './LocationEdges'
import { LocationSidePanel } from './LocationSidePanel'
import { LocationNodeFormDialog, type LocationNodeFormInput } from './LocationNodeFormDialog'
import type { LocationNode, LocationEdge } from '@/services/api'
import type { SelectedLocation } from '@/hooks/useLocationGraph'

// Define outside component to avoid re-renders
const nodeTypes = { location: LocationNodeComponent }
const edgeTypes = { waterway: WaterwayEdge, wilderness: WildernessEdge, road: RoadEdge }

type FormState =
  | { mode: 'create'; parentId?: number; parentName?: string }
  | { mode: 'edit'; node: LocationNode }
  | null

interface Props {
  worldId: number | null
  locationNodes: LocationNode[]
  locationEdges: LocationEdge[]
  selected: SelectedLocation
  visible?: boolean
  onSelectNode: (node: LocationNode | null) => void
  onSelectEdge: (edge: LocationEdge | null) => void
  onMoveNode: (id: number, x: number, y: number) => Promise<void>
  onConnect: (source: number, target: number) => void
  onAddNode: (input: LocationNodeFormInput, parentId?: number) => Promise<void>
  onEditNode: (id: number, input: LocationNodeFormInput) => Promise<void>
  onDeleteNode: (id: number) => void
  onUpdateEdge: (id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'bidirectional' | 'note'>) => Promise<void>
  onDeleteEdge: (id: number) => void
  onGenerate: () => void
  generating: boolean
}

function buildFlowNodes(locationNodes: LocationNode[], selectedId?: number): Node[] {
  // If all nodes are at origin, distribute them in a grid
  const needsLayout = locationNodes.length > 1 &&
    locationNodes.every(n => n.canvas_x === 0 && n.canvas_y === 0)

  return locationNodes.map((n, i) => {
    let position = { x: n.canvas_x, y: n.canvas_y }
    if (needsLayout) {
      const cols = Math.ceil(Math.sqrt(locationNodes.length))
      position = { x: (i % cols) * 420, y: Math.floor(i / cols) * 260 }
    }
    return {
      id: String(n.id),
      type: 'location',
      position,
      data: {
        name: n.name,
        node_type: n.node_type,
        description: n.description,
        isSelected: n.id === selectedId,
      } as unknown as Record<string, unknown>,
    }
  })
}

function buildFlowEdges(locationEdges: LocationEdge[], selectedId?: number): Edge[] {
  return locationEdges.map(e => ({
    id: String(e.id),
    source: String(e.source_node_id),
    target: String(e.target_node_id),
    type: e.edge_type,
    selected: e.id === selectedId,
    data: { effort: e.effort, bidirectional: e.bidirectional, note: e.note },
    markerEnd: e.bidirectional ? undefined : { type: MarkerType.ArrowClosed, color: '#14b8a6' },
  }))
}

function LocationGraphInner({
  worldId, locationNodes, locationEdges,
  selected, visible,
  onSelectNode, onSelectEdge,
  onMoveNode, onConnect: onConnectProp,
  onAddNode, onEditNode, onDeleteNode, onUpdateEdge, onDeleteEdge,
  onGenerate, generating,
}: Props) {
  const { fitView } = useReactFlow()
  const [formState, setFormState] = useState<FormState>(null)

  const selectedNodeId = selected?.type === 'node' ? selected.item.id : undefined
  const selectedEdgeId = selected?.type === 'edge' ? selected.item.id : undefined

  const flowNodes = useMemo(() => buildFlowNodes(locationNodes, selectedNodeId), [locationNodes, selectedNodeId])
  const flowEdges = useMemo(() => buildFlowEdges(locationEdges, selectedEdgeId), [locationEdges, selectedEdgeId])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  // Sync data changes (name, type, selection) without overwriting drag positions
  useEffect(() => {
    setNodes(prev => {
      const posMap = new Map(prev.map(n => [n.id, n.position]))
      return flowNodes.map(fn => ({
        ...fn,
        position: posMap.get(fn.id) ?? fn.position,
      }))
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

  const dragTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  useEffect(() => {
    return () => {
      dragTimers.current.forEach(t => clearTimeout(t))
      dragTimers.current.clear()
    }
  }, [])

  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    const id = node.id
    const prev = dragTimers.current.get(id)
    if (prev) clearTimeout(prev)
    dragTimers.current.set(id, setTimeout(() => {
      dragTimers.current.delete(id)
      onMoveNode(Number(id), node.position.x, node.position.y)
    }, 500))
  }, [onMoveNode])

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const loc = locationNodes.find(n => n.id === Number(node.id))
    if (!loc) return
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
  }, [onSelectNode])

  const handleFormConfirm = useCallback(async (input: LocationNodeFormInput) => {
    if (formState?.mode === 'edit') {
      await onEditNode(formState.node.id, input)
    } else if (formState?.mode === 'create') {
      await onAddNode(input, formState.parentId)
    }
  }, [formState, onAddNode, onEditNode])

  if (locationNodes.length === 0) {
    return (
      <div className="flex h-full">
        <div className="flex-1 flex items-center justify-center bg-[hsl(180_8%_97%)] text-center p-8">
          <div className="space-y-3 max-w-xs">
            <p className="text-sm text-muted-foreground font-[var(--font-display)] italic">
              El mapa está vacío
            </p>
            <p className="text-xs text-muted-foreground">
              Genera las localizaciones a partir del grafo causal o crea una manualmente
            </p>
            <div className="flex flex-col items-center gap-2">
              {worldId != null && (
                <button
                  onClick={onGenerate}
                  disabled={generating}
                  className="text-xs text-[#14b8a6] underline underline-offset-2 hover:text-[#0f766e] transition-colors disabled:opacity-50"
                >
                  {generating ? 'Generando...' : 'Generar desde el grafo causal →'}
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
    )
  }

  return (
    <div className="flex h-full">
      <div className="flex-1 relative min-w-0">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
          onNodeDragStop={handleNodeDragStop}
          onConnect={handleConnect}
          onPaneClick={handlePaneClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          connectionMode={ConnectionMode.Loose}
          nodesDraggable={true}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          className="bg-[hsl(180_8%_97%)]"
        >
          <Background color="#c8d5d5" gap={24} size={1} />
          <Controls />
          <MiniMap
            nodeColor="#14b8a6"
            className="!bg-background/90 !border-border/50"
          />
          <div className="absolute top-2 right-2 z-10 flex gap-1.5">
            <button
              onClick={() => setFormState({ mode: 'create' })}
              className="text-xs bg-background border border-border rounded-lg px-2.5 py-1.5 hover:border-[#14b8a6] text-muted-foreground hover:text-[#14b8a6] transition-colors flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Añadir
            </button>
            <button
              onClick={onGenerate}
              disabled={generating}
              className="text-xs bg-background border border-border rounded-lg px-3 py-1.5 hover:border-[#14b8a6] text-muted-foreground hover:text-[#14b8a6] transition-colors disabled:opacity-50"
            >
              {generating ? 'Generando...' : '↺ Regenerar'}
            </button>
          </div>
        </ReactFlow>
      </div>

      <LocationSidePanel
        selected={selected}
        nodes={locationNodes}
        edges={locationEdges}
        onEditNode={node => setFormState({ mode: 'edit', node })}
        onDeleteNode={onDeleteNode}
        onAddChildNode={node => setFormState({ mode: 'create', parentId: node.id, parentName: node.name })}
        onSelectNode={node => onSelectNode(node)}
        onUpdateEdge={onUpdateEdge}
        onDeleteEdge={onDeleteEdge}
        onClose={() => { onSelectNode(null) }}
      />

      {formState && (
        <LocationNodeFormDialog
          mode={formState.mode}
          editingNode={formState.mode === 'edit' ? formState.node : undefined}
          onConfirm={handleFormConfirm}
          onClose={() => setFormState(null)}
        />
      )}
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

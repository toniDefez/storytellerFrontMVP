import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ConnectionMode,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type OnConnect,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { LocationNode as LocationNodeComponent } from './LocationNode'
import { WaterwayEdge, WildernessEdge, RoadEdge } from './LocationEdges'
import { LocationSidePanel } from './LocationSidePanel'
import type { LocationNode, LocationEdge } from '@/services/api'
import type { SelectedLocation } from '@/hooks/useLocationGraph'

// Define outside component to avoid re-renders
const nodeTypes = { location: LocationNodeComponent }
const edgeTypes = { waterway: WaterwayEdge, wilderness: WildernessEdge, road: RoadEdge }

interface Props {
  worldId: number | null
  locationNodes: LocationNode[]
  locationEdges: LocationEdge[]
  selected: SelectedLocation
  onSelectNode: (node: LocationNode | null) => void
  onSelectEdge: (edge: LocationEdge | null) => void
  onMoveNode: (id: number, x: number, y: number) => Promise<void>
  onConnect: (source: number, target: number) => void
  onEditNode: (node: LocationNode) => void
  onDeleteNode: (id: number) => void
  onUpdateEdge: (id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'bidirectional' | 'note'>) => Promise<void>
  onDeleteEdge: (id: number) => void
  onGenerate: () => void
  generating: boolean
}

function buildFlowNodes(locationNodes: LocationNode[], selectedId?: number): Node[] {
  return locationNodes.map(n => ({
    id: String(n.id),
    type: 'location',
    position: { x: n.canvas_x, y: n.canvas_y },
    data: {
      name: n.name,
      node_type: n.node_type,
      description: n.description,
      isSelected: n.id === selectedId,
    } as unknown as Record<string, unknown>,
  }))
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

export function LocationGraphCanvas({
  worldId, locationNodes, locationEdges,
  selected, onSelectNode, onSelectEdge,
  onMoveNode, onConnect: onConnectProp,
  onEditNode, onDeleteNode, onUpdateEdge, onDeleteEdge,
  onGenerate, generating,
}: Props) {
  const selectedNodeId = selected?.type === 'node' ? selected.item.id : undefined
  const selectedEdgeId = selected?.type === 'edge' ? selected.item.id : undefined

  const flowNodes = useMemo(() => buildFlowNodes(locationNodes, selectedNodeId), [locationNodes, selectedNodeId])
  const flowEdges = useMemo(() => buildFlowEdges(locationEdges, selectedEdgeId), [locationEdges, selectedEdgeId])

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges)

  useEffect(() => { setNodes(flowNodes) }, [flowNodes, setNodes])
  useEffect(() => { setEdges(flowEdges) }, [flowEdges, setEdges])

  const dragTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    const id = Number(node.id)
    if (dragTimer.current) clearTimeout(dragTimer.current)
    dragTimer.current = setTimeout(() => {
      onMoveNode(id, node.position.x, node.position.y)
    }, 500)
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

  if (locationNodes.length === 0) {
    return (
      <div className="flex h-full">
        <div className="flex-1 flex items-center justify-center bg-[hsl(180_8%_97%)] text-center p-8">
          <div className="space-y-3 max-w-xs">
            <p className="text-sm text-muted-foreground font-[var(--font-display)] italic">
              El mapa está vacío
            </p>
            <p className="text-xs text-muted-foreground">
              Genera las localizaciones a partir del grafo causal de tu mundo
            </p>
            {worldId != null && (
              <button
                onClick={onGenerate}
                disabled={generating}
                className="text-xs text-[#14b8a6] underline underline-offset-2 hover:text-[#0f766e] transition-colors disabled:opacity-50"
              >
                {generating ? 'Generando...' : 'Generar desde el grafo causal →'}
              </button>
            )}
          </div>
        </div>
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
          {/* Botón regenerar en toolbar */}
          <div className="absolute top-2 right-2 z-10">
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
        onEditNode={onEditNode}
        onDeleteNode={onDeleteNode}
        onUpdateEdge={onUpdateEdge}
        onDeleteEdge={onDeleteEdge}
        onClose={() => { onSelectNode(null) }}
      />
    </div>
  )
}

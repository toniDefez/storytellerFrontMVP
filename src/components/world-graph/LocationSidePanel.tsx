import type { LocationNode, LocationEdge } from '@/services/api'
import type { SelectedLocation } from '@/hooks/useLocationGraph'
import { LocationNodeDetailPanel } from './LocationNodeDetailPanel'
import { LocationEdgeDetailPanel } from './LocationEdgeDetailPanel'

interface Props {
  selected: SelectedLocation
  nodes: LocationNode[]
  edges: LocationEdge[]
  onEditNode: (node: LocationNode) => void
  onDeleteNode: (id: number) => void
  onAddChildNode: (parentNode: LocationNode) => void
  onExpandWithAI: (node: LocationNode) => void
  expandingNodeId: number | null
  onSelectNode: (node: LocationNode) => void
  onUpdateEdge: (id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'dramatic_charge' | 'bidirectional' | 'note'>) => Promise<void>
  onDeleteEdge: (id: number) => void
  onClose: () => void
}

export function LocationSidePanel({ selected, nodes, edges, onEditNode, onDeleteNode, onAddChildNode, onExpandWithAI, expandingNodeId, onSelectNode, onUpdateEdge, onDeleteEdge, onClose }: Props) {
  if (!selected) return (
    <div className="w-64 border-l border-border/50 flex flex-col items-center justify-center gap-3 p-6">
      <p className="text-sm text-muted-foreground italic text-center">
        Selecciona una localización o conexión para ver sus detalles
      </p>
    </div>
  )

  if (selected.type === 'node') {
    const node = selected.item
    const connectedIds = new Set(
      edges.filter(e => e.source_node_id === node.id || e.target_node_id === node.id)
           .map(e => e.source_node_id === node.id ? e.target_node_id : e.source_node_id)
    )
    const connectedNodes = nodes.filter(n => connectedIds.has(n.id))
    const childNodes = nodes.filter(n => n.parent_id === node.id)

    return (
      <div className="w-72 border-l border-border/50 overflow-hidden">
        <LocationNodeDetailPanel
          node={node}
          connectedNodes={connectedNodes}
          childNodes={childNodes}
          onEdit={onEditNode}
          onDelete={onDeleteNode}
          onAddChild={onAddChildNode}
          onExpandWithAI={onExpandWithAI}
          expandingNodeId={expandingNodeId}
          onSelectChild={onSelectNode}
          onClose={onClose}
        />
      </div>
    )
  }

  const edge = selected.item
  const sourceNode = nodes.find(n => n.id === edge.source_node_id)
  const targetNode = nodes.find(n => n.id === edge.target_node_id)

  return (
    <div className="w-72 border-l border-border/50 overflow-hidden">
      <LocationEdgeDetailPanel
        edge={edge}
        sourceNode={sourceNode}
        targetNode={targetNode}
        onUpdate={onUpdateEdge}
        onDelete={onDeleteEdge}
        onClose={onClose}
      />
    </div>
  )
}

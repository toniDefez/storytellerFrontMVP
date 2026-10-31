import type { LocationNode, LocationEdge, LocationNodePatch } from '@/services/api'
import type { SelectedLocation } from '@/hooks/useLocationGraph'
import { LocationNodeDetailPanel } from './LocationNodeDetailPanel'
import { LocationEdgeDetailPanel } from './LocationEdgeDetailPanel'

interface Props {
  selected: SelectedLocation
  nodes: LocationNode[]
  edges: LocationEdge[]
  onUpdateNode: (id: number, patch: LocationNodePatch) => Promise<void>
  onDeleteNode: (id: number) => Promise<void>
  onAddInside: (parentNode: LocationNode) => void
  onExpandWithAI: (node: LocationNode) => void
  expandingNodeId: number | null
  onEnrichWithAI: (node: LocationNode) => void
  enrichingNodeId: number | null
  onSelectNode: (node: LocationNode) => void
  onUpdateEdge: (id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'dramatic_charge' | 'bidirectional' | 'note'>) => Promise<void>
  onDeleteEdge: (id: number) => void
  onClose: () => void
}

export function LocationSidePanel({
  selected, nodes, edges, onUpdateNode, onDeleteNode, onAddInside,
  onExpandWithAI, expandingNodeId, onEnrichWithAI, enrichingNodeId,
  onSelectNode, onUpdateEdge, onDeleteEdge, onClose,
}: Props) {
  if (!selected) return null

  if (selected.type === 'node') {
    const node = selected.item
    const connectedIds = new Set(
      edges.filter(e => e.source_node_id === node.id || e.target_node_id === node.id)
           .map(e => e.source_node_id === node.id ? e.target_node_id : e.source_node_id)
    )
    const connectedNodes = nodes.filter(n => connectedIds.has(n.id))
    const childNodes = nodes.filter(n => n.parent_id === node.id)

    return (
      <div className="h-full overflow-hidden">
        <LocationNodeDetailPanel
          // Un lugar nuevo empieza con sus campos limpios, sin borradores del anterior.
          key={node.id}
          node={node}
          connectedNodes={connectedNodes}
          childNodes={childNodes}
          onUpdate={onUpdateNode}
          onDelete={onDeleteNode}
          onAddInside={onAddInside}
          onExpandWithAI={onExpandWithAI}
          expandingNodeId={expandingNodeId}
          onEnrichWithAI={onEnrichWithAI}
          enrichingNodeId={enrichingNodeId}
          onSelectNode={onSelectNode}
          onClose={onClose}
        />
      </div>
    )
  }

  const edge = selected.item
  const sourceNode = nodes.find(n => n.id === edge.source_node_id)
  const targetNode = nodes.find(n => n.id === edge.target_node_id)

  return (
    <div className="h-full overflow-hidden">
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

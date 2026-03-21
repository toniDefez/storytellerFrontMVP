import { useMemo, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { TreeNode } from './TreeNode'
import type { TreeNodeData } from './TreeNode'
import { computeTreeLayout, DOMAIN_COLOR, EDGE_LABEL } from './treeLayout'
import type { WorldNode } from '@/services/api'

const nodeTypes = { tree: TreeNode }

interface CausalTreeCanvasProps {
  nodes: WorldNode[]
  selectedNodeId?: number
  onSelectNode: (node: WorldNode | null) => void
}

function buildFlowGraph(
  worldNodes: WorldNode[],
  selectedId?: number,
): { nodes: Node<TreeNodeData>[]; edges: Edge[] } {
  const positions = computeTreeLayout(worldNodes)

  const flowNodes: Node<TreeNodeData>[] = worldNodes.map(n => {
    const pos = positions.get(n.id) ?? { x: 0, y: 0 }
    return {
      id: String(n.id),
      type: 'tree',
      position: { x: pos.x, y: pos.y },
      data: {
        label: n.label,
        domain: n.domain,
        role: n.role,
        description: n.content?.description ?? '',
        causal_summary: n.content?.causal_summary ?? '',
        isSelected: n.id === selectedId,
        isRoot: !n.parent_id,
      },
    }
  })

  const flowEdges: Edge[] = worldNodes
    .filter(n => n.parent_id != null)
    .map(n => ({
      id: `e-${n.parent_id}-${n.id}`,
      source: String(n.parent_id),
      target: String(n.id),
      type: 'smoothstep',
      label: n.parent_edge_type ? EDGE_LABEL[n.parent_edge_type] ?? n.parent_edge_type : undefined,
      labelStyle: { fontSize: 9, fill: '#94a3b8' },
      style: { stroke: DOMAIN_COLOR[n.domain] + '80', strokeWidth: 1.5 },
    }))

  return { nodes: flowNodes, edges: flowEdges }
}

export function CausalTreeCanvas({ nodes: worldNodes, selectedNodeId, onSelectNode }: CausalTreeCanvasProps) {
  const nodeMap = useMemo(() => {
    const m = new Map<number, WorldNode>()
    for (const n of worldNodes) m.set(n.id, n)
    return m
  }, [worldNodes])

  const { nodes: flowNodes, edges: flowEdges } = useMemo(
    () => buildFlowGraph(worldNodes, selectedNodeId),
    [worldNodes, selectedNodeId],
  )

  const [nodes, , onNodesChange] = useNodesState(flowNodes)
  const [edges, , onEdgesChange] = useEdgesState(flowEdges)

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      const id = Number(node.id)
      const worldNode = nodeMap.get(id)
      if (!worldNode) return
      onSelectNode(selectedNodeId === id ? null : worldNode)
    },
    [nodeMap, selectedNodeId, onSelectNode],
  )

  const handlePaneClick = useCallback(() => {
    onSelectNode(null)
  }, [onSelectNode])

  if (worldNodes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50/50 text-center p-8">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-display italic">
            El árbol está vacío
          </p>
          <p className="text-xs text-muted-foreground">
            Genera el nodo raíz para empezar
          </p>
        </div>
      </div>
    )
  }

  return (
    <ReactFlow
      key={worldNodes.length}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      onPaneClick={handlePaneClick}
      nodeTypes={nodeTypes}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      className="bg-slate-50/50"
      nodesDraggable={false}
    >
      <Background color="#e2e8f0" gap={20} />
      <Controls />
      <MiniMap
        nodeColor={n => DOMAIN_COLOR[(n.data as TreeNodeData).domain] ?? '#a855f7'}
        className="!bg-background/90 !border-border/50"
      />
    </ReactFlow>
  )
}

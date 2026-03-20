import { useCallback, useState } from 'react'
import {
  ReactFlow,
  addEdge,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  type Connection,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { Node } from '@xyflow/react'
import { ConceptNode } from './ConceptNode'
import type { ConceptNodeData } from './forceLayout'
import { WorldGraphChat, type ChatMessage } from './WorldGraphChat'
import { applyForceLayout } from './forceLayout'
import { Loader2, Expand } from 'lucide-react'

const nodeTypes = { concept: ConceptNode }

export type GraphData = {
  nodes: Array<{
    id: string
    label: string
    domain: ConceptNodeData['domain']
    description?: string
  }>
  edges: Array<{ source: string; target: string; label?: string }>
}

type Props = {
  initialGraph: GraphData
  onSave: (nodes: Node<ConceptNodeData>[], edges: Edge[]) => void
  onExpandNode?: (nodeId: string, nodeLabel: string) => Promise<GraphData>
  onChat?: (message: string, currentGraph: GraphData) => Promise<{ reply: string; patch?: GraphData }>
}

export function WorldGraph({ initialGraph, onSave, onExpandNode, onChat }: Props) {
  const toFlowNodes = (g: GraphData): Node<ConceptNodeData>[] =>
    g.nodes.map((n, i) => ({
      id: n.id,
      type: 'concept',
      position: { x: 100 + (i % 4) * 220, y: 100 + Math.floor(i / 4) * 160 },
      data: { label: n.label, domain: n.domain, description: n.description },
    }))

  const toFlowEdges = (g: GraphData): Edge[] =>
    g.edges.map((e, i) => ({
      id: `e-${i}`,
      source: e.source,
      target: e.target,
      label: e.label,
      style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: '#64748b' },
    }))

  const layouted = applyForceLayout(toFlowNodes(initialGraph), initialGraph.edges)

  const [nodes, setNodes, onNodesChange] = useNodesState<ConceptNodeData>(layouted)
  const [edges, setEdges, onEdgesChange] = useEdgesState(toFlowEdges(initialGraph))
  const [expandingId, setExpandingId] = useState<string | null>(null)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, style: { stroke: '#94a3b8', strokeWidth: 1.5 } }, eds)),
    [setEdges],
  )

  const handleNodeDoubleClick = useCallback(
    async (_: React.MouseEvent, node: Node<ConceptNodeData>) => {
      if (!onExpandNode || expandingId) return
      setExpandingId(node.id)
      try {
        const expansion = await onExpandNode(node.id, node.data.label)
        // Merge new nodes/edges, avoiding duplicates
        const existingIds = new Set(nodes.map(n => n.id))
        const newFlowNodes = expansion.nodes
          .filter(n => !existingIds.has(n.id))
          .map((n, i) => ({
            id: n.id,
            type: 'concept' as const,
            position: {
              x: node.position.x + (i % 3 - 1) * 200,
              y: node.position.y + Math.floor(i / 3) * 160 + 180,
            },
            data: { label: n.label, domain: n.domain, description: n.description },
          }))
        const existingEdgeKeys = new Set(edges.map(e => `${e.source}-${e.target}`))
        const newFlowEdges = expansion.edges
          .filter(e => !existingEdgeKeys.has(`${e.source}-${e.target}`))
          .map((e, i) => ({
            id: `e-exp-${Date.now()}-${i}`,
            source: e.source,
            target: e.target,
            label: e.label,
            style: { stroke: '#94a3b8', strokeWidth: 1.5 },
          }))
        setNodes(ns => [...ns, ...newFlowNodes])
        setEdges(es => [...es, ...newFlowEdges])
      } finally {
        setExpandingId(null)
      }
    },
    [onExpandNode, expandingId, nodes, edges, setNodes, setEdges],
  )

  const handleChat = useCallback(
    async (message: string) => {
      if (!onChat) return
      setChatMessages(m => [...m, { role: 'user', content: message }])
      setChatLoading(true)
      try {
        const currentGraph: GraphData = {
          nodes: nodes.map(n => ({ id: n.id, label: n.data.label, domain: n.data.domain, description: n.data.description })),
          edges: edges.map(e => ({ source: e.source, target: e.target, label: e.label as string | undefined })),
        }
        const { reply, patch } = await onChat(message, currentGraph)
        setChatMessages(m => [...m, { role: 'assistant', content: reply }])
        if (patch) {
          const existingIds = new Set(nodes.map(n => n.id))
          const newFlowNodes = patch.nodes
            .filter(n => !existingIds.has(n.id))
            .map((n, i) => ({
              id: n.id,
              type: 'concept' as const,
              position: { x: 200 + (i % 4) * 220, y: 400 + Math.floor(i / 4) * 160 },
              data: { label: n.label, domain: n.domain, description: n.description },
            }))
          const existingEdgeKeys = new Set(edges.map(e => `${e.source}-${e.target}`))
          const newFlowEdges = patch.edges
            .filter(e => !existingEdgeKeys.has(`${e.source}-${e.target}`))
            .map((e, i) => ({
              id: `e-chat-${Date.now()}-${i}`,
              source: e.source,
              target: e.target,
              label: e.label,
              style: { stroke: '#94a3b8', strokeWidth: 1.5 },
            }))
          setNodes(ns => [...ns, ...newFlowNodes])
          setEdges(es => [...es, ...newFlowEdges])
        }
      } finally {
        setChatLoading(false)
      }
    },
    [onChat, nodes, edges, setNodes, setEdges],
  )

  return (
    <div className="flex gap-0 h-[600px] rounded-xl border border-border/50 overflow-hidden bg-background">
      {/* Graph pane */}
      <div className="flex-1 relative min-w-0">
        {expandingId && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-background/90 backdrop-blur-sm border border-border rounded-full px-3 py-1.5 shadow-sm">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            <span className="text-xs text-foreground">Expandiendo nodo...</span>
          </div>
        )}
        {onExpandNode && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-2.5 py-1.5">
            <Expand className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Doble click para expandir un nodo</span>
          </div>
        )}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDoubleClick={handleNodeDoubleClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-slate-50/50"
        >
          <Background color="#e2e8f0" gap={20} />
          <Controls />
          <MiniMap
            nodeColor={n => {
              const domain = (n.data as ConceptNodeData).domain
              return domain === 'physical' ? '#10b981'
                : domain === 'biological' ? '#f59e0b'
                : domain === 'social' ? '#0ea5e9'
                : '#a855f7'
            }}
            className="!bg-background/90 !border-border/50"
          />
        </ReactFlow>
      </div>

      {/* Chat sidebar */}
      <div className="w-[220px] shrink-0 border-l border-border/50 flex flex-col bg-background">
        <WorldGraphChat
          messages={chatMessages}
          loading={chatLoading}
          onSend={handleChat}
        />
        <div className="px-2 py-2 border-t border-border/50 shrink-0">
          <button
            onClick={() => onSave(nodes, edges)}
            className="w-full text-xs font-medium bg-primary text-primary-foreground rounded-lg py-2 hover:opacity-90 transition-opacity"
          >
            Guardar mundo
          </button>
        </div>
      </div>
    </div>
  )
}

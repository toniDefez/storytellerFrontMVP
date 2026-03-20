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
import { Loader2, Expand, X, Maximize2, Pencil, Trash2, Check } from 'lucide-react'

const nodeTypes = { concept: ConceptNode }

const DOMAIN_COLOR: Record<string, string> = {
  physical: '#10b981', biological: '#f59e0b', social: '#0ea5e9', core: '#a855f7',
}
const DOMAIN_LABEL: Record<string, string> = {
  physical: 'Físico', biological: 'Biológico', social: 'Social', core: 'Núcleo',
}

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
  const [selectedNode, setSelectedNode] = useState<Node<ConceptNodeData> | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [editLabel, setEditLabel] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editDomain, setEditDomain] = useState<ConceptNodeData['domain']>('core')
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null)
  const [editEdgeLabel, setEditEdgeLabel] = useState('')
  const [isEditingEdge, setIsEditingEdge] = useState(false)

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, style: { stroke: '#94a3b8', strokeWidth: 1.5 } }, eds)),
    [setEdges],
  )

  const handleNodeClick = useCallback(
    (_: React.MouseEvent, node: Node<ConceptNodeData>) => {
      setSelectedEdge(null)
      setIsEditingEdge(false)
      setSelectedNode(prev => {
        if (prev?.id === node.id) {
          setIsEditing(false)
          return null
        }
        setIsEditing(false)
        return node
      })
    },
    [],
  )

  const startEditing = useCallback(() => {
    if (!selectedNode) return
    setEditLabel(selectedNode.data.label)
    setEditDescription(selectedNode.data.description ?? '')
    setEditDomain(selectedNode.data.domain)
    setIsEditing(true)
  }, [selectedNode])

  const handleSaveEdit = useCallback(() => {
    if (!selectedNode) return
    const updated: ConceptNodeData = {
      ...selectedNode.data,
      label: editLabel.trim() || selectedNode.data.label,
      description: editDescription.trim() || undefined,
      domain: editDomain,
    }
    setNodes(ns => ns.map(n => n.id === selectedNode.id ? { ...n, data: updated } : n))
    setSelectedNode(prev => prev ? { ...prev, data: updated } : null)
    setIsEditing(false)
  }, [selectedNode, editLabel, editDescription, editDomain, setNodes])

  const handleDeleteNode = useCallback(() => {
    if (!selectedNode) return
    setNodes(ns => ns.filter(n => n.id !== selectedNode.id))
    setEdges(es => es.filter(e => e.source !== selectedNode.id && e.target !== selectedNode.id))
    setSelectedNode(null)
    setIsEditing(false)
  }, [selectedNode, setNodes, setEdges])

  const handleEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedNode(null)
    setIsEditing(false)
    setSelectedEdge(prev => prev?.id === edge.id ? null : edge)
    setEditEdgeLabel(String(edge.label ?? ''))
    setIsEditingEdge(false)
  }, [])

  const handleSaveEdge = useCallback(() => {
    if (!selectedEdge) return
    const updated = { ...selectedEdge, label: editEdgeLabel.trim() || undefined }
    setEdges(es => es.map(e => e.id === selectedEdge.id ? updated : e))
    setSelectedEdge(updated)
    setIsEditingEdge(false)
  }, [selectedEdge, editEdgeLabel, setEdges])

  const handleDeleteEdge = useCallback(() => {
    if (!selectedEdge) return
    setEdges(es => es.filter(e => e.id !== selectedEdge.id))
    setSelectedEdge(null)
    setIsEditingEdge(false)
  }, [selectedEdge, setEdges])

  const handleExpandSelected = useCallback(
    async () => {
      if (!onExpandNode || !selectedNode || expandingId) return
      const node = selectedNode
      setExpandingId(node.id)
      try {
        const expansion = await onExpandNode(node.id, node.data.label)
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
        setSelectedNode(null)
      } finally {
        setExpandingId(null)
      }
    },
    [onExpandNode, selectedNode, expandingId, nodes, edges, setNodes, setEdges],
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
          if (newFlowNodes.length > 0) {
            const names = newFlowNodes.map(n => n.data.label).join(', ')
            setChatMessages(m => [...m, {
              role: 'system',
              content: `✓ ${newFlowNodes.length} nodo(s) añadido(s) al grafo: ${names}`,
            }])
          }
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
        {onExpandNode && !selectedNode && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-background/80 backdrop-blur-sm border border-border/50 rounded-lg px-2.5 py-1.5">
            <Expand className="w-3 h-3 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Click en un nodo para ver detalles</span>
          </div>
        )}

        {/* Edge detail panel */}
        {selectedEdge && (() => {
          const sourceLabel = nodes.find(n => n.id === selectedEdge.source)?.data.label ?? selectedEdge.source
          const targetLabel = nodes.find(n => n.id === selectedEdge.target)?.data.label ?? selectedEdge.target
          return (
            <div className="absolute bottom-3 left-3 z-20 w-64 bg-background border border-border rounded-xl shadow-lg p-3 flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Relación</span>
                <button
                  onClick={() => { setSelectedEdge(null); setIsEditingEdge(false) }}
                  className="text-muted-foreground hover:text-foreground shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-foreground leading-snug">
                <span className="font-semibold">{sourceLabel}</span>
                <span className="text-muted-foreground"> → </span>
                <span className="font-semibold">{targetLabel}</span>
              </p>

              {isEditingEdge ? (
                <>
                  <input
                    value={editEdgeLabel}
                    onChange={e => setEditEdgeLabel(e.target.value)}
                    className="text-xs text-foreground rounded-md border border-border px-2 py-1 outline-none focus:ring-1 focus:ring-primary/50"
                    placeholder="Etiqueta de relación..."
                  />
                  <div className="flex gap-1.5">
                    <button
                      onClick={handleSaveEdge}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium bg-primary text-primary-foreground rounded-lg py-1.5 hover:opacity-90 transition-opacity"
                    >
                      <Check className="w-3 h-3" /> Guardar
                    </button>
                    <button
                      onClick={() => setIsEditingEdge(false)}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium border border-border rounded-lg py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {selectedEdge.label && (
                    <p className="text-xs text-muted-foreground italic">"{selectedEdge.label}"</p>
                  )}
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => { setEditEdgeLabel(String(selectedEdge.label ?? '')); setIsEditingEdge(true) }}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium border border-border rounded-lg py-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <Pencil className="w-3 h-3" /> Editar
                    </button>
                    <button
                      onClick={handleDeleteEdge}
                      className="flex-1 flex items-center justify-center gap-1 text-xs font-medium border border-red-200 text-red-500 rounded-lg py-1.5 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" /> Borrar
                    </button>
                  </div>
                </>
              )}
            </div>
          )
        })()}

        {/* Node detail panel */}
        {selectedNode && (
          <div className="absolute bottom-3 left-3 z-20 w-64 bg-background border border-border rounded-xl shadow-lg p-3 flex flex-col gap-2 max-h-[70%] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              {isEditing ? (
                <select
                  value={editDomain}
                  onChange={e => setEditDomain(e.target.value as ConceptNodeData['domain'])}
                  className="text-[10px] font-semibold uppercase tracking-wide bg-transparent border border-border rounded px-1 py-0.5 text-muted-foreground"
                >
                  <option value="physical">Físico</option>
                  <option value="biological">Biológico</option>
                  <option value="social">Social</option>
                  <option value="core">Núcleo</option>
                </select>
              ) : (
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: DOMAIN_COLOR[selectedNode.data.domain] ?? '#a855f7' }}
                  />
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                    {DOMAIN_LABEL[selectedNode.data.domain] ?? selectedNode.data.domain}
                  </span>
                </div>
              )}
              <button
                onClick={() => { setSelectedNode(null); setIsEditing(false) }}
                className="text-muted-foreground hover:text-foreground shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Label */}
            {isEditing ? (
              <input
                value={editLabel}
                onChange={e => setEditLabel(e.target.value)}
                className="text-sm font-semibold text-foreground rounded-md border border-border px-2 py-1 outline-none focus:ring-1 focus:ring-primary/50"
                placeholder="Nombre del nodo"
              />
            ) : (
              <p className="text-sm font-semibold text-foreground leading-snug">{selectedNode.data.label}</p>
            )}

            {/* Description */}
            {isEditing ? (
              <textarea
                value={editDescription}
                onChange={e => setEditDescription(e.target.value)}
                rows={3}
                className="text-xs text-muted-foreground rounded-md border border-border px-2 py-1.5 outline-none focus:ring-1 focus:ring-primary/50 resize-none"
                placeholder="Descripción del nodo..."
              />
            ) : (
              selectedNode.data.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedNode.data.description}</p>
              )
            )}

            {/* Actions */}
            {isEditing ? (
              <div className="flex gap-1.5 mt-1">
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-medium bg-primary text-primary-foreground rounded-lg py-1.5 hover:opacity-90 transition-opacity"
                >
                  <Check className="w-3 h-3" /> Guardar
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 flex items-center justify-center gap-1 text-xs font-medium border border-border rounded-lg py-1.5 hover:bg-muted/50 transition-colors"
                >
                  <X className="w-3 h-3" /> Cancelar
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex gap-1.5">
                  <button
                    onClick={startEditing}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-medium border border-border rounded-lg py-1.5 hover:bg-muted/50 transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button
                    onClick={handleDeleteNode}
                    className="flex-1 flex items-center justify-center gap-1 text-xs font-medium border border-red-200 text-red-500 rounded-lg py-1.5 hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Borrar
                  </button>
                </div>
                {onExpandNode && (
                  <button
                    onClick={handleExpandSelected}
                    disabled={!!expandingId}
                    className="flex items-center justify-center gap-1.5 w-full text-xs font-medium border border-border rounded-lg py-1.5 hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {expandingId === selectedNode.id ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Expandiendo...</>
                    ) : (
                      <><Maximize2 className="w-3 h-3" /> Expandir nodo</>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges.map(e => ({
            ...e,
            style: e.id === selectedEdge?.id
              ? { stroke: '#a855f7', strokeWidth: 2.5 }
              : { stroke: '#94a3b8', strokeWidth: 1.5 },
          }))}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={handleNodeClick}
          onEdgeClick={handleEdgeClick}
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

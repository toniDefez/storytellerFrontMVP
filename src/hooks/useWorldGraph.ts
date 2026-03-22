import { useState, useCallback } from 'react'
import type { WorldNode, CandidateNode, EdgeType, NodeDomain, NodeRole } from '@/services/api'
import {
  getWorldGraph,
  expandNodeCandidates,
  createNode,
  deleteSubtree,
  getSubtreePreview,
  graphChat,
} from '@/services/api'

export interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

export interface UseWorldGraphReturn {
  nodes: WorldNode[]
  premise: string
  loading: boolean
  error: string
  selectedNode: WorldNode | null
  ghostCandidates: CandidateNode[]
  ghostParentId: number | null
  loadGraph: (worldId: number) => Promise<void>
  selectNode: (node: WorldNode | null) => void
  expandNode: (worldId: number, nodeId: number) => Promise<void>
  confirmCandidate: (worldId: number, parentId: number, candidate: CandidateNode) => Promise<void>
  dismissGhosts: () => void
  addNodeManually: (worldId: number, input: {
    parentId?: number
    parentEdgeType?: EdgeType
    domain: NodeDomain
    role: NodeRole
    label: string
    description: string
    causalSummary: string
  }) => Promise<WorldNode>
  removeSubtree: (worldId: number, nodeId: number) => Promise<{ count: number; labels: string[] }>
  deleteConfirmed: (worldId: number, nodeId: number) => Promise<void>
  chatHistory: ChatMessage[]
  chatLoading: boolean
  sendChatMessage: (worldId: number, text: string) => Promise<void>
}

export function useWorldGraph(): UseWorldGraphReturn {
  const [nodes, setNodes] = useState<WorldNode[]>([])
  const [premise, setPremise] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedNode, setSelectedNode] = useState<WorldNode | null>(null)
  const [ghostCandidates, setGhostCandidates] = useState<CandidateNode[]>([])
  const [ghostParentId, setGhostParentId] = useState<number | null>(null)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [chatLoading, setChatLoading] = useState(false)

  const loadGraph = useCallback(async (worldId: number) => {
    setLoading(true)
    setError('')
    try {
      const graph = await getWorldGraph(worldId)
      setNodes(graph.nodes ?? [])
      setPremise(graph.premise)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando grafo')
    } finally {
      setLoading(false)
    }
  }, [])

  const selectNode = useCallback((node: WorldNode | null) => {
    setSelectedNode(node)
    setGhostCandidates([])
    setGhostParentId(null)
  }, [])

  const expandNode = useCallback(async (worldId: number, nodeId: number) => {
    setLoading(true)
    setError('')
    try {
      const result = await expandNodeCandidates(worldId, nodeId)
      setGhostCandidates(result.candidates ?? [])
      setGhostParentId(nodeId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error expandiendo nodo')
    } finally {
      setLoading(false)
    }
  }, [])

  const dismissGhosts = useCallback(() => {
    setGhostCandidates([])
    setGhostParentId(null)
  }, [])

  const confirmCandidate = useCallback(async (worldId: number, parentId: number, candidate: CandidateNode) => {
    setLoading(true)
    setError('')
    try {
      const newNode = await createNode(worldId, {
        parent_id: parentId,
        parent_edge_type: candidate.parent_edge_type,
        domain: candidate.domain,
        role: candidate.role,
        label: candidate.label,
        description: candidate.description,
        causal_summary: candidate.causal_summary,
        position_order: nodes.filter(n => n.parent_id === parentId).length,
      })
      setNodes(prev => [...prev, newNode])
      setGhostCandidates([])
      setGhostParentId(null)
      setSelectedNode(newNode)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error añadiendo nodo')
    } finally {
      setLoading(false)
    }
  }, [nodes])

  const addNodeManually = useCallback(async (worldId: number, input: {
    parentId?: number
    parentEdgeType?: EdgeType
    domain: NodeDomain
    role: NodeRole
    label: string
    description: string
    causalSummary: string
  }) => {
    const newNode = await createNode(worldId, {
      parent_id: input.parentId,
      parent_edge_type: input.parentEdgeType,
      domain: input.domain,
      role: input.role,
      label: input.label,
      description: input.description,
      causal_summary: input.causalSummary,
      position_order: nodes.filter(n => n.parent_id === (input.parentId ?? null)).length,
    })
    setNodes(prev => [...prev, newNode])
    return newNode
  }, [nodes])

  const removeSubtree = useCallback(async (worldId: number, nodeId: number) => {
    const preview = await getSubtreePreview(worldId, nodeId)
    return { count: preview.node_count, labels: preview.labels }
  }, [])

  const deleteConfirmed = useCallback(async (worldId: number, nodeId: number) => {
    setLoading(true)
    try {
      const result = await deleteSubtree(worldId, nodeId)
      const deletedSet = new Set(result.deleted_ids)
      setNodes(prev => prev.filter(n => !deletedSet.has(n.id)))
      setSelectedNode(prev => prev && deletedSet.has(prev.id) ? null : prev)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error eliminando nodo')
    } finally {
      setLoading(false)
    }
  }, [])

  const sendChatMessage = useCallback(async (worldId: number, text: string) => {
    setChatHistory(prev => [...prev, { role: 'user', text }])
    setChatLoading(true)
    try {
      const res = await graphChat(worldId, text)
      setChatHistory(prev => [...prev, { role: 'assistant', text: res.reply }])
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error en el chat'
      setChatHistory(prev => [...prev, { role: 'assistant', text: `Error: ${msg}` }])
    } finally {
      setChatLoading(false)
    }
  }, [])

  return {
    nodes, premise, loading, error,
    selectedNode, ghostCandidates, ghostParentId,
    loadGraph, selectNode, expandNode, confirmCandidate,
    dismissGhosts, addNodeManually, removeSubtree, deleteConfirmed,
    chatHistory, chatLoading, sendChatMessage,
  }
}

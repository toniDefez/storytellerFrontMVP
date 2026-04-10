import { useState, useCallback } from 'react'
import type { LocationNode, LocationEdge } from '@/services/api'
import {
  getLocationGraph, createLocationNode, updateLocationNode,
  updateLocationNodePosition, deleteLocationNode,
  createLocationEdge, updateLocationEdge, deleteLocationEdge,
  generateLocationRegions, expandLocationNode,
} from '@/services/api'

export type SelectedLocation =
  | { type: 'node'; item: LocationNode }
  | { type: 'edge'; item: LocationEdge }
  | null

export function useLocationGraph(worldId: number | null) {
  const [nodes, setNodes] = useState<LocationNode[]>([])
  const [edges, setEdges] = useState<LocationEdge[]>([])
  const [selected, setSelected] = useState<SelectedLocation>(null)
  const [loading, setLoading] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [expandingNodeId, setExpandingNodeId] = useState<number | null>(null)
  const [error, setError] = useState('')

  const loadGraph = useCallback(async () => {
    if (!worldId) return
    setLoading(true)
    try {
      const graph = await getLocationGraph(worldId)
      setNodes(graph.nodes ?? [])
      setEdges(graph.edges ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando localizaciones')
    } finally {
      setLoading(false)
    }
  }, [worldId])

  const generate = useCallback(async () => {
    if (!worldId) return
    setGenerating(true)
    setError('')
    try {
      const graph = await generateLocationRegions(worldId)
      setNodes(graph.nodes ?? [])
      setEdges(graph.edges ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando localizaciones')
    } finally {
      setGenerating(false)
    }
  }, [worldId])

  const expandNode = useCallback(async (worldId: number, nodeId: number) => {
    setExpandingNodeId(nodeId)
    setError('')
    try {
      const graph = await expandLocationNode(worldId, nodeId)
      setNodes(prev => [...prev, ...(graph.nodes ?? [])])
      setEdges(prev => [...prev, ...(graph.edges ?? [])])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error expandiendo localización')
    } finally {
      setExpandingNodeId(null)
    }
  }, [])

  const addNode = useCallback(async (node: Omit<LocationNode, 'id'>) => {
    const created = await createLocationNode(node)
    setNodes(prev => [...prev, created])
    return created
  }, [])

  const editNode = useCallback(async (id: number, data: Pick<LocationNode, 'name' | 'node_type' | 'description' | 'properties'>) => {
    await updateLocationNode(id, data)
    setNodes(prev => prev.map(n => n.id === id ? { ...n, ...data } : n))
  }, [])

  const moveNode = useCallback(async (id: number, x: number, y: number) => {
    await updateLocationNodePosition(id, x, y)
    setNodes(prev => prev.map(n => n.id === id ? { ...n, canvas_x: x, canvas_y: y } : n))
  }, [])

  const removeNode = useCallback(async (id: number) => {
    await deleteLocationNode(id)
    setNodes(prev => prev.filter(n => n.id !== id))
    setEdges(prev => prev.filter(e => e.source_node_id !== id && e.target_node_id !== id))
    if (selected?.type === 'node' && selected.item.id === id) setSelected(null)
  }, [selected])

  const addEdge = useCallback(async (edge: Omit<LocationEdge, 'id'>) => {
    const created = await createLocationEdge(edge)
    setEdges(prev => [...prev, created])
    return created
  }, [])

  const editEdge = useCallback(async (id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'dramatic_charge' | 'bidirectional' | 'note'>) => {
    await updateLocationEdge(id, data)
    setEdges(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
  }, [])

  const removeEdge = useCallback(async (id: number) => {
    await deleteLocationEdge(id)
    setEdges(prev => prev.filter(e => e.id !== id))
    if (selected?.type === 'edge' && selected.item.id === id) setSelected(null)
  }, [selected])

  return {
    nodes, edges, selected, setSelected,
    loading, generating, expandingNodeId, error,
    loadGraph, generate, expandNode,
    addNode, editNode, moveNode, removeNode,
    addEdge, editEdge, removeEdge,
  }
}

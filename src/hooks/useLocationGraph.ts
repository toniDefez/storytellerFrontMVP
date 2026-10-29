import { useState, useCallback } from 'react'
import type { LocationNode, LocationEdge, LocationNodePatch } from '@/services/api'
import {
  getLocationGraph, createLocationNode, updateLocationNode,
  updateLocationNodePosition, deleteLocationNode,
  createLocationEdge, updateLocationEdge, deleteLocationEdge,
  generateLocationRegions, expandLocationNode, enrichLocationNode,
} from '@/services/api'
import { useGenerationProgress } from './useGenerationProgress'

async function fetchGraph(worldId: number) {
  const graph = await getLocationGraph(worldId)
  return { nodes: graph.nodes ?? [], edges: graph.edges ?? [] }
}

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
  const [enrichingNodeId, setEnrichingNodeId] = useState<number | null>(null)
  const [error, setError] = useState('')
  // Generar tarda ~40 s y el modelo corrige su propia salida: la fase real
  // («corrigiendo localizaciones…») se enseña junto al botón.
  const { progress: generatingProgress, start: startProgress, stop: stopProgress } = useGenerationProgress()

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
    const requestId = startProgress()
    try {
      const graph = await generateLocationRegions(worldId, false, requestId)
      setNodes(graph.nodes ?? [])
      setEdges(graph.edges ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error generando localizaciones')
    } finally {
      stopProgress()
      setGenerating(false)
    }
  }, [worldId, startProgress, stopProgress])

  const addRegions = useCallback(async () => {
    if (!worldId) return
    setGenerating(true)
    setError('')
    const requestId = startProgress()
    try {
      await generateLocationRegions(worldId, true, requestId)
      // Reload full graph from DB to get accurate state (includes pre-existing nodes)
      const { nodes: fresh, edges: freshEdges } = await fetchGraph(worldId)
      setNodes(fresh)
      setEdges(freshEdges)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error añadiendo regiones')
    } finally {
      stopProgress()
      setGenerating(false)
    }
  }, [worldId, startProgress, stopProgress])

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

  const enrichNode = useCallback(async (worldId: number, nodeId: number) => {
    setEnrichingNodeId(nodeId)
    setError('')
    try {
      const updated = await enrichLocationNode(worldId, nodeId)
      setNodes(prev => prev.map(n => n.id === nodeId ? updated : n))
      if (selected?.type === 'node' && selected.item.id === nodeId) {
        setSelected({ type: 'node', item: updated })
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error completando localización')
    } finally {
      setEnrichingNodeId(null)
    }
  }, [selected])

  const addNode = useCallback(async (node: Omit<LocationNode, 'id'>) => {
    const raw = await createLocationNode(node)
    const created: LocationNode = { ...raw, properties: raw.properties ?? {} }
    setNodes(prev => [...prev, created])
    return created
  }, [])

  // Solo lo que cambia: el backend conserva el resto.
  const editNode = useCallback(async (id: number, patch: LocationNodePatch) => {
    await updateLocationNode(id, patch)
    setNodes(prev => prev.map(n => {
      if (n.id !== id) return n
      const { properties, narrative_function, ...rest } = patch
      const next: LocationNode = { ...n, ...rest }
      if (narrative_function !== undefined) next.narrative_function = narrative_function || undefined
      if (properties) next.properties = { ...n.properties, ...properties }
      return next
    }))
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
    loading, generating, generatingProgress, expandingNodeId, enrichingNodeId, error,
    loadGraph, generate, addRegions, expandNode, enrichNode,
    addNode, editNode, moveNode, removeNode,
    addEdge, editEdge, removeEdge,
  }
}

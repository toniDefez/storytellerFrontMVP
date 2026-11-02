import { useState, useCallback } from 'react'
import type { LocationNode, LocationEdge, LocationNodePatch } from '@/services/api'
import {
  getLocationGraph, createLocationNode, updateLocationNode,
  updateLocationNodePosition, deleteLocationNode,
  createLocationEdge, updateLocationEdge, deleteLocationEdge,
} from '@/services/api'

export type SelectedLocation =
  | { type: 'node'; item: LocationNode }
  | { type: 'edge'; item: LocationEdge }
  | null

/**
 * Los lugares y caminos de un mundo. La generación de regiones, expandir y
 * enriquecer murieron con la jerarquía: la escena 0 propone lugares como
 * tarjetas (proposePlaces) y el autor los crea con addNode.
 */
export function useLocationGraph(worldId: number | null) {
  const [nodes, setNodes] = useState<LocationNode[]>([])
  const [edges, setEdges] = useState<LocationEdge[]>([])
  const [selected, setSelected] = useState<SelectedLocation>(null)
  const [loading, setLoading] = useState(false)
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
    loading, error,
    loadGraph,
    addNode, editNode, moveNode, removeNode,
    addEdge, editEdge, removeEdge,
  }
}

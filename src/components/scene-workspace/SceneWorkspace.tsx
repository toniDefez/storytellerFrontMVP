import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  getFlowNodes,
  getSceneCharacters,
  getSceneDetail,
  createFlowNode,
  deleteFlowNode,
  reorderFlowNodes,
} from '@/services/api'
import type { FlowNode, FlowNodeType, SceneCharacter } from '@/services/api'
import { ArcBar } from './ArcBar'
import { FlowNodeList } from './FlowNodeList'
import { FlowNodePalette } from './FlowNodePalette'

interface Props {
  sceneId: number
  storyId: number
  onBack: () => void
}

export function SceneWorkspace({ sceneId, onBack }: Props) {
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [sceneCharacters, setSceneCharacters] = useState<SceneCharacter[]>([])
  const [sceneTitle, setSceneTitle] = useState<string>(`Escena ${sceneId}`)
  const [loading, setLoading] = useState(true)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const [flowNodes, chars, sceneDetail] = await Promise.all([
        getFlowNodes(sceneId),
        getSceneCharacters(sceneId),
        getSceneDetail(sceneId),
      ])
      setNodes(flowNodes)
      setSceneCharacters(chars)
      setSceneTitle(sceneDetail.title)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar la escena.')
    } finally {
      setLoading(false)
    }
  }, [sceneId])

  useEffect(() => {
    loadAll()
  }, [loadAll])

  /* ── Add node from palette ─── */
  const handleAddNode = useCallback(async (nodeType: FlowNodeType) => {
    const nextPosition = nodes.length > 0
      ? Math.max(...nodes.map(n => n.position)) + 1
      : 0
    try {
      const node = await createFlowNode(sceneId, nodeType, nextPosition, {})
      setNodes(prev => [...prev, node])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al añadir nodo.')
    }
  }, [sceneId, nodes])

  /* ── Update node config (called after debounced auto-save) ─── */
  const handleUpdate = useCallback((id: number, nodeType: FlowNodeType, config: Record<string, unknown>) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, node_type: nodeType, config } : n))
  }, [])

  /* ── Delete node ─── */
  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteFlowNode(id)
      setNodes(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar nodo.')
    }
  }, [])

  /* ── Reorder ─── */
  const handleReorder = useCallback(async (orderedIds: number[]) => {
    // optimistic update
    setNodes(prev => {
      const map = new Map(prev.map(n => [n.id, n]))
      return orderedIds.map((id, idx) => ({ ...map.get(id)!, position: idx }))
    })
    try {
      await reorderFlowNodes(sceneId, orderedIds)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al reordenar nodos.')
      loadAll()
    }
  }, [sceneId, loadAll])

  return (
    <div className="flex flex-col h-full w-full bg-[hsl(40_20%_97%)]">
      {/* ── Floating top controls ────────────────────────────────── */}
      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-3 left-3 z-10 bg-white/90 border border-stone-200 rounded-lg shadow-sm px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        ← Grafo
      </button>

      {/* Scene title */}
      <h1 className="absolute top-3 left-1/2 -translate-x-1/2 z-10 font-display text-base font-semibold text-stone-800 bg-white/90 border border-stone-200 rounded-lg shadow-sm px-3 py-1.5 pointer-events-none">
        {sceneTitle}
      </h1>

      {/* Generar button */}
      <button
        disabled
        title="Próximamente"
        className="absolute top-3 right-3 z-10 bg-cyan-500 text-white opacity-50 cursor-not-allowed px-3 py-1.5 rounded-lg text-sm font-medium"
      >
        Generar
      </button>

      {/* ── Arc Bar ─────────────────────────────────────────────── */}
      <div className="px-4 pt-14 pb-2 border-b border-stone-100 bg-white/60">
        <ArcBar nodeCount={nodes.length} />
      </div>

      {/* ── Main area ───────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Node list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-4 h-4 border border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : (
            <FlowNodeList
              nodes={nodes}
              sceneCharacters={sceneCharacters}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          )}
        </div>

        {/* Palette */}
        <FlowNodePalette onAddNode={handleAddNode} />
      </div>
    </div>
  )
}

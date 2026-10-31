import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getWorldById, deleteWorld, getWorldDetail } from '../../services/api'
import type { World, WorldNode, WorldDetail } from '../../services/api'
import type { NodeFormInput } from '@/components/world-graph/NodeFormDialog'
import { useWorldGraph } from '@/hooks/useWorldGraph'
import ConfirmModal from '../../components/ConfirmModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useUrlParam } from '@/hooks/useUrlParam'
import { CausalTreeCanvas } from '@/components/world-graph/CausalTreeCanvas'
import { GhostCandidates } from '@/components/world-graph/GhostCandidates'
import { PlacesPanel } from '@/components/places/PlacesPanel'
import { useLocationGraph } from '@/hooks/useLocationGraph'
import { toast } from 'sonner'
import { CharacterPanel } from '@/components/character-panel/CharacterPanel'
import { StoryPanel } from '@/components/story-setup/StoryPanel'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { notifyError } from '@/lib/notifyError'

function inferDotColor(world: World): string {
  const text = (world.premise || world.description || '').toLowerCase()
  if (/ceniza|volcan|fuego/.test(text)) return '#dc2626'
  if (/hielo|nieve|glaciar/.test(text)) return '#06b6d4'
  if (/agua|oceano|lluvia/.test(text)) return '#3b82f6'
  if (/bosque|selva|verde/.test(text)) return '#10b981'
  if (/desierto|arena|sol|gusano/.test(text)) return '#f59e0b'
  if (/oscuridad|sombra/.test(text)) return '#475569'
  if (/magia|hechizo/.test(text)) return '#8b5cf6'
  return '#7c3aed'
}

export default function WorldDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [world, setWorld] = useState<World | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [isExpanding, setIsExpanding] = useState(false)
  // La pestaña vive en la URL: «atrás» vuelve a la pestaña anterior, no saca del mundo.
  const [tabParam, setTabParam] = useUrlParam('tab')
  const graphView = (tabParam ?? 'causal') as 'causal' | 'locations' | 'characters' | 'stories'
  const setGraphView = (v: 'causal' | 'locations' | 'characters' | 'stories') =>
    setTabParam(v === 'causal' ? null : v, { clear: ['place', 'character', 'story', 'scene', 'read'] })
  const [worldDetail, setWorldDetail] = useState<WorldDetail | null>(null)
  const graph = useWorldGraph()

  const refreshWorldDetail = useCallback(() => {
    const worldId = Number(id)
    if (!id || Number.isNaN(worldId)) return
    getWorldDetail(worldId).then(setWorldDetail).catch(notifyError('No se pudo cargar el resumen del mundo'))
  }, [id])

  const {
    nodes: locationNodes, edges: locationEdges,
    generating: locationGenerating,
    generatingProgress: locationGeneratingProgress,
    error: locationError,
    loadGraph: loadLocationGraph, generate: generateLocations,
    addNode: addLocationNode, editNode: editLocationNode, removeNode,
    addEdge, editEdge, removeEdge,
  } = useLocationGraph(Number(id))

  // El hook guardaba el error y nadie lo enseñaba: generar localizaciones
  // podía fallar sin que la pantalla cambiase.
  useEffect(() => {
    if (locationError) toast.error(`Localizaciones: ${locationError}`)
  }, [locationError])

  const handleAddNode = useCallback(async (input: NodeFormInput, parentNode: WorldNode | null) => {
    const wid = Number(id)
    if (!id || Number.isNaN(wid)) return
    await graph.addNodeManually(wid, {
      parentId: parentNode?.id,
      parentEdgeType: input.parentEdgeType,
      domain: input.domain,
      role: input.role,
      label: input.label,
      description: input.description,
      causalSummary: input.description,
    })
  }, [id, graph])

  const handleUpdateNode = useCallback(async (input: NodeFormInput, nodeId: number) => {
    const wid = Number(id)
    if (!id || Number.isNaN(wid)) return
    await graph.updateNodeManually(wid, nodeId, {
      label: input.label,
      domain: input.domain,
      role: input.role,
      description: input.description,
    })
  }, [id, graph])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])

  useEffect(() => {
    document.title = `${t('pageTitle.worldDetail', { name: world?.name ?? '' })} — StoryTeller`
  }, [t, i18n.language, world?.name])

  useEffect(() => {
    const worldId = Number(id)
    if (!id || Number.isNaN(worldId)) {
      setError(t('world.detail.invalidId'))
      setLoading(false)
      return
    }

    Promise.all([
      getWorldById(worldId),
      graph.loadGraph(worldId),
      getWorldDetail(worldId),
    ])
      .then(([w, , detail]) => {
        setWorld(w)
        setWorldDetail(detail)
        document.title = `${w.name} — StoryTeller`
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, t])

  useEffect(() => {
    if (id) loadLocationGraph()
  }, [id, loadLocationGraph])

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteWorld(Number(id))
      toast.success('Mundo eliminado correctamente.')
      navigate('/worlds')
    } catch {
      setError(t('world.detail.deleteError'))
      setLoading(false)
    }
  }

  if (loading) return <DetailSkeleton />
  if (error) return (
    <div className="flex justify-center items-center h-96">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  )
  if (!world) {
    return (
      <div className="flex justify-center items-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{t('world.detail.notFound')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const dotColor = inferDotColor(world)

  return (
    // Móvil: la cabecera con el menú mide 45 px y la barra se parte en dos
    // filas, así que la altura la reparte un flex en vez de un calc fijo.
    <div className="flex flex-col h-[calc(100dvh-45px)] md:h-screen">
      <ConfirmModal
        open={showConfirmDelete}
        title={t('world.detail.deleteTitle')}
        message={t('world.detail.deleteMessage', { name: world.name })}
        confirmText={t('world.detail.deleteConfirm')}
        cancelText={t('common.cancel')}
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* ── Slim toolbar 44px ─────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-y-1 px-3 md:px-4 py-1.5 md:py-0 md:h-11 shrink-0 border-b border-border/60 bg-background"
      >
        {/* Left: world identity + tab switcher */}
        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
          {/* World dot */}
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: dotColor }}
          />

          {/* World name */}
          <span
            className="text-sm font-medium text-foreground truncate max-w-[180px]"
            title={world.name}
          >
            {world.name}
          </span>

          {/* Separator */}
          <span className="hidden md:inline text-border/60 text-xs shrink-0 mx-1">·</span>

          {/* Tab switcher: en móvil, segunda fila a ancho completo */}
          <div className="grid grid-cols-4 basis-full md:basis-auto md:flex items-center gap-0 shrink-0 [&>button]:min-h-10 md:[&>button]:min-h-0">
            <button
              onClick={() => setGraphView('causal')}
              className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
                graphView === 'causal'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Mundo
            </button>
            <button
              onClick={() => setGraphView('locations')}
              className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
                graphView === 'locations'
                  ? 'bg-entity-location/10 text-entity-location'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Lugares
            </button>
            <button
              onClick={() => setGraphView('characters')}
              className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
                graphView === 'characters'
                  ? 'bg-[#f97316]/10 text-[#c2410c]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Personajes
            </button>
            <button
              onClick={() => setGraphView('stories')}
              className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
                graphView === 'stories'
                  ? 'bg-[#06b6d4]/10 text-[#0e7490]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Historias
            </button>
          </div>
        </div>

        {/* Right: ··· menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center justify-center w-8 h-8 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
              aria-label="Más opciones"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          {/* Solo borrar (2026-10-31): biblia, exportar y editar quedaron desfasados. */}
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={() => setShowConfirmDelete(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              {t('world.detail.deleteButton')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Full-viewport graph ───────────────────────────────────────── */}
      <div className="overflow-hidden flex-1 min-h-0">
        <div className="relative h-full">
          {/* Causal canvas */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: graphView === 'causal' ? 'block' : 'none',
            }}
          >
            <div className="relative h-full">
              <CausalTreeCanvas
                nodes={graph.nodes}
                worldId={Number(id)}
                selectedNode={graph.selectedNode}
                onSelectNode={graph.selectNode}
                onAddNode={handleAddNode}
                onUpdateNode={handleUpdateNode}
                isExpanding={isExpanding}
                chatHistory={graph.chatHistory}
                chatLoading={graph.chatLoading}
                onSendMessage={(text) => graph.sendChatMessage(Number(id), text)}
                onExpand={async () => {
                  setIsExpanding(true)
                  try { await graph.expandNode(Number(id), graph.selectedNode!.id) }
                  finally { setIsExpanding(false) }
                }}
                onDeleteSubtree={() => graph.removeSubtree(Number(id), graph.selectedNode!.id)}
                onDeleteConfirmed={() => graph.deleteConfirmed(Number(id), graph.selectedNode!.id)}
              />
              {graph.ghostCandidates.length > 0 && graph.ghostParentId && (
                <GhostCandidates
                  candidates={graph.ghostCandidates}
                  parentLabel={graph.nodes.find(n => n.id === graph.ghostParentId)?.label ?? ''}
                  onConfirm={c => graph.confirmCandidate(Number(id), graph.ghostParentId!, c)}
                  onDismiss={graph.dismissGhosts}
                />
              )}
            </div>
          </div>

          {/* Lugares como fichas. El lienzo del mapa (terreno, facciones,
              conexiones) queda aparcado: nada de eso llegaba a la escena. */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: graphView === 'locations' ? 'block' : 'none',
            }}
          >
            <PlacesPanel
              places={locationNodes}
              routes={locationEdges}
              // Un camino vale en los dos sentidos; tipo y esfuerzo quedan por
              // defecto: lo que cuenta es a cuánto está, en palabras.
              onConnect={(a, b, distance) => addEdge({
                world_id: Number(id), source_node_id: a, target_node_id: b,
                edge_type: 'road', effort: 'moderate', dramatic_charge: 'medium',
                bidirectional: true, note: distance,
              })}
              onSetDistance={(route, distance) => editEdge(route.id, {
                edge_type: route.edge_type, effort: route.effort, dramatic_charge: route.dramatic_charge,
                bidirectional: route.bidirectional, note: distance,
              })}
              onDisconnect={removeEdge}
              onCreate={name => addLocationNode({
                world_id: Number(id),
                parent_id: null,
                name,
                node_type: 'settlement',
                description: '',
                properties: {},
                canvas_x: 0,
                canvas_y: 0,
              })}
              // Solo lo que cambió: enviar properties: {} a ciegas borraba datos.
              onUpdate={editLocationNode}
              onDelete={removeNode}
              onSuggest={generateLocations}
              suggesting={locationGenerating}
              suggestingProgress={locationGeneratingProgress}
            />
          </div>

          {/* Characters view */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: graphView === 'characters' ? 'block' : 'none',
            }}
          >
            <CharacterPanel
              worldId={Number(id)}
              worldPremise={worldDetail?.summary || world?.premise || ''}
              characterBriefs={worldDetail?.characters ?? []}
              onCharacterListChanged={refreshWorldDetail}
            />
          </div>

          {/* Stories view */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: graphView === 'stories' ? 'block' : 'none',
            }}
          >
            <StoryPanel
              worldId={Number(id)}
              stories={worldDetail?.stories ?? []}
              characters={worldDetail?.characters ?? []}
              onStoryListChanged={refreshWorldDetail}
            />
          </div>
        </div>
      </div>

    </div>
  )
}

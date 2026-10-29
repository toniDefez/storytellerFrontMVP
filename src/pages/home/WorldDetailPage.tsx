import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getWorldById, deleteWorld, getWorldDetail } from '../../services/api'
import type { World, WorldNode, WorldDetail } from '../../services/api'
import type { NodeFormInput } from '@/components/world-graph/NodeFormDialog'
import { useWorldGraph } from '@/hooks/useWorldGraph'
import ConfirmModal from '../../components/ConfirmModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { MoreHorizontal, Trash2, Pencil, BookOpen, Download } from 'lucide-react'
import { CausalTreeCanvas } from '@/components/world-graph/CausalTreeCanvas'
import { GhostCandidates } from '@/components/world-graph/GhostCandidates'
import { PlacesPanel } from '@/components/places/PlacesPanel'
import { useLocationGraph } from '@/hooks/useLocationGraph'
import { toast } from 'sonner'
import { CharacterPanel } from '@/components/character-panel/CharacterPanel'
import { StoryPanel } from '@/components/story-setup/StoryPanel'
import { exportWorld } from '../../services/worldExport'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
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
  const [exporting, setExporting] = useState(false)
  const [isExpanding, setIsExpanding] = useState(false)
  const [graphView, setGraphView] = useState<'causal' | 'locations' | 'characters' | 'stories'>('causal')
  const [worldDetail, setWorldDetail] = useState<WorldDetail | null>(null)
  const graph = useWorldGraph()

  const refreshWorldDetail = useCallback(() => {
    const worldId = Number(id)
    if (!id || Number.isNaN(worldId)) return
    getWorldDetail(worldId).then(setWorldDetail).catch(notifyError('No se pudo cargar el resumen del mundo'))
  }, [id])

  const {
    nodes: locationNodes,
    generating: locationGenerating,
    generatingProgress: locationGeneratingProgress,
    error: locationError,
    loadGraph: loadLocationGraph, generate: generateLocations,
    addNode: addLocationNode, editNode: editLocationNode, removeNode,
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

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportWorld(Number(id))
    } catch {
      toast.error(t('importExport.exportError'))
    } finally {
      setExporting(false)
    }
  }

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
    <div>
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
        className="flex items-center gap-0 px-4 border-b border-border/60 bg-background"
        style={{ height: 44 }}
      >
        {/* Left: world identity + tab switcher */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
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
          <span className="text-border/60 text-xs shrink-0 mx-1">·</span>

          {/* Tab switcher */}
          <div className="flex items-center gap-0 shrink-0">
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
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link to={`/worlds/${id}/bible`} className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                {t('bible.viewBible')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport} disabled={exporting}>
              <Download className="w-3.5 h-3.5 mr-2" />
              {exporting ? t('importExport.exporting') : t('importExport.exportButton')}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/worlds/${id}/edit`} className="flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5" />
                {t('world.detail.editButton')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
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
      <div
        className="overflow-hidden"
        style={{ height: 'calc(100vh - 44px)' }}
      >
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

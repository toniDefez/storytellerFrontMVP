import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getWorldById, deleteWorld, getWorldDetail, updateWorld } from '../../services/api'
import type { World, WorldDetail, WorldInput } from '../../services/api'
import ConfirmModal from '../../components/ConfirmModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useUrlParam } from '@/hooks/useUrlParam'
import { WorldPanel } from '@/components/world/WorldPanel'
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

type Tab = 'world' | 'locations' | 'characters' | 'stories'

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
  // La pestaña vive en la URL: «atrás» vuelve a la pestaña anterior, no saca del mundo.
  const [tabParam, setTabParam] = useUrlParam('tab')
  const tab = (tabParam ?? 'world') as Tab
  const setTab = (v: Tab) =>
    setTabParam(v === 'world' ? null : v, { clear: ['place', 'character', 'story', 'scene', 'read'] })
  const [worldDetail, setWorldDetail] = useState<WorldDetail | null>(null)

  // El mundo se vuelve a leer con el resumen: `locked` cambia en cuanto una
  // historia tiene escenas, y eso pasa sin recargar la página.
  const refreshWorldDetail = useCallback(() => {
    const worldId = Number(id)
    if (!id || Number.isNaN(worldId)) return
    getWorldDetail(worldId).then(setWorldDetail).catch(notifyError('No se pudo cargar el resumen del mundo'))
    getWorldById(worldId).then(setWorld).catch(() => {})
  }, [id])

  const {
    nodes: locationNodes, edges: locationEdges,
    error: locationError,
    loadGraph: loadLocationGraph,
    addNode: addLocationNode, editNode: editLocationNode, removeNode,
    addEdge, editEdge, removeEdge,
  } = useLocationGraph(Number(id))

  useEffect(() => {
    if (locationError) toast.error(`Localizaciones: ${locationError}`)
  }, [locationError])

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

    Promise.all([getWorldById(worldId), getWorldDetail(worldId)])
      .then(([w, detail]) => {
        setWorld(w)
        setWorldDetail(detail)
        document.title = `${w.name} — StoryTeller`
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, t])

  useEffect(() => {
    if (id) loadLocationGraph()
  }, [id, loadLocationGraph])

  // Al entrar en Lugares, el candado se lee de nuevo: el autor puede venir de
  // crear una historia y su primera escena en esta misma página.
  useEffect(() => {
    if (tab === 'locations' && id) getWorldById(Number(id)).then(setWorld).catch(() => {})
  }, [tab, id])

  const handleSaveWorld = async (input: WorldInput) => {
    const updated = await updateWorld(Number(id), input)
    setWorld(updated)
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
  const tabClass = (active: boolean, on: string) =>
    `text-xs font-medium px-3 py-1 rounded-sm transition-colors ${active ? on : 'text-muted-foreground hover:text-foreground hover:bg-accent'}`

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
      <div className="flex flex-wrap items-center gap-y-1 px-3 md:px-4 py-1.5 md:py-0 md:h-11 shrink-0 border-b border-border/60 bg-background">
        <div className="flex flex-wrap items-center gap-2 min-w-0 flex-1">
          <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dotColor }} />
          <span className="text-sm font-medium text-foreground truncate max-w-[180px]" title={world.name}>
            {world.name}
          </span>
          <span className="hidden md:inline text-border/60 text-xs shrink-0 mx-1">·</span>

          {/* Tab switcher: en móvil, segunda fila a ancho completo */}
          <div className="grid grid-cols-4 basis-full md:basis-auto md:flex items-center gap-0 shrink-0 [&>button]:min-h-10 md:[&>button]:min-h-0">
            <button onClick={() => setTab('world')} className={tabClass(tab === 'world', 'bg-primary/10 text-primary')}>
              Mundo
            </button>
            <button onClick={() => setTab('locations')} className={tabClass(tab === 'locations', 'bg-entity-location/10 text-entity-location')}>
              Lugares
            </button>
            <button onClick={() => setTab('characters')} className={tabClass(tab === 'characters', 'bg-[#f97316]/10 text-[#c2410c]')}>
              Personajes
            </button>
            <button onClick={() => setTab('stories')} className={tabClass(tab === 'stories', 'bg-[#06b6d4]/10 text-[#0e7490]')}>
              Historias
            </button>
          </div>
        </div>

        {/* Right: ··· menu (solo escritorio; en el móvil borrar está al final de la pestaña Mundo) */}
        <div className="hidden md:block">
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
      </div>

      <div className="overflow-hidden flex-1 min-h-0">
        <div className="relative h-full">
          {/* Mundo: la premisa y las tres líneas (escena 0). */}
          <div style={{ position: 'absolute', inset: 0, display: tab === 'world' ? 'block' : 'none' }}>
            <WorldPanel world={world} onSave={handleSaveWorld} onDeleteWorld={() => setShowConfirmDelete(true)} />
          </div>

          {/* Lugares como fichas. */}
          <div style={{ position: 'absolute', inset: 0, display: tab === 'locations' ? 'block' : 'none' }}>
            <PlacesPanel
              worldId={Number(id)}
              locked={world.locked}
              hasStories={(worldDetail?.stories?.length ?? 0) > 0}
              onStartStory={() => setTab('stories')}
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
            />
          </div>

          <div style={{ position: 'absolute', inset: 0, display: tab === 'characters' ? 'block' : 'none' }}>
            <CharacterPanel
              worldId={Number(id)}
              worldPremise={worldDetail?.summary || world?.premise || ''}
              characterBriefs={worldDetail?.characters ?? []}
              onCharacterListChanged={refreshWorldDetail}
            />
          </div>

          <div style={{ position: 'absolute', inset: 0, display: tab === 'stories' ? 'block' : 'none' }}>
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

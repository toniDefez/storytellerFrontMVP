import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getWorldById, deleteWorld } from '../../services/api'
import type { World, WorldNode } from '../../services/api'
import type { NodeFormInput } from '@/components/world-graph/NodeFormDialog'
import { useWorldGraph } from '@/hooks/useWorldGraph'
import ConfirmModal from '../../components/ConfirmModal'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { Plus, Users, Clapperboard, Trash2, Pencil, BookOpen, Download } from 'lucide-react'
import { CausalTreeCanvas } from '@/components/world-graph/CausalTreeCanvas'
import { GhostCandidates } from '@/components/world-graph/GhostCandidates'
import { LocationGraphCanvas } from '@/components/world-graph/LocationGraphCanvas'
import { EdgeFormDialog } from '@/components/world-graph/EdgeFormDialog'
import { useLocationGraph } from '@/hooks/useLocationGraph'
import { toast } from 'sonner'
import { exportWorld } from '../../services/worldExport'

const DEFAULT_GRADIENT = 'from-violet-600 to-purple-800'

function inferGradient(world: World): string {
  const text = (world.premise || world.description || '').toLowerCase()
  if (/ceniza|volcan|fuego/.test(text)) return 'from-red-600 to-orange-700'
  if (/hielo|nieve|glaciar/.test(text)) return 'from-cyan-500 to-blue-700'
  if (/agua|oceano|lluvia/.test(text)) return 'from-blue-500 to-indigo-700'
  if (/bosque|selva|verde/.test(text)) return 'from-emerald-500 to-teal-700'
  if (/desierto|arena|sol|gusano/.test(text)) return 'from-amber-500 to-orange-700'
  if (/oscuridad|sombra/.test(text)) return 'from-slate-600 to-slate-900'
  if (/magia|hechizo/.test(text)) return 'from-violet-500 to-purple-800'
  return DEFAULT_GRADIENT
}

interface WorldWithRelations extends World {
  characters?: Array<{
    id: number
    name: string
    role: string
    personality: string
    goals: string[]
  }>
  scenes?: Array<{
    id: number
    title: string
    location: string
    time: string
    tone: string
    context: string
    world_id: number
    position?: number
  }>
}

export default function WorldDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [world, setWorld] = useState<World | null>(null)
  const [characters, setCharacters] = useState<WorldWithRelations['characters']>([])
  const [scenes, setScenes] = useState<NonNullable<WorldWithRelations['scenes']>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [isExpanding, setIsExpanding] = useState(false)
  const [graphView, setGraphView] = useState<'causal' | 'locations'>('causal')
  const [pendingConn, setPendingConn] = useState<{ src: number; tgt: number } | null>(null)
  const [confirmRegen, setConfirmRegen] = useState(false)
  const graph = useWorldGraph()

  const {
    nodes: locationNodes, edges: locationEdges,
    selected: locationSelected, setSelected: setLocationSelected,
    generating: locationGenerating,
    loadGraph: loadLocationGraph, generate: generateLocations,
    moveNode, addEdge, editNode: editLocationNode, removeNode,
    editEdge, removeEdge,
  } = useLocationGraph(Number(id))

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
    ])
      .then(([w]) => {
        setWorld(w)
        document.title = `${w.name} — StoryTeller`
        const raw = w as unknown as Record<string, unknown>
        setCharacters(Array.isArray(raw.characters) ? raw.characters as WorldWithRelations['characters'] : [])
        setScenes(Array.isArray(raw.scenes) ? raw.scenes as NonNullable<WorldWithRelations['scenes']> : [])
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

  const sortedScenes = [...(scenes || [])].sort((a, b) => {
    const posA = a.position ?? 0
    const posB = b.position ?? 0
    if (posA !== posB) return posA - posB
    return a.id - b.id
  })
  const gradient = inferGradient(world)

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

      {/* ── Compact header ────────────────────────────────────────────── */}
      <div className="mb-4">
        <PageBreadcrumb items={[{ label: t('nav.worlds'), href: '/worlds' }, { label: world.name }]} />
        <div className={`bg-gradient-to-r ${gradient} rounded-[4px] px-6 py-5 mt-3 relative overflow-hidden`}>
          <div className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
          {/* Actions */}
          <div className="absolute top-3 right-3 flex gap-1">
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/15 h-8 text-xs" asChild>
              <Link to={`/worlds/${id}/bible`}>
                <BookOpen className="h-3.5 w-3.5 mr-1" />
                {t('bible.viewBible')}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/15 h-8 text-xs" onClick={handleExport} disabled={exporting}>
              <Download className="h-3.5 w-3.5 mr-1" />
              {exporting ? t('importExport.exporting') : t('importExport.exportButton')}
            </Button>
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/15 h-8 text-xs" asChild>
              <Link to={`/worlds/${id}/edit`}>
                <Pencil className="h-3.5 w-3.5 mr-1" />
                {t('world.detail.editButton')}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-white/70 hover:text-white hover:bg-white/15 hover:text-red-300 h-8 text-xs" onClick={() => setShowConfirmDelete(true)}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {t('world.detail.deleteButton')}
            </Button>
          </div>
          <h1
            className="text-[2rem] font-normal tracking-[-0.03em] leading-tight text-white pr-64"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {world.name}
          </h1>
          {world.premise && (
            <p
              className="text-white/50 italic mt-1 text-sm leading-relaxed line-clamp-1 pr-64"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              "{world.premise}"
            </p>
          )}
        </div>
      </div>

      {/* ── Full-bleed graph ──────────────────────────────────────────── */}
      <div
        className="-mx-6 md:-mx-8 overflow-hidden"
        style={{
          borderTop: '1px solid hsl(35 12% 86% / 0.7)',
          borderBottom: '1px solid hsl(35 12% 86% / 0.7)',
          height: 'calc(100vh - 170px)',
        }}
      >
        <div className="flex flex-col h-full">
          {/* Tab switcher */}
          <div className="flex border-b border-border/50 bg-background px-4 gap-0 shrink-0">
            <button
              onClick={() => setGraphView('causal')}
              className={`text-xs font-medium px-4 py-2.5 border-b-2 transition-colors ${
                graphView === 'causal'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Grafo Causal
            </button>
            <button
              onClick={() => setGraphView('locations')}
              className={`text-xs font-medium px-4 py-2.5 border-b-2 transition-colors ${
                graphView === 'locations'
                  ? 'border-[#14b8a6] text-[#14b8a6]'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Localizaciones
            </button>
          </div>

          {/* Both canvases mounted simultaneously */}
          <div className="flex-1 relative overflow-hidden">
            <div
              style={{
                position: 'absolute', inset: 0,
                visibility: graphView === 'causal' ? 'visible' : 'hidden',
                pointerEvents: graphView === 'causal' ? 'auto' : 'none',
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

            <div
              style={{
                position: 'absolute', inset: 0,
                visibility: graphView === 'locations' ? 'visible' : 'hidden',
                pointerEvents: graphView === 'locations' ? 'auto' : 'none',
              }}
            >
              <LocationGraphCanvas
                worldId={Number(id)}
                locationNodes={locationNodes}
                locationEdges={locationEdges}
                selected={locationSelected}
                onSelectNode={node => setLocationSelected(node ? { type: 'node', item: node } : null)}
                onSelectEdge={edge => setLocationSelected(edge ? { type: 'edge', item: edge } : null)}
                onMoveNode={moveNode}
                onConnect={(src, tgt) => setPendingConn({ src, tgt })}
                onEditNode={node => editLocationNode(node.id, { name: node.name, node_type: node.node_type, description: node.description, properties: node.properties })}
                onDeleteNode={removeNode}
                onUpdateEdge={editEdge}
                onDeleteEdge={removeEdge}
                onGenerate={() => setConfirmRegen(true)}
                generating={locationGenerating}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Content below graph ───────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto mt-8 space-y-8">

      {/* ── Section divider ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4 py-2 select-none">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <span
          className="tracking-[0.5em] text-xs"
          style={{ fontFamily: 'var(--font-display)', color: 'rgba(27,28,26,0.25)' }}
        >
          ✦ ✦ ✦
        </span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>

      {/* ── Characters Section ────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-entity-character flex items-center gap-2.5">
            <Users className="h-5 w-5" />
            {t('world.detail.charactersSection')}
            <span className="text-sm font-normal text-muted-foreground">
              ({characters?.length || 0})
            </span>
          </h2>
          <Button variant="secondary" size="sm" asChild>
            <Link to={`/worlds/${id}/characters/create`}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('world.detail.createCharacterButton')}
            </Link>
          </Button>
        </div>

        {!characters || characters.length === 0 ? (
          <div className="rounded-[4px] bg-[#f7ece6]/50 shadow-ambient px-8 py-12 text-center">
            <p className="font-display italic text-lg text-[#877270] mb-2">
              {t('world.detail.noCharactersTitle')}
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {t('world.detail.noCharactersDesc')}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/worlds/${id}/characters/create`}>
                  {t('world.detail.createCharacterManual')}
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to={`/worlds/${id}/characters/create`}>
                  {t('world.detail.createCharacterAi')}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {characters.map(c => (
              <Link key={c.id} to={`/worlds/${id}/characters/${c.id}`} className="block">
                <div className="rounded-[4px] bg-[#f7ece6] shadow-ambient p-4 h-full transition-all hover:shadow-ambient-hover">
                  <h3 className="font-display font-medium text-[#7a2d18]">{c.name}</h3>
                  {c.role && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-ui uppercase tracking-[0.06em] bg-[rgba(158,61,34,0.1)] text-[#9e3d22]">
                      {c.role}
                    </span>
                  )}
                  {c.personality && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2 font-display italic">
                      {c.personality}
                    </p>
                  )}
                  {c.goals && c.goals.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {c.goals.slice(0, 2).map((g: string, i: number) => (
                        <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui bg-[rgba(27,28,26,0.05)] text-[#6b6860]">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Scenes Section ────────────────────────────────────────────── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-entity-scene flex items-center gap-2.5">
            <Clapperboard className="h-5 w-5" />
            {t('world.detail.scenesSection')}
            <span className="text-sm font-normal text-muted-foreground">
              ({sortedScenes?.length || 0})
            </span>
          </h2>
          <Button variant="secondary" size="sm" asChild>
            <Link to={`/worlds/${id}/scenes/create`}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('world.detail.createSceneButton')}
            </Link>
          </Button>
        </div>

        {!sortedScenes || sortedScenes.length === 0 ? (
          <div className="rounded-[4px] bg-[#e3f3f3]/50 shadow-ambient px-8 py-12 text-center">
            <p className="font-display italic text-lg text-[#3d7a7a] mb-2">
              {t('world.detail.noScenesTitle')}
            </p>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              {t('world.detail.noScenesDesc')}
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" asChild>
                <Link to={`/worlds/${id}/scenes/create`}>
                  {t('world.detail.createSceneManual')}
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link to={`/worlds/${id}/scenes/create`}>
                  {t('world.detail.createSceneAi')}
                </Link>
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sortedScenes.map((s, idx) => {
              const pos = s.position ?? idx + 1
              return (
                <Link key={s.id} to={`/worlds/${id}/scenes/${s.id}`} className="block">
                  <div className="rounded-[4px] bg-[#e3f3f3] shadow-ambient p-4 flex items-center gap-4 transition-all hover:shadow-ambient-hover">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-entity-scene/10 flex items-center justify-center">
                      <span className="text-sm font-bold text-[#155555]">{pos}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-medium text-[#155555]">{s.title}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {s.location && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui bg-[rgba(21,85,85,0.1)] text-[#155555]">
                            {s.location}
                          </span>
                        )}
                        {s.time && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui bg-[rgba(21,85,85,0.1)] text-[#155555]">
                            {s.time}
                          </span>
                        )}
                        {s.tone && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui bg-[rgba(21,85,85,0.1)] text-[#155555]">
                            {s.tone}
                          </span>
                        )}
                      </div>
                      {s.context && (
                        <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                          {s.context}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      </div>{/* end max-w-5xl */}

      {/* EdgeFormDialog */}
      <EdgeFormDialog
        open={pendingConn !== null}
        onConfirm={(edgeType, effort, bidirectional) => {
          if (pendingConn && id) {
            addEdge({
              world_id: Number(id),
              source_node_id: pendingConn.src,
              target_node_id: pendingConn.tgt,
              edge_type: edgeType,
              effort,
              bidirectional,
              note: '',
            })
          }
          setPendingConn(null)
        }}
        onCancel={() => setPendingConn(null)}
      />

      {/* Regenerate confirmation dialog */}
      {confirmRegen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-semibold text-base mb-2">¿Regenerar el mapa?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Se eliminará el mapa actual y se generará uno nuevo desde el grafo causal.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmRegen(false)}
                className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setConfirmRegen(false); generateLocations() }}
                className="text-sm px-3 py-1.5 rounded-lg bg-[#14b8a6] text-white hover:bg-[#0f766e]"
              >
                Regenerar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

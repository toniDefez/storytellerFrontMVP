import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getWorldById, deleteWorld } from '../../services/api'
import type { World } from '../../services/api'
import { useWorldGraph } from '@/hooks/useWorldGraph'
import ConfirmModal from '../../components/ConfirmModal'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { Plus, Users, Clapperboard, Trash2, Pencil, BookOpen, Download } from 'lucide-react'
import { CausalTreeCanvas } from '@/components/world-graph/CausalTreeCanvas'
import { GhostCandidates } from '@/components/world-graph/GhostCandidates'
import { GraphSidePanel } from '@/components/world-graph/GraphSidePanel'
import { PremiseBar } from '@/components/world-graph/PremiseBar'
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
  const graph = useWorldGraph()

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
    <div className="max-w-4xl mx-auto space-y-8 mt-8">
      <PageBreadcrumb items={[{ label: t('nav.worlds'), href: '/worlds' }, { label: world.name }]} />

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

      {/* ── Hero: gradient standalone, no card body ───────────────────── */}
      <div className={`bg-gradient-to-br ${gradient} rounded-xl px-8 py-14 relative overflow-hidden`}>
        {/* Actions */}
        <div className="absolute top-5 right-5 flex gap-1.5">
          <Button variant="ghost" size="sm" className="text-white/75 hover:text-white hover:bg-white/15" asChild>
            <Link to={`/worlds/${id}/bible`}>
              <BookOpen className="h-4 w-4 mr-1.5" />
              {t('bible.viewBible')}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/75 hover:text-white hover:bg-white/15"
            onClick={handleExport}
            disabled={exporting}
          >
            <Download className="h-4 w-4 mr-1.5" />
            {exporting ? t('importExport.exporting') : t('importExport.exportButton')}
          </Button>
          <Button variant="ghost" size="sm" className="text-white/75 hover:text-white hover:bg-white/15" asChild>
            <Link to={`/worlds/${id}/edit`}>
              <Pencil className="h-4 w-4 mr-1.5" />
              {t('world.detail.editButton')}
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-white/75 hover:text-white hover:bg-white/15 hover:text-red-300"
            onClick={() => setShowConfirmDelete(true)}
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            {t('world.detail.deleteButton')}
          </Button>
        </div>

        {/* World name */}
        <h1
          className="text-[3.5rem] font-normal tracking-[-0.03em] leading-tight text-white"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {world.name}
        </h1>

        {/* Premise beneath name */}
        {world.premise && (
          <p
            className="text-white/55 italic mt-3 text-[15px] leading-relaxed max-w-2xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            "{world.premise}"
          </p>
        )}

        {/* Subtle vignette at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-b from-transparent to-black/20 pointer-events-none" />
      </div>

      {/* ── Description prose: directly on page, no wrapper ───────────── */}
      {world.description && (
        <p className="prose-drop-cap prose-literary overflow-hidden max-w-3xl">
          {world.description}
        </p>
      )}

      {/* ── Graph canvas: standalone section, no nesting ──────────────── */}
      <div
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid hsl(35 12% 86% / 0.7)' }}
      >
        <PremiseBar premise={world.premise} />
        <div className="flex" style={{ height: 'max(calc(100vh - 360px), 520px)' }}>
          <div className="flex-1 relative min-w-0">
            <CausalTreeCanvas
              nodes={graph.nodes}
              worldId={Number(id) || null}
              selectedNodeId={graph.selectedNode?.id}
              onSelectNode={graph.selectNode}
              onAddNode={async () => {}}
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
          <GraphSidePanel
            selectedNode={graph.selectedNode}
            isExpanding={isExpanding}
            chatHistory={graph.chatHistory}
            chatLoading={graph.chatLoading}
            onSendMessage={(text) => graph.sendChatMessage(Number(id), text)}
            onClose={() => graph.selectNode(null)}
            onExpand={async () => {
              setIsExpanding(true)
              try { await graph.expandNode(Number(id), graph.selectedNode!.id) }
              finally { setIsExpanding(false) }
            }}
            onDeleteSubtree={() => graph.removeSubtree(Number(id), graph.selectedNode!.id)}
            onDeleteConfirmed={() => graph.deleteConfirmed(Number(id), graph.selectedNode!.id)}
          />
        </div>
      </div>

      {/* ── Section divider ───────────────────────────────────────────── */}
      <div className="flex items-center gap-4 py-4 select-none">
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
    </div>
  )
}

import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getWorldDetail, deleteWorld } from '../../services/api'
import type { WorldDetail, World } from '../../services/api'
import ConfirmModal from '../../components/ConfirmModal'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { Plus, Users, Clapperboard, Trash2, Pencil } from 'lucide-react'
import { toast } from 'sonner'

const DEFAULT_GRADIENT = 'from-violet-500 to-purple-700'

function inferGradient(world: World): string {
  const text = (world.core_axis || world.description || '').toLowerCase()
  if (/ceniza|volcan|fuego/.test(text)) return 'from-red-500 to-orange-600'
  if (/hielo|nieve|glaciar/.test(text)) return 'from-cyan-400 to-blue-600'
  if (/agua|oceano|lluvia/.test(text)) return 'from-blue-400 to-indigo-600'
  if (/bosque|selva|verde/.test(text)) return 'from-emerald-400 to-teal-600'
  if (/desierto|arena|sol/.test(text)) return 'from-amber-400 to-orange-600'
  if (/oscuridad|sombra/.test(text)) return 'from-slate-600 to-gray-800'
  if (/magia|hechizo/.test(text)) return 'from-violet-500 to-purple-700'
  return DEFAULT_GRADIENT
}

export default function WorldDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<WorldDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  useEffect(() => {
    document.title = `${t('pageTitle.worldDetail', { name: detail?.world?.name ?? '' })} — StoryTeller`
  }, [t, i18n.language, detail?.world?.name])

  useEffect(() => {
    const worldId = Number(id)
    if (!id || Number.isNaN(worldId)) {
      setError(t('world.detail.invalidId'))
      setLoading(false)
      return
    }

    getWorldDetail(worldId)
      .then(data => {
        if (!data || typeof data !== 'object') {
          throw new Error(t('world.detail.notFound'))
        }

        const raw = data as unknown as Record<string, unknown>
        if (!raw.name) {
          throw new Error(t('world.detail.notFound'))
        }

        // world-detail/get returns `summary` instead of `description`
        const normalizedWorld: World = {
          id: Number(raw.id ?? worldId),
          name: String(raw.name ?? ''),
          factions: Array.isArray(raw.factions) ? (raw.factions as string[]) : [],
          description: String(raw.summary ?? raw.description ?? ''),
          core_axis: String(raw.core_axis ?? ''),
          environment: String(raw.environment ?? ''),
          subsistence: String(raw.subsistence ?? ''),
          organization: String(raw.organization ?? ''),
          tensions: String(raw.tensions ?? ''),
          tone: String(raw.tone ?? ''),
        }

        setDetail({
          world: normalizedWorld,
          characters: Array.isArray(raw.characters) ? raw.characters : [],
          scenes: Array.isArray(raw.scenes) ? raw.scenes : [],
        })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, t])

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
  if (!detail?.world) {
    return (
      <div className="flex justify-center items-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{t('world.detail.notFound')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { world, characters, scenes } = detail
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

      {/* ── Hero Section ── */}
      <div className="rounded-xl overflow-hidden shadow-lg">
        <div className={`bg-gradient-to-br ${gradient} px-8 py-10 relative`}>
          <div className="absolute top-4 right-4 flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/15"
              asChild
            >
              <Link to={`/worlds/${id}/edit`}>
                <Pencil className="h-4 w-4 mr-1.5" />
                {t('world.detail.editButton')}
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/15"
              onClick={() => setShowConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4 mr-1.5" />
              {t('world.detail.deleteButton')}
            </Button>
          </div>
          <h1 className="text-4xl font-bold text-white font-display leading-tight">
            {world.name}
          </h1>
          {world.description && (
            <p className="mt-3 text-white/80 text-lg max-w-2xl leading-relaxed">
              {world.description}
            </p>
          )}
        </div>

        <div className="bg-card border border-t-0 border-border rounded-b-xl px-8 py-5 space-y-4">
          {world.factions && world.factions.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">{t('world.detail.factionsInline')}</span>
              {world.factions.map(f => (
                <Badge key={f} variant="outline" className="text-sm">
                  {f}
                </Badge>
              ))}
            </div>
          )}

          {/* Sanderson layers */}
          {world.core_axis && (
            <div className="mt-6">
              <p className="text-sm text-muted-foreground italic mb-3">
                "{world.core_axis}"
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {([
                  { key: 'environment' as const, label: t('world.create.layerEnvironment'), color: 'emerald' },
                  { key: 'subsistence' as const, label: t('world.create.layerSubsistence'), color: 'amber' },
                  { key: 'organization' as const, label: t('world.create.layerOrganization'), color: 'blue' },
                  { key: 'tensions' as const, label: t('world.create.layerTensions'), color: 'rose' },
                  { key: 'tone' as const, label: t('world.create.layerTone'), color: 'violet' },
                ]).filter(l => world[l.key]).map(layer => (
                  <div key={layer.key} className={`rounded-xl bg-white border border-gray-100 p-4 border-l-4 border-l-${layer.color}-500`}>
                    <h4 className={`text-xs font-semibold uppercase tracking-widest text-${layer.color}-600 mb-1`}>
                      {layer.label}
                    </h4>
                    <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                      {world[layer.key]}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Characters Section ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-entity-character flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('world.detail.charactersSection')}
            <span className="text-base font-normal text-muted-foreground">
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
          <Card className="border-entity-character/20 bg-entity-character-light/40">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-entity-character/10 p-4 mb-4">
                <Users className="h-8 w-8 text-entity-character" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">
                {t('world.detail.noCharactersTitle')}
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {t('world.detail.noCharactersDesc')}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/worlds/${id}/characters/create`}>
                    {t('world.detail.createCharacterManual')}
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link to={`/worlds/${id}/characters/create`}>
                    {t('world.detail.createCharacterAi')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {characters.map(c => (
              <Link
                key={c.id}
                to={`/worlds/${id}/characters/${c.id}`}
                className="block"
              >
                <Card className="border-l-4 border-l-entity-character hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-foreground">{c.name}</h3>
                    {c.role && (
                      <Badge className="mt-1.5 bg-entity-character/10 text-entity-character-muted border-entity-character/20 hover:bg-entity-character/15">
                        {c.role}
                      </Badge>
                    )}
                    {c.personality && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {c.personality}
                      </p>
                    )}
                    {c.goals && c.goals.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {c.goals.slice(0, 2).map((g: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {g}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Scenes Section ── */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-entity-scene flex items-center gap-2">
            <Clapperboard className="h-5 w-5" />
            {t('world.detail.scenesSection')}
            <span className="text-base font-normal text-muted-foreground">
              ({scenes?.length || 0})
            </span>
          </h2>
          <Button variant="secondary" size="sm" asChild>
            <Link to={`/worlds/${id}/scenes/create`}>
              <Plus className="h-4 w-4 mr-1.5" />
              {t('world.detail.createSceneButton')}
            </Link>
          </Button>
        </div>

        {!scenes || scenes.length === 0 ? (
          <Card className="border-entity-scene/20 bg-entity-scene-light/40">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-entity-scene/10 p-4 mb-4">
                <Clapperboard className="h-8 w-8 text-entity-scene" />
              </div>
              <p className="text-lg font-medium text-foreground mb-1">
                {t('world.detail.noScenesTitle')}
              </p>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                {t('world.detail.noScenesDesc')}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/worlds/${id}/scenes/create`}>
                    {t('world.detail.createSceneManual')}
                  </Link>
                </Button>
                <Button variant="secondary" size="sm" asChild>
                  <Link to={`/worlds/${id}/scenes/create`}>
                    {t('world.detail.createSceneAi')}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scenes.map(s => (
              <Link
                key={s.id}
                to={`/worlds/${id}/scenes/${s.id}`}
                className="block"
              >
                <Card className="border-l-4 border-l-entity-scene hover:shadow-md transition-shadow h-full">
                  <CardContent className="p-4">
                    <h3 className="font-bold text-foreground">{s.title}</h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {s.location && (
                        <Badge className="bg-entity-scene/10 text-entity-scene-muted border-entity-scene/20 hover:bg-entity-scene/15">
                          {s.location}
                        </Badge>
                      )}
                      {s.time && (
                        <Badge className="bg-entity-scene/10 text-entity-scene-muted border-entity-scene/20 hover:bg-entity-scene/15">
                          {s.time}
                        </Badge>
                      )}
                      {s.tone && (
                        <Badge className="bg-entity-scene/10 text-entity-scene-muted border-entity-scene/20 hover:bg-entity-scene/15">
                          {s.tone}
                        </Badge>
                      )}
                    </div>
                    {s.context && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {s.context}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

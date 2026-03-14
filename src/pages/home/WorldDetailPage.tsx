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
import { Plus, Users, Clapperboard, Trash2 } from 'lucide-react'

const CLIMATE_GRADIENT: Record<string, string> = {
  Artico:    'from-cyan-400 to-blue-600',
  Tropical:  'from-emerald-400 to-teal-600',
  Desertico: 'from-amber-400 to-orange-600',
  Volcanico: 'from-red-500 to-rose-700',
  Oceanico:  'from-blue-400 to-indigo-600',
  Montanoso: 'from-slate-400 to-stone-600',
  Toxico:    'from-lime-400 to-green-600',
  Templado:  'from-violet-400 to-purple-600',
}
const DEFAULT_GRADIENT = 'from-violet-500 to-purple-700'

export default function WorldDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<WorldDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

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

        // Current backend shape:
        // { id, name, era, climate, politics, culture, factions, summary, characters, scenes }
        const raw = data as unknown as Record<string, unknown>
        if (!raw.name) {
          throw new Error(t('world.detail.notFound'))
        }

        const normalizedWorld: World = {
          id: Number(raw.id ?? worldId),
          name: String(raw.name ?? ''),
          era: String(raw.era ?? ''),
          climate: String(raw.climate ?? ''),
          politics: String(raw.politics ?? ''),
          culture: String(raw.culture ?? ''),
          factions: Array.isArray(raw.factions) ? (raw.factions as string[]) : [],
          description: String(raw.summary ?? ''),
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
  const gradient = CLIMATE_GRADIENT[world.climate] ?? DEFAULT_GRADIENT

  const attributes = [
    { label: t('world.detail.eraAttr'), value: world.era },
    { label: t('world.detail.climateAttr'), value: world.climate },
    { label: t('world.detail.politicsAttr'), value: world.politics },
    { label: t('world.detail.cultureAttr'), value: world.culture },
  ].filter(a => a.value)

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
          <div className="absolute top-4 right-4">
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
          {attributes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attributes.map(a => (
                <Badge
                  key={a.label}
                  variant="secondary"
                  className="text-sm px-3 py-1"
                >
                  {a.label}: {a.value}
                </Badge>
              ))}
            </div>
          )}

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

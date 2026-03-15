import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  getSceneDetail,
  deleteScene,
  addCharacterToScene,
  generateEvents,
  getSceneNarrative,
  getWorldDetail,
} from '../../services/api'
import type { SceneDetail, Character, Event as StoryEvent } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'
import ConfirmModal from '../../components/ConfirmModal'
import { Button } from '@/components/ui/button'
import { Loader2, Pencil } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function SceneDetailPage() {
  const { worldId, sceneId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [detail, setDetail] = useState<SceneDetail | null>(null)
  const [worldCharacters, setWorldCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add character
  const [showAddChar, setShowAddChar] = useState(false)
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null)
  const [addingChar, setAddingChar] = useState(false)

  // Generate events
  const [eventDesc, setEventDesc] = useState('')
  const [numEvents, setNumEvents] = useState(1)
  const [generatingEvents, setGeneratingEvents] = useState(false)

  // Narrative
  const [narrative, setNarrative] = useState<string | null>(null)
  const [generatingNarrative, setGeneratingNarrative] = useState(false)

  const { hasInstallation, checked: installationChecked } = useInstallation()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  useEffect(() => {
    document.title = `${t('pageTitle.sceneDetail', { title: detail?.scene?.title ?? '' })} — StoryTeller`
  }, [t, i18n.language, detail?.scene?.title])

  useEffect(() => {
    if (!sceneId || !worldId) return
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, worldId])

  function loadData() {
    setLoading(true)
    Promise.all([
      getSceneDetail(Number(sceneId)),
      getWorldDetail(Number(worldId)),
    ])
      .then(([sceneDetail, worldDetail]) => {
        setDetail(sceneDetail)
        setWorldCharacters(worldDetail.characters || [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  const handleDelete = async () => {
    try {
      await deleteScene(Number(sceneId))
      toast.success('Escena eliminada correctamente.')
      navigate(`/worlds/${worldId}`)
    } catch {
      setError(t('scene.detail.deleteError'))
    }
  }

  const handleAddCharacter = async () => {
    if (!selectedCharId) return
    setAddingChar(true)
    try {
      await addCharacterToScene(Number(sceneId), selectedCharId)
      setShowAddChar(false)
      setSelectedCharId(null)
      toast.success('Personaje añadido a la escena.')
      loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('scene.detail.addCharacterError'))
    } finally {
      setAddingChar(false)
    }
  }

  const handleGenerateEvents = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detail) return
    setGeneratingEvents(true)
    setError('')
    try {
      const charIds = detail.characters?.map(c => c.id) || []
      const result = await generateEvents(Number(sceneId), charIds, eventDesc, numEvents)
      setDetail(prev => prev ? {
        ...prev,
        events: [...(prev.events || []), ...(result.events || [])],
      } : prev)
      setEventDesc('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('scene.detail.generateEventsError'))
    } finally {
      setGeneratingEvents(false)
    }
  }

  const handleGenerateNarrative = async () => {
    setGeneratingNarrative(true)
    setError('')
    try {
      const result = await getSceneNarrative(Number(sceneId))
      setNarrative(result.text)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('scene.detail.generateNarrativeError'))
    } finally {
      setGeneratingNarrative(false)
    }
  }

  if (loading) return <DetailSkeleton />
  if (error && !detail) return (
    <div className="flex justify-center items-center h-96">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  )
  if (!detail) return null

  const { scene, characters, events } = detail
  const sceneCharacterIds = new Set(characters?.map(c => c.id) || [])
  const availableCharacters = worldCharacters.filter(c => !sceneCharacterIds.has(c.id))
  const sortedEvents = [...(events || [])].sort((a, b) => a.position - b.position)

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-8">
      <PageBreadcrumb items={[{label: t('nav.worlds'), href: '/worlds'}, {label: t('nav.worlds'), href: '/worlds/' + worldId}, {label: scene.title}]} />

      <ConfirmModal
        open={showConfirmDelete}
        title={t('scene.detail.deleteTitle')}
        message={t('scene.detail.deleteMessage', { title: scene.title })}
        confirmText={t('scene.detail.deleteConfirm')}
        cancelText={t('common.cancel')}
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Scene Header */}
      <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-200 p-8 shadow-sm">
        <div className="flex justify-between items-start">
          <h2 className="font-[var(--font-display)] text-3xl font-bold text-slate-800">{scene.title}</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/worlds/${worldId}/scenes/${sceneId}/edit`}>
                <Pencil className="h-4 w-4 mr-1.5" />
                {t('scene.detail.editButton')}
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowConfirmDelete(true)}>{t('scene.detail.deleteButton')}</Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4 mb-4">
          <Badge className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-150">{scene.location}</Badge>
          <Badge className="bg-sky-100 text-sky-700 border-sky-200 hover:bg-sky-150">{scene.time}</Badge>
          <Badge className="bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-150">{scene.tone}</Badge>
        </div>
        <p className="text-slate-600 leading-relaxed">{scene.context}</p>
      </div>

      {/* Characters in Scene */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="font-[var(--font-display)] text-xl font-bold text-entity-character">
              {t('scene.detail.charactersSection', { count: characters?.length || 0 })}
            </h3>
            {availableCharacters.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setShowAddChar(!showAddChar)}>
                {t('scene.detail.addCharacterButton')}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showAddChar && (
            <div className="mb-4 p-4 bg-entity-character-light rounded-lg border border-orange-200 flex gap-3 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('scene.detail.selectCharacterLabel')}</label>
                <select
                  value={selectedCharId || ''}
                  onChange={e => setSelectedCharId(Number(e.target.value))}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">{t('scene.detail.selectCharacterPlaceholder')}</option>
                  {availableCharacters.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                  ))}
                </select>
              </div>
              <Button variant="secondary" size="sm" onClick={handleAddCharacter} disabled={!selectedCharId || addingChar}>
                {addingChar ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('scene.detail.addingCharacter')}</> : t('scene.detail.addCharacterConfirm')}
              </Button>
            </div>
          )}

          {!characters || characters.length === 0 ? (
            <p className="text-gray-500 italic">{t('scene.detail.noCharacters')}</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {characters.map(c => (
                <div key={c.id} className="bg-entity-character-light border border-orange-200 rounded-xl px-4 py-2">
                  <span className="font-bold text-slate-800">{c.name}</span>
                  <span className="text-entity-character-muted text-sm ml-2">({c.role})</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Events */}
      <Card>
        <CardHeader>
          <h3 className="font-[var(--font-display)] text-xl font-bold text-slate-800">
            {t('scene.detail.eventsSection', { count: sortedEvents.length })}
          </h3>
        </CardHeader>
        <CardContent>
          {sortedEvents.length === 0 ? (
            <p className="text-gray-500 italic mb-6">{t('scene.detail.noEvents')}</p>
          ) : (
            <div className="space-y-4 mb-6">
              {sortedEvents.map((ev: StoryEvent, idx: number) => (
                <div key={ev.id || idx} className="border-l-4 border-sky-500 pl-4 py-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-sky-100 text-sky-700 border-sky-200">#{idx + 1}</Badge>
                    {ev.spot && <Badge variant="outline">{ev.spot}</Badge>}
                  </div>
                  <p className="text-slate-700">{ev.action}</p>
                </div>
              ))}
            </div>
          )}

          {/* Generate Events Form */}
          {installationChecked && !hasInstallation && <NoInstallationBanner />}
          <form onSubmit={handleGenerateEvents} className="p-4 bg-sky-50/50 rounded-lg border border-sky-200">
            <h4 className="font-[var(--font-display)] font-semibold text-slate-700 mb-3">{t('scene.detail.generateEventsTitle')}</h4>
            <div className="mb-3">
              <Textarea
                value={eventDesc}
                onChange={e => setEventDesc(e.target.value)}
                className="min-h-[60px]"
                placeholder={t('scene.detail.generateEventsPlaceholder')}
                required
              />
            </div>
            <div className="flex gap-3 items-end">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('scene.detail.numEventsLabel')}</label>
                <Input type="number" min={1} max={5} value={numEvents} onChange={e => setNumEvents(Number(e.target.value))} className="w-20" />
              </div>
              <Button type="submit" size="lg" disabled={generatingEvents}>
                {generatingEvents ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('scene.detail.generatingEvents')}</> : t('scene.detail.generateEventsButton')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Narrative */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="font-[var(--font-display)] text-xl font-bold text-slate-800">{t('scene.detail.narrativeSection')}</h3>
            <Button variant="secondary" size="sm" onClick={handleGenerateNarrative} disabled={generatingNarrative}>
              {generatingNarrative ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('scene.detail.generatingNarrative')}</> : t('scene.detail.generateNarrativeButton')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {narrative ? (
            <div className="prose max-w-none bg-gradient-to-br from-slate-50 to-sky-50 p-6 rounded-xl border border-sky-200 whitespace-pre-wrap text-slate-800 leading-relaxed">
              {narrative}
            </div>
          ) : (
            <p className="text-gray-500 italic">{t('scene.detail.noNarrative')}</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getSceneById, updateScene } from '../../services/api'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog'
import { PillSelect } from '../../components/PillSelect'
import { FieldGroup } from '@/components/form/FieldGroup'
import { SectionDivider } from '@/components/form/SectionDivider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, Clapperboard } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { toast } from 'sonner'

interface SceneBaseline {
  title: string
  location: string
  time: string
  tone: string
  context: string
}

const TIME_VALUES = ['Amanecer', 'Manana', 'Mediodia', 'Tarde', 'Anochecer', 'Noche', 'Medianoche']
const TONE_VALUES = ['Epico', 'Misterioso', 'Sombrio', 'Romantico', 'Tenso', 'Comico', 'Tragico', 'Pacifico', 'Ominoso', 'Intimo']

export default function EditScenePage() {
  const { worldId, sceneId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [time, setTime] = useState('')
  const [tone, setTone] = useState('')
  const [context, setContext] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [sceneTitle, setSceneTitle] = useState('')
  const [baseline, setBaseline] = useState<SceneBaseline | null>(null)

  const isDirty =
    baseline !== null && (
      title !== baseline.title ||
      location !== baseline.location ||
      time !== baseline.time ||
      tone !== baseline.tone ||
      context !== baseline.context
    )

  const { blocker } = useUnsavedChangesGuard(isDirty)

  useEffect(() => {
    document.title = `${t('pageTitle.editScene')} — StoryTeller`
  }, [t, i18n.language])

  useEffect(() => {
    const id = Number(sceneId)
    if (!sceneId || Number.isNaN(id)) {
      setError(t('scene.detail.deleteError'))
      setFetching(false)
      return
    }

    getSceneById(id)
      .then(data => {
        setTitle(data.title)
        setLocation(data.location)
        setTime(data.time)
        setTone(data.tone)
        setContext(data.context)
        setSceneTitle(data.title)
        setBaseline({
          title: data.title,
          location: data.location,
          time: data.time,
          tone: data.tone,
          context: data.context,
        })
      })
      .catch(err => setError(err instanceof Error ? err.message : t('scene.detail.deleteError')))
      .finally(() => setFetching(false))
  }, [sceneId, t])

  const timeOptions = TIME_VALUES.map(v => ({ value: v, label: t(`scene.times.${v}`) }))
  const timeDescriptions = Object.fromEntries(TIME_VALUES.map(v => [v, t(`scene.times.${v}Desc`)]))

  const toneOptions = TONE_VALUES.map(v => ({ value: v, label: t(`scene.tones.${v}`) }))
  const toneDescriptions = Object.fromEntries(TONE_VALUES.map(v => [v, t(`scene.tones.${v}Desc`)]))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!time || !tone) {
      setError(t('scene.create.validationError'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await updateScene(Number(sceneId), {
        title,
        location,
        time,
        tone,
        context,
      })
      toast.success(t('scene.edit.successTitle'), { description: t('scene.edit.successDesc') })
      setBaseline({ title, location, time, tone, context })
      navigate(`/worlds/${worldId}/scenes/${sceneId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('scene.edit.error'))
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <DetailSkeleton />

  return (
    <>
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-2xl mx-auto">
        <PageBreadcrumb items={[
          { label: t('nav.worlds'), href: '/worlds' },
          { label: t('nav.worlds'), href: `/worlds/${worldId}` },
          { label: sceneTitle || '...', href: `/worlds/${worldId}/scenes/${sceneId}` },
          { label: t('common.edit') },
        ]} />
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-sky-100 bg-entity-scene-light/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-entity-scene/10 flex items-center justify-center">
                <Clapperboard className="w-4.5 h-4.5 text-entity-scene" />
              </div>
              <div>
                <CardTitle className="font-[var(--font-display)]">{t('scene.edit.title')}</CardTitle>
                <CardDescription>{t('scene.edit.subtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <FieldGroup label={t('scene.create.titleLabel')}>
                <Input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full" required placeholder={t('scene.create.titlePlaceholder')} />
              </FieldGroup>

              <FieldGroup label={t('scene.create.locationLabel')}>
                <Input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full" required placeholder={t('scene.create.locationPlaceholder')} />
              </FieldGroup>

              <SectionDivider label={t('scene.create.atmosphereSection')} />

              <FieldGroup label={t('scene.create.timeLabel')}>
                <PillSelect options={timeOptions} value={time} onChange={setTime} descriptions={timeDescriptions} />
              </FieldGroup>

              <FieldGroup label={t('scene.create.toneLabel')}>
                <PillSelect options={toneOptions} value={tone} onChange={setTone} descriptions={toneDescriptions} />
              </FieldGroup>

              <SectionDivider label={t('scene.create.narrativeSection')} />

              <FieldGroup label={t('scene.create.contextLabel')}>
                <Textarea value={context} onChange={e => setContext(e.target.value)} className="min-h-[90px] resize-none" required placeholder={t('scene.create.contextPlaceholder')} />
              </FieldGroup>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('scene.edit.submitting')}</> : t('scene.edit.submitButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    <UnsavedChangesDialog blocker={blocker} />
    </>
  )
}

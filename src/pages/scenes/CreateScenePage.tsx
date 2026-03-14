import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createScene, generateScene } from '../../services/api'
import type { Scene } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'
import { PillSelect } from '../../components/PillSelect'
import { FieldGroup } from '@/components/form/FieldGroup'
import { SectionDivider } from '@/components/form/SectionDivider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, Clapperboard } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'

const TIME_VALUES = ['Amanecer', 'Manana', 'Mediodia', 'Tarde', 'Anochecer', 'Noche', 'Medianoche']
const TONE_VALUES = ['Epico', 'Misterioso', 'Sombrio', 'Romantico', 'Tenso', 'Comico', 'Tragico', 'Pacifico', 'Ominoso', 'Intimo']

export default function CreateScenePage() {
  const { id: worldId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [, setMode] = useState<'manual' | 'ai'>('manual')

  useEffect(() => {
    document.title = `${t('pageTitle.createScene')} — StoryTeller`
  }, [t, i18n.language])

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [time, setTime] = useState('')
  const [tone, setTone] = useState('')
  const [context, setContext] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')

  const [aiLoading, setAiLoading] = useState(false)
  const [aiScene, setAiScene] = useState<Scene | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { hasInstallation, checked: installationChecked } = useInstallation()

  const timeOptions = TIME_VALUES.map(v => ({ value: v, label: t(`scene.times.${v}`) }))
  const timeDescriptions = Object.fromEntries(TIME_VALUES.map(v => [v, t(`scene.times.${v}Desc`)]))

  const toneOptions = TONE_VALUES.map(v => ({ value: v, label: t(`scene.tones.${v}`) }))
  const toneDescriptions = Object.fromEntries(TONE_VALUES.map(v => [v, t(`scene.tones.${v}Desc`)]))

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!time || !tone) {
      setError(t('scene.create.validationError'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await createScene({ title, location, time, tone, context, world_id: Number(worldId) })
      navigate(`/worlds/${worldId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('scene.create.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAiLoading(true)
    setError('')
    setAiScene(null)
    try {
      const scene = await generateScene(Number(worldId), aiPrompt)
      setAiScene(scene)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('scene.create.aiError'))
    } finally {
      setAiLoading(false)
    }
  }

  const handleAISave = async () => {
    if (!aiScene) return
    setLoading(true)
    setError('')
    try {
      await createScene({
        title: aiScene.title || t('scene.create.aiDefaultTitle'),
        location: aiScene.location || '',
        time: aiScene.time || '',
        tone: aiScene.tone || '',
        context: aiScene.context || '',
        world_id: Number(worldId),
      })
      navigate(`/worlds/${worldId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('scene.create.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-2xl mx-auto">
        <PageBreadcrumb items={[{label: t('nav.worlds'), href: '/worlds'}, {label: t('nav.worlds'), href: '/worlds/' + worldId}, {label: t('scene.create.title')}]} />
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-sky-100 bg-entity-scene-light/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-entity-scene/10 flex items-center justify-center">
                <Clapperboard className="w-4.5 h-4.5 text-entity-scene" />
              </div>
              <div>
                <CardTitle className="font-[var(--font-display)]">{t('scene.create.title')}</CardTitle>
                <CardDescription>{t('scene.create.subtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="manual" onValueChange={v => setMode(v as 'manual' | 'ai')}>
              <TabsList className="mb-6">
                <TabsTrigger value="manual">{t('scene.create.manualTab')}</TabsTrigger>
                <TabsTrigger value="ai">{t('scene.create.aiTab')}</TabsTrigger>
              </TabsList>

              <TabsContent value="manual">
                <form onSubmit={handleManualSubmit}>
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
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('scene.create.submitting')}</> : t('scene.create.submitButton')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="ai">
                <div>
                  {installationChecked && !hasInstallation && <NoInstallationBanner />}
                  <form onSubmit={handleAIGenerate}>
                    <FieldGroup label={t('scene.create.aiPromptLabel')}>
                      <Textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="min-h-[90px] resize-none" placeholder={t('scene.create.aiPromptPlaceholder')} required />
                    </FieldGroup>
                    <Button type="submit" size="lg" className="w-full mb-4" disabled={aiLoading || !hasInstallation}>
                      {aiLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('scene.create.aiGenerating')}</> : t('scene.create.aiSubmitButton')}
                    </Button>
                  </form>

                  {aiScene && (
                    <div className="mt-2 rounded-xl border border-sky-200 overflow-hidden">
                      <div className="px-5 py-3 bg-entity-scene">
                        <h3 className="text-sm font-bold text-white font-[var(--font-display)]">{aiScene.title}</h3>
                        <p className="text-xs text-white/70">{aiScene.location} · {aiScene.time}</p>
                      </div>
                      <div className="p-5 bg-entity-scene-light space-y-2">
                        {[
                          { label: t('scene.create.aiPreviewTone'), value: aiScene.tone },
                          { label: t('scene.create.aiPreviewContext'), value: aiScene.context },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex gap-3 text-sm">
                            <span className="text-entity-scene-muted font-semibold w-20 shrink-0">{label}</span>
                            <span className="text-foreground">{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-3 bg-card border-t border-sky-100">
                        <Button size="lg" className="w-full" onClick={handleAISave} disabled={loading}>
                          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('scene.create.aiSaving')}</> : t('scene.create.aiSaveButton')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

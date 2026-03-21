import { useState, useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createScene, generateScene, getWorldById, getSceneById } from '../../services/api'
import type { Scene, Character } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog'
import { WorldContextPanel } from '@/components/character-creation/WorldContextPanel'
import { PillSelect } from '../../components/PillSelect'
import { FieldGroup } from '@/components/form/FieldGroup'
import { SectionDivider } from '@/components/form/SectionDivider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, Clapperboard, Users, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'

const TIME_VALUES = ['Amanecer', 'Manana', 'Mediodia', 'Tarde', 'Anochecer', 'Noche', 'Medianoche']
const TONE_VALUES = ['Epico', 'Misterioso', 'Sombrio', 'Romantico', 'Tenso', 'Comico', 'Tragico', 'Pacifico', 'Ominoso', 'Intimo']

export default function CreateScenePage() {
  const { id: worldId } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { t, i18n } = useTranslation()
  const [, setMode] = useState<'manual' | 'ai'>('manual')
  const afterSceneId = searchParams.get('after')
  const [afterScene, setAfterScene] = useState<Scene | null>(null)

  useEffect(() => {
    document.title = `${t('pageTitle.createScene')} — StoryTeller`
  }, [t, i18n.language])

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [time, setTime] = useState('')
  const [tone, setTone] = useState('')
  const [context, setContext] = useState('')
  const [aiPrompt, setAiPrompt] = useState('')

  const [characters, setCharacters] = useState<Character[]>([])
  const [selectedCharacterIds, setSelectedCharacterIds] = useState<Set<number>>(new Set())
  const [charactersLoading, setCharactersLoading] = useState(true)

  const [aiLoading, setAiLoading] = useState(false)
  const [aiScene, setAiScene] = useState<Scene | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { hasInstallation, checked: installationChecked } = useInstallation()

  const isDirty = title.trim().length > 0 || location.trim().length > 0 || tone !== '' || time !== '' || context.trim().length > 0
  const { blocker } = useUnsavedChangesGuard(isDirty)

  useEffect(() => {
    if (!worldId) return
    setCharactersLoading(true)
    getWorldById(Number(worldId))
      .then(data => {
        const raw = data as unknown as Record<string, unknown>
        setCharacters(Array.isArray(raw.characters) ? raw.characters as Character[] : [])
      })
      .catch(() => setCharacters([]))
      .finally(() => setCharactersLoading(false))
  }, [worldId])

  useEffect(() => {
    if (!afterSceneId) return
    getSceneById(Number(afterSceneId))
      .then(scene => {
        setAfterScene(scene)
        if (!aiPrompt) {
          setAiPrompt(t('scene.create.afterPromptHint'))
        }
      })
      .catch(() => setAfterScene(null))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [afterSceneId])

  const toggleCharacter = (id: number) => {
    setSelectedCharacterIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

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
      setTitle('')
      setLocation('')
      setTime('')
      setTone('')
      setContext('')
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
      let prompt = aiPrompt
      if (afterScene) {
        const continuation = `Continua despues de: "${afterScene.title}". ${afterScene.context || ''}\n\n`
        prompt = continuation + prompt
      }
      const scene = await generateScene(Number(worldId), prompt)
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>
                      <TabsTrigger
                        value="ai"
                        disabled={!hasInstallation}
                        style={!hasInstallation ? { pointerEvents: 'none' } : undefined}
                      >
                        {t('scene.create.aiTab')}
                      </TabsTrigger>
                    </span>
                  </TooltipTrigger>
                  {!hasInstallation && (
                    <TooltipContent>{t('installation.tabDisabledTooltip')}</TooltipContent>
                  )}
                </Tooltip>
              </TabsList>

              <TabsContent value="manual">
                <WorldContextPanel worldId={Number(worldId)} />
                {afterScene && (
                  <div className="rounded-xl border border-entity-scene/30 bg-entity-scene-light/40 px-5 py-4 mb-6">
                    <div className="flex items-center gap-2 mb-1">
                      <ArrowRight className="w-4 h-4 text-entity-scene" />
                      <span className="text-sm font-semibold text-entity-scene">
                        {t('scene.create.continuingAfter', { title: afterScene.title })}
                      </span>
                    </div>
                    {afterScene.context && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {afterScene.context}
                      </p>
                    )}
                  </div>
                )}
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
                  <WorldContextPanel worldId={Number(worldId)} />

                  {afterScene && (
                    <div className="rounded-xl border border-entity-scene/30 bg-entity-scene-light/40 px-5 py-4 mb-6">
                      <div className="flex items-center gap-2 mb-1">
                        <ArrowRight className="w-4 h-4 text-entity-scene" />
                        <span className="text-sm font-semibold text-entity-scene">
                          {t('scene.create.continuingAfter', { title: afterScene.title })}
                        </span>
                      </div>
                      {afterScene.context && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {afterScene.context}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Character roster */}
                  <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50/40 to-amber-50/20 px-5 py-4 mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="w-4 h-4 text-entity-character" />
                      <span className="text-xs font-semibold uppercase tracking-widest text-entity-character/70">
                        {t('scene.create.availableCharacters')}
                      </span>
                      {selectedCharacterIds.size > 0 && (
                        <span className="ml-auto text-xs text-entity-character font-medium">
                          {t('scene.create.selectedCount', { count: selectedCharacterIds.size })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {t('scene.create.availableCharactersHint')}
                    </p>
                    {charactersLoading ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        {t('common.loading')}
                      </div>
                    ) : characters.length === 0 ? (
                      <p className="text-sm text-muted-foreground italic">
                        {t('scene.create.noCharactersInWorld')}
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {characters.map(character => {
                          const isSelected = selectedCharacterIds.has(character.id)
                          return (
                            <button
                              key={character.id}
                              type="button"
                              onClick={() => toggleCharacter(character.id)}
                              className={`
                                inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm
                                border transition-all duration-150 cursor-pointer
                                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-entity-character/50
                                ${isSelected
                                  ? 'bg-entity-character text-white border-entity-character shadow-sm'
                                  : 'bg-white text-foreground/80 border-orange-200 hover:border-entity-character/50 hover:bg-orange-50'}
                              `}
                              aria-pressed={isSelected}
                            >
                              <span className="font-medium">{character.name}</span>
                              {character.role && (
                                <span className={`text-xs ${isSelected ? 'text-white/70' : 'text-muted-foreground'}`}>
                                  {character.role}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>

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
      <UnsavedChangesDialog blocker={blocker} />
    </div>
  )
}

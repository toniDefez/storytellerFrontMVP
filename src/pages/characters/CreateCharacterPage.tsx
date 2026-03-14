import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { createCharacter, generateCharacter } from '../../services/api'
import type { Character } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'
import { PillSelect, MultiPillSelect } from '../../components/PillSelect'
import { FieldGroup } from '@/components/form/FieldGroup'
import { SectionDivider } from '@/components/form/SectionDivider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2, User, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'

const ROLE_VALUES = ['Guerrero', 'Mago', 'Picaro', 'Explorador', 'Sanador', 'Mercader', 'Noble', 'Sacerdote', 'Villano', 'Artesano'] as const
const PERSONALITY_VALUES = ['Valiente', 'Astuto', 'Compasivo', 'Arrogante', 'Misterioso', 'Leal', 'Vengativo', 'Ingenuo', 'Sabio', 'Impulsivo', 'Reservado', 'Temerario'] as const

export default function CreateCharacterPage() {
  const { id: worldId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [, setMode] = useState<'manual' | 'ai'>('manual')

  useEffect(() => {
    document.title = `${t('pageTitle.createCharacter')} — StoryTeller`
  }, [t, i18n.language])

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [personalityTags, setPersonalityTags] = useState<string[]>([])
  const [background, setBackground] = useState('')
  const [goals, setGoals] = useState<string[]>([''])
  const [aiPrompt, setAiPrompt] = useState('')

  const [aiLoading, setAiLoading] = useState(false)
  const [aiCharacter, setAiCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { hasInstallation, checked: installationChecked } = useInstallation()

  // Build pill options: value = Spanish backend string, label = translated display
  const roleOptions = ROLE_VALUES.map(v => ({ value: v, label: t(`character.roles.${v}`) }))
  const roleDesc: Record<string, string> = Object.fromEntries(
    ROLE_VALUES.map(v => [v, t(`character.roles.${v}Desc`)])
  )

  const personalityOptions = PERSONALITY_VALUES.map(v => ({ value: v, label: t(`character.personalities.${v}`) }))
  const personalityDesc: Record<string, string> = Object.fromEntries(
    PERSONALITY_VALUES.map(v => [v, t(`character.personalities.${v}Desc`)])
  )

  const handleGoalChange = (idx: number, value: string) => {
    setGoals(goals.map((g, i) => (i === idx ? value : g)))
  }
  const addGoal = () => setGoals([...goals, ''])
  const removeGoal = (idx: number) => setGoals(goals.filter((_, i) => i !== idx))

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      setError(t('character.create.validationError'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await createCharacter({
        name,
        role,
        personality: personalityTags.join(', '),
        background,
        goals: goals.filter(g => g.trim()),
        world_id: Number(worldId),
        state: {},
      })
      navigate(`/worlds/${worldId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('character.create.error'))
    } finally {
      setLoading(false)
    }
  }

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAiLoading(true)
    setError('')
    setAiCharacter(null)
    try {
      const character = await generateCharacter(Number(worldId), aiPrompt)
      setAiCharacter(character)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('character.create.aiError'))
    } finally {
      setAiLoading(false)
    }
  }

  const handleAISave = async () => {
    if (!aiCharacter) return
    setLoading(true)
    setError('')
    try {
      await createCharacter({
        name: aiCharacter.name || 'Personaje generado',
        role: aiCharacter.role || '',
        personality: aiCharacter.personality || '',
        background: aiCharacter.background || '',
        goals: aiCharacter.goals || [],
        world_id: Number(worldId),
        state: aiCharacter.state || {},
      })
      navigate(`/worlds/${worldId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('character.create.error'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-2xl mx-auto">
        <PageBreadcrumb items={[{label: t('nav.worlds'), href: '/worlds'}, {label: 'Mundo', href: '/worlds/' + worldId}, {label: t('character.create.title')}]} />
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-amber-100 bg-entity-character-light/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-entity-character/10 flex items-center justify-center">
                <User className="w-4.5 h-4.5 text-entity-character" />
              </div>
              <div>
                <CardTitle className="font-[var(--font-display)]">{t('character.create.title')}</CardTitle>
                <CardDescription>{t('character.create.subtitle')}</CardDescription>
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
                <TabsTrigger value="manual">{t('character.create.manualTab')}</TabsTrigger>
                <TabsTrigger value="ai">{t('character.create.aiTab')}</TabsTrigger>
              </TabsList>

              <TabsContent value="manual">
                <form onSubmit={handleManualSubmit}>
                  <FieldGroup label={t('character.create.nameLabel')}>
                    <Input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full" required placeholder={t('character.create.namePlaceholder')} />
                  </FieldGroup>

                  <SectionDivider label={t('character.create.identitySection')} />

                  <FieldGroup label={t('character.create.roleLabel')}>
                    <PillSelect options={roleOptions} value={role} onChange={setRole} descriptions={roleDesc} />
                  </FieldGroup>

                  <FieldGroup label={t('character.create.personalityLabel')} hint={t('character.create.personalityHint')}>
                    <MultiPillSelect options={personalityOptions} value={personalityTags} onChange={setPersonalityTags} descriptions={personalityDesc} />
                  </FieldGroup>

                  <SectionDivider label={t('character.create.historySection')} />

                  <FieldGroup label={t('character.create.backgroundLabel')}>
                    <Textarea value={background} onChange={e => setBackground(e.target.value)} className="min-h-[90px] resize-none" required placeholder={t('character.create.backgroundPlaceholder')} />
                  </FieldGroup>

                  <div className="mb-7">
                    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('character.create.goalsLabel')}</label>
                    {goals.map((g, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <Input type="text" value={g} onChange={e => handleGoalChange(idx, e.target.value)} className="w-full" placeholder={t('character.create.goalPlaceholder', { index: idx + 1 })} />
                        {goals.length > 1 && (
                          <button type="button" onClick={() => removeGoal(idx)} className="text-muted-foreground/40 hover:text-destructive transition p-1">
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addGoal} className="text-entity-character hover:text-entity-character-muted text-xs font-semibold mt-1 transition">{t('character.create.addGoal')}</button>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('character.create.submitting')}</> : t('character.create.submitButton')}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="ai">
                <div>
                  {installationChecked && !hasInstallation && <NoInstallationBanner />}
                  <form onSubmit={handleAIGenerate}>
                    <FieldGroup label={t('character.create.aiPromptLabel')}>
                      <Textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)} className="min-h-[90px] resize-none" placeholder={t('character.create.aiPromptPlaceholder')} required />
                    </FieldGroup>
                    <Button type="submit" size="lg" className="w-full mb-4" disabled={aiLoading || !hasInstallation}>
                      {aiLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('character.create.aiGenerating')}</> : t('character.create.aiSubmitButton')}
                    </Button>
                  </form>

                  {aiCharacter && (
                    <div className="mt-2 rounded-xl border border-amber-200 overflow-hidden">
                      <div className="px-5 py-3 bg-entity-character">
                        <h3 className="text-sm font-bold text-white font-[var(--font-display)]">{aiCharacter.name}</h3>
                        <p className="text-xs text-white/70">{aiCharacter.role}</p>
                      </div>
                      <div className="p-5 bg-entity-character-light space-y-2">
                        {[
                          { label: t('character.create.aiPreviewPersonality'), value: aiCharacter.personality },
                          { label: t('character.create.aiPreviewBackground'), value: aiCharacter.background },
                          ...(aiCharacter.goals?.length ? [{ label: t('character.create.aiPreviewGoals'), value: aiCharacter.goals.join(', ') }] : []),
                        ].map(({ label, value }) => (
                          <div key={label} className="flex gap-3 text-sm">
                            <span className="text-entity-character-muted font-semibold w-24 shrink-0">{label}</span>
                            <span className="text-foreground">{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-3 bg-card border-t border-amber-100">
                        <Button size="lg" className="w-full" onClick={handleAISave} disabled={loading}>
                          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('character.create.aiSaving')}</> : t('character.create.aiSaveButton')}
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

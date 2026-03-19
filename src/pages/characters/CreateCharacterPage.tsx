import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
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
import { Loader2, User, X, Save } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { WorldContextPanel } from '@/components/character-creation/WorldContextPanel'
import { AIGeneratingIndicator } from '@/components/world-creation/AIGeneratingIndicator'
import { DerivationLayer } from '@/components/world-creation/DerivationLayer'
import type { ExtendedChipStatus } from '@/components/world-creation/DerivationLayer'

/* ------------------------------------------------------------------ */
/* Manual tab constants                                                */
/* ------------------------------------------------------------------ */

const ROLE_VALUES = ['Guerrero', 'Mago', 'Picaro', 'Explorador', 'Sanador', 'Mercader', 'Noble', 'Sacerdote', 'Villano', 'Artesano'] as const
const PERSONALITY_VALUES = ['Valiente', 'Astuto', 'Compasivo', 'Arrogante', 'Misterioso', 'Leal', 'Vengativo', 'Ingenuo', 'Sabio', 'Impulsivo', 'Reservado', 'Temerario'] as const

/* ------------------------------------------------------------------ */
/* Derive tab types & constants                                        */
/* ------------------------------------------------------------------ */

type DerivePhase = 'premise' | 'generating' | 'reviewing'

interface SectionData {
  content: string | null
  status: ExtendedChipStatus
  editedContent?: string
}

interface CharacterSections {
  identity: SectionData
  temperament: SectionData
  history: SectionData
  will: SectionData
}

const CHARACTER_LAYERS = ['identity', 'temperament', 'history', 'will'] as const
type CharacterLayerKey = (typeof CHARACTER_LAYERS)[number]

const LAYER_DISPLAY: Record<CharacterLayerKey, { icon: string; label: string; labelEn: string; color: string }> = {
  identity:    { icon: '\u{1F3AD}', label: 'Identidad',    labelEn: 'Identity',    color: 'text-amber-600' },
  temperament: { icon: '\u{1F525}', label: 'Temperamento', labelEn: 'Temperament', color: 'text-rose-600' },
  history:     { icon: '\u{1F4DC}', label: 'Historia',     labelEn: 'History',     color: 'text-blue-600' },
  will:        { icon: '\u{2728}',  label: 'Voluntad',     labelEn: 'Will',        color: 'text-emerald-600' },
}

const PREMISE_EXAMPLES = [
  'Una sanadora que descubrio que su cura es peor que la enfermedad...',
  'El ultimo cartografo de un mundo que ya no tiene fronteras...',
  'Alguien que traiciono a su faccion por amor y ahora no pertenece a ninguna...',
  'Un juez que aplica leyes en las que ya no cree...',
  'La hija de un lider que sabe que su padre miente a todos...',
]

/* ------------------------------------------------------------------ */
/* Derive tab helpers                                                  */
/* ------------------------------------------------------------------ */

function buildSectionContent(character: Character, section: CharacterLayerKey): string {
  switch (section) {
    case 'identity': {
      const parts: string[] = []
      if (character.role) parts.push(`Rol: ${character.role}`)
      if (character.social_position) parts.push(`Posicion social: ${character.social_position}`)
      if (character.faction_affiliation) parts.push(`Faccion: ${character.faction_affiliation}`)
      return parts.join('\n\n') || ''
    }
    case 'temperament': {
      const parts: string[] = []
      if (character.personality) parts.push(`Personalidad: ${character.personality}`)
      if (character.internal_contradiction) parts.push(`Contradiccion interna: ${character.internal_contradiction}`)
      if (character.relation_to_collective_lie) parts.push(`Relacion con la mentira colectiva: ${character.relation_to_collective_lie}`)
      return parts.join('\n\n') || ''
    }
    case 'history': {
      const parts: string[] = []
      if (character.background) parts.push(character.background)
      if (character.personal_fear) parts.push(`Miedo personal: ${character.personal_fear}`)
      return parts.join('\n\n') || ''
    }
    case 'will': {
      if (character.goals && character.goals.length > 0) {
        return character.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')
      }
      return ''
    }
  }
}

function initSections(): CharacterSections {
  return {
    identity:    { content: null, status: 'idle' },
    temperament: { content: null, status: 'idle' },
    history:     { content: null, status: 'idle' },
    will:        { content: null, status: 'idle' },
  }
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function CreateCharacterPage() {
  const { id: worldId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  useEffect(() => {
    document.title = `${t('pageTitle.createCharacter')} — StoryTeller`
  }, [t, i18n.language])

  /* ---- Shared state ---- */
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { hasInstallation, checked: installationChecked } = useInstallation()

  /* ---- Manual tab state ---- */
  const [manualName, setManualName] = useState('')
  const [role, setRole] = useState('')
  const [personalityTags, setPersonalityTags] = useState<string[]>([])
  const [background, setBackground] = useState('')
  const [goals, setGoals] = useState<string[]>([''])

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
        name: manualName,
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

  /* ---- Derive tab state ---- */
  const [derivePhase, setDerivePhase] = useState<DerivePhase>('premise')
  const [deriveName, setDeriveName] = useState('')
  const [premise, setPremise] = useState('')
  const [sections, setSections] = useState<CharacterSections>(initSections)
  const [generatedCharacter, setGeneratedCharacter] = useState<Character | null>(null)
  const [saving, setSaving] = useState(false)

  // Rotating placeholder
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % PREMISE_EXAMPLES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleDerive = useCallback(async () => {
    if (!premise.trim()) return
    setDerivePhase('generating')
    setError('')

    try {
      const character = await generateCharacter(Number(worldId), premise)
      setGeneratedCharacter(character)

      if (character.name && !deriveName) {
        setDeriveName(character.name)
      }

      const newSections: CharacterSections = {
        identity:    { content: buildSectionContent(character, 'identity'),    status: 'ready' },
        temperament: { content: buildSectionContent(character, 'temperament'), status: 'ready' },
        history:     { content: buildSectionContent(character, 'history'),     status: 'ready' },
        will:        { content: buildSectionContent(character, 'will'),        status: 'ready' },
      }

      for (const key of CHARACTER_LAYERS) {
        if (!newSections[key].content) {
          newSections[key].content = t('character.create.pendingGeneration')
        }
      }

      setSections(newSections)
      setDerivePhase('reviewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('character.create.aiError'))
      setDerivePhase('premise')
    }
  }, [premise, worldId, deriveName, t])

  const acceptSection = useCallback((key: string) => {
    setSections(prev => ({
      ...prev,
      [key]: { ...prev[key as CharacterLayerKey], status: 'accepted' },
    }))
  }, [])

  const rejectSection = useCallback((key: string) => {
    setSections(prev => ({
      ...prev,
      [key]: { ...prev[key as CharacterLayerKey], status: 'rejected' },
    }))
  }, [])

  const editSection = useCallback((key: string, newText: string) => {
    setSections(prev => ({
      ...prev,
      [key]: { ...prev[key as CharacterLayerKey], editedContent: newText, status: 'accepted' },
    }))
  }, [])

  const allDecided = CHARACTER_LAYERS.every(
    k => sections[k].status === 'accepted' || sections[k].status === 'rejected'
  )
  const hasAccepted = CHARACTER_LAYERS.some(k => sections[k].status === 'accepted')

  const handleSave = useCallback(async () => {
    setSaving(true)
    setError('')

    try {
      const base = generatedCharacter || {} as Partial<Character>

      await createCharacter({
        name: deriveName || base.name || 'Personaje derivado',
        role: base.role || '',
        personality: base.personality || '',
        background: base.background || '',
        goals: base.goals || [],
        world_id: Number(worldId),
        state: base.state || {},
        premise,
        social_position: base.social_position,
        internal_contradiction: base.internal_contradiction,
        relation_to_collective_lie: base.relation_to_collective_lie,
        personal_fear: base.personal_fear,
        faction_affiliation: base.faction_affiliation,
      })

      navigate(`/worlds/${worldId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('character.create.error'))
    } finally {
      setSaving(false)
    }
  }, [generatedCharacter, deriveName, worldId, premise, navigate, t])

  /* ---- Render ---- */

  return (
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-3xl mx-auto">
        <PageBreadcrumb items={[
          { label: t('nav.worlds'), href: '/worlds' },
          { label: 'Mundo', href: `/worlds/${worldId}` },
          { label: t('character.create.title') },
        ]} />

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

            <Tabs defaultValue="derive" onValueChange={() => setError('')}>
              <TabsList className="mb-6">
                <TabsTrigger value="derive">{t('character.create.deriveButton')}</TabsTrigger>
                <TabsTrigger value="manual">{t('character.create.manualTab')}</TabsTrigger>
              </TabsList>

              {/* ============================================= */}
              {/* TAB: DERIVE FROM WORLD                        */}
              {/* ============================================= */}
              <TabsContent value="derive">
                <div>
                  {installationChecked && !hasInstallation && (
                    <div className="mb-6">
                      <NoInstallationBanner />
                    </div>
                  )}

                  {/* World context */}
                  <WorldContextPanel worldId={Number(worldId)} />

                  {/* PHASE: PREMISE */}
                  <AnimatePresence mode="wait">
                    {derivePhase === 'premise' && (
                      <motion.div
                        key="premise"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Name */}
                        <div className="mb-6">
                          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                            {t('character.create.nameLabel')}
                          </label>
                          <Input
                            type="text"
                            value={deriveName}
                            onChange={e => setDeriveName(e.target.value)}
                            placeholder={t('character.create.namePlaceholder')}
                            className="border-0 border-b-2 border-muted/50 rounded-none px-0 text-lg
                                       font-[var(--font-display)] placeholder:italic placeholder:text-muted-foreground/40
                                       focus-visible:ring-0 focus-visible:border-entity-character/50 transition-colors"
                          />
                          <p className="text-[10px] text-muted-foreground/50 mt-1 italic">
                            {i18n.language === 'es' ? 'Opcional. La IA puede sugerir uno.' : 'Optional. AI can suggest one.'}
                          </p>
                        </div>

                        {/* Premise */}
                        <div className="mb-6">
                          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                            {t('character.create.premiseLabel')}
                          </label>
                          <p className="text-xs text-muted-foreground/70 mb-3 leading-relaxed">
                            {t('character.create.premiseHint')}
                          </p>
                          <div className="relative">
                            <Textarea
                              value={premise}
                              onChange={e => setPremise(e.target.value)}
                              placeholder={PREMISE_EXAMPLES[placeholderIdx]}
                              className="min-h-[140px] resize-none text-base leading-relaxed
                                         border-2 border-dashed border-entity-character/25 rounded-xl
                                         bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]
                                         from-amber-500/[0.02] to-transparent
                                         placeholder:text-muted-foreground/40 placeholder:italic
                                         focus:border-solid focus:border-entity-character/40
                                         focus-visible:ring-0 focus-visible:ring-offset-0
                                         focus:shadow-md focus:shadow-amber-500/5
                                         transition-all duration-300"
                            />
                            <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/40">
                              {premise.length}/500
                            </span>
                          </div>
                        </div>

                        {/* Derive button */}
                        <Button
                          type="button"
                          size="lg"
                          className="w-full font-semibold tracking-wide
                                     bg-gradient-to-r from-amber-600 to-orange-500
                                     hover:from-amber-700 hover:to-orange-600
                                     hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5
                                     transition-all duration-200"
                          disabled={!premise.trim() || !hasInstallation}
                          onClick={handleDerive}
                        >
                          <User className="w-4 h-4 mr-2" />
                          {t('character.create.deriveButton')}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* PHASE: GENERATING */}
                  <AnimatePresence>
                    {derivePhase === 'generating' && (
                      <AIGeneratingIndicator />
                    )}
                  </AnimatePresence>

                  {/* PHASE: REVIEWING */}
                  <AnimatePresence>
                    {derivePhase === 'reviewing' && (
                      <motion.div
                        key="reviewing"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {/* Name (editable) */}
                        <div className="mb-6">
                          <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                            {t('character.create.nameLabel')}
                          </label>
                          <Input
                            type="text"
                            value={deriveName}
                            onChange={e => setDeriveName(e.target.value)}
                            placeholder={t('character.create.namePlaceholder')}
                            className="border-0 border-b-2 border-amber-200 rounded-none px-0 text-lg
                                       font-[var(--font-display)] placeholder:italic placeholder:text-muted-foreground/40
                                       focus-visible:ring-0 focus-visible:border-entity-character/50 transition-colors"
                          />
                        </div>

                        {/* Separator */}
                        <div className="relative my-6 flex items-center gap-3">
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
                          <span className="text-[10px] font-semibold text-amber-600/50 uppercase tracking-[0.2em]">
                            {i18n.language === 'es' ? 'Resultado de la derivacion' : 'Derivation result'}
                          </span>
                          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
                        </div>

                        {/* Layers */}
                        <div className="space-y-4">
                          {CHARACTER_LAYERS.map((layer, idx) => {
                            const ls = sections[layer]
                            if (ls.status === 'idle') return null

                            return (
                              <div key={layer}>
                                <DerivationLayer
                                  layerKey={layer}
                                  layerMeta={LAYER_DISPLAY[layer]}
                                  suggestion={ls.editedContent ?? ls.content}
                                  cascadeDelay={idx * 180}
                                  isRevealed={ls.content !== null}
                                  onReveal={() => {}}
                                  onSuggestionAccept={acceptSection}
                                  onSuggestionReject={rejectSection}
                                  onSuggestionEdit={editSection}
                                  chipStatus={ls.status === 'ready' ? 'pending' : ls.status}
                                />
                              </div>
                            )
                          })}
                        </div>

                        {/* Save button */}
                        <div className="mt-8 space-y-3">
                          <AnimatePresence>
                            {allDecided && hasAccepted && (
                              <motion.div
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                              >
                                <Button
                                  type="button"
                                  size="lg"
                                  className="w-full font-semibold tracking-wide
                                             bg-gradient-to-r from-amber-600 to-orange-500
                                             hover:from-amber-700 hover:to-orange-600
                                             hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5
                                             transition-all duration-200"
                                  onClick={handleSave}
                                  disabled={saving}
                                >
                                  {saving ? (
                                    <>
                                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                      {t('character.create.savingCharacter')}
                                    </>
                                  ) : (
                                    <>
                                      <Save className="w-4 h-4 mr-2" />
                                      {t('character.create.saveCharacter')}
                                    </>
                                  )}
                                </Button>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          {/* Re-edit premise */}
                          <div className="text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setDerivePhase('premise')
                                setSections(initSections())
                                setGeneratedCharacter(null)
                              }}
                              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition underline underline-offset-2"
                            >
                              {i18n.language === 'es' ? 'Volver a editar la premisa' : 'Edit premise again'}
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </TabsContent>

              {/* ============================================= */}
              {/* TAB: MANUAL                                    */}
              {/* ============================================= */}
              <TabsContent value="manual">
                <form onSubmit={handleManualSubmit}>
                  <FieldGroup label={t('character.create.nameLabel')}>
                    <Input type="text" value={manualName} onChange={e => setManualName(e.target.value)} className="w-full" required placeholder={t('character.create.namePlaceholder')} />
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
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { useInstallation } from '@/hooks/useInstallation'
import NoInstallationBanner from '@/components/NoInstallationBanner'
import { WorldContextPanel } from '@/components/character-creation/WorldContextPanel'
import { AIGeneratingIndicator } from '@/components/world-creation/AIGeneratingIndicator'
import { DerivationLayer } from '@/components/world-creation/DerivationLayer'
import type { ExtendedChipStatus } from '@/components/world-creation/DerivationLayer'
import { generateCharacter, createCharacter } from '@/services/api'
import type { Character } from '@/services/api'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Phase = 'premise' | 'generating' | 'reviewing' | 'saving'

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

/* ------------------------------------------------------------------ */
/* Layer display metadata (character-themed colors)                     */
/* ------------------------------------------------------------------ */

const CHARACTER_LAYERS = ['identity', 'temperament', 'history', 'will'] as const
type CharacterLayerKey = (typeof CHARACTER_LAYERS)[number]

const LAYER_DISPLAY: Record<CharacterLayerKey, { icon: string; label: string; labelEn: string; color: string }> = {
  identity:    { icon: '\u{1F3AD}', label: 'Identidad',    labelEn: 'Identity',    color: 'text-amber-600' },
  temperament: { icon: '\u{1F525}', label: 'Temperamento', labelEn: 'Temperament', color: 'text-rose-600' },
  history:     { icon: '\u{1F4DC}', label: 'Historia',     labelEn: 'History',     color: 'text-blue-600' },
  will:        { icon: '\u{2728}',  label: 'Voluntad',     labelEn: 'Will',        color: 'text-emerald-600' },
}

/* ------------------------------------------------------------------ */
/* Rotating placeholder premises                                       */
/* ------------------------------------------------------------------ */

const PREMISE_EXAMPLES = [
  'Una sanadora que descubrio que su cura es peor que la enfermedad...',
  'El ultimo cartografo de un mundo que ya no tiene fronteras...',
  'Alguien que traiciono a su faccion por amor y ahora no pertenece a ninguna...',
  'Un juez que aplica leyes en las que ya no cree...',
  'La hija de un lider que sabe que su padre miente a todos...',
]

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
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

export default function CreateCharacterPageSanderson() {
  const { id: worldId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { hasInstallation, checked: installationChecked } = useInstallation()

  const [phase, setPhase] = useState<Phase>('premise')
  const [name, setName] = useState('')
  const [premise, setPremise] = useState('')
  const [sections, setSections] = useState<CharacterSections>(initSections)
  const [generatedCharacter, setGeneratedCharacter] = useState<Character | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Rotating placeholder
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(prev => (prev + 1) % PREMISE_EXAMPLES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    document.title = `${t('pageTitle.createCharacter')} -- StoryTeller`
  }, [t, i18n.language])

  /* ---- Derive character ---- */

  const handleDerive = useCallback(async () => {
    if (!premise.trim()) return
    setPhase('generating')
    setError('')

    try {
      const character = await generateCharacter(Number(worldId), premise)
      setGeneratedCharacter(character)

      // If the backend returned a name and user hasn't typed one, use it
      if (character.name && !name) {
        setName(character.name)
      }

      // Populate sections from the generated character
      const newSections: CharacterSections = {
        identity:    { content: buildSectionContent(character, 'identity'),    status: 'ready' },
        temperament: { content: buildSectionContent(character, 'temperament'), status: 'ready' },
        history:     { content: buildSectionContent(character, 'history'),     status: 'ready' },
        will:        { content: buildSectionContent(character, 'will'),        status: 'ready' },
      }

      // If a section has no content (backend doesn't return new fields yet), mark appropriately
      for (const key of CHARACTER_LAYERS) {
        if (!newSections[key].content) {
          newSections[key].content = t('character.create.pendingGeneration')
          newSections[key].status = 'ready'
        }
      }

      setSections(newSections)
      setPhase('reviewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('character.create.aiError'))
      setPhase('premise')
    }
  }, [premise, worldId, name, t])

  /* ---- Section accept/reject/edit ---- */

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

  /* ---- Save character ---- */

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
        name: name || base.name || 'Personaje derivado',
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
  }, [generatedCharacter, name, worldId, premise, navigate, t])

  /* ---- Render ---- */

  return (
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-3xl mx-auto">
        <PageBreadcrumb items={[
          { label: t('nav.worlds'), href: '/worlds' },
          { label: 'Mundo', href: `/worlds/${worldId}` },
          { label: t('character.create.derivationTitle') },
        ]} />

        {/* Card principal */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="border-b border-amber-100 bg-entity-character-light/50 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-entity-character/10 flex items-center justify-center">
                <User className="w-5 h-5 text-entity-character" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground font-[var(--font-display)]">
                  {t('character.create.derivationTitle')}
                </h1>
                <p className="text-sm text-muted-foreground italic mt-0.5">
                  {t('character.create.derivationSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-6">

            {/* Installation banner */}
            {installationChecked && !hasInstallation && (
              <div className="mb-6">
                <NoInstallationBanner />
              </div>
            )}

            {/* Error */}
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* World context panel (always visible, collapsible) */}
            <WorldContextPanel worldId={Number(worldId)} />

            {/* ---- PHASE: PREMISE ---- */}
            <AnimatePresence mode="wait">
              {phase === 'premise' && (
                <motion.div
                  key="premise"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Name input */}
                  <div className="mb-6">
                    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      {t('character.create.nameLabel')}
                    </label>
                    <Input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={t('character.create.namePlaceholder')}
                      className="border-0 border-b-2 border-muted/50 rounded-none px-0 text-lg
                                 font-[var(--font-display)] placeholder:italic placeholder:text-muted-foreground/40
                                 focus-visible:ring-0 focus-visible:border-entity-character/50 transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground/50 mt-1 italic">
                      {i18n.language === 'es' ? 'Opcional. La IA puede sugerir uno.' : 'Optional. AI can suggest one.'}
                    </p>
                  </div>

                  {/* Premise textarea */}
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

            {/* ---- PHASE: GENERATING ---- */}
            <AnimatePresence>
              {phase === 'generating' && (
                <AIGeneratingIndicator />
              )}
            </AnimatePresence>

            {/* ---- PHASE: REVIEWING ---- */}
            <AnimatePresence>
              {phase === 'reviewing' && (
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
                      value={name}
                      onChange={e => setName(e.target.value)}
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

                  {/* Derivation layers */}
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
                          setPhase('premise')
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
        </div>
      </div>
    </div>
  )
}

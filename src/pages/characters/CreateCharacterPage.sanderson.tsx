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
import { FactionOrbitMap } from '@/components/character-creation/FactionOrbitMap'
import { ConsciousnessPlane } from '@/components/character-creation/ConsciousnessPlane'
import { PermeabilityMembrane } from '@/components/character-creation/PermeabilityMembrane'
import { WantNeedFearTriangle } from '@/components/character-creation/WantNeedFearTriangle'
import { LayerActionBar } from '@/components/character-creation/LayerActionBar'
import { AIGeneratingIndicator } from '@/components/world-creation/AIGeneratingIndicator'
import { generateCharacter, createCharacter, getWorldById } from '@/services/api'
import type { Character, World } from '@/services/api'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

type Phase = 'premise' | 'generating' | 'reviewing' | 'saving'
type SectionKey = 'identity' | 'temperament' | 'history' | 'will'
type SectionStatus = 'idle' | 'pending' | 'accepted' | 'rejected'

interface SectionState {
  status: SectionStatus
}

const SECTIONS: SectionKey[] = ['identity', 'temperament', 'history', 'will']

const SECTION_META: Record<SectionKey, { icon: string; label: string; color: string; barColor: string }> = {
  identity:    { icon: '🎭', label: 'Identidad',    color: 'text-amber-600',  barColor: 'bg-amber-500' },
  temperament: { icon: '🔥', label: 'Temperamento', color: 'text-rose-600',   barColor: 'bg-rose-500' },
  history:     { icon: '📜', label: 'Historia',     color: 'text-blue-600',   barColor: 'bg-blue-500' },
  will:        { icon: '✨', label: 'Voluntad',     color: 'text-emerald-600', barColor: 'bg-emerald-500' },
}

/* ------------------------------------------------------------------ */
/* Premise examples                                                    */
/* ------------------------------------------------------------------ */

const PREMISE_EXAMPLES = [
  'Una sanadora que descubrió que su cura es peor que la enfermedad...',
  'El último cartógrafo de un mundo que ya no tiene fronteras...',
  'Alguien que traicionó a su facción por amor y ahora no pertenece a ninguna...',
  'Un juez que aplica leyes en las que ya no cree...',
  'La hija de un líder que sabe que su padre miente a todos...',
]

function initSections(): Record<SectionKey, SectionState> {
  return {
    identity:    { status: 'idle' },
    temperament: { status: 'idle' },
    history:     { status: 'idle' },
    will:        { status: 'idle' },
  }
}

/* ------------------------------------------------------------------ */
/* Layer shell                                                         */
/* ------------------------------------------------------------------ */

function LayerShell({
  sectionKey,
  status,
  onAccept,
  onReject,
  delay = 0,
  children,
}: {
  sectionKey: SectionKey
  status: SectionStatus
  onAccept: () => void
  onReject: () => void
  delay?: number
  children: React.ReactNode
}) {
  const meta = SECTION_META[sectionKey]

  if (status === 'idle') return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22, delay }}
      className="relative mb-3"
    >
      {/* Colour bar */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full ${meta.barColor} opacity-40`} />

      <div className="ml-4">
        {/* Header */}
        <div className="flex items-center gap-2 py-2">
          <span className="text-sm">{meta.icon}</span>
          <span className={`text-[10px] font-bold uppercase tracking-widest ${meta.color}`}>
            {meta.label}
          </span>
          {status === 'accepted' && (
            <span className="text-[9px] font-medium text-primary/60 bg-primary/8 px-2 py-0.5 rounded-full">
              Confirmado
            </span>
          )}
        </div>

        {/* Content */}
        <AnimatePresence>
          {status !== 'rejected' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden pb-2"
            >
              {children}
              <LayerActionBar
                status={status === 'pending' ? 'pending' : status === 'accepted' ? 'accepted' : 'pending'}
                onAccept={onAccept}
                onReject={onReject}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
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
  const [sections, setSections] = useState<Record<SectionKey, SectionState>>(initSections)
  const [character, setCharacter] = useState<Character | null>(null)
  const [world, setWorld] = useState<World | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Rotating placeholder
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx(p => (p + 1) % PREMISE_EXAMPLES.length), 4000)
    return () => clearInterval(id)
  }, [])

  // Fetch world data for visualisations
  useEffect(() => {
    if (!worldId) return
    getWorldById(Number(worldId)).then(setWorld).catch(() => {})
  }, [worldId])

  useEffect(() => {
    document.title = `${t('pageTitle.createCharacter')} -- StoryTeller`
  }, [t, i18n.language])

  /* ---- Derive ---- */

  const handleDerive = useCallback(async () => {
    if (!premise.trim()) return
    setPhase('generating')
    setError('')
    try {
      const c = await generateCharacter(Number(worldId), premise)
      setCharacter(c)
      if (c.name && !name) setName(c.name)
      setSections({
        identity:    { status: 'pending' },
        temperament: { status: 'pending' },
        history:     { status: 'pending' },
        will:        { status: 'pending' },
      })
      setPhase('reviewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('character.create.aiError'))
      setPhase('premise')
    }
  }, [premise, worldId, name, t])

  /* ---- Section actions ---- */

  const accept = useCallback((key: SectionKey) => {
    setSections(p => ({ ...p, [key]: { status: 'accepted' } }))
  }, [])

  const reject = useCallback((key: SectionKey) => {
    setSections(p => ({ ...p, [key]: { status: 'rejected' } }))
  }, [])

  /* ---- Save ---- */

  const allDecided  = SECTIONS.every(k => sections[k].status === 'accepted' || sections[k].status === 'rejected')
  const hasAccepted = SECTIONS.some(k => sections[k].status === 'accepted')

  const handleSave = useCallback(async () => {
    if (!character) return
    setSaving(true)
    setError('')
    try {
      await createCharacter({
        name:                      name || character.name || 'Personaje derivado',
        role:                      character.role || '',
        personality:               character.personality || '',
        background:                character.background || '',
        goals:                     character.goals || [],
        world_id:                  Number(worldId),
        state:                     character.state || {},
        premise,
        social_position:           character.social_position,
        internal_contradiction:    character.internal_contradiction,
        relation_to_collective_lie: character.relation_to_collective_lie,
        personal_fear:             character.personal_fear,
        faction_affiliation:       character.faction_affiliation,
      })
      navigate(`/worlds/${worldId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('character.create.error'))
    } finally {
      setSaving(false)
    }
  }, [character, name, worldId, premise, navigate, t])

  /* ---------------------------------------------------------------- */
  /* Render                                                            */
  /* ---------------------------------------------------------------- */

  return (
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-3xl mx-auto">
        <PageBreadcrumb items={[
          { label: t('nav.worlds'), href: '/worlds' },
          { label: world?.name ?? 'Mundo', href: `/worlds/${worldId}` },
          { label: t('character.create.derivationTitle') },
        ]} />

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

          {/* Body */}
          <div className="px-6 py-6">

            {installationChecked && !hasInstallation && (
              <div className="mb-6"><NoInstallationBanner /></div>
            )}

            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* World context — pass world to avoid re-fetch */}
            <WorldContextPanel worldId={Number(worldId)} world={world} />

            {/* ── PHASE: PREMISE ── */}
            <AnimatePresence mode="wait">
              {phase === 'premise' && (
                <motion.div
                  key="premise"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="mb-5">
                    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      {t('character.create.nameLabel')}
                    </label>
                    <Input
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
                                   from-amber-500/[0.02] to-transparent
                                   placeholder:text-muted-foreground/40 placeholder:italic
                                   focus:border-solid focus:border-entity-character/40
                                   focus-visible:ring-0 focus-visible:ring-offset-0
                                   focus:shadow-md focus:shadow-amber-500/5 transition-all duration-300"
                      />
                      <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/40">
                        {premise.length}/500
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button" size="lg"
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

            {/* ── PHASE: GENERATING ── */}
            <AnimatePresence>
              {phase === 'generating' && <AIGeneratingIndicator />}
            </AnimatePresence>

            {/* ── PHASE: REVIEWING ── */}
            <AnimatePresence>
              {phase === 'reviewing' && character && (
                <motion.div
                  key="reviewing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Name */}
                  <div className="mb-5">
                    <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                      {t('character.create.nameLabel')}
                    </label>
                    <Input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder={t('character.create.namePlaceholder')}
                      className="border-0 border-b-2 border-amber-200 rounded-none px-0 text-lg
                                 font-[var(--font-display)] placeholder:italic placeholder:text-muted-foreground/40
                                 focus-visible:ring-0 focus-visible:border-entity-character/50 transition-colors"
                    />
                  </div>

                  {/* Separator */}
                  <div className="relative my-5 flex items-center gap-3">
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
                    <span className="text-[9px] font-semibold text-amber-600/50 uppercase tracking-[0.2em]">
                      {i18n.language === 'es' ? 'Resultado de la derivación' : 'Derivation result'}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />
                  </div>

                  {/* ── IDENTIDAD: faction orbit map ── */}
                  <LayerShell
                    sectionKey="identity"
                    status={sections.identity.status}
                    onAccept={() => accept('identity')}
                    onReject={() => reject('identity')}
                    delay={0.05}
                  >
                    <FactionOrbitMap
                      factions={world?.factions ?? []}
                      factionAffiliation={character.faction_affiliation}
                      socialPosition={character.social_position}
                      role={character.role}
                      factionPowerTier={character.faction_power_tier}
                    />
                  </LayerShell>

                  {/* ── TEMPERAMENTO: consciousness plane + membrane ── */}
                  <LayerShell
                    sectionKey="temperament"
                    status={sections.temperament.status}
                    onAccept={() => accept('temperament')}
                    onReject={() => reject('temperament')}
                    delay={0.18}
                  >
                    <ConsciousnessPlane
                      consciousnessState={character.consciousness_state}
                      state={character.relation_to_collective_lie}
                    />
                    <PermeabilityMembrane
                      declared={character.contradiction_declared}
                      operative={character.contradiction_operative}
                      contradiction={character.internal_contradiction}
                    />
                  </LayerShell>

                  {/* ── HISTORIA: prose + fear ── */}
                  <LayerShell
                    sectionKey="history"
                    status={sections.history.status}
                    onAccept={() => accept('history')}
                    onReject={() => reject('history')}
                    delay={0.31}
                  >
                    <div className="space-y-3 mb-1">
                      {character.background && (
                        <p className="text-[13px] text-muted-foreground leading-relaxed font-[var(--font-body)]">
                          {character.background}
                        </p>
                      )}
                      {character.personal_fear && (
                        <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-orange-400">Miedo</span>
                          <p className="text-[12.5px] italic font-[var(--font-display)] text-foreground/80">
                            {character.personal_fear}
                          </p>
                        </div>
                      )}
                    </div>
                  </LayerShell>

                  {/* ── VOLUNTAD: want/need/fear triangle ── */}
                  <LayerShell
                    sectionKey="will"
                    status={sections.will.status}
                    onAccept={() => accept('will')}
                    onReject={() => reject('will')}
                    delay={0.44}
                  >
                    <WantNeedFearTriangle
                      structuredGoals={character.structured_goals}
                      goals={character.goals ?? []}
                      personalFear={character.personal_fear}
                      internalContradiction={character.internal_contradiction}
                      tensions={world?.tensions}
                    />
                  </LayerShell>

                  {/* Save */}
                  <div className="mt-8 space-y-3">
                    <AnimatePresence>
                      {allDecided && hasAccepted && (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                        >
                          <Button
                            type="button" size="lg"
                            className="w-full font-semibold tracking-wide
                                       bg-gradient-to-r from-amber-600 to-orange-500
                                       hover:from-amber-700 hover:to-orange-600
                                       hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5
                                       transition-all duration-200"
                            onClick={handleSave}
                            disabled={saving}
                          >
                            {saving ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('character.create.savingCharacter')}</>
                            ) : (
                              <><Save className="w-4 h-4 mr-2" />{t('character.create.saveCharacter')}</>
                            )}
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => { setPhase('premise'); setSections(initSections()); setCharacter(null) }}
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

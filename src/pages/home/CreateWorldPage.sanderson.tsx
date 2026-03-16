import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Save, Loader2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { useInstallation } from '@/hooks/useInstallation'
import NoInstallationBanner from '@/components/NoInstallationBanner'
import { PhysicalParameterStep } from '@/components/world-creation/PhysicalParameterStep'
import { DerivationLayer } from '@/components/world-creation/DerivationLayer'
import { DerivationProgress } from '@/components/world-creation/DerivationProgress'
import { AIGeneratingIndicator } from '@/components/world-creation/AIGeneratingIndicator'
import {
  useLayeredDerivation,
  GENERATION_LAYERS,
  LAYER_DISPLAY,
} from '@/hooks/useLayeredDerivation'
import { createWorld } from '@/services/api'
import type { WorldLayerType } from '@/services/api'
import type { ExtendedChipStatus } from '@/components/world-creation/DerivationLayer'

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function CreateWorldPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { hasInstallation, checked: installationChecked } = useInstallation()

  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const {
    state,
    setCoreAxis,
    setPhysicalSelections,
    startDerivation,
    generateNextLayer,
    acceptLayer,
    rejectLayer,
    editLayer,
    regenerateLayer,
    getAcceptedContent,
    allLayersDecided,
    hasAcceptedLayers,
    isGenerating,
    canGenerateNext,
  } = useLayeredDerivation()

  // Refs for scroll-to
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    document.title = `${t('pageTitle.createWorld')} -- StoryTeller`
  }, [t, i18n.language])

  // Auto-generate synthesis when society is accepted
  useEffect(() => {
    if (
      state.layers.society.status === 'accepted' &&
      state.layers.synthesis.status === 'idle' &&
      !isGenerating
    ) {
      generateNextLayer()
    }
  }, [state.layers.society.status, state.layers.synthesis.status, isGenerating, generateNextLayer])

  // Update name from synthesis
  useEffect(() => {
    if (state.layers.synthesis.name && !name) {
      setName(state.layers.synthesis.name)
    }
  }, [state.layers.synthesis.name, name])

  /* ---- Handlers ---- */

  const handleDerive = async () => {
    if (!state.coreAxis.trim()) return
    await startDerivation()
  }

  const handleScrollToLayer = (layer: string) => {
    layerRefs.current[layer]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')

    try {
      const synthesis = state.layers.synthesis
      await createWorld({
        name: name || synthesis.name || 'Mundo sin nombre',
        factions: synthesis.factions ?? [],
        description: synthesis.description ?? '',
        core_axis: state.coreAxis,
        environment: getAcceptedContent('physical') ?? '',
        subsistence: getAcceptedContent('biological') ?? '',
        organization: getAcceptedContent('society') ?? '',
        tensions: state.layers.society.tensions ?? '',
        tone: getAcceptedContent('synthesis') ?? '',
      })
      navigate('/worlds')
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('world.create.error'))
    } finally {
      setSaving(false)
    }
  }

  /* ---- Derived values ---- */

  const showLayers = state.phase === 'reviewing' || state.phase === 'generating'
  const error = state.error || saveError

  const layerStatuses: Record<string, ExtendedChipStatus> = {}
  for (const l of GENERATION_LAYERS) {
    layerStatuses[l] = state.layers[l].status
  }

  const revealedLayers = new Set<string>(
    GENERATION_LAYERS.filter(l => state.layers[l].content !== null)
  )

  const hasPendingOrReady = GENERATION_LAYERS.some(
    l => state.layers[l].status === 'ready'
  )

  /* ---- Render ---- */

  return (
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-3xl mx-auto">
        <PageBreadcrumb items={[
          { label: t('nav.worlds'), href: '/worlds' },
          { label: t('world.create.submitButton') },
        ]} />

        {/* Card principal */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="border-b border-border/50 bg-accent/30 px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-foreground font-[var(--font-display)]">
                  {t('world.create.sandersonTitle')}
                </h1>
                <p className="text-sm text-muted-foreground italic mt-0.5">
                  {t('world.create.sandersonSubtitle')}
                </p>
              </div>
            </div>
          </div>

          {/* Content with mini-map */}
          <div className="relative">
            {/* Mini-map sticky (desktop, only when layers visible) */}
            {showLayers && (
              <div className="hidden lg:block absolute right-6 top-6 z-10">
                <div className="sticky top-[120px]">
                  <DerivationProgress
                    layers={GENERATION_LAYERS as unknown as string[]}
                    statuses={layerStatuses}
                    revealedLayers={revealedLayers}
                    onLayerClick={handleScrollToLayer}
                  />
                </div>
              </div>
            )}

            <div className="px-6 py-6 lg:pr-24">
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

              {/* Name input */}
              <div className="mb-6">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  {t('world.create.worldNameLabel')}
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('world.create.worldNamePlaceholder')}
                  className="border-0 border-b-2 border-muted/50 rounded-none px-0 text-lg
                             font-[var(--font-display)] placeholder:italic placeholder:text-muted-foreground/40
                             focus-visible:ring-0 focus-visible:border-primary/50 transition-colors"
                />
              </div>

              {/* Core axis */}
              <div className="mb-6">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  {t('world.create.coreAxisLabel')}
                </label>
                <p className="text-xs text-muted-foreground/70 mb-3 leading-relaxed">
                  {t('world.create.coreAxisDescription')}
                </p>

                <div className="relative">
                  <Textarea
                    value={state.coreAxis}
                    onChange={e => setCoreAxis(e.target.value)}
                    placeholder={t('world.create.coreAxisPlaceholder')}
                    disabled={state.phase === 'generating'}
                    className="min-h-[140px] resize-none text-base leading-relaxed
                               border-2 border-dashed border-primary/25 rounded-xl
                               bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))]
                               from-primary/[0.02] to-transparent
                               placeholder:text-muted-foreground/40 placeholder:italic
                               focus:border-solid focus:border-primary/40
                               focus-visible:ring-0 focus-visible:ring-offset-0
                               focus:shadow-md focus:shadow-primary/5
                               transition-all duration-300"
                  />
                  <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/40">
                    {state.coreAxis.length}/500
                  </span>
                </div>
              </div>

              {/* Physical parameters + derive button (input phase only) */}
              <AnimatePresence mode="wait">
                {state.phase === 'input' && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <PhysicalParameterStep
                      coreAxis={state.coreAxis}
                      selections={state.physicalSelections}
                      onSelectionsChange={setPhysicalSelections}
                      onDerive={handleDerive}
                      disabled={!state.coreAxis.trim() || !hasInstallation}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* First-layer generating indicator (full-page animation) */}
              <AnimatePresence>
                {state.phase === 'generating' && !revealedLayers.size && (
                  <AIGeneratingIndicator />
                )}
              </AnimatePresence>

              {/* Generated layers */}
              <AnimatePresence>
                {showLayers && revealedLayers.size > 0 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Separator */}
                    <div className="relative my-8 flex items-center gap-3">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                      <span className="text-[10px] font-semibold text-primary/50 uppercase tracking-[0.2em]">
                        {t('world.create.derivedLayersLabel')}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    </div>

                    {/* Mobile mini-map */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                      {GENERATION_LAYERS.map((layer) => {
                        const meta = LAYER_DISPLAY[layer]
                        const status = state.layers[layer].status
                        return (
                          <button
                            key={layer}
                            type="button"
                            onClick={() => handleScrollToLayer(layer)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] transition-all ${
                              status === 'accepted'
                                ? `${meta.color.replace('text-', 'bg-')} ${meta.color.replace('text-', 'border-')} text-white`
                                : status === 'generating'
                                  ? `${meta.color.replace('text-', 'border-')} bg-transparent animate-pulse`
                                  : `border-muted-foreground/20 bg-muted/30`
                            }`}
                            aria-label={meta.label}
                          >
                            {status === 'accepted' ? '\u2713' : meta.icon}
                          </button>
                        )
                      })}
                    </div>

                    {/* The layers */}
                    <div className="space-y-4">
                      {GENERATION_LAYERS.map((layer, idx) => {
                        const ls = state.layers[layer]
                        if (ls.status === 'idle') return null

                        return (
                          <div
                            key={layer}
                            ref={el => { layerRefs.current[layer] = el }}
                          >
                            <DerivationLayer
                              layerKey={layer}
                              layerMeta={LAYER_DISPLAY[layer]}
                              suggestion={ls.editedContent ?? ls.content}
                              cascadeDelay={idx * 180}
                              isRevealed={ls.content !== null}
                              onReveal={() => {}}
                              onSuggestionAccept={(k) => acceptLayer(k as WorldLayerType)}
                              onSuggestionReject={(k) => rejectLayer(k as WorldLayerType)}
                              onSuggestionEdit={(k, text) => editLayer(k as WorldLayerType, text)}
                              chipStatus={ls.status === 'ready' ? 'pending' : ls.status as ExtendedChipStatus}
                              onRegenerate={() => regenerateLayer(layer)}
                            />
                          </div>
                        )
                      })}
                    </div>

                    {/* Actions */}
                    <div className="mt-8 space-y-3">

                      {/* Generate next layer button */}
                      <AnimatePresence>
                        {canGenerateNext && !isGenerating && state.currentStep > 0 && state.currentStep < GENERATION_LAYERS.length && !hasPendingOrReady && (
                          <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -8 }}
                          >
                            <Button
                              type="button"
                              onClick={generateNextLayer}
                              className="w-full font-semibold tracking-wide"
                              size="lg"
                            >
                              <ChevronRight className="w-4 h-4 mr-2" />
                              {t('world.create.generateNextLayer')}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Per-layer generating indicator */}
                      {isGenerating && revealedLayers.size > 0 && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center py-2">
                          <Loader2 className="w-4 h-4 animate-spin text-primary/50" />
                          {t('world.create.generatingLayer')}
                        </div>
                      )}

                      {/* Save button */}
                      <AnimatePresence>
                        {allLayersDecided && hasAcceptedLayers && (
                          <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                          >
                            <Button
                              type="button"
                              size="lg"
                              className="w-full font-semibold tracking-wide
                                         bg-gradient-to-r from-primary to-primary/90
                                         hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5
                                         transition-all duration-200"
                              onClick={handleSave}
                              disabled={saving}
                            >
                              {saving ? (
                                <>
                                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  {t('world.create.saving')}
                                </>
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  {t('world.create.saveWorld')}
                                </>
                              )}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Re-edit axis */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setCoreAxis(state.coreAxis)
                            // Reset layers but keep axis
                            window.location.reload() // Simple reset for now
                          }}
                          className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition underline underline-offset-2"
                        >
                          {t('world.create.reEditAxis')}
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
    </div>
  )
}

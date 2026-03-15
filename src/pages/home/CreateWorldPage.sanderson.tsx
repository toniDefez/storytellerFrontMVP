/**
 * CreateWorldPage -- Rediseno Sanderson
 *
 * ============================================================
 * DOCUMENTO DE DISENO DE INTERFAZ COMPLETO
 * ============================================================
 *
 * A) PANTALLA DE CREACION
 *
 * LAYOUT GENERAL:
 * +---------------------------------------------------------+
 * |  Breadcrumb: Mundos > Crear mundo                       |
 * +---------------------------------------------------------+
 * |                                                         |
 * |  [Card principal - max-w-3xl centrada]                  |
 * |                                                         |
 * |  +---------------------------------------------------+  |
 * |  |  Header con icono de pluma + titulo serif          |  |
 * |  |  "Define el corazon de tu mundo"                   |  |
 * |  +---------------------------------------------------+  |
 * |  |                                          | Mini-  ||  |
 * |  |  NOMBRE DEL MUNDO                        | mapa   ||  |
 * |  |  [Input con placeholder literario]       | (sticky||  |
 * |  |                                          |  der.) ||  |
 * |  |  ─── El eje central ───                  |        ||  |
 * |  |                                          |  O eje ||  |
 * |  |  +-------------------------------------+ |  O ent ||  |
 * |  |  | Textarea grande, prominente,        | |  O sub ||  |
 * |  |  | con placeholder:                    | |  O org ||  |
 * |  |  | "En este mundo..."                  | |  O ten ||  |
 * |  |  | borde primary punteado              | |  O ton ||  |
 * |  |  | min-height 120px                    | |        ||  |
 * |  |  +-------------------------------------+ |        ||  |
 * |  |                                          |        ||  |
 * |  |  [Boton "Derivar mundo" -- grande, primary,       ||  |
 * |  |   con icono de varita/estrella]          |        ||  |
 * |  |                                          |        ||  |
 * |  |  ─── Estado post-derivacion ───          |        ||  |
 * |  |                                          |        ||  |
 * |  |  Capas aparecen en CASCADA:              |        ||  |
 * |  |                                          |        ||  |
 * |  |  | Entorno                               |        ||  |
 * |  |  |   [SuggestionChip]                    |        ||  |
 * |  |  |                                       |        ||  |
 * |  |  | Subsistencia        (delay: 200ms)    |        ||  |
 * |  |  |   [SuggestionChip]                    |        ||  |
 * |  |  |                                       |        ||  |
 * |  |  | Organizacion        (delay: 400ms)    |        ||  |
 * |  |  |   [SuggestionChip]                    |        ||  |
 * |  |  |                                       |        ||  |
 * |  |  | Tensiones           (delay: 600ms)    |        ||  |
 * |  |  |   [SuggestionChip]                    |        ||  |
 * |  |  |                                       |        ||  |
 * |  |  | Tono narrativo      (delay: 800ms)    |        ||  |
 * |  |  |   [SuggestionChip]                    |        ||  |
 * |  |  |                                       |        ||  |
 * |  |  ─── Profundizacion (opcional) ───       |        ||  |
 * |  |                                          |        ||  |
 * |  |  [Acordeones: Facciones, Miedo           |        ||  |
 * |  |   colectivo, Mentira, Vulnerabilidad]    |        ||  |
 * |  |                                          |        ||  |
 * |  |  [Boton "Aceptar todo"]                  |        ||  |
 * |  |  [Boton "Guardar mundo" -- grande]       |        ||  |
 * |  +---------------------------------------------------+  |
 * +---------------------------------------------------------+
 *
 * ESPECIFICACIONES DE DISENO:
 *
 * Header de la card:
 * - bg: accent/30 (off-white purpureo)
 * - border-bottom: border/50
 * - Icono: pluma estilizada en un cuadrado redondeado bg-primary/10
 * - Titulo: font-display (Lora), text-xl, text-foreground
 * - Subtitulo: text-sm, text-muted-foreground, italico
 *
 * Input de nombre:
 * - Aparece ANTES del eje (el nombre puede ser provisorio)
 * - font-display (Lora) en el valor escrito, text-lg
 * - Placeholder: "Aun sin nombre..." en italic muted
 * - Border bottom-only (underline style, no rectangle)
 * - Al focus: border-primary con transicion suave
 *
 * Textarea del eje central:
 * - PROMINENTE: es el protagonista de la pagina
 * - min-h-[140px], text-base, leading-relaxed
 * - Border: 2px dashed primary/30, radius-xl
 * - Background: white con sutil gradiente radial primary/3 en el centro
 * - Placeholder: "En este mundo, la lluvia nunca cesa..."
 * - Al focus: border solid primary/50, shadow-md shadow-primary/5
 * - font-body (Source Sans 3)
 *
 * Boton "Derivar mundo":
 * - w-full, size lg, variant default (primary)
 * - Icono: Sparkles (lucide) a la izquierda
 * - Texto: font-semibold, tracking-wide
 * - Hover: translateY(-1px), shadow-lg shadow-primary/25
 * - Disabled cuando el eje esta vacio o AI no disponible
 * - Spring animation en hover (stiffness: 400, damping: 18)
 *
 * Cascada de capas:
 * - Cada DerivationLayer tiene delay incremental: 0, 200, 400, 600, 800ms
 * - Entra desde y:20, opacity:0, scale:0.97
 * - Separador visual entre capas: linea muy sutil (1px muted/20)
 * - Barra lateral izquierda con color de la capa (2px, opacity 40%)
 *
 * Mini-mapa (DerivationProgress):
 * - Sticky en desktop (top: 120px, right side)
 * - Hidden en mobile, reemplazado por barra horizontal compact
 * - 6 nodos: 1 (eje) + 5 (capas)
 * - Conectados por linea vertical delgada
 * - Click en nodo scrollea a esa seccion
 *
 * Boton "Aceptar todo":
 * - variant outline, text-sm
 * - Aparece solo cuando hay chips pendientes
 * - Click: anima todos los chips a "accepted" secuencialmente (100ms entre cada uno)
 *
 * Boton "Guardar mundo":
 * - Aparece solo cuando todas las capas estan aceptadas
 * - w-full, size lg
 * - Transicion de entrada: slide-up con opacity
 * - Gradiente de fondo: from-primary to-primary/90
 *
 * COLORES ESPECIFICOS:
 * - Eje central area: bg-white, border-primary/30 dashed
 * - Capa Entorno: emerald-600 accent
 * - Capa Subsistencia: amber-600 accent
 * - Capa Organizacion: blue-600 accent
 * - Capa Tensiones: rose-600 accent
 * - Capa Tono: violet-600 accent
 *
 * TIPOGRAFIA:
 * - Titulo card: Lora 20px semibold
 * - Labels de seccion: Source Sans 3, 11px, uppercase, tracking-widest, semibold
 * - Nombre del mundo: Lora 18px (en el input)
 * - Eje central: Source Sans 3, 16px, leading-relaxed
 * - Nombres de capa: Source Sans 3, 12px, uppercase, tracking-widest, color de capa
 * - Texto de sugerencia: Source Sans 3, 14px, leading-relaxed
 * - Botones: Source Sans 3, 14px, font-semibold
 *
 * SPACING:
 * - Card padding: px-6 (mobile px-4)
 * - Entre secciones: 24px (space-6)
 * - Entre capas: 16px (space-4)
 * - Chip padding: px-4 py-3
 * - Boton height lg: 44px (accesibilidad tactil)
 */

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, BookOpen, Save, CheckCheck, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { useInstallation } from '@/hooks/useInstallation'
import NoInstallationBanner from '@/components/NoInstallationBanner'
import { DerivationLayer, type LayerKey, LAYER_META } from '@/components/world-creation/DerivationLayer'
import { DerivationProgress } from '@/components/world-creation/DerivationProgress'
import { AIGeneratingIndicator } from '@/components/world-creation/AIGeneratingIndicator'
import type { ChipStatus } from '@/components/world-creation/SuggestionChip'
import { deriveWorld, createWorld } from '../../services/api'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface DerivedLayers {
  [key: string]: string
  environment: string
  subsistence: string
  organization: string
  tensions: string
  tone: string
}

type Phase = 'axis' | 'generating' | 'reviewing' | 'saving'

const LAYER_ORDER: LayerKey[] = ['environment', 'subsistence', 'organization', 'tensions', 'tone']
const CASCADE_DELAY = 180 // ms between each layer reveal

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function CreateWorldPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { hasInstallation, checked: installationChecked } = useInstallation()

  // --- State ---
  const [phase, setPhase] = useState<Phase>('axis')
  const [name, setName] = useState('')
  const [coreAxis, setCoreAxis] = useState('')
  const [derived, setDerived] = useState<DerivedLayers | null>(null)
  const [chipStatuses, setChipStatuses] = useState<Record<LayerKey, ChipStatus>>({
    environment: 'pending',
    subsistence: 'pending',
    organization: 'pending',
    tensions: 'pending',
    tone: 'pending',
  })
  const [revealedLayers, setRevealedLayers] = useState<Set<LayerKey>>(new Set())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // Refs para scroll-to
  const layerRefs = useRef<Record<LayerKey, HTMLDivElement | null>>({
    environment: null,
    subsistence: null,
    organization: null,
    tensions: null,
    tone: null,
  })

  useEffect(() => {
    document.title = `${t('pageTitle.createWorld')} -- StoryTeller`
  }, [t, i18n.language])

  // --- Handlers ---

  const handleDerive = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!coreAxis.trim()) return

    setPhase('generating')
    setError('')

    try {
      const result = await deriveWorld(coreAxis)
      setDerived({
        environment: result.environment,
        subsistence: result.subsistence,
        organization: result.organization,
        tensions: result.tensions,
        tone: result.tone,
      })
      if (result.name && !name) {
        setName(result.name)
      }
      setChipStatuses({
        environment: 'pending',
        subsistence: 'pending',
        organization: 'pending',
        tensions: 'pending',
        tone: 'pending',
      })
      setRevealedLayers(new Set())
      setPhase('reviewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('world.create.deriveError'))
      setPhase('axis')
    }
  }

  const handleAcceptLayer = (layer: LayerKey) => {
    setChipStatuses(prev => ({ ...prev, [layer]: 'accepted' }))
  }

  const handleRejectLayer = (layer: LayerKey) => {
    setChipStatuses(prev => ({ ...prev, [layer]: 'rejected' }))
  }

  const handleEditLayer = (layer: LayerKey, newText: string) => {
    if (!derived) return
    setDerived(prev => prev ? { ...prev, [layer]: newText } : prev)
    setChipStatuses(prev => ({ ...prev, [layer]: 'accepted' }))
  }

  const handleRevealLayer = (layer: LayerKey) => {
    setRevealedLayers(prev => new Set([...prev, layer]))
  }

  const handleAcceptAll = () => {
    LAYER_ORDER.forEach((layer, idx) => {
      setTimeout(() => {
        setChipStatuses(prev => ({ ...prev, [layer]: 'accepted' }))
      }, idx * 100)
    })
  }

  const handleScrollToLayer = (layer: LayerKey) => {
    layerRefs.current[layer]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const allAccepted = LAYER_ORDER.every(l => chipStatuses[l] === 'accepted' || chipStatuses[l] === 'rejected')
  const hasPending = LAYER_ORDER.some(l => chipStatuses[l] === 'pending')
  const acceptedLayers = LAYER_ORDER.filter(l => chipStatuses[l] === 'accepted')

  const handleSave = async () => {
    if (!derived) return
    setSaving(true)
    setError('')

    try {
      const acceptedData: Record<string, string> = {}
      for (const layer of LAYER_ORDER) {
        if (chipStatuses[layer] === 'accepted') {
          acceptedData[layer] = derived[layer]
        }
      }

      await createWorld({
        name: name || 'Mundo sin nombre',
        era: '',
        climate: '',
        politics: '',
        culture: '',
        factions: [],
        description: '',
        core_axis: coreAxis,
        environment: acceptedData.environment || '',
        subsistence: acceptedData.subsistence || '',
        organization: acceptedData.organization || '',
        tensions: acceptedData.tensions || '',
        tone: acceptedData.tone || '',
      })
      navigate('/worlds')
    } catch (err) {
      setError(err instanceof Error ? err.message : t('world.create.error'))
    } finally {
      setSaving(false)
    }
  }

  // --- Render ---

  return (
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-3xl mx-auto">
        <PageBreadcrumb items={[
          { label: t('nav.worlds'), href: '/worlds' },
          { label: t('world.create.submitButton') },
        ]} />

        {/* Card principal */}
        <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden">

          {/* ─── Header ─── */}
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

          {/* ─── Contenido con mini-mapa ─── */}
          <div className="relative">
            {/* Mini-mapa sticky (solo desktop, solo en fase reviewing) */}
            {phase === 'reviewing' && derived && (
              <div className="hidden lg:block absolute right-6 top-6 z-10">
                <div className="sticky top-[120px]">
                  <DerivationProgress
                    layers={LAYER_ORDER}
                    statuses={chipStatuses}
                    revealedLayers={revealedLayers}
                    onLayerClick={handleScrollToLayer}
                  />
                </div>
              </div>
            )}

            <div className="px-6 py-6 lg:pr-24">
              {/* Banner sin instalacion */}
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

              {/* ─── Nombre del mundo ─── */}
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

              {/* ─── Eje central ─── */}
              <div className="mb-6">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  {t('world.create.coreAxisLabel')}
                </label>
                <p className="text-xs text-muted-foreground/70 mb-3 leading-relaxed">
                  {t('world.create.coreAxisDescription')}
                </p>

                <form onSubmit={handleDerive}>
                  <div className="relative">
                    <Textarea
                      value={coreAxis}
                      onChange={e => setCoreAxis(e.target.value)}
                      placeholder={t('world.create.coreAxisPlaceholder')}
                      disabled={phase === 'generating'}
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

                    {/* Contador de caracteres */}
                    <span className="absolute bottom-3 right-3 text-[10px] text-muted-foreground/40">
                      {coreAxis.length}/500
                    </span>
                  </div>

                  {/* Boton derivar */}
                  <AnimatePresence mode="wait">
                    {phase === 'axis' && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2 }}
                        className="mt-4"
                      >
                        <Button
                          type="submit"
                          size="lg"
                          className="w-full font-semibold tracking-wide"
                          disabled={!coreAxis.trim() || !hasInstallation}
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          {t('world.create.deriveButton')}
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </form>
              </div>

              {/* ─── Indicador de generacion ─── */}
              <AnimatePresence>
                {phase === 'generating' && <AIGeneratingIndicator />}
              </AnimatePresence>

              {/* ─── Capas derivadas (post-derivacion) ─── */}
              <AnimatePresence>
                {phase === 'reviewing' && derived && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Separador */}
                    <div className="relative my-8 flex items-center gap-3">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                      <span className="text-[10px] font-semibold text-primary/50 uppercase tracking-[0.2em]">
                        {t('world.create.derivedLayersLabel')}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
                    </div>

                    {/* Mini-mapa mobile (horizontal) */}
                    <div className="lg:hidden flex items-center justify-center gap-2 mb-6">
                      {LAYER_ORDER.map((layer) => {
                        const meta = LAYER_META[layer]
                        const status = chipStatuses[layer]
                        return (
                          <button
                            key={layer}
                            type="button"
                            onClick={() => handleScrollToLayer(layer)}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[8px] transition-all ${
                              status === 'accepted'
                                ? `${meta.color.replace('text-', 'bg-')} ${meta.color.replace('text-', 'border-')} text-white`
                                : `border-muted-foreground/20 bg-muted/30`
                            }`}
                            aria-label={meta.label}
                          >
                            {status === 'accepted' ? '\u2713' : meta.icon}
                          </button>
                        )
                      })}
                    </div>

                    {/* Las 5 capas */}
                    <div className="space-y-4">
                      {LAYER_ORDER.map((layer, idx) => (
                        <div
                          key={layer}
                          ref={el => { layerRefs.current[layer] = el }}
                        >
                          <DerivationLayer
                            layerKey={layer}
                            suggestion={derived[layer]}
                            cascadeDelay={idx * CASCADE_DELAY}
                            isRevealed={revealedLayers.has(layer)}
                            onReveal={() => handleRevealLayer(layer)}
                            onSuggestionAccept={handleAcceptLayer}
                            onSuggestionReject={handleRejectLayer}
                            onSuggestionEdit={handleEditLayer}
                            chipStatus={chipStatuses[layer]}
                          />
                        </div>
                      ))}
                    </div>

                    {/* ─── Acciones finales ─── */}
                    <div className="mt-8 space-y-3">
                      {/* Aceptar todo (solo si hay pendientes) */}
                      <AnimatePresence>
                        {hasPending && revealedLayers.size === 5 && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                          >
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="w-full text-sm"
                              onClick={handleAcceptAll}
                            >
                              <CheckCheck className="w-4 h-4 mr-2" />
                              {t('world.create.acceptAll')}
                            </Button>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Guardar mundo (solo si todo aceptado) */}
                      <AnimatePresence>
                        {allAccepted && acceptedLayers.length > 0 && (
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

                      {/* Re-derivar */}
                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setPhase('axis')}
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

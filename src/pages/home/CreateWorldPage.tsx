import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Server, Wand2, Sparkles, Feather, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { useInstallation } from '@/hooks/useInstallation'
import {
  generateWorld,
  getJobStatus,
  getGenerationProgress,
  refinePremise,
  suggestPremises,
  createWorldFromSeed,
} from '@/services/api'
import type { SeedTemplateBrief } from '@/services/api'
import { SeedTemplatePicker } from '@/components/SeedTemplatePicker'
import { BrainstormStep } from '@/components/brainstorm/BrainstormStep'
import type { BrainstormCard } from '@/services/api'
import { notifyError } from '@/lib/notifyError'
import { toast } from 'sonner'
import { ManualWorldForm } from '@/components/ManualWorldForm'

const POLL_INTERVAL_MS = 2000
// El backend da 5 minutos a la tarea; con 2 la app se rendía mientras el
// mundo se seguía creando con un modelo lento.
const POLL_TIMEOUT_MS = 6 * 60_000

export default function CreateWorldPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { hasInstallation, loading: installLoading, checked } = useInstallation()

  const [premise, setPremise] = useState('')
  const [selectedSeed, setSelectedSeed] = useState<SeedTemplateBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  // Fase real del generador (la tarea usa su id como identificador de
  // petición): antes eran mensajes rotando con un temporizador.
  const [progress, setProgress] = useState('Preparando…')
  const [step, setStep] = useState<'premise' | 'brainstorm' | 'generating'>('premise')

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [refining, setRefining] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollStartRef = useRef<number>(0)
  // Si la persona se va de la página, ni se sigue preguntando ni se la
  // arrastra al mundo nuevo cuando termine.
  const leftRef = useRef(false)

  useEffect(() => {
    document.title = `Crear Mundo — StoryTeller`
  }, [i18n.language])

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  useEffect(() => {
    if (textareaRef.current) autoResize(textareaRef.current)
  }, [premise])

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  useEffect(() => {
    leftRef.current = false
    return () => {
      leftRef.current = true
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current)
    }
  }, [])

  // Si falla o se agota el tiempo, se vuelve a la premisa (que se conserva)
  // con el error a la vista. Antes el spinner seguía para siempre y no había
  // forma de volver.
  const failGeneration = (message: string) => {
    stopPolling()
    setError(message)
    setLoading(false)
    setStep('premise')
  }

  const startPolling = (jobId: string) => {
    pollStartRef.current = Date.now()
    setProgress('Preparando…')
    pollIntervalRef.current = setInterval(async () => {
      const seconds = Math.round((Date.now() - pollStartRef.current) / 1000)
      getGenerationProgress(jobId)
        .then(({ runs }) => {
          const current = runs.find(r => r.status === 'running') ?? runs[runs.length - 1]
          setProgress(current?.phase ? `${current.phase} · ${seconds} s` : `Esperando al generador · ${seconds} s`)
        })
        .catch(() => {})  // informativo: si falla, la creación sigue
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        failGeneration('La generación tardó demasiado. Inténtalo de nuevo.')
        return
      }
      try {
        const job = await getJobStatus(jobId)
        if (leftRef.current) return
        if (job.status === 'done') {
          stopPolling()
          navigate(`/worlds/${job.world_id}`)
        } else if (job.status === 'error') {
          failGeneration(job.error || 'Error generando el mundo')
        }
      } catch {
        // transient network error — keep polling
      }
    }, POLL_INTERVAL_MS)
  }

  const handleSuggest = async () => {
    setSuggesting(true)
    setSuggestions([])
    try {
      const result = await suggestPremises()
      setSuggestions(result.premises ?? [])
    } catch (err) {
      notifyError('No se pudieron sugerir ideas')(err)
    } finally {
      setSuggesting(false)
    }
  }

  const handleRefine = async () => {
    if (!premise.trim()) return
    setRefining(true)
    setSuggestions([])
    try {
      const result = await refinePremise(premise.trim())
      if (result.premise && result.premise.trim() !== premise.trim()) {
        setPremise(result.premise)
      } else {
        toast.info('La premisa ya tiene lo esencial: no hay nada que añadir.')
      }
    } catch (err) {
      notifyError('No se pudo enriquecer la premisa')(err)
    } finally {
      setRefining(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!premise.trim()) return
    setError('')
    setStep('brainstorm')
  }

  const handleGenerate = async (keepers: BrainstormCard[]) => {
    setStep('generating')
    setLoading(true)
    setError('')
    try {
      const keeperTexts = keepers.map(k => k.content)
      if (selectedSeed) {
        let enrichedPremise = premise.trim()
        if (keeperTexts.length > 0) {
          enrichedPremise += '\n\nDecisiones creativas del usuario:\n' + keeperTexts.map((k, i) => `${i + 1}. ${k}`).join('\n')
        }
        const { job_id } = await createWorldFromSeed(selectedSeed.id, selectedSeed.title, enrichedPremise)
        startPolling(job_id)
      } else {
        let enrichedPremise = premise.trim()
        if (keeperTexts.length > 0) {
          enrichedPremise += '\n\nDecisiones creativas del usuario:\n' + keeperTexts.map((k, i) => `${i + 1}. ${k}`).join('\n')
        }
        const { job_id } = await generateWorld(enrichedPremise)
        startPolling(job_id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error iniciando la generación')
      setLoading(false)
      setStep('premise')
    }
  }

  const handleSkipBrainstorm = () => handleGenerate([])

  if (installLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (checked && !hasInstallation) {
    return (
      <div className="flex justify-center items-start min-h-[80vh] py-4">
        <div className="w-full max-w-xl mx-auto mt-16 px-4">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Server className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-bold">{t('installation.guardTitle')}</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t('installation.guardDesc')}</p>
              <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
                <Button onClick={() => navigate('/settings?tab=installation')}>
                  {t('installation.guardGoSettings')}
                </Button>
                <Button variant="ghost" onClick={() => navigate('/worlds')}>
                  {t('installation.guardGoBack')}
                </Button>
              </div>
              <div className="max-w-xs mx-auto pt-4 border-t border-border">
                <ManualWorldForm />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[80vh] px-4 w-full">
      <div className="w-full">
        <PageBreadcrumb items={[
          { label: t('nav.worlds'), href: '/worlds' },
          { label: t('world.create.title') },
        ]} />

        {error && (
          <Alert variant="destructive" className="mb-4 max-w-[640px] mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-[640px] mx-auto pt-6 md:pt-12"
        >
          {/* ── Header ── */}
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-5"
              style={{ backgroundColor: 'hsl(260 35% 93%)', border: '1px solid hsl(260 30% 86%)' }}>
              <Feather className="w-5 h-5" style={{ color: 'hsl(260 38% 40%)' }} />
            </div>
            <h1
              className="text-[2rem] md:text-[2.5rem] leading-[1.15] font-light tracking-[-0.01em] text-foreground mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Todo mundo comienza<br />
              con una premisa
            </h1>
            <p
              className="text-[0.95rem] leading-relaxed max-w-sm mx-auto"
              style={{ color: 'hsl(30 6% 47%)', fontFamily: 'var(--font-body)' }}
            >
              Una frase que contiene la semilla de todo lo que vendrá.
            </p>
          </div>

          {step === 'generating' || loading ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(260 38% 40%)' }} />
              <p
                className="text-sm text-center transition-all duration-500"
                style={{ color: 'hsl(30 6% 47%)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
              >
                <span role="status" aria-live="polite">{progress}</span>
              </p>
            </div>
          ) : step === 'brainstorm' ? (
            <div>
              <motion.button
                type="button"
                onClick={() => setStep('premise')}
                className="flex items-center gap-1.5 text-xs mb-6 cursor-pointer"
                style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 38% 40%)' }}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver a la premisa</span>
              </motion.button>
              <BrainstormStep
                premise={premise}
                onDone={handleGenerate}
                onSkip={handleSkipBrainstorm}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* ── Premise textarea: lo importante, primero ── */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <label
                    className="text-[10px] tracking-[0.2em] uppercase"
                    style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 30% 58%)' }}
                  >
                    La premisa
                  </label>
                  {premise.trim() ? (
                    <motion.button
                      type="button"
                      onClick={handleRefine}
                      disabled={refining}
                      className="flex items-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer"
                      style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 38% 40%)' }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {refining ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="italic" style={{ fontFamily: 'var(--font-display)', color: 'hsl(260 30% 58%)' }}>
                            enriqueciendo...
                          </span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3.5 w-3.5" />
                          <span>Enriquecer</span>
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={handleSuggest}
                      disabled={suggesting}
                      className="flex items-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer"
                      style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 38% 40%)' }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {suggesting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="italic" style={{ fontFamily: 'var(--font-display)', color: 'hsl(260 30% 58%)' }}>
                            pensando…
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Proponme una</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
                <textarea
                  ref={textareaRef}
                  value={premise}
                  onChange={e => {
                    setPremise(e.target.value)
                    autoResize(e.target)
                  }}
                  className="w-full resize-none outline-none text-[1.05rem] leading-[1.75] placeholder:text-muted-foreground/35"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 300,
                    color: 'hsl(30 8% 20%)',
                    background: 'transparent',
                    borderBottom: '1px solid hsl(260 30% 86%)',
                    paddingBottom: '0.75rem',
                    overflow: 'hidden',
                  }}
                  rows={2}
                  placeholder="Una frase: quién quiere qué, y qué se lo impide."
                  required
                />
              </div>

              {/* ── Suggestions ── */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="mb-8"
                  >
                    <p
                      className="text-[10px] tracking-[0.15em] uppercase mb-3"
                      style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 30% 58%)' }}
                    >
                      Elige una, o deja que te inspire
                    </p>
                    <div className="flex flex-col gap-2">
                      {suggestions.map((s, i) => (
                        <motion.button
                          key={i}
                          type="button"
                          onClick={() => { setPremise(s); setSuggestions([]) }}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.3 }}
                          className="group text-left rounded-lg px-4 py-3 transition-all duration-200 cursor-pointer"
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontStyle: 'italic',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            color: 'hsl(30 8% 35%)',
                            backgroundColor: 'hsl(260 25% 96%)',
                            border: '1px solid hsl(260 20% 90%)',
                          }}
                          whileHover={{
                            backgroundColor: 'hsl(260 30% 94%)',
                            borderColor: 'hsl(260 30% 82%)',
                            x: 4,
                          }}
                        >
                          <span className="block">{s}</span>
                          <span
                            className="block mt-1 text-[10px] tracking-[0.1em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{ fontFamily: 'var(--font-ui)', fontStyle: 'normal', color: 'hsl(260 38% 40%)' }}
                          >
                            Usar esta premisa
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Plantillas, como atajo ── */}
              <SeedTemplatePicker selected={selectedSeed} onSelect={setSelectedSeed} />

              {/* ── Submit ── */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-[0.9rem] tracking-[0.03em]"
                  style={{ fontFamily: 'var(--font-ui)' }}
                  disabled={loading || !premise.trim()}
                >
                  {selectedSeed ? `Crear desde "${selectedSeed.title}"` : 'Generar mundo'}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}

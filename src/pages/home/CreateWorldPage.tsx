import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Server, Sparkles, Feather, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { useInstallation } from '@/hooks/useInstallation'
import { createWorld, refinePremise, suggestPremises } from '@/services/api'
import type { RefinedPremise, WorldInput } from '@/services/api'
import { BrainstormStep } from '@/components/brainstorm/BrainstormStep'
import type { BrainstormCard } from '@/services/api'
import { notifyError } from '@/lib/notifyError'
import { toast } from 'sonner'
import { ManualWorldForm } from '@/components/ManualWorldForm'
import { LINES } from '@/components/world/worldLines'

type Step = 'premise' | 'brainstorm' | 'reading' | 'creating'

/**
 * Crear un mundo (escena 0, acto 1): la premisa, el brainstorm opcional y la
 * lectura del generador, «Así entiendo tu mundo»: nombre, premisa enriquecida
 * y las tres líneas (qué es siempre verdad, qué falta, quién manda). El autor
 * corrige o deja, y «Crear mundo» guarda. No hay generación en segundo plano
 * ni árbol: el mundo son estas líneas y los lugares que vienen después.
 */
export default function CreateWorldPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { hasInstallation, loading: installLoading, checked } = useInstallation()

  const [premise, setPremise] = useState('')
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('premise')
  const [reading, setReading] = useState<WorldInput>({ name: '', premise: '', description: '', rule: '', scarcity: '', power: '' })
  const [readingSeconds, setReadingSeconds] = useState(0)
  const [proposingLine, setProposingLine] = useState<null | 'rule' | 'scarcity' | 'power'>(null)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])
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

  useEffect(() => {
    leftRef.current = false
    return () => { leftRef.current = true }
  }, [])

  // Contador mientras se lee la premisa: el 12B tarda entre 20 y 60 s.
  useEffect(() => {
    if (step !== 'creating' || reading.name || reading.premise) return
    const started = Date.now()
    const timer = setInterval(() => setReadingSeconds(Math.round((Date.now() - started) / 1000)), 1000)
    return () => clearInterval(timer)
  }, [step, reading.name, reading.premise])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!premise.trim()) return
    setError('')
    setStep('brainstorm')
  }

  const enrichedWith = (keepers: BrainstormCard[]) => {
    let enriched = premise.trim()
    const texts = keepers.map(k => k.content)
    if (texts.length > 0) {
      enriched += '\n\nDecisiones creativas del usuario:\n' + texts.map((k, i) => `${i + 1}. ${k}`).join('\n')
    }
    return enriched
  }

  // La lectura nunca bloquea: si el generador falla o devuelve menos de lo
  // pedido, la pantalla enseña lo que haya (vacíos con «Proponme») y deja crear.
  const readWorld = async (keepers: BrainstormCard[]) => {
    const enriched = enrichedWith(keepers)
    setStep('creating')
    setReading({ name: '', premise: '', description: '', rule: '', scarcity: '', power: '' })
    setReadingSeconds(0)
    let r: Partial<RefinedPremise> = {}
    try {
      r = await refinePremise(enriched)
    } catch (err) {
      notifyError('No se pudo leer la premisa; puedes rellenarla a mano')(err)
    }
    if (leftRef.current) return
    setReading({
      name: r.name ?? '',
      premise: (r.premise ?? '').trim() || enriched,
      description: '',
      rule: r.rule ?? '',
      scarcity: r.scarcity ?? '',
      power: r.power ?? '',
    })
    setStep('reading')
  }

  const proposeLine = async (key: 'rule' | 'scarcity' | 'power') => {
    setProposingLine(key)
    try {
      const r = await refinePremise(reading.premise.trim() || premise.trim())
      if (r[key]) setReading(prev => ({ ...prev, [key]: r[key] }))
      else toast.info('El generador no ha propuesto nada para esta línea.')
    } catch (err) {
      notifyError('No se pudo proponer')(err)
    } finally {
      setProposingLine(null)
    }
  }

  const [creating, setCreating] = useState(false)
  const handleCreate = async () => {
    const name = reading.name.trim() || premise.trim().slice(0, 60)
    if (!name) return
    setCreating(true)
    setError('')
    try {
      const { id } = await createWorld({ ...reading, name, premise: reading.premise.trim() || premise.trim() })
      navigate(`/worlds/${id}?tab=locations`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el mundo')
      setCreating(false)
    }
  }

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

  const FIELD = 'w-full rounded-md border border-border/60 bg-background px-3 py-2.5 min-h-11 text-sm leading-relaxed outline-none focus:border-primary/50'

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
          {step !== 'reading' && (
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
          )}

          {step === 'creating' ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(260 38% 40%)' }} />
              <p
                className="text-sm text-center"
                style={{ color: 'hsl(30 6% 47%)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
              >
                <span role="status" aria-live="polite">Leyendo tu mundo… {readingSeconds > 0 ? `${readingSeconds} s` : ''}</span>
              </p>
            </div>
          ) : step === 'reading' ? (
            <div className="space-y-7">
              <motion.button
                type="button"
                onClick={() => setStep('premise')}
                className="flex items-center gap-1.5 text-xs cursor-pointer min-h-10"
                style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 38% 40%)' }}
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.97 }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Volver a la premisa</span>
              </motion.button>

              <div>
                <h2 className="font-display text-2xl text-foreground mb-1">Así entiendo tu mundo</h2>
                <p className="text-sm text-muted-foreground">Corrige lo que no sea así. Todo se puede cambiar después.</p>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] tracking-[0.2em] uppercase text-primary/70" htmlFor="new-world-name">Nombre</label>
                <input
                  id="new-world-name"
                  value={reading.name}
                  onChange={e => setReading({ ...reading, name: e.target.value })}
                  placeholder="Dos a cuatro palabras"
                  className={`${FIELD} font-display text-lg`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] tracking-[0.2em] uppercase text-primary/70" htmlFor="new-world-premise">La premisa</label>
                <textarea
                  id="new-world-premise"
                  value={reading.premise}
                  onChange={e => setReading({ ...reading, premise: e.target.value })}
                  rows={4}
                  className={`${FIELD} resize-y`}
                />
              </div>

              {LINES.map(line => (
                <div key={line.key} className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <label className="text-sm text-muted-foreground" htmlFor={`new-world-${line.key}`}>{line.question}</label>
                    <button
                      type="button"
                      onClick={() => void proposeLine(line.key)}
                      disabled={proposingLine !== null}
                      className="flex min-h-10 items-center gap-1 text-xs text-primary disabled:opacity-50"
                    >
                      {proposingLine === line.key ? <Loader2 className="size-3 animate-spin" /> : <Sparkles className="size-3" />}
                      Proponme
                    </button>
                  </div>
                  <textarea
                    id={`new-world-${line.key}`}
                    value={reading[line.key]}
                    onChange={e => setReading({ ...reading, [line.key]: e.target.value })}
                    rows={line.key === 'rule' ? 2 : 1}
                    placeholder={line.hint}
                    className={`${FIELD} resize-none`}
                  />
                </div>
              ))}

              <Button
                type="button"
                size="lg"
                onClick={() => void handleCreate()}
                className="w-full h-12 text-[0.9rem] tracking-[0.03em]"
                style={{ fontFamily: 'var(--font-ui)' }}
                disabled={creating || !(reading.name.trim() || premise.trim())}
              >
                {creating ? 'Creando…' : 'Crear mundo'}
              </Button>
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
                onDone={keepers => void readWorld(keepers)}
                onSkip={() => void readWorld([])}
              />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <label
                    className="text-[10px] tracking-[0.2em] uppercase"
                    style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 30% 58%)' }}
                  >
                    La premisa
                  </label>
                  {!premise.trim() && (
                    <motion.button
                      type="button"
                      onClick={handleSuggest}
                      disabled={suggesting}
                      className="flex items-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer min-h-10"
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

              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-[0.9rem] tracking-[0.03em]"
                  style={{ fontFamily: 'var(--font-ui)' }}
                  disabled={!premise.trim()}
                >
                  Seguir
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}

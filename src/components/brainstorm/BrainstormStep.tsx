import { useState, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AxisSelector } from './AxisSelector'
import { BrainstormCard } from './BrainstormCard'
import { KeepersPanel } from './KeepersPanel'
import { suggestBrainstormAxes, generateBrainstormCards } from '@/services/api'
import type { BrainstormAxis, BrainstormCard as CardType } from '@/services/api'
import { notifyError } from '@/lib/notifyError'
import { describeError } from '@/services/telemetry'

const VISIBLE_COUNT = 3
const PREFETCH_THRESHOLD = 2

interface Props {
  premise: string
  onDone: (keepers: CardType[]) => void
  onSkip: () => void
}

export function BrainstormStep({ premise, onDone, onSkip }: Props) {
  const [axes, setAxes] = useState<BrainstormAxis[]>([])
  const [activeAxisIndex, setActiveAxisIndex] = useState(0)
  const [visible, setVisible] = useState<CardType[]>([])
  const [keepers, setKeepers] = useState<CardType[]>([])
  const [loadingAxes, setLoadingAxes] = useState(false)
  const [loadingCards, setLoadingCards] = useState(false)
  const [started, setStarted] = useState(false)
  // Antes un fallo se tragaba y salía «Has votado todas las ideas»: ahora se
  // dice qué ha pasado y se puede reintentar.
  const [cardsError, setCardsError] = useState('')

  const bufferRef = useRef<CardType[]>([])
  const fetchingRef = useRef(false)
  const activeIndexRef = useRef(0)
  // Una promesa por eje: pedir el mismo eje dos veces reutiliza la petición.
  const axisCacheRef = useRef<Map<number, Promise<CardType[]>>>(new Map())
  // El generador local atiende una tarea cada vez: al pulsar Generar (o al
  // salir) no se lanzan más peticiones de cartas que retrasen el mundo.
  const stoppedRef = useRef(false)

  useEffect(() => {
    stoppedRef.current = false
    return () => { stoppedRef.current = true }
  }, [])

  const fetchCards = useCallback(async (axis: BrainstormAxis): Promise<CardType[]> => {
    if (stoppedRef.current) return []
    const result = await generateBrainstormCards(premise, axis.topic, axis.question)
    return result.cards ?? []
  }, [premise])

  const loadAxis = useCallback((index: number, allAxes: BrainstormAxis[]): Promise<CardType[]> => {
    const cached = axisCacheRef.current.get(index)
    if (cached) return cached
    const promise = fetchCards(allAxes[index])
    axisCacheRef.current.set(index, promise)
    // Si falla, se olvida para que reintentar vuelva a pedirlo.
    promise.catch(() => {
      if (axisCacheRef.current.get(index) === promise) axisCacheRef.current.delete(index)
    })
    return promise
  }, [fetchCards])

  // Solo el eje siguiente: adelantar los cinco ponía varias tareas por
  // delante de la generación del mundo (~46 s de espera medidos).
  const prefetchNext = useCallback((index: number, allAxes: BrainstormAxis[]) => {
    const next = index + 1
    if (stoppedRef.current || next >= allAxes.length || axisCacheRef.current.has(next)) return
    loadAxis(next, allAxes).catch(() => {})  // si falla, se verá al abrir ese eje
  }, [loadAxis])

  const showAxis = useCallback(async (index: number, allAxes: BrainstormAxis[]) => {
    activeIndexRef.current = index
    setActiveAxisIndex(index)
    setCardsError('')
    fetchingRef.current = false
    bufferRef.current = []
    setVisible([])
    setLoadingCards(true)
    try {
      const cards = await loadAxis(index, allAxes)
      if (activeIndexRef.current !== index) return
      bufferRef.current = cards.slice(VISIBLE_COUNT)
      setVisible(cards.slice(0, VISIBLE_COUNT))
      prefetchNext(index, allAxes)
    } catch (err) {
      if (activeIndexRef.current === index) {
        setCardsError(describeError(err, 'error desconocido'))
      }
    } finally {
      if (activeIndexRef.current === index) setLoadingCards(false)
    }
  }, [loadAxis, prefetchNext])

  // Pide más cartas del eje en pantalla cuando quedan pocas en reserva.
  const topUp = useCallback((index: number) => {
    const axis = axes[index]
    if (!axis || stoppedRef.current || fetchingRef.current || bufferRef.current.length >= PREFETCH_THRESHOLD) return
    fetchingRef.current = true
    fetchCards(axis)
      .then(newCards => {
        if (activeIndexRef.current !== index) return
        bufferRef.current.push(...newCards)
        setVisible(v => {
          if (v.length < VISIBLE_COUNT && bufferRef.current.length > 0) {
            const extra = bufferRef.current.splice(0, VISIBLE_COUNT - v.length)
            return [...v, ...extra]
          }
          return v
        })
      })
      .catch(err => {
        if (activeIndexRef.current === index) setCardsError(describeError(err, 'error desconocido'))
      })
      .finally(() => {
        if (activeIndexRef.current === index) fetchingRef.current = false
      })
  }, [axes, fetchCards])

  const startBrainstorm = useCallback(async () => {
    setLoadingAxes(true)
    setStarted(true)
    try {
      const result = await suggestBrainstormAxes(premise)
      setAxes(result.axes)
      setLoadingAxes(false)
      if (result.axes.length > 0) await showAxis(0, result.axes)
    } catch (err) {
      notifyError('No se pudieron explorar ideas')(err)
    } finally {
      setLoadingAxes(false)
    }
  }, [premise, showAxis])

  const selectAxis = useCallback((index: number) => {
    showAxis(index, axes)
  }, [axes, showAxis])

  const retryCards = useCallback(() => {
    const index = activeIndexRef.current
    if (visible.length > 0) {
      // Falló una recarga con cartas aún en pantalla: basta con volver a pedir.
      setCardsError('')
      topUp(index)
      return
    }
    axisCacheRef.current.delete(index)
    showAxis(index, axes)
  }, [visible.length, topUp, showAxis, axes])

  const voteCard = useCallback((cardIndex: number, keep: boolean) => {
    const card = visible[cardIndex]
    if (!card) return

    if (keep) {
      setKeepers(prev => [...prev, card])
    }

    setVisible(prev => {
      const next = prev.filter((_, i) => i !== cardIndex)
      if (bufferRef.current.length > 0) {
        const replacement = bufferRef.current.shift()!
        next.push(replacement)
      }
      return next
    })

    topUp(activeAxisIndex)
  }, [visible, activeAxisIndex, topUp])

  const removeKeeper = useCallback((index: number) => {
    setKeepers(prev => prev.filter((_, i) => i !== index))
  }, [])

  const finish = (chosen: CardType[]) => {
    stoppedRef.current = true
    onDone(chosen)
  }

  const skip = () => {
    stoppedRef.current = true
    onSkip()
  }

  // ── Not started ──
  if (!started) {
    return (
      <div className="text-center py-8">
        <p className="text-sm mb-4" style={{ fontFamily: 'var(--font-body)', color: 'hsl(30 6% 47%)' }}>
          Explora ideas para enriquecer tu premisa antes de generar
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={startBrainstorm} style={{ fontFamily: 'var(--font-ui)' }}>
            Explorar ideas
          </Button>
          <Button variant="ghost" onClick={skip} style={{ fontFamily: 'var(--font-ui)' }}>
            Generar directamente
          </Button>
        </div>
      </div>
    )
  }

  // ── Loading axes ──
  if (loadingAxes) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'hsl(260 38% 40%)' }} />
        <p className="text-sm italic" style={{ fontFamily: 'var(--font-display)', color: 'hsl(30 6% 47%)' }}>
          Buscando temas para explorar...
        </p>
      </div>
    )
  }

  // ── Main UI ──
  return (
    <div>
      <AxisSelector axes={axes} activeIndex={activeAxisIndex} onSelect={selectAxis} loading={loadingCards} />

      {axes[activeAxisIndex] && (
        <p className="text-sm italic mb-4" style={{ fontFamily: 'var(--font-display)', color: 'hsl(30 6% 47%)' }}>
          {axes[activeAxisIndex].question}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
        {/* Cards */}
        <div>
          {loadingCards ? (
            <div className="flex items-center gap-2 py-8 justify-center">
              <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'hsl(260 38% 40%)' }} />
              <span className="text-sm italic" style={{ fontFamily: 'var(--font-display)', color: 'hsl(30 6% 47%)' }}>
                Generando ideas...
              </span>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {visible.map((card, i) => (
                <BrainstormCard
                  key={card.content.slice(0, 40)}
                  card={card}
                  onKeep={() => voteCard(i, true)}
                  onReject={() => voteCard(i, false)}
                />
              ))}
            </AnimatePresence>
          )}
          {!loadingCards && cardsError && (
            <div role="alert" className="flex flex-col items-center gap-2 py-6 text-center">
              <p className="text-sm" style={{ color: 'hsl(0 55% 45%)' }}>
                No se pudieron generar ideas para este tema: {cardsError}
              </p>
              <Button variant="outline" size="sm" onClick={retryCards} style={{ fontFamily: 'var(--font-ui)' }}>
                Reintentar
              </Button>
            </div>
          )}
          {!loadingCards && !cardsError && visible.length === 0 && bufferRef.current.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6">
              {fetchingRef.current ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'hsl(260 38% 40%)' }} />
                  <span className="text-sm italic" style={{ fontFamily: 'var(--font-display)', color: 'hsl(30 6% 47%)' }}>
                    Buscando más ideas...
                  </span>
                </>
              ) : (
                <p className="text-sm text-center" style={{ color: 'hsl(30 6% 47%)' }}>
                  Has votado todas las ideas de este tema. Prueba otro eje o continúa.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Keepers */}
        <div className="md:sticky md:top-4 self-start">
          <KeepersPanel keepers={keepers} onRemove={removeKeeper} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-8 pt-4" style={{ borderTop: '1px solid hsl(260 20% 90%)' }}>
        <span className="text-xs" style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 30% 58%)' }}>
          {keepers.length} idea{keepers.length !== 1 ? 's' : ''} guardada{keepers.length !== 1 ? 's' : ''}
        </span>
        <div className="flex gap-3">
          <Button variant="ghost" onClick={skip} style={{ fontFamily: 'var(--font-ui)' }}>
            Generar sin ideas
          </Button>
          <Button onClick={() => finish(keepers)} style={{ fontFamily: 'var(--font-ui)' }}>
            Generar con {keepers.length} idea{keepers.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}

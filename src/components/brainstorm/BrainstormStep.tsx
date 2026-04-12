import { useState, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AxisSelector } from './AxisSelector'
import { BrainstormCard } from './BrainstormCard'
import { KeepersPanel } from './KeepersPanel'
import { suggestBrainstormAxes, generateBrainstormCards } from '@/services/api'
import type { BrainstormAxis, BrainstormCard as CardType } from '@/services/api'

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

  const bufferRef = useRef<CardType[]>([])
  const fetchingRef = useRef(false)

  // Fetch 5 cards and split into visible + buffer
  const fetchCards = useCallback(async (axis: BrainstormAxis) => {
    try {
      const result = await generateBrainstormCards(premise, axis.topic, axis.question)
      return result.cards
    } catch {
      return []
    }
  }, [premise])

  // Refill visible slots from buffer, prefetch if running low
  const refillFromBuffer = useCallback((currentAxis: BrainstormAxis) => {
    setVisible(prev => {
      if (prev.length >= VISIBLE_COUNT) return prev
      const needed = VISIBLE_COUNT - prev.length
      const fromBuffer = bufferRef.current.splice(0, needed)
      const updated = [...prev, ...fromBuffer]

      // Prefetch if buffer is running low
      if (bufferRef.current.length < PREFETCH_THRESHOLD && !fetchingRef.current) {
        fetchingRef.current = true
        fetchCards(currentAxis).then(newCards => {
          bufferRef.current.push(...newCards)
          fetchingRef.current = false
          // If visible is still short, trigger another refill
          setVisible(v => {
            if (v.length < VISIBLE_COUNT && bufferRef.current.length > 0) {
              const extra = bufferRef.current.splice(0, VISIBLE_COUNT - v.length)
              return [...v, ...extra]
            }
            return v
          })
        })
      }

      return updated
    })
  }, [fetchCards])

  const startBrainstorm = useCallback(async () => {
    setLoadingAxes(true)
    setStarted(true)
    try {
      const result = await suggestBrainstormAxes(premise)
      setAxes(result.axes)
      if (result.axes.length > 0) {
        setActiveAxisIndex(0)
        setLoadingCards(true)
        const cards = await fetchCards(result.axes[0])
        bufferRef.current = cards.slice(VISIBLE_COUNT)
        setVisible(cards.slice(0, VISIBLE_COUNT))
      }
    } catch {
      // fall back silently
    } finally {
      setLoadingAxes(false)
      setLoadingCards(false)
    }
  }, [premise, fetchCards])

  const selectAxis = useCallback(async (index: number) => {
    setActiveAxisIndex(index)
    setLoadingCards(true)
    setVisible([])
    bufferRef.current = []
    fetchingRef.current = false
    try {
      const axis = axes[index]
      const cards = await fetchCards(axis)
      bufferRef.current = cards.slice(VISIBLE_COUNT)
      setVisible(cards.slice(0, VISIBLE_COUNT))
    } catch {
      // silently fail
    } finally {
      setLoadingCards(false)
    }
  }, [axes, fetchCards])

  const voteCard = useCallback((cardIndex: number, keep: boolean) => {
    const card = visible[cardIndex]
    if (!card) return

    if (keep) {
      setKeepers(prev => [...prev, card])
    }

    setVisible(prev => {
      const next = prev.filter((_, i) => i !== cardIndex)
      // Fill from buffer
      if (bufferRef.current.length > 0) {
        const replacement = bufferRef.current.shift()!
        next.push(replacement)
      }
      return next
    })

    // Prefetch if buffer low
    const currentAxis = axes[activeAxisIndex]
    if (currentAxis && bufferRef.current.length < PREFETCH_THRESHOLD && !fetchingRef.current) {
      fetchingRef.current = true
      fetchCards(currentAxis).then(newCards => {
        bufferRef.current.push(...newCards)
        fetchingRef.current = false
        refillFromBuffer(currentAxis)
      })
    }
  }, [visible, axes, activeAxisIndex, fetchCards, refillFromBuffer])

  const removeKeeper = useCallback((index: number) => {
    setKeepers(prev => prev.filter((_, i) => i !== index))
  }, [])

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
          <Button variant="ghost" onClick={onSkip} style={{ fontFamily: 'var(--font-ui)' }}>
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
          {!loadingCards && visible.length === 0 && bufferRef.current.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-6">
              {fetchingRef.current ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" style={{ color: 'hsl(260 38% 40%)' }} />
                  <span className="text-sm italic" style={{ fontFamily: 'var(--font-display)', color: 'hsl(30 6% 47%)' }}>
                    Buscando mas ideas...
                  </span>
                </>
              ) : (
                <p className="text-sm text-center" style={{ color: 'hsl(30 6% 47%)' }}>
                  Has votado todas las ideas de este tema. Prueba otro eje o continua.
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
          <Button variant="ghost" onClick={onSkip} style={{ fontFamily: 'var(--font-ui)' }}>
            Generar sin ideas
          </Button>
          <Button onClick={() => onDone(keepers)} style={{ fontFamily: 'var(--font-ui)' }}>
            Generar con {keepers.length} idea{keepers.length !== 1 ? 's' : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}

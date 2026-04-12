import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AxisSelector } from './AxisSelector'
import { BrainstormCard } from './BrainstormCard'
import { KeepersPanel } from './KeepersPanel'
import { suggestBrainstormAxes, generateBrainstormCards } from '@/services/api'
import type { BrainstormAxis, BrainstormCard as CardType } from '@/services/api'

interface Props {
  premise: string
  onDone: (keepers: CardType[]) => void
  onSkip: () => void
}

export function BrainstormStep({ premise, onDone, onSkip }: Props) {
  const [axes, setAxes] = useState<BrainstormAxis[]>([])
  const [activeAxisIndex, setActiveAxisIndex] = useState(0)
  const [cards, setCards] = useState<CardType[]>([])
  const [keepers, setKeepers] = useState<CardType[]>([])
  const [loadingAxes, setLoadingAxes] = useState(false)
  const [loadingCards, setLoadingCards] = useState(false)
  const [started, setStarted] = useState(false)

  const startBrainstorm = useCallback(async () => {
    setLoadingAxes(true)
    setStarted(true)
    try {
      const result = await suggestBrainstormAxes(premise)
      setAxes(result.axes)
      if (result.axes.length > 0) {
        setActiveAxisIndex(0)
        setLoadingCards(true)
        const cardsResult = await generateBrainstormCards(premise, result.axes[0].topic, result.axes[0].question)
        setCards(cardsResult.cards)
      }
    } catch {
      // fall back silently
    } finally {
      setLoadingAxes(false)
      setLoadingCards(false)
    }
  }, [premise])

  const selectAxis = useCallback(async (index: number) => {
    setActiveAxisIndex(index)
    setLoadingCards(true)
    setCards([])
    try {
      const axis = axes[index]
      const result = await generateBrainstormCards(premise, axis.topic, axis.question)
      setCards(result.cards)
    } catch {
      // silently fail
    } finally {
      setLoadingCards(false)
    }
  }, [axes, premise])

  const keepCard = useCallback((cardIndex: number) => {
    const card = cards[cardIndex]
    if (card) {
      setKeepers(prev => [...prev, card])
      setCards(prev => prev.filter((_, i) => i !== cardIndex))
    }
  }, [cards])

  const rejectCard = useCallback((cardIndex: number) => {
    setCards(prev => prev.filter((_, i) => i !== cardIndex))
  }, [])

  const removeKeeper = useCallback((index: number) => {
    setKeepers(prev => prev.filter((_, i) => i !== index))
  }, [])

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

  return (
    <div>
      <AxisSelector axes={axes} activeIndex={activeAxisIndex} onSelect={selectAxis} loading={loadingCards} />

      {axes[activeAxisIndex] && (
        <p className="text-sm italic mb-4" style={{ fontFamily: 'var(--font-display)', color: 'hsl(30 6% 47%)' }}>
          {axes[activeAxisIndex].question}
        </p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
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
              {cards.map((card, i) => (
                <BrainstormCard key={`${card.content.slice(0, 20)}-${i}`} card={card} onKeep={() => keepCard(i)} onReject={() => rejectCard(i)} />
              ))}
            </AnimatePresence>
          )}
          {!loadingCards && cards.length === 0 && started && (
            <p className="text-sm text-center py-4" style={{ color: 'hsl(30 6% 47%)' }}>
              Has votado todas las ideas de este tema. Prueba otro eje o continua.
            </p>
          )}
        </div>

        <div className="md:sticky md:top-4 self-start">
          <KeepersPanel keepers={keepers} onRemove={removeKeeper} />
        </div>
      </div>

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

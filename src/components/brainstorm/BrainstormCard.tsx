import { motion } from 'framer-motion'
import { ThumbsUp, ThumbsDown } from 'lucide-react'
import type { BrainstormCard as CardType } from '@/services/api'

interface Props {
  card: CardType
  onKeep: () => void
  onReject: () => void
  disabled?: boolean
}

export function BrainstormCard({ card, onKeep, onReject, disabled }: Props) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="rounded-lg p-4 mb-3"
      style={{ backgroundColor: 'hsl(260 20% 97%)', border: '1px solid hsl(260 20% 90%)' }}
    >
      {card.category && (
        <p
          className="text-xs italic mb-1.5 opacity-60"
          style={{ fontFamily: 'var(--font-display)', color: 'hsl(260 30% 50%)' }}
        >
          {card.category}
        </p>
      )}
      <p className="text-sm leading-relaxed mb-3" style={{ fontFamily: 'var(--font-body)', color: 'hsl(30 8% 25%)' }}>
        {card.content}
      </p>
      <div className="flex gap-2">
        <motion.button
          type="button" onClick={onKeep} disabled={disabled}
          className="flex items-center gap-1 px-3 py-1 rounded-md text-xs disabled:opacity-50"
          style={{ fontFamily: 'var(--font-ui)', backgroundColor: 'hsl(150 40% 94%)', color: 'hsl(150 40% 30%)', border: '1px solid hsl(150 30% 85%)' }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        >
          <ThumbsUp className="w-3 h-3" /> Guardar
        </motion.button>
        <motion.button
          type="button" onClick={onReject} disabled={disabled}
          className="flex items-center gap-1 px-3 py-1 rounded-md text-xs disabled:opacity-50"
          style={{ fontFamily: 'var(--font-ui)', backgroundColor: 'hsl(0 0% 96%)', color: 'hsl(0 0% 45%)', border: '1px solid hsl(0 0% 88%)' }}
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
        >
          <ThumbsDown className="w-3 h-3" /> Descartar
        </motion.button>
      </div>
    </motion.div>
  )
}

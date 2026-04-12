import { motion, AnimatePresence } from 'framer-motion'
import { Bookmark, X } from 'lucide-react'
import type { BrainstormCard } from '@/services/api'

interface Props {
  keepers: BrainstormCard[]
  onRemove: (index: number) => void
}

export function KeepersPanel({ keepers, onRemove }: Props) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: 'hsl(260 20% 97%)', border: '1px solid hsl(260 20% 90%)' }}>
      <div className="flex items-center gap-2 mb-3">
        <Bookmark className="w-4 h-4" style={{ color: 'hsl(260 38% 40%)' }} />
        <span className="text-[10px] tracking-[0.15em] uppercase" style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 30% 50%)' }}>
          Guardadas ({keepers.length})
        </span>
      </div>
      <AnimatePresence>
        {keepers.map((k, i) => (
          <motion.div
            key={`${k.content.slice(0, 30)}-${i}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-start gap-2 mb-2 text-xs leading-relaxed"
            style={{ fontFamily: 'var(--font-body)', color: 'hsl(30 8% 30%)' }}
          >
            <span className="flex-1">{k.content.length > 120 ? k.content.slice(0, 120) + '...' : k.content}</span>
            <button type="button" onClick={() => onRemove(i)} className="shrink-0 p-0.5 rounded hover:bg-red-50">
              <X className="w-3 h-3 text-muted-foreground hover:text-red-500" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
      {keepers.length === 0 && (
        <p className="text-xs italic" style={{ color: 'hsl(260 20% 65%)', fontFamily: 'var(--font-display)' }}>
          Vota ideas para guardarlas aqui
        </p>
      )}
    </div>
  )
}

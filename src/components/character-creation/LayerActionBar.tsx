import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Pencil } from 'lucide-react'

interface LayerActionBarProps {
  status: 'pending' | 'accepted' | 'rejected'
  onAccept: () => void
  onReject: () => void
  onEdit?: () => void
  accentColor?: string
}

const spring = { type: 'spring', stiffness: 500, damping: 28 } as const

export function LayerActionBar({
  status,
  onAccept,
  onReject,
  onEdit,
  accentColor = 'var(--entity-character)',
}: LayerActionBarProps) {
  if (status === 'rejected') return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.2 }}
      className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60"
    >
      <AnimatePresence mode="wait">
        {status === 'accepted' ? (
          <motion.div
            key="accepted"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={spring}
            className="flex items-center gap-2"
          >
            <span className="flex items-center gap-1.5 text-xs font-medium text-primary/60">
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              Confirmado
            </span>
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center
                           justify-center text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="w-3 h-3" />
              </button>
            )}
            <button
              type="button"
              onClick={onReject}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-destructive/10 flex items-center
                         justify-center text-muted-foreground hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="pending"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={spring}
            className="flex items-center gap-2"
          >
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onAccept}
              style={{ backgroundColor: `color-mix(in oklch, ${accentColor} 15%, transparent)` }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         text-xs font-semibold transition-colors hover:opacity-90"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              Aceptar
            </motion.button>
            {onEdit && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={onEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                           bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground
                           text-xs font-medium transition-colors"
              >
                <Pencil className="w-3 h-3" />
                Editar
              </motion.button>
            )}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={onReject}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                         bg-muted hover:bg-destructive/10 text-muted-foreground hover:text-destructive
                         text-xs font-medium transition-colors"
            >
              <X className="w-3 h-3" />
              Descartar
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

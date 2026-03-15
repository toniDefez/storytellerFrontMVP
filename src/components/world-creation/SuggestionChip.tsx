import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, X, Pencil } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'

export type ChipStatus = 'pending' | 'accepted' | 'rejected' | 'editing'

interface SuggestionChipProps {
  text: string
  status: ChipStatus
  onAccept: () => void
  onReject: () => void
  onEdit: (newText: string) => void
}

const chipSpring = { type: 'spring', stiffness: 500, damping: 28 } as const

/**
 * SuggestionChip -- una sugerencia derivada por la IA que puede
 * aceptarse, rechazarse o editarse. El chip cambia visualmente
 * de estado con animaciones de spring-physics.
 *
 * Estados visuales:
 * - pending:  borde punteado, fondo accent, texto muted.
 *             Aparece con una animacion de "materializar" (scale 0.85 -> 1).
 * - accepted: fondo primary/10, borde primary/30, texto foreground.
 *             Transicion suave con check-mark que hace pop-in.
 * - rejected: opacity reducida, tachado, colapsa a 0 altura.
 * - editing:  se expande a textarea inline con borde primary.
 */
export function SuggestionChip({ text, status, onAccept, onReject, onEdit }: SuggestionChipProps) {
  const [editText, setEditText] = useState(text)
  const [isEditing, setIsEditing] = useState(false)

  const handleStartEdit = () => {
    setEditText(text)
    setIsEditing(true)
  }

  const handleConfirmEdit = () => {
    onEdit(editText.trim() || text)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditText(text)
    setIsEditing(false)
  }

  if (status === 'rejected') {
    return (
      <motion.div
        initial={{ opacity: 1, height: 'auto', marginBottom: 8 }}
        animate={{ opacity: 0, height: 0, marginBottom: 0 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="overflow-hidden"
      />
    )
  }

  return (
    <AnimatePresence mode="wait">
      {isEditing ? (
        <motion.div
          key="editing"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={chipSpring}
          className="mb-2"
        >
          <div className="rounded-xl border-2 border-primary/40 bg-white p-3 shadow-sm shadow-primary/5">
            <Textarea
              value={editText}
              onChange={e => setEditText(e.target.value)}
              className="min-h-[60px] resize-none border-0 bg-transparent p-0 text-sm
                         focus-visible:ring-0 focus-visible:ring-offset-0
                         font-[var(--font-body)] leading-relaxed"
              autoFocus
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleConfirmEdit()
                }
                if (e.key === 'Escape') handleCancelEdit()
              }}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="text-xs text-muted-foreground hover:text-foreground transition px-2 py-1"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmEdit}
                className="text-xs font-semibold text-primary hover:text-primary/80 transition px-2 py-1"
              >
                Confirmar
              </button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="chip"
          layout
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={chipSpring}
          className={`group relative mb-2 rounded-xl px-4 py-3 text-sm leading-relaxed transition-colors duration-200 ${
            status === 'accepted'
              ? 'bg-primary/8 border border-primary/25 text-foreground shadow-sm shadow-primary/5'
              : 'bg-accent/60 border border-dashed border-primary/20 text-muted-foreground'
          }`}
        >
          {/* Icono de aceptado */}
          <AnimatePresence>
            {status === 'accepted' && (
              <motion.span
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 600, damping: 15 }}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" strokeWidth={3} />
              </motion.span>
            )}
          </AnimatePresence>

          {/* Texto de la sugerencia */}
          <p className="pr-20 font-[var(--font-body)]">{text}</p>

          {/* Acciones (visibles en hover para pending, siempre visibles para accepted con opacidad baja) */}
          <div
            className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 transition-opacity duration-150 ${
              status === 'pending'
                ? 'opacity-0 group-hover:opacity-100'
                : 'opacity-40 group-hover:opacity-100'
            }`}
          >
            {status === 'pending' && (
              <motion.button
                type="button"
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={onAccept}
                className="w-7 h-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center text-primary transition-colors"
                aria-label="Aceptar sugerencia"
              >
                <Check className="w-3.5 h-3.5" strokeWidth={2.5} />
              </motion.button>
            )}

            <motion.button
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleStartEdit}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Editar sugerencia"
            >
              <Pencil className="w-3 h-3" />
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.9 }}
              onClick={onReject}
              className="w-7 h-7 rounded-lg bg-muted hover:bg-destructive/10 flex items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Rechazar sugerencia"
            >
              <X className="w-3 h-3" />
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

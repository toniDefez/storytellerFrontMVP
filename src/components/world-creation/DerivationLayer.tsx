import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { SuggestionChip, type ChipStatus } from './SuggestionChip'

/**
 * Las 5 capas Sanderson, cada una con su icono, color y nombre.
 * El icono es un caracter unicode para mantenerlo simple sin dependencias.
 */
export const LAYER_META: Record<string, { icon: string; label: string; labelEn: string; color: string }> = {
  environment:  { icon: '\u{1F30D}', label: 'Entorno',         labelEn: 'Environment',   color: 'text-emerald-600' },
  subsistence:  { icon: '\u{1F33E}', label: 'Subsistencia',    labelEn: 'Subsistence',   color: 'text-amber-600' },
  organization: { icon: '\u{1F3DB}', label: 'Organizacion',    labelEn: 'Organization',  color: 'text-blue-600' },
  tensions:     { icon: '\u{26A1}',  label: 'Tensiones',       labelEn: 'Tensions',      color: 'text-rose-600' },
  tone:         { icon: '\u{1F3AD}', label: 'Tono narrativo',  labelEn: 'Narrative Tone', color: 'text-violet-600' },
}

export type LayerKey = keyof typeof LAYER_META

interface DerivationLayerProps {
  layerKey: LayerKey
  suggestion: string
  /** Delay en ms antes de que esta capa aparezca en la cascada */
  cascadeDelay: number
  /** Si la capa ya esta visible (post-animacion) */
  isRevealed: boolean
  onReveal: () => void
  onSuggestionAccept: (layerKey: LayerKey) => void
  onSuggestionReject: (layerKey: LayerKey) => void
  onSuggestionEdit: (layerKey: LayerKey, newText: string) => void
  chipStatus: ChipStatus
}

const layerSpring = { type: 'spring', stiffness: 300, damping: 25 } as const

/**
 * DerivationLayer -- una capa individual del modelo Sanderson.
 *
 * Animacion de entrada:
 * 1. Aparece con cascadeDelay, deslizandose desde abajo (y: 20 -> 0)
 *    y escalando ligeramente (scale 0.97 -> 1)
 * 2. La barra-titulo aparece primero, luego el contenido se despliega
 *
 * Layout:
 * - Barra lateral izquierda con color de capa (2px vertical)
 * - Icono + nombre de capa en la cabecera
 * - Contenido colapsable con la sugerencia
 * - Chevron que rota 180deg al expandir
 */
export function DerivationLayer({
  layerKey,
  suggestion,
  cascadeDelay,
  isRevealed,
  onReveal,
  onSuggestionAccept,
  onSuggestionReject,
  onSuggestionEdit,
  chipStatus,
}: DerivationLayerProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const meta = LAYER_META[layerKey]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ ...layerSpring, delay: cascadeDelay / 1000 }}
      onAnimationComplete={() => {
        if (!isRevealed) onReveal()
      }}
      className="relative"
    >
      {/* Barra lateral de color */}
      <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-full ${
        meta.color.replace('text-', 'bg-')
      } opacity-40`} />

      <div className="ml-4">
        {/* Cabecera de capa (siempre visible) */}
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2.5 w-full text-left py-2 group"
        >
          <span className="text-base" role="img" aria-hidden="true">
            {meta.icon}
          </span>
          <span className={`text-xs font-semibold uppercase tracking-widest ${meta.color}`}>
            {meta.label}
          </span>

          {/* Indicador de estado */}
          {chipStatus === 'accepted' && (
            <span className="text-[10px] font-medium text-primary/60 bg-primary/8 px-2 py-0.5 rounded-full">
              Confirmado
            </span>
          )}

          <motion.span
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-auto text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </motion.span>
        </button>

        {/* Contenido colapsable */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pb-4 pt-1">
                <SuggestionChip
                  text={suggestion}
                  status={chipStatus}
                  onAccept={() => onSuggestionAccept(layerKey)}
                  onReject={() => onSuggestionReject(layerKey)}
                  onEdit={(newText) => onSuggestionEdit(layerKey, newText)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

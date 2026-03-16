import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Loader2, RefreshCw, AlertTriangle } from 'lucide-react'
import { SuggestionChip, type ChipStatus } from './SuggestionChip'

/**
 * Las 5 capas Sanderson, cada una con su icono, color y nombre.
 * El icono es un caracter unicode para mantenerlo simple sin dependencias.
 *
 * @deprecated Use LAYER_DISPLAY from useLayeredDerivation for the new 4-layer model.
 * Kept for backward compatibility.
 */
export const LAYER_META: Record<string, { icon: string; label: string; labelEn: string; color: string }> = {
  environment:  { icon: '\u{1F30D}', label: 'Entorno',         labelEn: 'Environment',   color: 'text-emerald-600' },
  subsistence:  { icon: '\u{1F33E}', label: 'Subsistencia',    labelEn: 'Subsistence',   color: 'text-amber-600' },
  organization: { icon: '\u{1F3DB}', label: 'Organizacion',    labelEn: 'Organization',  color: 'text-blue-600' },
  tensions:     { icon: '\u{26A1}',  label: 'Tensiones',       labelEn: 'Tensions',      color: 'text-rose-600' },
  tone:         { icon: '\u{1F3AD}', label: 'Tono narrativo',  labelEn: 'Narrative Tone', color: 'text-violet-600' },
}

export type LayerKey = keyof typeof LAYER_META

/** Extended chip status that includes the new layer statuses */
export type ExtendedChipStatus = ChipStatus | 'generating' | 'stale' | 'ready' | 'idle'

interface DerivationLayerProps {
  layerKey: string
  suggestion: string | null
  /** Delay en ms antes de que esta capa aparezca en la cascada */
  cascadeDelay: number
  /** Si la capa ya esta visible (post-animacion) */
  isRevealed: boolean
  onReveal: () => void
  onSuggestionAccept: (layerKey: string) => void
  onSuggestionReject: (layerKey: string) => void
  onSuggestionEdit: (layerKey: string, newText: string) => void
  chipStatus: ExtendedChipStatus
  /** Optional: override layer metadata (for new LAYER_DISPLAY) */
  layerMeta?: { icon: string; label: string; labelEn: string; color: string }
  /** Called when user clicks "Regenerate" on a stale layer */
  onRegenerate?: () => void
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
 *
 * New states:
 * - generating: shows a compact spinner instead of SuggestionChip
 * - stale: shows an amber warning with "Regenerate" button
 * - ready: same as pending (shows SuggestionChip in pending state)
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
  layerMeta,
  onRegenerate,
}: DerivationLayerProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  // Use provided layerMeta, fall back to LAYER_META for backward compat
  const meta = layerMeta ?? LAYER_META[layerKey] ?? { icon: '', label: layerKey, labelEn: layerKey, color: 'text-gray-600' }

  // Map extended statuses to ChipStatus for SuggestionChip
  const chipStatusForChip: ChipStatus =
    chipStatus === 'ready' ? 'pending'
    : chipStatus === 'generating' || chipStatus === 'stale' || chipStatus === 'idle' ? 'pending'
    : chipStatus as ChipStatus

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

          {chipStatus === 'generating' && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-primary/50 ml-1" />
          )}

          {chipStatus === 'stale' && (
            <span className="text-[10px] font-medium text-amber-600/70 bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Desactualizado
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
                {/* Generating state: show spinner */}
                {chipStatus === 'generating' && (
                  <div className="flex items-center gap-3 px-4 py-6 rounded-xl bg-accent/40 border border-dashed border-primary/15">
                    <Loader2 className="w-5 h-5 animate-spin text-primary/50" />
                    <span className="text-sm text-muted-foreground italic font-[var(--font-display)]">
                      Derivando...
                    </span>
                  </div>
                )}

                {/* Stale state: show warning + regenerate button */}
                {chipStatus === 'stale' && suggestion && (
                  <div className="space-y-2">
                    <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-4 py-3">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground leading-relaxed font-[var(--font-body)]">
                            {suggestion}
                          </p>
                          <p className="text-xs text-amber-600/70 mt-2">
                            Una capa anterior fue editada. Esta sugerencia podria no ser coherente.
                          </p>
                        </div>
                      </div>
                    </div>
                    {onRegenerate && (
                      <button
                        type="button"
                        onClick={onRegenerate}
                        className="flex items-center gap-1.5 text-xs font-medium text-amber-700 hover:text-amber-800 transition-colors px-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Regenerar capa
                      </button>
                    )}
                  </div>
                )}

                {/* Normal states: show SuggestionChip */}
                {chipStatus !== 'generating' && chipStatus !== 'stale' && suggestion && (
                  <SuggestionChip
                    text={suggestion}
                    status={chipStatusForChip}
                    onAccept={() => onSuggestionAccept(layerKey)}
                    onReject={() => onSuggestionReject(layerKey)}
                    onEdit={(newText) => onSuggestionEdit(layerKey, newText)}
                  />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

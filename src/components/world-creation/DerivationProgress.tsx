import { motion } from 'framer-motion'
import { LAYER_META, type ExtendedChipStatus } from './DerivationLayer'
import type { ChipStatus } from './SuggestionChip'
import { LAYER_DISPLAY } from '@/hooks/useLayeredDerivation'
import type { WorldLayerType } from '@/services/api'

/** Resolves layer metadata from either the old LAYER_META or the new LAYER_DISPLAY */
function getLayerMeta(layer: string): { icon: string; label: string; color: string } {
  if (layer in LAYER_DISPLAY) {
    const d = LAYER_DISPLAY[layer as WorldLayerType]
    return { icon: d.icon, label: d.label, color: d.color }
  }
  if (layer in LAYER_META) {
    return LAYER_META[layer]
  }
  return { icon: '', label: layer, color: 'text-gray-600' }
}

interface DerivationProgressProps {
  layers: string[]
  statuses: Record<string, ChipStatus | ExtendedChipStatus>
  revealedLayers: Set<string>
  activeLayer?: string
  onLayerClick: (layer: string) => void
}

/**
 * DerivationProgress -- Mini-mapa vertical del progreso de derivacion.
 *
 * Se posiciona sticky a la derecha del formulario (en desktop).
 * En mobile se convierte en una barra horizontal compacta.
 *
 * Cada nodo es un circulo conectado por una linea vertical.
 * Los estados visuales son:
 * - idle: greyed out dot, no interaction
 * - generating: pulsing ring animation
 * - No revelado: circulo gris con borde punteado
 * - Revelado/Pendiente/ready: circulo con borde del color de la capa
 * - Aceptado: circulo relleno con el color de la capa + check
 * - stale: amber/yellow border
 * - Activo: ring animado
 */
export function DerivationProgress({ layers, statuses, revealedLayers, activeLayer, onLayerClick }: DerivationProgressProps) {
  return (
    <nav aria-label="Progreso de derivacion" className="flex flex-col items-center gap-0">
      {layers.map((layer, idx) => {
        const meta = getLayerMeta(layer)
        const isRevealed = revealedLayers.has(layer)
        const status = statuses[layer] ?? 'idle'
        const isActive = activeLayer === layer
        const isLast = idx === layers.length - 1
        const isIdle = status === 'idle'
        const isGenerating = status === 'generating'
        const isStale = status === 'stale'

        // Colores basados en el estado
        const bgColor = status === 'accepted'
          ? meta.color.replace('text-', 'bg-')
          : 'bg-transparent'
        const borderColor = isStale
          ? 'border-amber-400'
          : isGenerating
            ? meta.color.replace('text-', 'border-')
            : isRevealed
              ? meta.color.replace('text-', 'border-')
              : 'border-muted-foreground/20'
        const lineColor = isRevealed
          ? 'bg-primary/15'
          : 'bg-muted-foreground/10'

        return (
          <div key={layer} className="flex flex-col items-center">
            {/* Nodo */}
            <button
              type="button"
              onClick={() => isRevealed && onLayerClick(layer)}
              disabled={!isRevealed && !isGenerating}
              className="relative group"
              aria-label={`${meta.label}: ${
                status === 'accepted' ? 'confirmado'
                : status === 'generating' ? 'generando'
                : status === 'stale' ? 'desactualizado'
                : status === 'ready' || status === 'pending' ? 'pendiente'
                : 'sin derivar'
              }`}
            >
              {/* Ring animado para capa activa */}
              {isActive && (
                <motion.div
                  className={`absolute inset-0 rounded-full ${borderColor} border-2`}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              {/* Pulsing ring for generating state */}
              {isGenerating && (
                <motion.div
                  className={`absolute inset-0 rounded-full ${meta.color.replace('text-', 'border-')} border-2`}
                  animate={{ scale: [1, 1.6, 1], opacity: [0.6, 0, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <motion.div
                whileHover={isRevealed ? { scale: 1.2 } : {}}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isIdle
                    ? 'bg-muted/20 border-muted-foreground/10 border-dashed'
                    : isGenerating
                      ? `bg-transparent ${borderColor} border-solid`
                      : isStale
                        ? 'bg-amber-50 border-amber-400 border-solid'
                        : isRevealed
                          ? `${bgColor} ${borderColor} cursor-pointer`
                          : `bg-muted/30 ${borderColor} border-dashed`
                }`}
              >
                {status === 'accepted' ? (
                  <motion.svg
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                    className="w-3 h-3 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </motion.svg>
                ) : isGenerating ? (
                  <motion.div
                    className={`w-2.5 h-2.5 rounded-full ${meta.color.replace('text-', 'bg-')}`}
                    animate={{ scale: [0.8, 1.1, 0.8], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                  />
                ) : isStale ? (
                  <span className="text-[9px] text-amber-500" aria-hidden="true">!</span>
                ) : isIdle ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/15" />
                ) : isRevealed ? (
                  <span className="text-[10px]" aria-hidden="true">{meta.icon}</span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                )}
              </motion.div>

              {/* Tooltip con nombre de capa */}
              <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 text-[10px] font-medium
                             text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100
                             transition-opacity pointer-events-none max-w-[120px] truncate">
                {meta.label}
              </span>
            </button>

            {/* Linea conectora */}
            {!isLast && (
              <div className={`w-0.5 h-6 ${lineColor} transition-colors duration-500`} />
            )}
          </div>
        )
      })}
    </nav>
  )
}

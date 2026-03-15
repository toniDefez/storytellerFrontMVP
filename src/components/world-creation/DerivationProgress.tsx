import { motion } from 'framer-motion'
import { LAYER_META, type LayerKey } from './DerivationLayer'
import type { ChipStatus } from './SuggestionChip'

interface DerivationProgressProps {
  layers: LayerKey[]
  statuses: Record<LayerKey, ChipStatus>
  revealedLayers: Set<LayerKey>
  activeLayer?: LayerKey
  onLayerClick: (layer: LayerKey) => void
}

/**
 * DerivationProgress -- Mini-mapa vertical del progreso de derivacion.
 *
 * Se posiciona sticky a la derecha del formulario (en desktop).
 * En mobile se convierte en una barra horizontal compacta.
 *
 * Cada nodo es un circulo conectado por una linea vertical.
 * Los estados visuales son:
 * - No revelado: circulo gris con borde punteado
 * - Revelado/Pendiente: circulo con borde del color de la capa
 * - Aceptado: circulo relleno con el color de la capa + check
 * - Activo: ring animado
 */
export function DerivationProgress({ layers, statuses, revealedLayers, activeLayer, onLayerClick }: DerivationProgressProps) {
  return (
    <nav aria-label="Progreso de derivacion" className="flex flex-col items-center gap-0">
      {layers.map((layer, idx) => {
        const meta = LAYER_META[layer]
        const isRevealed = revealedLayers.has(layer)
        const status = statuses[layer]
        const isActive = activeLayer === layer
        const isLast = idx === layers.length - 1

        // Colores basados en el estado
        const bgColor = status === 'accepted'
          ? meta.color.replace('text-', 'bg-')
          : 'bg-transparent'
        const borderColor = isRevealed
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
              disabled={!isRevealed}
              className="relative group"
              aria-label={`${meta.label}: ${status === 'accepted' ? 'confirmado' : status === 'pending' ? 'pendiente' : 'sin derivar'}`}
            >
              {/* Ring animado para capa activa */}
              {isActive && (
                <motion.div
                  className={`absolute inset-0 rounded-full ${borderColor} border-2`}
                  animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                />
              )}

              <motion.div
                whileHover={isRevealed ? { scale: 1.2 } : {}}
                className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                  isRevealed
                    ? `${bgColor} ${borderColor} ${isRevealed ? 'cursor-pointer' : ''}`
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
                ) : isRevealed ? (
                  <span className="text-[10px]" aria-hidden="true">{meta.icon}</span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                )}
              </motion.div>

              {/* Tooltip con nombre de capa */}
              <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 text-[10px] font-medium
                             text-muted-foreground whitespace-nowrap opacity-0 group-hover:opacity-100
                             transition-opacity pointer-events-none">
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

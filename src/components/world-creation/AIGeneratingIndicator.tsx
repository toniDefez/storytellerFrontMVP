import { motion } from 'framer-motion'

/**
 * AIGeneratingIndicator -- Feedback visual mientras la IA genera las derivaciones.
 *
 * No es un simple spinner. Es una animacion tematica:
 * - Un "libro" estilizado con paginas que se pasan
 * - Particulas de "tinta" que flotan suavemente
 * - Debajo, la fase real del generador cuando quien lo usa la conoce
 *   (useGenerationProgress): la animacion sola no decia si seguia vivo.
 *
 * El color sigue a la entidad: morado para mundos, naranja para personajes.
 */

type Accent = 'world' | 'character'

// Clases completas (no interpoladas) para que Tailwind las encuentre.
const ACCENT_CLASSES: Record<Accent, { left: string; right: string; spine: string; ink: string; bar: string }> = {
  world: {
    left: 'bg-primary/15',
    right: 'bg-primary/10',
    spine: 'bg-primary/30',
    ink: 'bg-primary/40',
    bar: 'via-primary/60',
  },
  character: {
    left: 'bg-orange-500/15',
    right: 'bg-orange-500/10',
    spine: 'bg-orange-500/30',
    ink: 'bg-orange-500/40',
    bar: 'via-orange-500/60',
  },
}

interface Props {
  /** Qué se está generando («Creando el personaje…»). */
  label?: string
  /** Fase real y segundos, si se conocen. */
  detail?: string
  accent?: Accent
}

export function AIGeneratingIndicator({ label = 'Generando…', detail, accent = 'world' }: Props) {
  const c = ACCENT_CLASSES[accent]
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex flex-col items-center py-12"
    >
      {/* Animacion del "libro abierto" */}
      <div className="relative w-16 h-16 mb-6">
        {/* Pagina izquierda */}
        <motion.div
          className={`absolute inset-y-0 left-0 w-8 rounded-l-sm ${c.left} origin-right`}
          animate={{ rotateY: [0, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Pagina derecha */}
        <motion.div
          className={`absolute inset-y-0 right-0 w-8 rounded-r-sm ${c.right} origin-left`}
          animate={{ rotateY: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        {/* Lomo */}
        <div className={`absolute left-1/2 -translate-x-1/2 inset-y-0 w-1 ${c.spine} rounded-full`} />

        {/* Particulas de tinta */}
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className={`absolute w-1 h-1 rounded-full ${c.ink}`}
            style={{ left: `${20 + i * 15}%`, top: '50%' }}
            animate={{
              y: [-2, -16 - i * 4, -2],
              x: [0, (i % 2 === 0 ? 6 : -6), 0],
              opacity: [0, 0.7, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              delay: i * 0.35,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <motion.div className="text-center">
        <motion.p
          className="text-sm text-muted-foreground italic font-[var(--font-display)]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {label}
        </motion.p>

        {/* Barra de progreso indeterminada estilizada */}
        <div className="mt-4 w-48 h-0.5 bg-muted rounded-full overflow-hidden mx-auto">
          <motion.div
            className={`h-full bg-gradient-to-r from-transparent ${c.bar} to-transparent rounded-full`}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '40%' }}
          />
        </div>

        {detail && (
          <p role="status" aria-live="polite" className="mt-3 max-w-sm text-xs text-muted-foreground/80 break-words">
            {detail}
          </p>
        )}
      </motion.div>
    </motion.div>
  )
}

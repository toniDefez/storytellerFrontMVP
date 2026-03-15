import { motion } from 'framer-motion'

/**
 * AIGeneratingIndicator -- Feedback visual mientras la IA genera las derivaciones.
 *
 * No es un simple spinner. Es una animacion tematica:
 * - Un "libro" estilizado con paginas que se pasan
 * - Texto descriptivo que cicla entre frases evocadoras
 * - Particulas de "tinta" que flotan suavemente
 *
 * El objetivo es que el usuario sienta que algo creativo esta
 * sucediendo, no que un servidor esta procesando datos.
 */

/* TODO: cycle through these phrases in the indicator animation */
// const PHRASES = [
//   'Extrayendo consecuencias del eje...',
//   'Imaginando como la ceniza cae sobre los campos...',
//   'Derivando sistemas de subsistencia...',
//   'Descubriendo tensiones ocultas...',
//   'Tejiendo el tono de esta historia...',
// ]

export function AIGeneratingIndicator() {
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
          className="absolute inset-y-0 left-0 w-8 rounded-l-sm bg-primary/15 origin-right"
          animate={{ rotateY: [0, -15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Pagina derecha */}
        <motion.div
          className="absolute inset-y-0 right-0 w-8 rounded-r-sm bg-primary/10 origin-left"
          animate={{ rotateY: [0, 15, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
        />
        {/* Lomo */}
        <div className="absolute left-1/2 -translate-x-1/2 inset-y-0 w-1 bg-primary/30 rounded-full" />

        {/* Particulas de tinta */}
        {[0, 1, 2, 3, 4].map(i => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-primary/40"
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

      {/* Texto ciclico */}
      <motion.div className="text-center">
        <motion.p
          className="text-sm text-muted-foreground italic font-[var(--font-display)]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          Derivando tu mundo...
        </motion.p>

        {/* Barra de progreso indeterminada estilizada */}
        <div className="mt-4 w-48 h-0.5 bg-muted rounded-full overflow-hidden mx-auto">
          <motion.div
            className="h-full bg-gradient-to-r from-transparent via-primary/60 to-transparent rounded-full"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: '40%' }}
          />
        </div>
      </motion.div>
    </motion.div>
  )
}

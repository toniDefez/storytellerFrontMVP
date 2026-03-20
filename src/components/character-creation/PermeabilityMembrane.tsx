import { motion } from 'framer-motion'

interface PermeabilityMembraneProps {
  /** Structured halves from generator — preferred */
  declared?: string
  operative?: string
  /** Legacy combined string fallback */
  contradiction?: string
}

const ADVERSATIVES = [
  ' pero ', ' aunque ', ' sin embargo ', ' mientras que ', ' a pesar de ',
  ' no obstante ', ' y sin embargo ', ' mas ', ' aun así ', ' con todo ',
]

function splitContradiction(text: string): [string, string] {
  const lower = text.toLowerCase()
  for (const connector of ADVERSATIVES) {
    const idx = lower.indexOf(connector)
    if (idx > 10 && idx < text.length - 10) {
      return [text.slice(0, idx).trim(), text.slice(idx + connector.length).trim()]
    }
  }
  // No connector found — split roughly in half at a word boundary
  const half = Math.floor(text.length / 2)
  const pivot = text.indexOf(' ', half)
  if (pivot !== -1) return [text.slice(0, pivot).trim(), text.slice(pivot + 1).trim()]
  return [text, '']
}

// Animate particles drifting left→right through the membrane
const particles = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  delay: i * 0.7,
  yOffset: 20 + i * 12,
}))

export function PermeabilityMembrane({ declared: declaredProp, operative: operativeProp, contradiction }: PermeabilityMembraneProps) {
  const hasDirect = declaredProp && operativeProp
  if (!hasDirect && !contradiction) return null

  const [declared, operative] = hasDirect
    ? [declaredProp, operativeProp]
    : splitContradiction(contradiction!)

  return (
    <div className="mb-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 mb-2">
        Contradicción interna
      </p>

      <div className="relative flex rounded-xl overflow-hidden border border-border/50" style={{ minHeight: 100 }}>
        {/* LEFT — declared self */}
        <div className="flex-1 bg-blue-50/60 px-4 py-3 pr-2">
          <p className="text-[8.5px] font-semibold uppercase tracking-widest text-blue-500/70 mb-1.5">
            Lo que declara
          </p>
          <p className="text-[12px] font-[var(--font-display)] italic text-foreground/80 leading-snug">
            {declared}
          </p>
        </div>

        {/* MEMBRANE */}
        <div className="relative w-8 flex-shrink-0 flex flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50/60 via-white to-rose-50/60">
          {/* Dashed separator */}
          <div className="absolute inset-0 flex flex-col justify-around items-center py-2">
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} className="w-px h-2 rounded-full bg-muted-foreground/20" />
            ))}
          </div>

          {/* Tension icon */}
          <motion.span
            className="relative z-10 text-sm bg-white rounded px-0.5"
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            ⚡
          </motion.span>

          {/* Leaking particles */}
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute w-1 h-1 rounded-full bg-rose-400/60"
              style={{ top: p.yOffset, left: '50%' }}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 10, opacity: [0, 0.8, 0] }}
              transition={{
                duration: 1.8,
                delay: p.delay,
                repeat: Infinity,
                repeatDelay: 1.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* RIGHT — operative self */}
        <div className="flex-1 bg-rose-50/60 px-4 py-3 pl-2">
          <p className="text-[8.5px] font-semibold uppercase tracking-widest text-rose-500/70 mb-1.5">
            Lo que opera
          </p>
          <p className="text-[12px] font-[var(--font-display)] italic text-foreground/80 leading-snug">
            {operative || declared}
          </p>
        </div>
      </div>

      <p className="text-[10.5px] text-muted-foreground/50 text-center mt-2 italic">
        La membrana es semipermeable — algo siempre se filtra
      </p>
    </div>
  )
}

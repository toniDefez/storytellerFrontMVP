import { motion } from 'framer-motion'

const STATES = [
  {
    key: 'dormido',
    label: 'Dormido',
    description: 'No cuestiona el orden. Vive dentro de la mentira sin saberlo.',
    activeClass: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    key: 'inquieto',
    label: 'Inquieto',
    description: 'Siente que algo falla, pero no sabe nombrar qué.',
    activeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    key: 'despierto',
    label: 'Despierto',
    description: 'Ve la mentira con claridad, pero aún no sabe qué hacer con ese saber.',
    activeClass: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  {
    key: 'explotador',
    label: 'Explotador',
    description: 'Conoce la mentira y la usa a su favor. Cómplice consciente del sistema.',
    activeClass: 'bg-red-50 text-red-700 border-red-200',
  },
  {
    key: 'subversivo',
    label: 'Subversivo',
    description: 'Actúa activamente para destruir la mentira. El sistema lo teme.',
    activeClass: 'bg-rose-50 text-rose-800 border-rose-300',
  },
] as const

type LieState = (typeof STATES)[number]['key']

interface LieSpectrumBarProps {
  state: string | undefined
}

function normalizeState(raw: string | undefined): LieState {
  if (!raw) return 'dormido'
  const lower = raw.toLowerCase()
  for (const s of STATES) {
    if (lower.includes(s.key)) return s.key
  }
  return 'dormido'
}

export function LieSpectrumBar({ state }: LieSpectrumBarProps) {
  const active = normalizeState(state)
  const activeIdx = STATES.findIndex(s => s.key === active)
  const activeState = STATES[activeIdx]

  return (
    <div className="mb-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 mb-3">
        Relación con la mentira colectiva
      </p>

      {/* Track */}
      <div className="flex gap-1.5 relative mb-5">
        {STATES.map((s) => {
          const isActive = s.key === active
          return (
            <div
              key={s.key}
              className={`relative flex-1 h-7 rounded-md flex items-center justify-center
                          border text-[8px] font-bold uppercase tracking-[0.05em] transition-all duration-200
                          ${isActive ? s.activeClass : 'bg-muted/40 border-border/50 text-muted-foreground/40'}`}
            >
              {s.label}

              {/* Indicator arrow */}
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20, delay: 0.3 }}
                  className="absolute -bottom-4 left-1/2 -translate-x-1/2"
                >
                  <svg width="10" height="6" viewBox="0 0 10 6" className="fill-current text-muted-foreground/50">
                    <path d="M5 6L0 0h10L5 6z"/>
                  </svg>
                </motion.div>
              )}
            </div>
          )
        })}
      </div>

      {/* Description */}
      <motion.p
        key={active}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.4 }}
        className="text-center text-[12.5px] italic text-muted-foreground font-[var(--font-display)] leading-relaxed px-2"
      >
        "{activeState.description}"
      </motion.p>
    </div>
  )
}

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const pillTransition = { type: 'spring', stiffness: 400, damping: 18 } as const

interface PillSelectProps {
  options: string[]
  value: string
  onChange: (value: string) => void
  descriptions?: Record<string, string>
}

export function PillSelect({ options, value, onChange, descriptions }: PillSelectProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const activeKey = hovered ?? (value || null)
  const activeDesc = activeKey ? descriptions?.[activeKey] : null

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <motion.button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? '' : opt)}
            onMouseEnter={() => setHovered(opt)}
            onMouseLeave={() => setHovered(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            transition={pillTransition}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors duration-150 ${
              value === opt
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                : 'bg-background text-muted-foreground border-input hover:border-primary hover:text-accent-foreground hover:bg-accent'
            }`}
          >
            {opt}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {activeDesc && (
          <motion.div
            key={activeKey}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 px-4 py-2 border-l-2 border-primary/40 bg-accent rounded-r-lg">
              <p className="text-[11px] text-accent-foreground italic leading-relaxed">{activeDesc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface MultiPillSelectProps {
  options: string[]
  value: string[]
  onChange: (value: string[]) => void
  descriptions?: Record<string, string>
}

export function MultiPillSelect({ options, value, onChange, descriptions }: MultiPillSelectProps) {
  const [hovered, setHovered] = useState<string | null>(null)
  const activeDesc = hovered ? descriptions?.[hovered] : null

  const toggle = (opt: string) => {
    if (value.includes(opt)) onChange(value.filter(v => v !== opt))
    else onChange([...value, opt])
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map(opt => (
          <motion.button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            onMouseEnter={() => setHovered(opt)}
            onMouseLeave={() => setHovered(null)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.93 }}
            transition={pillTransition}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium border transition-colors duration-150 ${
              value.includes(opt)
                ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/20'
                : 'bg-background text-muted-foreground border-input hover:border-primary hover:text-accent-foreground hover:bg-accent'
            }`}
          >
            {opt}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {activeDesc && (
          <motion.div
            key={hovered}
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 px-4 py-2 border-l-2 border-primary/40 bg-accent rounded-r-lg">
              <p className="text-[11px] text-accent-foreground italic leading-relaxed">{activeDesc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

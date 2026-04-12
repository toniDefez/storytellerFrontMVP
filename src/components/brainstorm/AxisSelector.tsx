import { motion } from 'framer-motion'
import type { BrainstormAxis } from '@/services/api'

interface Props {
  axes: BrainstormAxis[]
  activeIndex: number
  onSelect: (index: number) => void
  loading?: boolean
}

export function AxisSelector({ axes, activeIndex, onSelect, loading }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {axes.map((axis, i) => (
        <motion.button
          key={i}
          type="button"
          onClick={() => onSelect(i)}
          disabled={loading}
          className="relative px-3 py-1.5 rounded-full text-sm transition-colors disabled:opacity-50"
          style={{
            fontFamily: 'var(--font-ui)',
            backgroundColor: i === activeIndex ? 'hsl(260 45% 50%)' : 'hsl(260 25% 96%)',
            color: i === activeIndex ? 'white' : 'hsl(260 30% 40%)',
            border: `1px solid ${i === activeIndex ? 'hsl(260 45% 50%)' : 'hsl(260 20% 88%)'}`,
          }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {axis.topic}
        </motion.button>
      ))}
    </div>
  )
}

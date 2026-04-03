import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import type { Character } from '@/services/api'
import { ConsciousnessStateDot } from './ConsciousnessStateDot'

interface Props {
  character: Character
  selected: boolean
  onClick: () => void
  onDelete?: () => void
}

export function CharacterCard({ character, selected, onClick, onDelete }: Props) {
  const initial = character.name?.charAt(0)?.toUpperCase() || '?'

  return (
    <motion.button
      onClick={onClick}
      className={`
        group w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left
        transition-colors duration-150 relative
        ${selected
          ? 'bg-[hsl(18_55%_94%)] border border-[hsl(17_63%_37%/0.3)] shadow-sm'
          : 'border border-transparent hover:bg-[hsl(18_55%_94%/0.5)]'
        }
      `}
      whileHover={{ x: selected ? 0 : 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {selected && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[hsl(17_63%_37%/0.6)]" />
      )}

      <span className="w-9 h-9 rounded-lg bg-[hsl(17_63%_37%/0.08)] flex items-center justify-center shrink-0 relative">
        <span className="font-[family-name:var(--font-display)] text-lg italic text-[hsl(17_63%_37%)] leading-none select-none">
          {initial}
        </span>
        <span className="absolute -top-0.5 -right-0.5">
          <ConsciousnessStateDot state={character.consciousness_state} />
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-foreground truncate">
          {character.name}
        </span>
        {character.role && (
          <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground/60 truncate">
            {character.role}
          </span>
        )}
      </span>

      {onDelete && (
        <span
          role="button"
          tabIndex={0}
          onClick={e => { e.stopPropagation(); onDelete() }}
          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onDelete() } }}
          className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-md
                     text-muted-foreground/40 hover:text-red-500 hover:bg-red-50
                     transition-all duration-150"
          aria-label={`Eliminar ${character.name}`}
        >
          <Trash2 className="w-3.5 h-3.5" />
        </span>
      )}
    </motion.button>
  )
}

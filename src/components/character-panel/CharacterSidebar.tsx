import { Plus } from 'lucide-react'
import type { Character } from '@/services/api'
import { CharacterCard } from './CharacterCard'

interface Props {
  worldPremise: string
  characters: Character[]
  selectedId: number | null
  onSelect: (id: number) => void
  onNewCharacter: () => void
}

export function CharacterSidebar({ worldPremise, characters, selectedId, onSelect, onNewCharacter }: Props) {
  return (
    <div className="flex flex-col h-full min-h-0 border-r border-border/40">
      {/* World premise */}
      {worldPremise && (
        <div className="px-5 pt-6 pb-4 border-b border-border/40">
          <p className="font-display text-sm italic text-foreground/40 leading-relaxed border-l-2 border-[hsl(17_63%_37%/0.25)] pl-4 line-clamp-4">
            {worldPremise}
          </p>
        </div>
      )}

      {/* Character list */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1.5">
        {characters.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <p className="font-display text-xl italic text-foreground/15 mb-2">Sin personajes aun</p>
            <p className="text-sm text-muted-foreground/50">Todo mundo necesita sus protagonistas.</p>
          </div>
        ) : (
          characters.map(c => (
            <CharacterCard
              key={c.id}
              character={c}
              selected={selectedId === c.id}
              onClick={() => onSelect(c.id)}
            />
          ))
        )}
      </div>

      {/* New character button — sticky bottom */}
      <div className="sticky bottom-0 px-3 py-3 bg-gradient-to-t from-[var(--background)] to-transparent">
        <button
          onClick={onNewCharacter}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg
                     border-2 border-dashed border-[hsl(17_63%_37%/0.2)]
                     text-[hsl(17_63%_37%)] text-xs font-medium
                     hover:border-[hsl(17_63%_37%/0.4)] hover:bg-[hsl(18_55%_94%/0.5)]
                     transition-all duration-150"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo personaje
        </button>
      </div>
    </div>
  )
}

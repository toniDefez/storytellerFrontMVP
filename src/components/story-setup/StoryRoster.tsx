import { X, Plus } from 'lucide-react'
import type { StoryCharacter, CharacterBrief } from '@/services/api'
import { Badge } from '@/components/ui/badge'

interface Props {
  storyCharacters: StoryCharacter[]
  availableCharacters: CharacterBrief[]
  onAdd: (characterId: number) => Promise<void>
  onRemove: (characterId: number) => Promise<void>
}

export function StoryRoster({ storyCharacters, availableCharacters, onAdd, onRemove }: Props) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Reparto{' '}
          {storyCharacters.length > 0 && (
            <Badge variant="outline" className="ml-1 text-xs">
              {storyCharacters.length}
            </Badge>
          )}
        </h3>
      </div>

      {/* Rostered characters */}
      {storyCharacters.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-1">
          Sin personajes en el reparto. Añade personajes del mundo para empezar.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {storyCharacters.map(char => (
            <div
              key={char.character_id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[#f97316]/30 bg-[#f97316]/5 text-sm font-medium text-[#c2410c]"
            >
              <span>{char.name}</span>
              <button
                onClick={() => onRemove(char.character_id)}
                className="text-[#f97316]/60 hover:text-[#c2410c] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-full"
                aria-label={`Quitar ${char.name} del reparto`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Available characters */}
      {availableCharacters.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          <span className="text-xs text-muted-foreground font-medium">Disponibles en este mundo:</span>
          <div className="flex flex-wrap gap-2">
            {availableCharacters.map(char => (
              <button
                key={char.id}
                onClick={() => onAdd(char.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border text-sm text-muted-foreground hover:border-[#f97316]/40 hover:bg-[#f97316]/5 hover:text-[#c2410c] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                aria-label={`Añadir ${char.name} al reparto`}
              >
                <Plus className="w-3 h-3" />
                {char.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {availableCharacters.length === 0 && storyCharacters.length > 0 && (
        <p className="text-xs text-muted-foreground italic">
          Todos los personajes del mundo están en el reparto.
        </p>
      )}
    </div>
  )
}

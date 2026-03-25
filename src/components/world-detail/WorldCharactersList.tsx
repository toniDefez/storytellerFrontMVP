import { Link } from 'react-router-dom'
import { Users, Plus } from 'lucide-react'
import type { CharacterBrief } from '@/services/api'

interface Props {
  worldId: number
  characters: CharacterBrief[]
  worldSummary: string
}

export function WorldCharactersList({ worldId, characters, worldSummary }: Props) {
  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      {/* World reference */}
      {worldSummary && (
        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/10 max-w-2xl">
          <p className="text-xs font-semibold text-primary/60 uppercase tracking-widest mb-1">Referencia del mundo</p>
          <p className="text-sm text-foreground/70 leading-relaxed">{worldSummary}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5 max-w-2xl">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-[#f97316]" />
          <h2 className="text-sm font-semibold text-foreground">
            Personajes
            {characters.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">({characters.length})</span>
            )}
          </h2>
        </div>
        <Link
          to={`/worlds/${worldId}/characters/create`}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-[#f97316]/10 text-[#c2410c] hover:bg-[#f97316]/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nuevo personaje
        </Link>
      </div>

      {/* List */}
      {characters.length === 0 ? (
        <div className="max-w-2xl flex flex-col items-center justify-center py-16 text-center">
          <Users className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No hay personajes todavía.</p>
          <Link
            to={`/worlds/${worldId}/characters/create`}
            className="mt-3 text-xs text-[#c2410c] hover:underline"
          >
            Crea el primero
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-4xl">
          {characters.map(c => (
            <Link
              key={c.id}
              to={`/worlds/${worldId}/characters/${c.id}`}
              className="group flex items-center gap-3 p-3.5 rounded-lg border border-border/60 bg-background hover:border-[#f97316]/30 hover:bg-[#f97316]/5 transition-all duration-150"
            >
              <div className="w-8 h-8 rounded-full bg-[#f97316]/10 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-[#f97316]" />
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-[#c2410c] transition-colors truncate">
                {c.name}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

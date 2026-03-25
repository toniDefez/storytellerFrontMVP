import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { CharacterBrief } from '@/services/api'

interface Props {
  worldId: number
  characters: CharacterBrief[]
  worldSummary: string
}

export function WorldCharactersList({ worldId, characters, worldSummary }: Props) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-10 py-8 max-w-5xl">

        {/* Section heading — literary serif */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl italic text-foreground tracking-tight">Personajes</h2>
            {characters.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{characters.length} en este mundo</p>
            )}
          </div>
          <Link
            to={`/worlds/${worldId}/characters/create`}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-[#f97316]/10 text-[#c2410c] hover:bg-[#f97316]/20 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]/50 focus-visible:ring-offset-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Nuevo personaje
          </Link>
        </div>

        {/* World reference — epigraph style */}
        {worldSummary && (
          <div className="mb-8 pl-4 border-l-2 border-[#f97316]/30 max-w-xl">
            <p className="font-display text-sm italic text-foreground/50 leading-relaxed">{worldSummary}</p>
          </div>
        )}

        {/* Empty state */}
        {characters.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl italic text-foreground/20 mb-3">Sin personajes aún</p>
            <p className="text-sm text-muted-foreground mb-5">Todo mundo necesita sus protagonistas.</p>
            <Link
              to={`/worlds/${worldId}/characters/create`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#c2410c] hover:text-[#f97316] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]/50 focus-visible:ring-offset-2 rounded-sm"
            >
              <Plus className="w-4 h-4" />
              Crear el primero
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map(c => {
              const initial = c.name.charAt(0).toUpperCase()
              return (
                <Link
                  key={c.id}
                  to={`/worlds/${worldId}/characters/${c.id}`}
                  className="group flex items-center gap-4 p-4 rounded-lg border border-border/40 bg-background hover:border-[#f97316]/40 hover:bg-[#f97316]/[0.03] hover:-translate-y-0.5 hover:shadow-md transition-[transform,box-shadow,border-color,background-color] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f97316]/50 focus-visible:ring-offset-2"
                >
                  {/* Initial letter — literary, distinctive per character */}
                  <div className="w-10 h-10 rounded-lg bg-[#f97316]/10 flex items-center justify-center shrink-0 group-hover:bg-[#f97316]/20 transition-colors duration-150">
                    <span className="font-display text-xl italic text-[#f97316] leading-none select-none">{initial}</span>
                  </div>
                  <span className="text-sm font-medium text-foreground group-hover:text-[#c2410c] transition-colors duration-150 truncate">
                    {c.name}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

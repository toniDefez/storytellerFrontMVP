import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import type { SceneBrief } from '@/services/api'

interface Props {
  worldId: number
  scenes: SceneBrief[]
  worldSummary: string
}

export function WorldScenesList({ worldId, scenes, worldSummary }: Props) {
  const sorted = [...scenes].sort((a, b) => a.position - b.position)

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-10 py-8 max-w-3xl">

        {/* Section heading — literary serif */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl italic text-foreground tracking-tight">Escenas</h2>
            {scenes.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{scenes.length} en este mundo</p>
            )}
          </div>
          <Link
            to={`/worlds/${worldId}/scenes/create`}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-[#06b6d4]/10 text-[#0e7490] hover:bg-[#06b6d4]/20 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/50 focus-visible:ring-offset-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva escena
          </Link>
        </div>

        {/* World reference — epigraph style */}
        {worldSummary && (
          <div className="mb-8 pl-4 border-l-2 border-[#06b6d4]/30 max-w-xl">
            <p className="font-display text-sm italic text-foreground/50 leading-relaxed">{worldSummary}</p>
          </div>
        )}

        {/* Empty state */}
        {sorted.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl italic text-foreground/20 mb-3">Sin escenas aún</p>
            <p className="text-sm text-muted-foreground mb-5">Las historias comienzan con una primera escena.</p>
            <Link
              to={`/worlds/${worldId}/scenes/create`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#0e7490] hover:text-[#06b6d4] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/50 focus-visible:ring-offset-2 rounded-sm"
            >
              <Plus className="w-4 h-4" />
              Crear la primera
            </Link>
          </div>
        ) : (
          <div className="flex flex-col">
            {sorted.map((s, index) => (
              <Link
                key={s.id}
                to={`/worlds/${worldId}/scenes/${s.id}`}
                className="group flex items-baseline gap-5 py-4 border-b border-border/30 last:border-0 -mx-4 px-4 rounded-sm hover:bg-[#06b6d4]/[0.03] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/50 focus-visible:ring-offset-2"
              >
                {/* Chapter-style number — dramatic, literary */}
                <span className="font-display text-3xl italic leading-none text-[#06b6d4]/25 group-hover:text-[#06b6d4]/60 transition-colors duration-150 w-9 text-right shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="text-sm font-medium text-foreground group-hover:text-[#0e7490] transition-colors duration-150 leading-snug">
                  {s.title}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

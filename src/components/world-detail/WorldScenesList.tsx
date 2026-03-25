import { Link } from 'react-router-dom'
import { Clapperboard, Plus } from 'lucide-react'
import type { SceneBrief } from '@/services/api'

interface Props {
  worldId: number
  scenes: SceneBrief[]
  worldSummary: string
}

export function WorldScenesList({ worldId, scenes, worldSummary }: Props) {
  const sorted = [...scenes].sort((a, b) => a.position - b.position)

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      {/* World reference */}
      {worldSummary && (
        <div className="mb-6 p-4 rounded-lg bg-[#06b6d4]/5 border border-[#06b6d4]/10 max-w-2xl">
          <p className="text-xs font-semibold text-[#0e7490]/60 uppercase tracking-widest mb-1">Referencia del mundo</p>
          <p className="text-sm text-foreground/70 leading-relaxed">{worldSummary}</p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5 max-w-2xl">
        <div className="flex items-center gap-2">
          <Clapperboard className="w-4 h-4 text-[#06b6d4]" />
          <h2 className="text-sm font-semibold text-foreground">
            Escenas
            {scenes.length > 0 && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">({scenes.length})</span>
            )}
          </h2>
        </div>
        <Link
          to={`/worlds/${worldId}/scenes/create`}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-[#06b6d4]/10 text-[#0e7490] hover:bg-[#06b6d4]/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Nueva escena
        </Link>
      </div>

      {/* List */}
      {sorted.length === 0 ? (
        <div className="max-w-2xl flex flex-col items-center justify-center py-16 text-center">
          <Clapperboard className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No hay escenas todavía.</p>
          <Link
            to={`/worlds/${worldId}/scenes/create`}
            className="mt-3 text-xs text-[#0e7490] hover:underline"
          >
            Crea la primera
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-2 max-w-2xl">
          {sorted.map(s => (
            <Link
              key={s.id}
              to={`/worlds/${worldId}/scenes/${s.id}`}
              className="group flex items-center gap-3 p-3.5 rounded-lg border border-border/60 bg-background hover:border-[#06b6d4]/30 hover:bg-[#06b6d4]/5 transition-all duration-150"
            >
              <div className="w-6 h-6 rounded bg-[#06b6d4]/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-[#0e7490]">
                {s.position + 1}
              </div>
              <span className="text-sm font-medium text-foreground group-hover:text-[#0e7490] transition-colors truncate">
                {s.title}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

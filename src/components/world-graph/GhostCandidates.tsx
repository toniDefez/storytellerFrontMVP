import { X } from 'lucide-react'
import type { CandidateNode } from '@/services/api'
import { DOMAIN_COLOR, DOMAIN_LABEL, EDGE_LABEL } from './treeLayout'

interface GhostCandidatesProps {
  candidates: CandidateNode[]
  parentLabel: string
  onConfirm: (candidate: CandidateNode) => void
  onDismiss: () => void
}

export function GhostCandidates({ candidates, parentLabel, onConfirm, onDismiss }: GhostCandidatesProps) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 bg-background/95 backdrop-blur border-t border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-foreground">
            Expande: <span className="text-primary">{parentLabel}</span>
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Elige un nodo hijo o cierra para escribir el tuyo
          </p>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {candidates.map((c, i) => {
          const color = DOMAIN_COLOR[c.domain] ?? '#a855f7'
          return (
            <button
              key={i}
              onClick={() => onConfirm(c)}
              className="text-left p-3 rounded-lg border-2 border-dashed hover:border-solid transition-all group"
              style={{ borderColor: color + '80' }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {DOMAIN_LABEL[c.domain] ?? c.domain}
                </span>
              </div>
              <p className="text-xs font-semibold text-foreground leading-tight group-hover:text-primary transition-colors">
                {c.label}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-snug line-clamp-2">
                {c.description}
              </p>
              <p className="text-[9px] text-muted-foreground/70 mt-1 italic">
                ↳ {EDGE_LABEL[c.parent_edge_type] ?? c.parent_edge_type}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}

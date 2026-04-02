import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LocationNode, LocationNodeType, NarrativeFunction } from '@/services/api'

const NODE_TYPE_ICONS: Record<LocationNodeType, string> = {
  settlement: '🏘',
  wilderness: '🌲',
  ruin: '🏚',
  landmark: '⛰',
  passage: '🚪',
  structure: '🏛',
}

const NARRATIVE_FN_LABELS: Record<NarrativeFunction, string> = {
  conflict: 'Conflicto',
  origin: 'Origen',
  threshold: 'Umbral',
  atmosphere: 'Atmósfera',
}

const NARRATIVE_FN_COLORS: Record<NarrativeFunction, string> = {
  conflict: 'bg-red-500/15 text-red-700 border-red-500/20',
  origin: 'bg-amber-500/15 text-amber-700 border-amber-500/20',
  threshold: 'bg-violet-500/15 text-violet-700 border-violet-500/20',
  atmosphere: 'bg-sky-500/15 text-sky-700 border-sky-500/20',
}

interface Props {
  node: LocationNode
  connectedNodes: LocationNode[]
  childNodes: LocationNode[]
  onEdit: (node: LocationNode) => void
  onDelete: (id: number) => void
  onAddChild: (parentNode: LocationNode) => void
  onSelectChild: (node: LocationNode) => void
  onClose: () => void
}

export function LocationNodeDetailPanel({ node, connectedNodes, childNodes, onEdit, onDelete, onAddChild, onSelectChild, onClose }: Props) {
  const [storyLayerOpen, setStoryLayerOpen] = useState(false)
  const p = node.properties

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <span className="text-xs uppercase tracking-widest text-[#14b8a6] font-semibold">
          {node.node_type}
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h3 className="font-[var(--font-display)] text-lg font-semibold">{node.name}</h3>

        {node.narrative_function && (
          <span className={`inline-block text-xs px-2 py-0.5 rounded-full border font-medium ${NARRATIVE_FN_COLORS[node.narrative_function] ?? ''}`}>
            {NARRATIVE_FN_LABELS[node.narrative_function] ?? node.narrative_function}
          </span>
        )}

        {node.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{node.description}</p>
        )}

        {node.source_hint && (
          <div className="text-xs text-muted-foreground/70 italic border-l-2 border-[#14b8a6]/30 pl-2">
            {node.source_hint}
          </div>
        )}

        {connectedNodes.length > 0 && (
          <div>
            <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">Conexiones</div>
            <div className="flex flex-wrap gap-1.5">
              {connectedNodes.map(n => (
                <span key={n.id} className="text-xs bg-[#14b8a6]/10 text-[#0f766e] border border-[#14b8a6]/20 px-2 py-0.5 rounded-full">
                  {n.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Lugares dentro */}
        <div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
            Lugares dentro{childNodes.length > 0 && (
              <span className="text-muted-foreground/60 ml-1">({childNodes.length})</span>
            )}
          </div>
          {childNodes.length > 0 ? (
            <div className="space-y-0.5">
              {childNodes.map(child => (
                <button
                  key={child.id}
                  onClick={() => onSelectChild(child)}
                  className="w-full text-left group flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-[#14b8a6]/10 transition-colors"
                >
                  <span className="text-sm leading-5 w-5 shrink-0">
                    {NODE_TYPE_ICONS[child.node_type] ?? '📍'}
                  </span>
                  <span className="text-sm font-medium text-foreground group-hover:text-[#14b8a6] transition-colors truncate">
                    {child.name}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic px-2 py-1">
              Sin lugares dentro
            </p>
          )}
        </div>

        {/* Capa narrativa colapsable */}
        {(p.atmosphere || p.social_filter || p.behavioral_rule || p.control || p.duration) && (
          <div className="border border-border/50 rounded-lg overflow-hidden">
            <button
              onClick={() => setStoryLayerOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-muted-foreground hover:bg-accent/30 transition-colors"
            >
              <span>Capa narrativa</span>
              {storyLayerOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
            {storyLayerOpen && (
              <div className="px-3 pb-3 pt-1 space-y-2">
                {p.atmosphere && <div className="text-xs"><span className="text-muted-foreground">👃 </span><span className="italic">{p.atmosphere}</span></div>}
                {p.social_filter && <div className="text-xs"><span className="text-muted-foreground">👥 </span>{p.social_filter}</div>}
                {p.behavioral_rule && <div className="text-xs"><span className="text-muted-foreground">🚫 </span>{p.behavioral_rule}</div>}
                {p.control && <div className="text-xs"><span className="text-muted-foreground">👑 </span>{p.control}</div>}
                {p.duration && <div className="text-xs"><span className="text-muted-foreground">⏳ </span>{p.duration}</div>}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="p-4 border-t border-border/50 space-y-2">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5 text-[#14b8a6] border-[#14b8a6]/30 hover:bg-[#14b8a6]/10 hover:border-[#14b8a6]/50"
          onClick={() => onAddChild(node)}
        >
          <Plus className="w-3.5 h-3.5" /> Añadir lugar dentro
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => onEdit(node)}>
            <Pencil className="w-3.5 h-3.5" /> Editar
          </Button>
          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(node.id)}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

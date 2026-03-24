import { useState } from 'react'
import { ChevronDown, ChevronRight, Trash2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LocationNode } from '@/services/api'

interface Props {
  node: LocationNode
  connectedNodes: LocationNode[]
  onEdit: (node: LocationNode) => void
  onDelete: (id: number) => void
  onClose: () => void
}

export function LocationNodeDetailPanel({ node, connectedNodes, onEdit, onDelete, onClose }: Props) {
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

        {node.description && (
          <p className="text-sm text-muted-foreground leading-relaxed">{node.description}</p>
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

      <div className="p-4 border-t border-border/50 flex gap-2">
        <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => onEdit(node)}>
          <Pencil className="w-3.5 h-3.5" /> Editar
        </Button>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(node.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

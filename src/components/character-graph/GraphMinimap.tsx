import { Trash2 } from 'lucide-react'
import type { CharacterNode } from '@/services/api'

const DOMAIN_META: Record<string, { label: string; color: string; bg: string }> = {
  origin:  { label: 'Creencias', color: '#6366F1', bg: '#eef2ff' },
  fear:    { label: 'Miedos',    color: '#EF4444', bg: '#fef2f2' },
  drive:   { label: 'Deseos',    color: '#F59E0B', bg: '#fffbeb' },
  mask:    { label: 'Máscaras',  color: '#10B981', bg: '#ecfdf5' },
  bond:    { label: 'Grietas',   color: '#8B5CF6', bg: '#f5f3ff' },
}

// Fixed order for pipeline display
const PIPELINE_ORDER = ['origin', 'fear', 'drive', 'mask', 'bond']

interface Props {
  nodes: CharacterNode[]
  selectedNodeId: number | null
  onSelectNode: (id: number) => void
  onRemoveNode?: (id: number) => void
}

export function GraphMinimap({ nodes, selectedNodeId, onSelectNode, onRemoveNode }: Props) {
  const nodeByDomain = new Map<string, CharacterNode[]>()
  for (const node of nodes) {
    const list = nodeByDomain.get(node.domain) || []
    list.push(node)
    nodeByDomain.set(node.domain, list)
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground/40 italic p-4">
        Sin nodos definidos
      </div>
    )
  }

  // Show in pipeline order
  const orderedDomains = PIPELINE_ORDER.filter(d => nodeByDomain.has(d))

  return (
    <div className="overflow-y-auto p-3 space-y-2">
      <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-foreground/30 mb-2">
        Flujo de decisión
      </p>
      {orderedDomains.map((domain, i) => {
        const meta = DOMAIN_META[domain] || { label: domain, color: '#999', bg: '#f5f5f5' }
        const domainNodes = nodeByDomain.get(domain) || []
        return (
          <div key={domain}>
            {/* Stage header */}
            <div
              className="flex items-center gap-2 px-2 py-1 rounded-md mb-1"
              style={{ background: meta.bg }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: meta.color }}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-wide"
                style={{ color: meta.color }}
              >
                {meta.label}
              </span>
            </div>

            {/* Nodes in this stage */}
            {domainNodes.map(n => (
              <div
                key={n.id}
                className={`group flex items-center gap-1 rounded-md transition-all duration-150 ml-1
                  ${selectedNodeId === n.id
                    ? 'bg-amber-100 shadow-sm'
                    : 'hover:bg-muted/50'}`}
              >
                <button
                  onClick={() => onSelectNode(n.id)}
                  className={`flex-1 text-left px-2 py-1.5 text-[11px] min-w-0 truncate
                    ${selectedNodeId === n.id
                      ? 'text-amber-900 font-medium'
                      : 'text-foreground/70'}`}
                >
                  {n.label}
                </button>
                {onRemoveNode && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemoveNode(n.id) }}
                    className="p-1 mr-1 rounded opacity-0 group-hover:opacity-100 text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-all"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}

            {/* Arrow between stages */}
            {i < orderedDomains.length - 1 && (
              <div className="flex justify-center py-0.5">
                <span className="text-[10px] text-foreground/20">↓</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

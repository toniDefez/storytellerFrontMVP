import type { CharacterNode } from '@/services/api'

const DOMAIN_META: Record<string, { label: string; color: string; bg: string }> = {
  fear:    { label: 'Miedo',     color: '#dc2626', bg: '#fef2f2' },
  drive:   { label: 'Necesidad', color: '#059669', bg: '#ecfdf5' },
  mask:    { label: 'Armadura',  color: '#64748b', bg: '#f8fafc' },
  tension: { label: 'Señal',     color: '#d97706', bg: '#fffbeb' },
  bond:    { label: 'Quiebre',   color: '#9333ea', bg: '#faf5ff' },
  origin:  { label: 'Origen',    color: '#a8a29e', bg: '#f5f5f4' },
  belief:  { label: 'Creencia',  color: '#d97706', bg: '#fffbeb' },
}

// Fixed order for pipeline display
const PIPELINE_ORDER = ['fear', 'drive', 'mask', 'tension', 'bond']

interface Props {
  nodes: CharacterNode[]
  selectedNodeId: number | null
  onSelectNode: (id: number) => void
}

export function GraphMinimap({ nodes, selectedNodeId, onSelectNode }: Props) {
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
              <button
                key={n.id}
                onClick={() => onSelectNode(n.id)}
                className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] transition-all duration-150 ml-1
                  ${selectedNodeId === n.id
                    ? 'bg-amber-100 text-amber-900 font-medium shadow-sm'
                    : 'text-foreground/70 hover:bg-muted/50'}`}
              >
                {n.label}
              </button>
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

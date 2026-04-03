import type { CharacterNode, CharacterNodeDomain } from '@/services/api'

const DOMAIN_META: Record<string, { label: string; color: string }> = {
  fear:    { label: 'Miedo', color: '#dc2626' },
  drive:   { label: 'Necesidad', color: '#059669' },
  mask:    { label: 'Armadura', color: '#64748b' },
  tension: { label: 'Señal', color: '#d97706' },
  bond:    { label: 'Quiebre', color: '#9333ea' },
  // Backwards compatibility for old nodes
  origin:  { label: 'Origen', color: '#a8a29e' },
  belief:  { label: 'Creencia', color: '#d97706' },
}

const ROLE_LABELS: Record<string, string> = {
  trait: 'Rasgo',
  wound: 'Herida',
  arc_seed: 'Arco',
}

interface Props {
  nodes: CharacterNode[]
  selectedNodeId: number | null
  onSelectNode: (id: number) => void
}

export function GraphMinimap({ nodes, selectedNodeId, onSelectNode }: Props) {
  const grouped = new Map<CharacterNodeDomain, CharacterNode[]>()
  for (const node of nodes) {
    const list = grouped.get(node.domain) || []
    list.push(node)
    grouped.set(node.domain, list)
  }

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-xs text-muted-foreground/40 italic">
        Sin nodos
      </div>
    )
  }

  return (
    <div className="overflow-y-auto p-2 space-y-3">
      {Array.from(grouped.entries()).map(([domain, domainNodes]) => {
        const meta = DOMAIN_META[domain]
        return (
          <div key={domain}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
              <span className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">
                {meta.label}
              </span>
            </div>
            <div className="space-y-0.5">
              {domainNodes.map(n => (
                <button
                  key={n.id}
                  onClick={() => onSelectNode(n.id)}
                  className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors
                    ${selectedNodeId === n.id
                      ? 'bg-amber-100/60 text-amber-900'
                      : 'text-foreground/70 hover:bg-muted/30'}`}
                >
                  <span className="font-medium">{n.label}</span>
                  <span className="ml-1 text-[9px] text-muted-foreground/40">
                    {ROLE_LABELS[n.role] || n.role}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

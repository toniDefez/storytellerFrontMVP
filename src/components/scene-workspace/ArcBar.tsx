interface Props {
  nodeCount: number
}

const SEGMENTS = [
  { label: 'Setup', minNodes: 1 },
  { label: 'Tensión', minNodes: 2 },
  { label: 'Giro', minNodes: 3 },
]

export function ArcBar({ nodeCount }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-stone-400 font-medium uppercase tracking-wide mr-1">Arco</span>
      {SEGMENTS.map(seg => {
        const active = nodeCount >= seg.minNodes
        return (
          <span
            key={seg.label}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              active
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-stone-100 text-stone-400'
            }`}
          >
            {seg.label}
          </span>
        )
      })}
    </div>
  )
}

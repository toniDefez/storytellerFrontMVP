import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import type { ConceptNodeData } from './forceLayout'

const domainStyles: Record<ConceptNodeData['domain'], { bg: string; border: string; label: string; dot: string }> = {
  physical: {
    bg: 'bg-emerald-50',
    border: 'border-emerald-300',
    label: 'text-emerald-700',
    dot: 'bg-emerald-500',
  },
  biological: {
    bg: 'bg-amber-50',
    border: 'border-amber-300',
    label: 'text-amber-700',
    dot: 'bg-amber-500',
  },
  social: {
    bg: 'bg-sky-50',
    border: 'border-sky-300',
    label: 'text-sky-700',
    dot: 'bg-sky-500',
  },
  core: {
    bg: 'bg-purple-50',
    border: 'border-purple-300',
    label: 'text-purple-700',
    dot: 'bg-purple-500',
  },
}

export function ConceptNode({ data, selected }: NodeProps<ConceptNodeData>) {
  const s = domainStyles[data.domain ?? 'core']

  return (
    <div
      className={[
        'rounded-xl border-2 px-3.5 py-2.5 min-w-[130px] max-w-[200px] shadow-sm transition-all duration-150',
        s.bg,
        s.border,
        data.isGhost ? 'opacity-40 border-dashed' : '',
        selected ? 'shadow-md ring-2 ring-offset-1 ring-primary/40' : '',
      ].join(' ')}
    >
      <Handle type="target" position={Position.Top} className="!bg-transparent !border-0" />
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className={`w-2 h-2 rounded-full shrink-0 ${s.dot}`} />
        <span className={`text-[11px] font-semibold uppercase tracking-wide ${s.label}`}>
          {data.domain}
        </span>
      </div>
      <p className="text-sm font-semibold text-foreground leading-snug">{data.label}</p>
      {data.description && (
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">
          {data.description}
        </p>
      )}
      {data.isGhost && (
        <p className="text-[10px] text-muted-foreground mt-1 italic">Click para aceptar</p>
      )}
      <Handle type="source" position={Position.Bottom} className="!bg-transparent !border-0" />
    </div>
  )
}

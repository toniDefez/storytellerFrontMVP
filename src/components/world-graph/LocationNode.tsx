import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { LocationNodeType, NarrativeFunction } from '@/services/api'

const NODE_ICONS: Record<LocationNodeType, string> = {
  settlement: '🏘',
  wilderness: '🌲',
  ruin: '🏚',
  landmark: '⛰',
  passage: '🚪',
  structure: '🏛',
}

const NARRATIVE_FN_COLORS: Record<NarrativeFunction, string> = {
  conflict: 'bg-red-500/15 text-red-700',
  origin: 'bg-amber-500/15 text-amber-700',
  threshold: 'bg-violet-500/15 text-violet-700',
  atmosphere: 'bg-sky-500/15 text-sky-700',
}

export interface LocationNodeData {
  name: string
  node_type: LocationNodeType
  description: string
  narrative_function?: NarrativeFunction
  source_hint?: string
  isSelected?: boolean
}

export const LocationNode = memo(function LocationNode({ data }: NodeProps) {
  const d = data as unknown as LocationNodeData

  const handleStyle = {
    width: 8, height: 8,
    background: '#14b8a6',
    border: '2px solid white',
    borderRadius: '50%',
  }

  return (
    <div
      className={`
        rounded-xl border bg-background shadow-sm min-w-[120px] max-w-[160px]
        transition-all duration-150
        ${d.isSelected
          ? 'border-[#14b8a6] shadow-[0_0_0_2px_#14b8a620]'
          : 'border-border/60 hover:border-[#14b8a6]/50'}
      `}
      title={d.source_hint || undefined}
    >
      <Handle type="source" position={Position.Top}    id="t" style={handleStyle} />
      <Handle type="source" position={Position.Right}  id="r" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="b" style={handleStyle} />
      <Handle type="source" position={Position.Left}   id="l" style={handleStyle} />
      <Handle type="target" position={Position.Top}    id="tt" style={handleStyle} />
      <Handle type="target" position={Position.Right}  id="tr" style={handleStyle} />
      <Handle type="target" position={Position.Bottom} id="tb" style={handleStyle} />
      <Handle type="target" position={Position.Left}   id="tl" style={handleStyle} />

      {/* Barra teal superior */}
      <div className="h-[3px] rounded-t-xl bg-[#14b8a6]" />

      {/* Contenido */}
      <div className="px-2.5 py-2 space-y-1">
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none">{NODE_ICONS[d.node_type]}</span>
          <div className="font-medium text-xs text-foreground leading-tight">{d.name}</div>
        </div>
        {d.narrative_function && (
          <span className={`inline-block text-[10px] px-1.5 py-0.5 rounded-full font-medium ${NARRATIVE_FN_COLORS[d.narrative_function] ?? ''}`}>
            {d.narrative_function}
          </span>
        )}
      </div>
    </div>
  )
})

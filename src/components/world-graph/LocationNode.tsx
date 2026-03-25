import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { LocationNodeType } from '@/services/api'

const NODE_ICONS: Record<LocationNodeType, string> = {
  settlement: '🏘',
  wilderness: '🌲',
  ruin: '🏚',
  landmark: '⛰',
  threshold: '🚪',
}

export interface LocationNodeData {
  name: string
  node_type: LocationNodeType
  description: string
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
      <div className="px-2.5 py-2 flex items-center gap-1.5">
        <span className="text-base leading-none">{NODE_ICONS[d.node_type]}</span>
        <div className="font-medium text-xs text-foreground leading-tight">{d.name}</div>
      </div>
    </div>
  )
})

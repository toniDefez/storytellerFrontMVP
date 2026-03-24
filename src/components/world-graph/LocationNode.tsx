import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { LocationNodeType } from '@/services/api'

const NODE_ICONS: Record<LocationNodeType, string> = {
  settlement: '🏘',
  wilderness: '🌲',
  ruin: '🏚',
  landmark: '⛰',
  threshold: '🚪',
}

const NODE_TYPE_LABEL: Record<LocationNodeType, string> = {
  settlement: 'Asentamiento',
  wilderness: 'Naturaleza',
  ruin: 'Ruina',
  landmark: 'Punto de referencia',
  threshold: 'Paso',
}

export interface LocationNodeData {
  name: string
  node_type: LocationNodeType
  description: string
  isSelected?: boolean
}

export const LocationNode = memo(function LocationNode({ data }: NodeProps) {
  const d = data as unknown as LocationNodeData

  return (
    <div
      className={`
        rounded-xl border bg-background shadow-sm min-w-[140px] max-w-[180px]
        transition-all duration-150
        ${d.isSelected
          ? 'border-[#14b8a6] shadow-[0_0_0_2px_#14b8a620]'
          : 'border-border/60 hover:border-[#14b8a6]/50'}
      `}
    >
      {/* Barra teal superior */}
      <div className="h-[3px] rounded-t-xl bg-[#14b8a6]" />

      {/* Contenido */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-1.5 mb-1">
          <span className="text-sm">{NODE_ICONS[d.node_type]}</span>
          <span className="text-[10px] uppercase tracking-widest text-[#14b8a6] font-semibold">
            {NODE_TYPE_LABEL[d.node_type]}
          </span>
        </div>
        <div className="font-semibold text-sm text-foreground leading-tight">{d.name}</div>
        {d.description && (
          <p className="text-[11px] text-muted-foreground mt-1 leading-snug line-clamp-2">
            {d.description}
          </p>
        )}
      </div>
    </div>
  )
})

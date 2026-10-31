import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import type { LocationNodeType, NarrativeFunction } from '@/services/api'
import { narrativeFnLabel, nodeTypeLabel } from './locationLabels'

export interface LocationNodeData {
  name: string
  node_type: LocationNodeType
  narrative_function?: NarrativeFunction
  source_hint?: string
  isSelected?: boolean
  /** Color de la facción que lo controla, si tiene: se pinta como anillo. */
  factionColor?: string | null
}

/** Diámetro del punto en px. El nodo mide esto y se ancla por su centro. */
const PIN_SIZE = 14

/**
 * Un lugar en el mapa: un punto y su nombre, como en un mapa de verdad.
 *
 * Antes era una tarjeta con emoji, función narrativa y contador de sublugares,
 * con variantes por profundidad y por zoom: sobre el terreno tapaba el mapa y
 * no se parecía a nada del resto de la app. El detalle vive en el panel.
 *
 * El nodo mide solo el punto (y se ancla por su centro con `origin`), así que
 * las conexiones van de punto a punto; el nombre cuelga debajo sin ocupar caja.
 */
export const LocationNode = memo(function LocationNode({ data }: NodeProps) {
  const d = data as unknown as LocationNodeData
  const tooltip = [d.name, nodeTypeLabel(d.node_type), narrativeFnLabel(d.narrative_function)]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="group relative" style={{ width: PIN_SIZE, height: PIN_SIZE }} title={d.source_hint || tooltip}>
      {/* Arrastrar desde aquí conecta dos lugares; solo asoma al pasar por encima. */}
      <Handle
        type="source"
        position={Position.Right}
        id="c"
        className="!w-2 !h-2 !min-w-0 !min-h-0 !bg-entity-location !border !border-white opacity-0 transition-opacity group-hover:opacity-100"
      />
      <div
        className={`size-full rounded-full border-2 border-white bg-entity-location shadow-[0_1px_3px_rgb(0_0_0/0.35)] transition-transform duration-150 ${
          d.isSelected ? 'scale-125 ring-4 ring-entity-location/25' : 'group-hover:scale-110'
        }`}
        style={d.factionColor ? { outline: `2px solid ${d.factionColor}`, outlineOffset: 1 } : undefined}
      />
      <div
        className={`pointer-events-auto absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap font-display text-[15px] leading-tight ${
          d.isSelected ? 'font-semibold text-entity-location' : 'font-medium text-foreground'
        }`}
        style={{
          textShadow: [
            '-1px -1px 0 #fdfbf4',
            '1px -1px 0 #fdfbf4',
            '-1px 1px 0 #fdfbf4',
            '1px 1px 0 #fdfbf4',
            '0 0 5px rgba(253,251,244,0.95)',
          ].join(', '),
        }}
      >
        {d.name}
      </div>
    </div>
  )
})

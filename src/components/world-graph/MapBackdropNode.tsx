import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { getRegionVisual } from './physicalMapPalette'

export interface MapBackdropNodeData {
  width: number
  height: number
}

/**
 * Fondo del mapa: un rectángulo del color del mar por debajo de todo.
 *
 * El polígono de mar es la forma más exterior del mapa y su anillo recorre el
 * borde del lienzo. Suavizarlo redondea esas esquinas en ángulo recto y el mapa
 * aparece con un mordisco blanco en cada una. Se intentó preservar los ángulos
 * rectos, pero una escalera sobrante de la rejilla también son ángulos rectos,
 * así que la regla arreglaba las esquinas y dejaba el relieve dentado.
 *
 * Con un fondo del mismo color detrás, el redondeo deja de verse y desaparece
 * toda la clase de artefacto: no hay heurística que ajustar.
 */
export const MapBackdropNode = memo(function MapBackdropNode({ data }: NodeProps) {
  const d = data as unknown as MapBackdropNodeData
  const visual = getRegionVisual('sea')

  return (
    <div
      style={{
        width: d.width,
        height: d.height,
        background: visual.fill,
        pointerEvents: 'none',
      }}
    />
  )
})

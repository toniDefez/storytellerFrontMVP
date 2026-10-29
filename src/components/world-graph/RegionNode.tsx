import { memo, useMemo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { Region, RegionVertex } from '@/services/factionApi'
import { getRegionVisual } from './physicalMapPalette'
import { buildSmoothPath } from './regionPath'

export interface RegionNodeData {
  region: Region
  width: number
  height: number
  offsetX: number
  offsetY: number
}

/**
 * Region node — renders an SVG polygon (closed) or polyline (open) using
 * vertex positions relative to the node's bounding box.
 *
 * The wrapper is positioned in canvas coords at the bounding-box origin
 * (computed by `buildRegionFlowNodes` in LocationGraphCanvas). The SVG
 * inside has its own local coord space, so we subtract `offsetX/offsetY`
 * from every vertex to express points in node-local coordinates.
 *
 * El terreno es de solo lectura: no captura ningún clic. Antes cada región se
 * seleccionaba y el mar cubría el mapa entero, así que cualquier clic
 * seleccionaba una región y sacaba decenas de tiradores de vértice; no había
 * «terreno vacío» donde hacer clic para crear un lugar. Ahora los clics
 * atraviesan el terreno hasta el lienzo.
 */
export const RegionNode = memo(function RegionNode({ data }: NodeProps) {
  const d = data as unknown as RegionNodeData
  const { region, width, height, offsetX, offsetY } = d

  const visual = getRegionVisual(region.region_type)

  // Translate vertex canvas coords into node-local coords, then smooth.
  //
  // Smoothing happens here and not in the stored geometry: the database keeps
  // the ~60 vertices the engine produced, and the canvas draws a continuous
  // curve. Drawn as straight segments these rings look like a polygonal
  // diagram rather than a coastline — the outlines come out of a raster grid
  // and are faceted by construction.
  const localPoints = useMemo(
    () =>
      region.vertices
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map(v => ({ x: v.canvas_x - offsetX, y: v.canvas_y - offsetY })),
    [region.vertices, offsetX, offsetY]
  )
  const path = useMemo(
    () => buildSmoothPath(localPoints, region.is_closed),
    [localPoints, region.is_closed]
  )

  const dashArray = visual.strokeDashed ? '4 4' : undefined
  const filled = visual.fill !== 'none'

  return (
    <div
      className="region-node"
      style={{ width, height, pointerEvents: 'none' }}
    >
      <svg
        width={width}
        height={height}
        style={{ overflow: 'visible', display: 'block', pointerEvents: 'none' }}
        aria-label={`${region.region_type} region: ${region.name}`}
      >
        {filled ? (
          <path
            d={path}
            fill={visual.fill}
            fillOpacity={visual.fillOpacity}
            stroke={visual.strokeWidth > 0 ? visual.stroke : 'none'}
            strokeWidth={visual.strokeWidth}
            strokeDasharray={dashArray}
            strokeLinejoin="round"
          />
        ) : (
          <path
            d={path}
            fill="none"
            stroke={visual.stroke}
            strokeWidth={visual.strokeWidth}
            strokeDasharray={dashArray}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  )
})

/**
 * Compute bounding box for a region's vertices. Returns the top-left corner
 * (used as the React Flow node position) and the width/height (used by the
 * SVG inside). Adds a small padding so the polygon stroke isn't clipped.
 */
export function computeRegionBounds(vertices: RegionVertex[]): {
  x: number
  y: number
  width: number
  height: number
} {
  if (vertices.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 }
  }

  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  for (const v of vertices) {
    if (v.canvas_x < minX) minX = v.canvas_x
    if (v.canvas_y < minY) minY = v.canvas_y
    if (v.canvas_x > maxX) maxX = v.canvas_x
    if (v.canvas_y > maxY) maxY = v.canvas_y
  }

  const PAD = 4 // pixels — keeps the stroke visible at the bounding edge
  return {
    x: minX - PAD,
    y: minY - PAD,
    width: maxX - minX + PAD * 2,
    height: maxY - minY + PAD * 2,
  }
}

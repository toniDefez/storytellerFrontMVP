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
 * Hit area: the *shape* catches clicks, not the wrapper. The wrapper spans the
 * whole bounding box, so letting it catch clicks would mean a diagonal river
 * swallows every click in the large rectangle around it — including clicks
 * meant for the empty canvas. Closed regions are hit on their painted area;
 * open lines get an invisible fat stroke underneath so they stay grabbable
 * without having to hit a 3px line exactly.
 */
const OPEN_LINE_HIT_WIDTH = 14
export const RegionNode = memo(function RegionNode({ data, selected }: NodeProps) {
  const d = data as unknown as RegionNodeData
  const { region, width, height, offsetX, offsetY } = d

  const visual = getRegionVisual(region.region_type)

  // Translate vertex canvas coords into node-local coords, then smooth.
  //
  // Smoothing happens here and not in the stored geometry: the database keeps
  // the ~60 vertices a human can drag, and the canvas draws a continuous
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

  // Selection reads as a teal ring drawn on top, so it never has to fight the
  // region's own stroke width — a river's stroke is 0 and a coast's is 3.5.
  const selectionRing = selected ? (
    <path
      d={path}
      fill="none"
      stroke="#14b8a6"
      strokeWidth={3}
      strokeLinejoin="round"
      style={{ pointerEvents: 'none' }}
    />
  ) : null

  return (
    <div
      className="region-node"
      style={{ width, height, pointerEvents: 'none' }}
      title={region.name}
    >
      <svg
        width={width}
        height={height}
        style={{ overflow: 'visible', display: 'block' }}
        aria-label={`${region.region_type} region: ${region.name}`}
      >
        {filled ? (
          <>
            <path
              d={path}
              fill={visual.fill}
              fillOpacity={visual.fillOpacity}
              stroke={visual.strokeWidth > 0 ? visual.stroke : 'none'}
              strokeWidth={visual.strokeWidth}
              strokeDasharray={dashArray}
              strokeLinejoin="round"
              style={{ pointerEvents: 'visiblePainted', cursor: 'pointer' }}
            />
            {selectionRing}
          </>
        ) : (
          <>
            <path
              d={path}
              fill="none"
              stroke="transparent"
              strokeWidth={OPEN_LINE_HIT_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            />
            <path
              d={path}
              fill="none"
              stroke={visual.stroke}
              strokeWidth={visual.strokeWidth}
              strokeDasharray={dashArray}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            />
            {selectionRing}
          </>
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

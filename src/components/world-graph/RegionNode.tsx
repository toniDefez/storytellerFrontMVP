import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import type { Region, RegionVertex } from '@/services/factionApi'
import { getRegionVisual } from './physicalMapPalette'

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

  // Translate vertex canvas coords into node-local coords.
  const points = region.vertices
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map(v => `${v.canvas_x - offsetX},${v.canvas_y - offsetY}`)
    .join(' ')

  // Selected outline overlay: a slightly thicker ring of the same shape.
  const selectionStroke = selected ? '#14b8a6' : visual.stroke
  const strokeWidth = selected ? 3 : 2
  const dashArray = visual.strokeDashed ? '4 4' : undefined

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
        {region.is_closed ? (
          <polygon
            points={points}
            fill={visual.fill}
            fillOpacity={visual.fillOpacity}
            stroke={selectionStroke}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            style={{ pointerEvents: 'visiblePainted', cursor: 'pointer' }}
          />
        ) : (
          <>
            <polyline
              points={points}
              fill="none"
              stroke="transparent"
              strokeWidth={OPEN_LINE_HIT_WIDTH}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
            />
            <polyline
              points={points}
              fill="none"
              stroke={selectionStroke}
              strokeWidth={selected ? 4 : 3}
              strokeDasharray={dashArray}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ pointerEvents: 'none' }}
            />
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

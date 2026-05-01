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
 * pointerEvents: 'none' on the SVG itself + the polygon's hit-area set to
 * fill='visiblePainted' would conflict with React Flow's node click handler.
 * Instead we let the container div catch clicks (default React Flow node
 * behavior) and keep the SVG purely decorative.
 */
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
      style={{ width, height, pointerEvents: 'auto' }}
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
          />
        ) : (
          <polyline
            points={points}
            fill="none"
            stroke={selectionStroke}
            strokeWidth={selected ? 4 : 3}
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

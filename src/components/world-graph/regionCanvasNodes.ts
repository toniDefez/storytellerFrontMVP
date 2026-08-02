import type { Node } from '@xyflow/react'
import type { Region } from '@/services/factionApi'
import { VERTEX_HANDLE_RADIUS, Z_INDEX } from './physicalMapPalette'

/**
 * Node-id vocabulary and geometry helpers for the physical map canvas.
 *
 * React Flow keys everything by string id, but the map mixes three kinds of
 * node: civic locations (bare numeric ids, from `LocationNode.id`), regions
 * (`region-<id>`) and vertex handles (`vertex-<regionId>-<orderIndex>`).
 * Parsing lives here so no handler has to open-code a prefix check.
 */

export function regionNodeId(regionId: number): string {
  return `region-${regionId}`
}

export function vertexNodeId(regionId: number, orderIndex: number): string {
  return `vertex-${regionId}-${orderIndex}`
}

/** Parse `region-<id>`. Returns null for any other id. */
export function parseRegionNodeId(id: string): number | null {
  const m = /^region-(\d+)$/.exec(id)
  return m ? Number(m[1]) : null
}

/** Parse `vertex-<regionId>-<orderIndex>`. Returns null for any other id. */
export function parseVertexNodeId(
  id: string
): { regionId: number; orderIndex: number } | null {
  const m = /^vertex-(\d+)-(\d+)$/.exec(id)
  if (!m) return null
  return { regionId: Number(m[1]), orderIndex: Number(m[2]) }
}

/**
 * Build one draggable handle node per vertex of the given region.
 *
 * React Flow positions a node by its top-left corner, so each position is
 * offset by the handle radius to put the circle's *center* on the vertex.
 * `vertexCenterFromNodePosition` is the inverse, applied when a drag reports
 * a new position.
 */
export function buildVertexFlowNodes(region: Region | null): Node[] {
  if (!region) return []

  return region.vertices
    .slice()
    .sort((a, b) => a.order_index - b.order_index)
    .map(v => ({
      id: vertexNodeId(region.id, v.order_index),
      type: 'vertex',
      position: {
        x: v.canvas_x - VERTEX_HANDLE_RADIUS,
        y: v.canvas_y - VERTEX_HANDLE_RADIUS,
      },
      draggable: true,
      selectable: false,
      connectable: false,
      zIndex: Z_INDEX.vertex,
      data: {
        regionId: region.id,
        orderIndex: v.order_index,
        regionName: region.name,
      } as unknown as Record<string, unknown>,
    }))
}

/** Convert a dragged handle's top-left position back to the vertex center. */
export function vertexCenterFromNodePosition(position: { x: number; y: number }): {
  x: number
  y: number
} {
  return {
    x: position.x + VERTEX_HANDLE_RADIUS,
    y: position.y + VERTEX_HANDLE_RADIUS,
  }
}

import { memo } from 'react'
import type { NodeProps } from '@xyflow/react'
import { VERTEX_HANDLE, VERTEX_HANDLE_RADIUS } from './physicalMapPalette'

export interface VertexNodeData {
  regionId: number
  orderIndex: number
  regionName: string
}

/**
 * A draggable handle for one region vertex.
 *
 * Purely presentational — React Flow owns the drag, so this renders a circle
 * and nothing else. It carries no <Handle>, and its flow node sets
 * `connectable: false`, so it can never start an edge connection.
 *
 * Node construction and id parsing live in `regionCanvasNodes.ts`.
 */
export const VertexNode = memo(function VertexNode({ data, dragging }: NodeProps) {
  const d = data as unknown as VertexNodeData
  const size = VERTEX_HANDLE_RADIUS * 2

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Vértice ${d.orderIndex + 1} de ${d.regionName}`}
      title={`Vértice ${d.orderIndex + 1}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: VERTEX_HANDLE.fill,
        border: `${VERTEX_HANDLE.strokeWidth}px solid ${VERTEX_HANDLE.stroke}`,
        boxSizing: 'border-box',
        cursor: 'grab',
        // Grow slightly while dragging so the cursor doesn't fully hide it.
        transform: dragging ? 'scale(1.4)' : undefined,
        transition: dragging ? undefined : 'transform 120ms ease-out',
        boxShadow: '0 1px 2px rgba(0,0,0,0.35)',
      }}
    />
  )
})

import { BaseEdge, getBezierPath, useInternalNode } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import { getEdgeParams } from './getEdgeParams'

/**
 * Bezier edge anchored at the intersection of the source/target node bounding
 * boxes. Use for orbital ↔ container edges so lines never pile onto a single
 * handle point.
 */
export function FloatingEdge({
  id,
  source,
  target,
  markerEnd,
  markerStart,
  style,
}: EdgeProps) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) return null

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode)

  const [edgePath] = getBezierPath({
    sourceX: sx,
    sourceY: sy,
    sourcePosition: sourcePos,
    targetPosition: targetPos,
    targetX: tx,
    targetY: ty,
  })

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      markerStart={markerStart}
      style={style}
    />
  )
}

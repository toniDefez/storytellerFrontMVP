import { Position } from '@xyflow/react'
import type { InternalNode, Node } from '@xyflow/react'

/**
 * Ported from React Flow's "Simple Floating Edges" example, adapted to v12:
 *   - `node.internals.positionAbsolute` replaces v11's `nodeInternals.get().positionAbsolute`.
 *   - `node.measured` supersedes `node.width/height`.
 * The helper computes the intersection of the line connecting two node centers
 * with each node's bounding box, so edges attach to the nearest side instead of
 * a fixed handle.
 */

function getNodeIntersection(
  intersectionNode: InternalNode<Node>,
  targetNode: InternalNode<Node>,
): { x: number; y: number } {
  const iw = intersectionNode.measured?.width ?? 0
  const ih = intersectionNode.measured?.height ?? 0
  const tw = targetNode.measured?.width ?? 0
  const th = targetNode.measured?.height ?? 0

  const ipos = intersectionNode.internals.positionAbsolute
  const tpos = targetNode.internals.positionAbsolute

  const w = iw / 2
  const h = ih / 2

  const x2 = ipos.x + w
  const y2 = ipos.y + h
  const x1 = tpos.x + tw / 2
  const y1 = tpos.y + th / 2

  const xx1 = (x1 - x2) / (2 * w) - (y1 - y2) / (2 * h)
  const yy1 = (x1 - x2) / (2 * w) + (y1 - y2) / (2 * h)
  const a = 1 / (Math.abs(xx1) + Math.abs(yy1) || 1)
  const xx3 = a * xx1
  const yy3 = a * yy1
  const x = w * (xx3 + yy3) + x2
  const y = h * (yy3 - xx3) + y2

  return { x, y }
}

function getEdgePosition(
  node: InternalNode<Node>,
  intersectionPoint: { x: number; y: number },
): Position {
  const nx = Math.round(node.internals.positionAbsolute.x)
  const ny = Math.round(node.internals.positionAbsolute.y)
  const nw = node.measured?.width ?? 0
  const nh = node.measured?.height ?? 0
  const px = Math.round(intersectionPoint.x)
  const py = Math.round(intersectionPoint.y)

  if (px <= nx + 1) return Position.Left
  if (px >= nx + nw - 1) return Position.Right
  if (py <= ny + 1) return Position.Top
  if (py >= ny + nh - 1) return Position.Bottom
  return Position.Top
}

export function getEdgeParams(
  source: InternalNode<Node>,
  target: InternalNode<Node>,
): {
  sx: number; sy: number
  tx: number; ty: number
  sourcePos: Position; targetPos: Position
} {
  const sourceIntersectionPoint = getNodeIntersection(source, target)
  const targetIntersectionPoint = getNodeIntersection(target, source)
  const sourcePos = getEdgePosition(source, sourceIntersectionPoint)
  const targetPos = getEdgePosition(target, targetIntersectionPoint)
  return {
    sx: sourceIntersectionPoint.x,
    sy: sourceIntersectionPoint.y,
    tx: targetIntersectionPoint.x,
    ty: targetIntersectionPoint.y,
    sourcePos,
    targetPos,
  }
}

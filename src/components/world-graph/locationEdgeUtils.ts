import { Position, type InternalNode, type Node } from '@xyflow/react'

interface EdgeParams {
  sx: number; sy: number; tx: number; ty: number
  sourcePos: Position; targetPos: Position
}

function getNodeCenter(node: InternalNode) {
  return {
    x: node.internals.positionAbsolute.x + (node.measured?.width ?? 150) / 2,
    y: node.internals.positionAbsolute.y + (node.measured?.height ?? 60) / 2,
  }
}

function getIntersectionPoint(
  node: InternalNode,
  intersectionPoint: { x: number; y: number }
): { x: number; y: number; position: Position } {
  const nx = node.internals.positionAbsolute.x
  const ny = node.internals.positionAbsolute.y
  const w = (node.measured?.width ?? 150) / 2
  const h = (node.measured?.height ?? 60) / 2
  const cx = nx + w
  const cy = ny + h

  const dx = intersectionPoint.x - cx
  const dy = intersectionPoint.y - cy

  if (Math.abs(dx / w) > Math.abs(dy / h)) {
    return dx > 0
      ? { x: cx + w, y: cy + dy * (w / Math.abs(dx)), position: Position.Right }
      : { x: cx - w, y: cy + dy * (w / Math.abs(dx)), position: Position.Left }
  } else {
    return dy > 0
      ? { x: cx + dx * (h / Math.abs(dy)), y: cy + h, position: Position.Bottom }
      : { x: cx + dx * (h / Math.abs(dy)), y: cy - h, position: Position.Top }
  }
}

export function getEdgeParams(source: InternalNode<Node>, target: InternalNode<Node>): EdgeParams {
  const sourceCenter = getNodeCenter(source)
  const targetCenter = getNodeCenter(target)
  const src = getIntersectionPoint(source, targetCenter)
  const tgt = getIntersectionPoint(target, sourceCenter)
  return {
    sx: src.x, sy: src.y,
    tx: tgt.x, ty: tgt.y,
    sourcePos: src.position,
    targetPos: tgt.position,
  }
}

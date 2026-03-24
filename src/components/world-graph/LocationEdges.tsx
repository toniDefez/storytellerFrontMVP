import { memo } from 'react'
import {
  BaseEdge,
  getBezierPath,
  EdgeLabelRenderer,
  useInternalNode,
  type EdgeProps,
} from '@xyflow/react'
import { getEdgeParams } from './locationEdgeUtils'
import type { LocationEffort } from '@/services/api'

interface LocationEdgeData {
  effort: LocationEffort
  bidirectional: boolean
  note?: string
}

const EFFORT_LABEL: Record<LocationEffort, string> = {
  easy: 'Fácil',
  moderate: 'Moderado',
  difficult: 'Difícil',
}

const EFFORT_COLOR: Record<LocationEffort, string> = {
  easy: '#0f766e',
  moderate: '#0e7490',
  difficult: '#92400e',
}

interface FloatingEdgeProps extends EdgeProps {
  style?: React.CSSProperties
}

function FloatingLocationEdge({
  id, source, target, data, selected,
  style = {},
}: FloatingEdgeProps) {
  const sourceNode = useInternalNode(source)
  const targetNode = useInternalNode(target)

  if (!sourceNode || !targetNode) return null

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode)
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX: sx, sourceY: sy, sourcePosition: sourcePos,
    targetX: tx, targetY: ty, targetPosition: targetPos,
  })

  const d = data as unknown as LocationEdgeData
  const effort: LocationEffort = d?.effort ?? 'moderate'

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          strokeWidth: selected ? 2.5 : 1.5,
          filter: selected ? 'drop-shadow(0 0 4px currentColor)' : undefined,
        }}
      />
      {selected && d?.note && (
        <EdgeLabelRenderer>
          <div
            style={{ transform: `translate(-50%,-50%) translate(${labelX}px,${labelY}px)` }}
            className="absolute text-[10px] bg-background border border-border rounded px-1.5 py-0.5 pointer-events-none"
          >
            {d.note}
          </div>
        </EdgeLabelRenderer>
      )}
      <EdgeLabelRenderer>
        <div
          style={{
            transform: `translate(-50%,-50%) translate(${labelX}px,${labelY + 14}px)`,
            color: EFFORT_COLOR[effort],
          }}
          className="absolute text-[9px] font-semibold pointer-events-none bg-background/80 px-1 rounded"
        >
          {EFFORT_LABEL[effort]}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}

export const WaterwayEdge = memo((props: EdgeProps) => (
  <FloatingLocationEdge
    {...props}
    style={{ stroke: '#14b8a6', strokeDasharray: '8,5' }}
  />
))

export const WildernessEdge = memo((props: EdgeProps) => (
  <FloatingLocationEdge
    {...props}
    style={{ stroke: '#92400e', strokeDasharray: '5,7' }}
  />
))

export const RoadEdge = memo((props: EdgeProps) => (
  <FloatingLocationEdge
    {...props}
    style={{ stroke: '#14b8a6' }}
  />
))

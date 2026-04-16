import { BaseEdge, EdgeLabelRenderer, getSmoothStepPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import { useReducedMotion } from 'framer-motion'

interface LiteraryFlowEdgeData extends Record<string, unknown> {
  label: string
  /** Hex color of the source domain — drives ink-pool and particle color. */
  domainColor: string
  /** Index of this edge in the chain (0..3); staggers the particle animation. */
  chainIndex: number
}

/**
 * Custom edge for the 4 domain-chain edges (CREENCIAS → MIEDOS → … → MASCARAS).
 * - Path: smoothstep (preserves the existing vertical cascade).
 * - Label: rendered in the HTML layer via EdgeLabelRenderer so the project's
 *   serif display font can be used in italic (SVG <text> rendered it poorly).
 * - Ink-pool: small SVG circle at 20% of the path in the domain color.
 * - Particle: an animated circle gliding from source to target, reinforcing
 *   the "causation flows downward" metaphor. Respects prefers-reduced-motion.
 */
export function LiteraryFlowEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps) {
  const prefersReducedMotion = useReducedMotion()
  const edgeData = (data ?? {}) as Partial<LiteraryFlowEdgeData>
  const label = edgeData.label ?? ''
  const domainColor = edgeData.domainColor ?? '#a8a29e'
  const chainIndex = edgeData.chainIndex ?? 0

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  })

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />

      {/* Ink-pool: static dot at 20% of the path so the label has a visual anchor. */}
      <circle r={3} fill={domainColor}>
        <animateMotion
          dur="0.001s"
          repeatCount="1"
          fill="freeze"
          keyPoints="0.2;0.2"
          keyTimes="0;1"
          path={edgePath}
        />
      </circle>

      {/* Animated particle — or static dot if reduced-motion. */}
      {prefersReducedMotion ? (
        <circle r={3} fill={domainColor} opacity={0.7}>
          <animateMotion
            dur="0.001s"
            repeatCount="1"
            fill="freeze"
            keyPoints="0.5;0.5"
            keyTimes="0;1"
            path={edgePath}
          />
        </circle>
      ) : (
        <circle r={3} fill={domainColor} opacity={0.85}>
          <animateMotion
            dur="4s"
            repeatCount="indefinite"
            path={edgePath}
            begin={`${chainIndex}s`}
          />
        </circle>
      )}

      {label && (
        <EdgeLabelRenderer>
          <div
            className="absolute pointer-events-auto nodrag nopan font-display italic text-[11px] leading-snug text-stone-500 bg-[hsl(40_20%_97%)]/90 px-2 py-0.5 rounded-sm"
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  )
}

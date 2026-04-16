import { useStore } from '@xyflow/react'

export type ZoomLevel = 'full' | 'compact'

const COMPACT_THRESHOLD = 0.65

/**
 * Reads the React Flow viewport zoom and returns the level-of-detail bucket.
 * Must be called inside a `ReactFlowProvider`.
 */
export function useZoomLevel(): ZoomLevel {
  const zoom = useStore((s) => s.transform[2])
  return zoom >= COMPACT_THRESHOLD ? 'full' : 'compact'
}

import { useStore } from '@xyflow/react'

export type ZoomLevel = 'full' | 'compact'

// Below this zoom, switch to compact rendering to keep panoramic views readable.
// Value is a first approximation — tunable in QA with dense worlds.
const COMPACT_THRESHOLD = 0.65

/**
 * Reads the React Flow viewport zoom and returns the level-of-detail bucket.
 * Must be called inside a `ReactFlowProvider`.
 */
export function useZoomLevel(): ZoomLevel {
  const zoom = useStore((s) => s.transform[2])
  return zoom >= COMPACT_THRESHOLD ? 'full' : 'compact'
}

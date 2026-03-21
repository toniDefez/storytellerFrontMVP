import { useBlocker } from 'react-router-dom'
import type { Blocker } from 'react-router-dom'

export function useUnsavedChangesGuard(isDirty: boolean): { blocker: Blocker } {
  const blocker = useBlocker(isDirty)
  return { blocker }
}

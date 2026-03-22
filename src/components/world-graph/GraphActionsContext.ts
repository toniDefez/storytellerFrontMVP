import { createContext, useContext } from 'react'

export interface GraphActionsContextValue {
  /** Called by TreeNode when "+" is clicked. screenAnchor is in viewport px. */
  onPlusClick: (nodeId: string, screenAnchor: { x: number; y: number }) => void
}

export const GraphActionsContext = createContext<GraphActionsContextValue | null>(null)

export function useGraphActions(): GraphActionsContextValue {
  const ctx = useContext(GraphActionsContext)
  if (!ctx) throw new Error('useGraphActions must be used within GraphActionsContext.Provider')
  return ctx
}

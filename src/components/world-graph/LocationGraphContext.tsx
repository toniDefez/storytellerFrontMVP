import { createContext, useContext, type ReactNode } from 'react'

export interface LocationGraphContextValue {
  /** Abre el form dialog en modo "editar" para el nodo indicado. */
  onEditNode: (nodeId: number) => void
  /** Confirma y elimina el nodo indicado. */
  onDeleteNode: (nodeId: number) => void
}

const NOOP_CONTEXT: LocationGraphContextValue = {
  onEditNode: () => {},
  onDeleteNode: () => {},
}

const LocationGraphContext = createContext<LocationGraphContextValue>(NOOP_CONTEXT)

export function LocationGraphProvider({
  value, children,
}: {
  value: LocationGraphContextValue
  children: ReactNode
}) {
  return (
    <LocationGraphContext.Provider value={value}>
      {children}
    </LocationGraphContext.Provider>
  )
}

/**
 * Returns the handlers to edit/delete a location node from within a custom
 * ReactFlow node. Falls back to no-ops if rendered outside a provider
 * (allows individual commits to leave the app runnable during refactor).
 */
export function useLocationGraphContext(): LocationGraphContextValue {
  return useContext(LocationGraphContext)
}

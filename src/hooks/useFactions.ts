import { useCallback, useEffect, useState } from 'react'
import { listFactions, type Faction } from '@/services/factionApi'

export interface UseFactionsResult {
  factions: Faction[]
  loading: boolean
  error: string
  reload: () => Promise<void>
  byId: Map<number, Faction>
}

export function useFactions(worldId: number | null): UseFactionsResult {
  const [factions, setFactions] = useState<Faction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (worldId == null) return
    setLoading(true)
    setError('')
    try {
      const result = await listFactions(worldId)
      setFactions(result ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando facciones')
    } finally {
      setLoading(false)
    }
  }, [worldId])

  useEffect(() => {
    void reload()
  }, [reload])

  const byId = new Map(factions.map(f => [f.id, f]))

  return { factions, loading, error, reload, byId }
}

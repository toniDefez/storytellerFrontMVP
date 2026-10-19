import { useCallback, useEffect, useState } from 'react'
import { listRegions, type Region } from '@/services/factionApi'

export interface UseRegionsResult {
  regions: Region[]
  loading: boolean
  error: string
  reload: () => Promise<void>
}

export function useRegions(worldId: number | null): UseRegionsResult {
  const [regions, setRegions] = useState<Region[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    if (worldId == null) return
    setLoading(true)
    setError('')
    try {
      const result = await listRegions(worldId)
      setRegions(result ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando regiones')
    } finally {
      setLoading(false)
    }
  }, [worldId])

  useEffect(() => {
    void reload()
  }, [reload])

  return { regions, loading, error, reload }
}

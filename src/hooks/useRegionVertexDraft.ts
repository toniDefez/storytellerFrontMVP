import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { replaceRegionVertices, type Region, type RegionVertex } from '@/services/factionApi'

/**
 * Same debounce as civic node drags in LocationGraphCanvas, for the same
 * reason: a single nudge shouldn't cost one write per pixel.
 */
const PERSIST_DEBOUNCE_MS = 500

export interface UseRegionVertexDraftResult {
  /** `regions` with any in-flight edits overlaid. Feed this to the canvas. */
  effectiveRegions: Region[]
  error: string
  saving: boolean
  dismissError: () => void
  /** Called on every drag frame — updates local geometry only. */
  moveVertex: (regionId: number, orderIndex: number, x: number, y: number) => void
  /** Called when a drag ends — schedules the debounced save. */
  commitRegion: (regionId: number) => void
}

/**
 * Holds region geometry while the user drags its vertices, then persists it.
 *
 * Resolution rule: if a region has a draft, the draft wins; otherwise the
 * server-provided prop wins. The draft is dropped only *after* `onPersisted`
 * has refreshed the props, so the shape never flickers back to its old
 * position between the save and the reload.
 *
 * On failure the draft is dropped immediately, so the canvas visibly snaps
 * back to the last known server geometry rather than showing an unsaved shape.
 */
export function useRegionVertexDraft(
  regions: Region[],
  onPersisted: () => Promise<void>
): UseRegionVertexDraftResult {
  const [drafts, setDrafts] = useState<Map<number, RegionVertex[]>>(new Map())
  const [error, setError] = useState('')
  const [savingCount, setSavingCount] = useState(0)

  // Refs mirror state for the debounced callbacks, which would otherwise close
  // over whatever was current when the timer was scheduled.
  const draftsRef = useRef(drafts)
  draftsRef.current = drafts
  const regionsRef = useRef(regions)
  regionsRef.current = regions
  const onPersistedRef = useRef(onPersisted)
  onPersistedRef.current = onPersisted

  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  // Bumped on every edit. A save only clears its draft if no newer edit landed
  // while the request was in flight.
  const editGenRef = useRef<Map<number, number>>(new Map())

  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(t => clearTimeout(t))
      timers.clear()
    }
  }, [])

  const effectiveRegions = useMemo(() => {
    if (drafts.size === 0) return regions
    return regions.map(r => {
      const draft = drafts.get(r.id)
      return draft ? { ...r, vertices: draft } : r
    })
  }, [regions, drafts])

  const moveVertex = useCallback(
    (regionId: number, orderIndex: number, x: number, y: number) => {
      editGenRef.current.set(regionId, (editGenRef.current.get(regionId) ?? 0) + 1)
      setDrafts(prev => {
        const base =
          prev.get(regionId) ?? regionsRef.current.find(r => r.id === regionId)?.vertices
        if (!base) return prev
        const next = base.map(v =>
          v.order_index === orderIndex ? { ...v, canvas_x: x, canvas_y: y } : v
        )
        const m = new Map(prev)
        m.set(regionId, next)
        return m
      })
    },
    []
  )

  const dropDraft = useCallback((regionId: number) => {
    setDrafts(prev => {
      if (!prev.has(regionId)) return prev
      const m = new Map(prev)
      m.delete(regionId)
      return m
    })
  }, [])

  const persist = useCallback(
    async (regionId: number) => {
      const draft = draftsRef.current.get(regionId)
      if (!draft) return

      const genAtSend = editGenRef.current.get(regionId)
      // Renumber 0..N-1 so order_index stays dense even if the source data
      // arrived with gaps.
      const payload = draft
        .slice()
        .sort((a, b) => a.order_index - b.order_index)
        .map((v, i) => ({
          order_index: i,
          canvas_x: v.canvas_x,
          canvas_y: v.canvas_y,
        }))

      setSavingCount(c => c + 1)
      try {
        await replaceRegionVertices(regionId, payload)
        await onPersistedRef.current()
        // A drag that landed mid-request owns the draft now; its own timer
        // will save it. Clearing here would silently discard that edit.
        if (editGenRef.current.get(regionId) === genAtSend) {
          dropDraft(regionId)
        }
      } catch (e) {
        setError(
          e instanceof Error
            ? `No se pudo guardar la forma: ${e.message}`
            : 'No se pudo guardar la forma de la región'
        )
        dropDraft(regionId)
      } finally {
        setSavingCount(c => c - 1)
      }
    },
    [dropDraft]
  )

  const commitRegion = useCallback(
    (regionId: number) => {
      const prev = timersRef.current.get(regionId)
      if (prev) clearTimeout(prev)
      timersRef.current.set(
        regionId,
        setTimeout(() => {
          timersRef.current.delete(regionId)
          void persist(regionId)
        }, PERSIST_DEBOUNCE_MS)
      )
    },
    [persist]
  )

  const dismissError = useCallback(() => setError(''), [])

  return {
    effectiveRegions,
    error,
    saving: savingCount > 0,
    dismissError,
    moveVertex,
    commitRegion,
  }
}

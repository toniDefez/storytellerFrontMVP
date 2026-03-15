import { useEffect, useState, useCallback } from 'react'
import { getMyInstallation } from '../services/api'
import type { Installation } from '../services/api'

const POLL_INTERVAL_MS = 30_000

export function useInstallation() {
  const [installation, setInstallation] = useState<Installation | null>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState(false)

  const check = useCallback(async () => {
    try {
      const inst = await getMyInstallation()
      setInstallation(inst)
    } catch {
      setInstallation(null)
    } finally {
      setLoading(false)
      setChecked(true)
    }
  }, [])

  useEffect(() => {
    check()
    const interval = setInterval(check, POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [check])

  return {
    installation,
    hasInstallation: installation !== null,
    loading,
    checked,
  }
}

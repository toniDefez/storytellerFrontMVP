import { useEffect, useState } from 'react'
import { getMyInstallation } from '../services/api'
import type { Installation } from '../services/api'

export function useInstallation() {
  const [installation, setInstallation] = useState<Installation | null>(null)
  const [loading, setLoading] = useState(true)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    let cancelled = false
    getMyInstallation()
      .then((inst) => {
        if (!cancelled) setInstallation(inst)
      })
      .catch(() => {
        if (!cancelled) setInstallation(null)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setChecked(true)
        }
      })
    return () => { cancelled = true }
  }, [])

  return {
    installation,
    hasInstallation: installation !== null,
    loading,
    checked,
  }
}

import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

// Un trozo de navegación en la URL (pestaña, ficha abierta, escena entrada),
// para que «atrás» del navegador o del sistema vuelva un paso, como se espera
// en el móvil, en vez de sacarte del mundo entero (2026-10-31).
// Abrir algo es `set(valor)` (entrada nueva en el historial); cerrarlo desde
// la propia interfaz es `set(null, { replace: true })`, que no apila otra.
export function useUrlParam(key: string): [string | null, (value: string | null, opts?: { replace?: boolean; clear?: string[] }) => void] {
  const [params, setParams] = useSearchParams()
  const value = params.get(key)
  const set = useCallback((next: string | null, opts?: { replace?: boolean; clear?: string[] }) => {
    setParams(prev => {
      const out = new URLSearchParams(prev)
      for (const k of opts?.clear ?? []) out.delete(k)
      if (next == null || next === '') out.delete(key)
      else out.set(key, next)
      return out
    }, { replace: opts?.replace ?? false })
  }, [key, setParams])
  return [value, set]
}

import { useCallback, useEffect, useRef, useState } from 'react'
import { getGenerationProgress } from '@/services/api'
import { newRequestId } from '@/services/telemetry'

const POLL_MS = 1000

type TimerRef = { current: ReturnType<typeof setInterval> | null }

function clearTimer(timerRef: TimerRef) {
  if (timerRef.current) {
    clearInterval(timerRef.current)
    timerRef.current = null
  }
}

/**
 * Fase real de una generación larga. start() da el identificador de petición
 * que hay que pasar a la llamada a la API; mientras tanto se pregunta al
 * backend en qué fase va (el mismo patrón que el taller de escenas). Antes
 * personajes y localizaciones solo enseñaban una animación o el texto del
 * botón durante 40 s, sin saber si el generador seguía vivo.
 */
export function useGenerationProgress() {
  const [progress, setProgress] = useState('')
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  // Cada arranque tiene su número: una respuesta que llega después de
  // stop() no debe pintar una fase vieja.
  const runRef = useRef(0)

  const start = useCallback((): string => {
    clearTimer(timerRef)
    const run = ++runRef.current
    const requestId = newRequestId()
    const started = Date.now()
    setProgress('esperando al generador · 0 s')
    timerRef.current = setInterval(async () => {
      const seconds = Math.round((Date.now() - started) / 1000)
      try {
        const { runs } = await getGenerationProgress(requestId)
        if (runRef.current !== run) return
        const current = runs.find(r => r.status === 'running') ?? runs[runs.length - 1]
        setProgress(current?.phase ? `${current.phase} · ${seconds} s` : `esperando al generador · ${seconds} s`)
      } catch {
        // el progreso es informativo: si falla, la generación sigue
        if (runRef.current === run) setProgress(`esperando al generador · ${seconds} s`)
      }
    }, POLL_MS)
    return requestId
  }, [])

  const stop = useCallback(() => {
    runRef.current++
    clearTimer(timerRef)
    setProgress('')
  }, [])

  // Al salir de la pantalla no se sigue preguntando.
  useEffect(() => () => {
    runRef.current++
    clearTimer(timerRef)
  }, [])

  return { progress, start, stop }
}

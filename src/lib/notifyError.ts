import { toast } from 'sonner'
import { ApiError, describeError, reportClientError } from '@/services/telemetry'

/**
 * Para los catch que antes se tragaban el error: se lo dice a la persona y
 * queda en el log del backend con la referencia de la petición. Un "fallo en
 * silencio" era indistinguible de "no hay nada" (Enriquecer premisa, listas
 * vacías) y nadie podía saber que había fallado.
 */
export function notifyError(context: string) {
  return (err: unknown): void => {
    toast.error(`${context}: ${describeError(err, 'error desconocido')}`)
    // request() ya informa de los 5xx y de los fallos de red; el resto, aquí.
    if (!(err instanceof ApiError) || (err.status > 0 && err.status < 500)) {
      reportClientError({
        source: context,
        message: err instanceof Error ? err.message : String(err),
        request_id: err instanceof ApiError ? err.requestId : undefined,
        status: err instanceof ApiError ? err.status : undefined,
      })
    }
  }
}

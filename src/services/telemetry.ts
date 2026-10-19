// Telemetría de la app: un identificador por petición (el backend lo usa en
// sus logs y en generation_runs) y el envío de errores al backend para que
// no se queden en la consola del navegador de quien los sufre.

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export function newRequestId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/** Error de la API con lo necesario para encontrarlo en los logs. */
export class ApiError extends Error {
  readonly status: number
  readonly requestId: string

  constructor(message: string, status: number, requestId: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.requestId = requestId
  }
}

export interface ClientErrorReport {
  message: string
  source: string
  stack?: string
  request_id?: string
  status?: number
}

// Un error repetido en bucle no debe inundar el backend.
const recent = new Map<string, number>()
const DEDUPE_MS = 30_000

export function reportClientError(report: ClientErrorReport): void {
  const key = `${report.source}|${report.message}`
  const now = Date.now()
  if ((recent.get(key) ?? 0) > now - DEDUPE_MS) return
  recent.set(key, now)
  try {
    void fetch(`${API_URL}/telemetry/client-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...report, url: window.location.pathname }),
      keepalive: true,
    }).catch(() => {})
  } catch {
    // informar de un error nunca debe provocar otro
  }
}

let installed = false

/** Captura las excepciones no controladas y las promesas rechazadas. */
export function installGlobalErrorReporting(): void {
  if (installed) return
  installed = true
  window.addEventListener('error', (e) => {
    reportClientError({ source: 'window.error', message: e.message, stack: e.error?.stack })
  })
  window.addEventListener('unhandledrejection', (e) => {
    const reason = e.reason
    reportClientError({
      source: 'unhandledrejection',
      message: reason instanceof Error ? reason.message : String(reason),
      stack: reason instanceof Error ? reason.stack : undefined,
      request_id: reason instanceof ApiError ? reason.requestId : undefined,
      status: reason instanceof ApiError ? reason.status : undefined,
    })
  })
}

/** Mensaje para la persona: el error y, si lo hay, la referencia para buscarlo. */
export function describeError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return `${err.message} (ref. ${err.requestId.slice(0, 8)})`
  if (err instanceof Error && err.message) return err.message
  return fallback
}

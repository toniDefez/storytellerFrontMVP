import type { TFunction } from 'i18next'
import { toast } from 'sonner'
import { ApiError } from '@/services/telemetry'
import { notifyError } from '@/lib/notifyError'

/**
 * Avisa de un fallo al crear o guardar un lugar. El nombre repetido
 * (UNIQUE(world_id, name)) llega como 409 y tiene su propio mensaje; antes
 * era un 500 que el diálogo se tragaba sin decir nada.
 */
export function notifyPlaceError(t: TFunction, err: unknown, contextKey: string): void {
  if (err instanceof ApiError && err.status === 409) {
    toast.error(t('location.map.duplicateName'))
    return
  }
  notifyError(t(contextKey))(err)
}

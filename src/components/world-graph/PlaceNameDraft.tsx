import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useViewport } from '@xyflow/react'
import { Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface Props {
  /** Punto del mapa (coordenadas del lienzo) donde irá el lugar. */
  x: number
  y: number
  /** Devuelve true si el lugar se creó; si falla, el campo sigue abierto. */
  onSubmit: (name: string) => Promise<boolean>
  onCancel: () => void
}

/**
 * El nombre de un lugar nuevo, escrito en el mismo punto del mapa donde va a
 * quedar. Enter crea, Esc cancela. Sigue al mapa si se mueve la vista.
 *
 * Tiene su propio componente porque `useViewport` repinta en cada fotograma
 * de desplazamiento: así solo se repinta este campo y no el lienzo entero.
 */
export function PlaceNameDraft({ x, y, onSubmit, onCancel }: Props) {
  const { t } = useTranslation()
  const { x: vx, y: vy, zoom } = useViewport()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async () => {
    const value = name.trim()
    if (!value || busy) return
    setBusy(true)
    const ok = await onSubmit(value)
    if (!ok) setBusy(false)
  }

  return (
    <div
      className="absolute z-30"
      style={{ left: x * zoom + vx, top: y * zoom + vy, transform: 'translate(-7px, -7px)' }}
    >
      <div className="flex items-center gap-2">
        <span className="size-3.5 shrink-0 rounded-full border-2 border-white bg-entity-location shadow-[0_1px_3px_rgb(0_0_0/0.35)]" aria-hidden />
        <div className="relative">
          <Input
            autoFocus
            value={name}
            readOnly={busy}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') { e.preventDefault(); void submit() }
              if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); onCancel() }
            }}
            onBlur={() => { if (!name.trim() && !busy) onCancel() }}
            placeholder={t('location.map.namePlaceholder')}
            aria-label={t('location.map.namePlaceholder')}
            className="h-9 w-60 bg-background pr-8 font-display text-base shadow-md md:text-base"
          />
          {busy && <Loader2 className="absolute right-2.5 top-2.5 size-4 animate-spin text-muted-foreground" aria-hidden />}
        </div>
      </div>
      <p className="ml-[22px] mt-1 w-fit rounded bg-background/90 px-1.5 py-0.5 text-xs text-muted-foreground">
        {t('location.map.nameHint')}
      </p>
    </div>
  )
}

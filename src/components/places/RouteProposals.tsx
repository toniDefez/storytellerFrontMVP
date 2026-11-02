import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { RouteProposal } from '@/services/api'

/**
 * Caminos propuestos (escena 0, acto 3): «A ⇄ B · distancia». «Quedarse»
 * crea el camino; «Tirar» lo quita de la lista. Nada se guarda hasta entonces.
 */
interface Props {
  routes: RouteProposal[]
  onKeep: (r: RouteProposal) => Promise<boolean>
  onDrop: (r: RouteProposal) => void
}

const keyOf = (r: RouteProposal) => `${r.from_id}-${r.to_id}`

export function RouteProposals({ routes, onKeep, onDrop }: Props) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState<string | null>(null)

  const keep = async (r: RouteProposal) => {
    setBusy(keyOf(r))
    try {
      await onKeep(r)
    } finally {
      setBusy(null)
    }
  }

  if (routes.length === 0) return null
  return (
    <section className="space-y-2" aria-label={t('location.places.routeProposalsLabel')}>
      <h4 className="text-sm text-muted-foreground">{t('location.places.routeProposals')}</h4>
      <ul className="space-y-1.5">
        {routes.map(r => (
          <li key={keyOf(r)} className="flex flex-wrap items-center gap-2 rounded-lg border border-entity-location/30 bg-entity-location/5 px-3 py-2">
            <span className="min-w-0 flex-1 text-sm">
              <span className="font-display text-[15px]">{r.from}</span>
              <span className="mx-1 text-entity-location/80">{r.bidirectional ? '⇄' : '→'}</span>
              <span className="font-display text-[15px]">{r.to}</span>
              {r.distance && <span className="text-muted-foreground"> · {r.distance}</span>}
            </span>
            <div className="flex gap-1">
              <Button size="sm" onClick={() => void keep(r)} disabled={busy !== null} className="min-h-10 gap-1 md:min-h-8">
                {busy === keyOf(r) ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                {t('location.places.keep')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDrop(r)} disabled={busy !== null} className="min-h-10 gap-1 text-muted-foreground md:min-h-8">
                <X className="size-3.5" />
                {t('location.places.drop')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Loader2, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { PlaceProposal } from '@/services/api'

/**
 * Lugares propuestos (escena 0, acto 2): tarjetas con nombre, «Aquí siempre»,
 * «Cosas a mano» y «Porque…» (de qué línea del mundo sale). Nada se guarda
 * hasta «Quedarse». Viven en el estado del panel: al recargar desaparecen.
 */
interface Props {
  tension: string
  places: PlaceProposal[]
  proposing: boolean
  onKeep: (p: PlaceProposal) => Promise<boolean>
  onDrop: (p: PlaceProposal) => void
  onMore: () => void
}

export function PlaceProposals({ tension, places, proposing, onKeep, onDrop, onMore }: Props) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState<string | null>(null)

  const keep = async (p: PlaceProposal) => {
    setBusy(p.name)
    try {
      await onKeep(p)
    } finally {
      setBusy(null)
    }
  }

  return (
    <section className="space-y-3" aria-label={t('location.places.proposalsLabel')}>
      {tension && (
        <p className="font-display text-[15px] italic leading-snug text-foreground/80">{tension}</p>
      )}
      <ul className="space-y-2">
        {places.map(p => (
          <li key={p.name} className="rounded-lg border border-entity-location/30 bg-entity-location/5 px-3 py-3">
            <p className="font-display text-[17px] text-foreground">{p.name}</p>
            {p.rule && (
              <p className="mt-1 text-sm text-foreground/90">
                <span className="text-muted-foreground">{t('location.places.ruleLabel')} · </span>{p.rule}
              </p>
            )}
            {p.things.length > 0 && (
              <p className="mt-1 text-sm text-foreground/90">
                <span className="text-muted-foreground">{t('location.places.thingsLabel')} · </span>{p.things.join(' · ')}
              </p>
            )}
            {p.because && (
              <p className="mt-1 text-xs italic text-muted-foreground">{t('location.places.because')} {p.because}</p>
            )}
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={() => void keep(p)} disabled={busy !== null} className="min-h-10 gap-1.5 md:min-h-8">
                {busy === p.name ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                {t('location.places.keep')}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => onDrop(p)} disabled={busy !== null} className="min-h-10 gap-1.5 text-muted-foreground md:min-h-8">
                <X className="size-3.5" />
                {t('location.places.drop')}
              </Button>
            </div>
          </li>
        ))}
      </ul>
      <Button variant="outline" size="sm" onClick={onMore} disabled={proposing} className="min-h-10 gap-1.5 md:min-h-8">
        {proposing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
        {proposing ? t('location.places.proposing') : t('location.places.proposeMore')}
      </Button>
    </section>
  )
}

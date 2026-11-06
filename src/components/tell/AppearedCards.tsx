import type { ReactNode } from 'react'
import { Check } from 'lucide-react'
import type { PersonFound, PlaceFound } from '@/services/api'
import { appearedKey, type AppearedKind } from './appeared'

/**
 * «Han aparecido»: lo que la prosa trae al mundo y aún no existe. Personas
 * (naranja, como el reparto) con quién es y la ficha parcial; sitios (índigo,
 * como el mapa) con «Aquí siempre» y las cosas. Un toque marca o desmarca;
 * la cita, en gris pequeño, es la prueba de que está en el texto.
 */
interface Props {
  people: PersonFound[]
  places: PlaceFound[]
  selected: Set<string>
  onToggle: (kind: AppearedKind, name: string) => void
}

export function AppearedCards({ people, places, selected, onToggle }: Props) {
  const card = (kind: AppearedKind, name: string, tone: string, body: ReactNode, evidence: string) => {
    const on = selected.has(appearedKey(kind, name))
    return (
      <li key={appearedKey(kind, name)}>
        <button
          type="button"
          aria-pressed={on}
          onClick={() => onToggle(kind, name)}
          className={`w-full rounded-xl border px-4 py-3 text-left transition-colors ${on ? tone : 'border-border bg-transparent opacity-60'}`}
        >
          <div className="flex items-start justify-between gap-3">
            <p className="font-display text-[19px] leading-tight text-foreground">{name}</p>
            <span aria-hidden className={`mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border ${on ? 'border-foreground/60 bg-foreground text-background' : 'border-border'}`}>
              {on && <Check className="size-3.5" />}
            </span>
          </div>
          {body}
          {evidence && <p className="mt-2 text-xs italic text-muted-foreground">«{evidence}»</p>}
        </button>
      </li>
    )
  }

  return (
    <div className="space-y-6">
      {people.length > 0 && (
        <section>
          <p className="mb-2 text-[10px] tracking-[0.2em] uppercase text-entity-character">Gente</p>
          <ul className="space-y-2">
            {people.map(p => card('p', p.name, 'border-entity-character/40 bg-entity-character-light', (
              <>
                {p.who && <p className="mt-1 text-sm text-foreground/90">{p.who}</p>}
                {p.wants && <p className="mt-1 text-sm text-foreground/90"><span className="text-muted-foreground">Quiere · </span>{p.wants}</p>}
                {p.never && <p className="mt-0.5 text-sm text-foreground/90"><span className="text-muted-foreground">Nunca · </span>{p.never}</p>}
                {p.when && (p.when.si || p.when.hace) && (
                  <p className="mt-0.5 text-sm text-foreground/90"><span className="text-muted-foreground">Cuando · </span>{p.when.si}{p.when.si && p.when.hace ? ', ' : ''}{p.when.hace}</p>
                )}
              </>
            ), p.evidence))}
          </ul>
        </section>
      )}
      {places.length > 0 && (
        <section>
          <p className="mb-2 text-[10px] tracking-[0.2em] uppercase text-entity-location">Sitios</p>
          <ul className="space-y-2">
            {places.map(p => card('s', p.name, 'border-entity-location/40 bg-entity-location-light', (
              <>
                {p.rule && <p className="mt-1 text-sm text-foreground/90">{p.rule}</p>}
                {p.things.length > 0 && <p className="mt-0.5 text-sm text-foreground/90"><span className="text-muted-foreground">A mano · </span>{p.things.join(' · ')}</p>}
              </>
            ), p.evidence))}
          </ul>
        </section>
      )}
    </div>
  )
}

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Loader2, MapPin, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import type { LocationEdge, LocationNode, LocationNodePatch } from '@/services/api'
import { notifyPlaceError } from '@/components/world-graph/placeErrors'
import { InlineText } from './InlineText'

/** Medido con 2-4: más cosas y el escritor abre la escena con un inventario. */
export const MAX_THINGS = 4

const PILL = 'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors'
const PILL_ON = 'border-entity-location/40 bg-entity-location/10 text-entity-location'

interface Props {
  places: LocationNode[]
  /** Caminos entre lugares; `note` guarda a cuánto están («medio día a pie»). */
  routes: LocationEdge[]
  onConnect: (a: number, b: number, distance: string) => Promise<unknown>
  onSetDistance: (route: LocationEdge, distance: string) => Promise<void>
  onDisconnect: (id: number) => Promise<void>
  /** Devuelve el lugar creado; si falla, lanza (nombre repetido → 409). */
  onCreate: (name: string) => Promise<LocationNode>
  /** Guarda solo lo que cambia. */
  onUpdate: (id: number, patch: LocationNodePatch) => Promise<void>
  onDelete: (id: number) => Promise<void>
  /** Propone lugares a partir del mundo; solo se ofrece con la lista vacía. */
  onSuggest: () => void
  suggesting: boolean
  suggestingProgress?: string
}

/**
 * Los lugares como fichas (2026-10-29). Revisión con UX, diseño de juegos y
 * narratología: el tipo no llega a la prosa y era lo más visible, así que se
 * fue; lo que pesa es la regla, y solo cuando un paso la roza (3 de 3 frente a
 * 0 de 5 en el banco); las cosas casi solo cambian el sustantivo.
 * El mapa sumó capas —grafo, terreno,
 * facciones, función narrativa— y la escena solo recibía el nombre. Un lugar
 * es lo que la escena puede usar: su nombre, las cosas que hay ahí y lo que
 * siempre se cumple. Misma forma que Personajes: lista a la izquierda y ficha.
 */
export function PlacesPanel({ places, routes, onConnect, onSetDistance, onDisconnect, onCreate, onUpdate, onDelete, onSuggest, suggesting, suggestingProgress }: Props) {
  const { t } = useTranslation()
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [naming, setNaming] = useState(false)
  const selected = places.find(p => p.id === selectedId) ?? null
  // A dónde lleva cada lugar, por nombre, para la lista.
  const nameOf = new Map(places.map(p => [p.id, p.name]))
  const routesOf = (id: number) => routes
    .filter(r => r.source_node_id === id || r.target_node_id === id)
    .map(r => nameOf.get(r.source_node_id === id ? r.target_node_id : r.source_node_id))
    .filter((n): n is string => !!n)
  const sorted = [...places].sort((a, b) => a.name.localeCompare(b.name))

  const create = async (name: string) => {
    try {
      const created = await onCreate(name)
      setNaming(false)
      setSelectedId(created.id)
      return true
    } catch (err) {
      notifyPlaceError(t, err, 'location.map.createError')
      return false
    }
  }

  return (
    // Móvil: lista o ficha, nunca las dos (maestro-detalle apilado).
    <div className="grid h-full min-h-0 grid-cols-1 md:grid-cols-[320px_1fr]">
      <div className={`h-full min-h-0 flex-col border-r border-border/40 ${selected ? 'hidden md:flex' : 'flex'}`}>
        <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {sorted.length === 0 && !naming ? (
            <div className="flex flex-col items-center px-6 py-16 text-center">
              <p className="mb-2 font-display text-xl italic text-foreground/25">{t('location.places.empty')}</p>
              <p className="mb-5 text-sm text-muted-foreground">{t('location.places.emptyHint')}</p>
              <Button variant="outline" size="sm" onClick={onSuggest} disabled={suggesting} className="gap-1.5">
                {suggesting ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {suggesting ? suggestingProgress || t('location.map.generatingPlaces') : t('location.places.suggest')}
              </Button>
            </div>
          ) : (
            sorted.map(p => <PlaceRow key={p.id} place={p} routes={routesOf(p.id)} selected={p.id === selectedId} onClick={() => setSelectedId(p.id)} />)
          )}
          {naming && <NewPlaceRow onSubmit={create} onCancel={() => setNaming(false)} />}
        </div>

        <div className="px-3 py-3">
          <button
            type="button"
            onClick={() => setNaming(true)}
            disabled={naming}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border-2 border-dashed border-entity-location/20 px-3 py-2.5
                       text-xs font-medium text-entity-location transition-all duration-150
                       hover:border-entity-location/40 hover:bg-entity-location/5 disabled:opacity-50"
          >
            <Plus className="size-3.5" />
            {t('location.places.add')}
          </button>
        </div>
      </div>

      <div className={`h-full overflow-y-auto ${selected ? '' : 'hidden md:block'}`}>
        {selected ? (
          <PlaceSheet
            key={selected.id}
            place={selected}
            places={places}
            routes={routes}
            onConnect={onConnect}
            onSetDistance={onSetDistance}
            onDisconnect={onDisconnect}
            onUpdate={onUpdate}
            onDelete={async id => { await onDelete(id); setSelectedId(null) }}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <MapPin className="mb-3 size-12 text-muted-foreground/15" />
            <p className="font-display text-lg italic text-foreground/25">{t('location.places.select')}</p>
          </div>
        )}
      </div>
    </div>
  )
}

function PlaceRow({ place, routes, selected, onClick }: { place: LocationNode; routes: string[]; selected: boolean; onClick: () => void }) {
  const { t } = useTranslation()
  const things = place.properties?.props ?? []
  const rule = place.properties?.rule?.trim()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={selected || undefined}
      className={`group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
        selected ? 'bg-entity-location/10' : 'hover:bg-accent/60'
      }`}
    >
      <MapPin className={`mt-1 size-4 shrink-0 ${selected ? 'text-entity-location' : 'text-muted-foreground'}`} aria-hidden />
      <span className="min-w-0">
        <span className={`block truncate font-display text-[15px] ${selected ? 'text-entity-location' : 'text-foreground'}`}>
          {place.name}
        </span>
        {rule ? (
          <span className="block truncate text-xs italic text-muted-foreground">{rule}</span>
        ) : things.length > 0 ? (
          <span className="block truncate text-xs text-muted-foreground">{things.join(' · ')}</span>
        ) : (
          <span className="block truncate text-xs italic text-muted-foreground/60">{t('location.places.emptyRow')}</span>
        )}
        {/* Los caminos, en la lista: sin lienzo no se veía ninguna línea entre lugares (2026-10-31). */}
        {routes.length > 0 && (
          <span className="block truncate text-xs text-entity-location/90">⇄ {routes.join(' · ')}</span>
        )}
      </span>
    </button>
  )
}

function NewPlaceRow({ onSubmit, onCancel }: { onSubmit: (name: string) => Promise<boolean>; onCancel: () => void }) {
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    const value = name.trim()
    if (!value || busy) return
    setBusy(true)
    if (!(await onSubmit(value))) setBusy(false)
  }
  return (
    <div className="px-1 py-1">
      <div className="relative">
        <Input
          autoFocus
          value={name}
          readOnly={busy}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); void submit() }
            if (e.key === 'Escape') { e.preventDefault(); onCancel() }
          }}
          onBlur={() => { if (!name.trim() && !busy) onCancel() }}
          placeholder={t('location.map.namePlaceholder')}
          aria-label={t('location.map.namePlaceholder')}
          className="h-9 pr-8 font-display text-base md:text-base"
        />
        {busy && <Loader2 className="absolute right-2.5 top-2.5 size-4 animate-spin text-muted-foreground" aria-hidden />}
      </div>
      <p className="mt-1 px-1 text-xs text-muted-foreground">{t('location.map.nameHint')}</p>
    </div>
  )
}

function PlaceSheet({ place, places, routes, onConnect, onSetDistance, onDisconnect, onUpdate, onDelete, onClose }: {
  place: LocationNode
  places: LocationNode[]
  routes: LocationEdge[]
  onConnect: Props['onConnect']
  onSetDistance: Props['onSetDistance']
  onDisconnect: Props['onDisconnect']
  onUpdate: (id: number, patch: LocationNodePatch) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const things = place.properties?.props ?? []

  const save = (patch: LocationNodePatch) => {
    onUpdate(place.id, patch).catch(err => notifyPlaceError(t, err, 'location.map.saveError'))
  }

  return (
    <div className="mx-auto max-w-xl space-y-7 px-4 py-5 md:px-8 md:py-8">
      {/* Móvil: la misma fila de vuelta que en Personajes; la × queda para el escritorio. */}
      <div className="md:hidden -mx-4 -mt-5 mb-2 border-b border-border/40 px-2 py-1">
        <button type="button" onClick={onClose} className="flex items-center gap-1.5 min-h-10 px-2 text-sm text-muted-foreground">
          <ChevronLeft className="w-4 h-4" />
          {t('location.places.title', { defaultValue: 'Lugares' })}
        </button>
      </div>
      <div className="flex items-start gap-2">
        <InlineText
          value={place.name}
          required
          label={t('location.map.name')}
          onCommit={name => save({ name })}
          className="h-auto flex-1 py-1 font-display text-2xl font-semibold md:text-2xl"
        />
        <button
          type="button"
          onClick={onClose}
          aria-label={t('location.map.close')}
          className="hidden md:inline-flex mt-1.5 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <section className="space-y-1">
        <h4 className="text-sm text-muted-foreground">{t('location.places.rule')}</h4>
        <InlineText
          value={place.properties?.rule ?? ''}
          label={t('location.places.rule')}
          placeholder={t('location.places.rulePlaceholder')}
          onCommit={rule => save({ properties: { rule } })}
          boxed
          className="text-sm"
        />
        <p className="text-xs text-muted-foreground/80">{t('location.places.ruleHint')}</p>
      </section>

      <section className="space-y-2">
        <h4 className="text-sm text-muted-foreground">{t('location.places.things')}</h4>
        <ThingsEditor things={things} onChange={props => save({ properties: { props } })} />
        <p className="text-xs text-muted-foreground/80">{t('location.places.thingsHint')}</p>
      </section>

      <Routes
        place={place}
        places={places}
        routes={routes}
        onConnect={onConnect}
        onSetDistance={onSetDistance}
        onDisconnect={onDisconnect}
      />

      <section className="space-y-1">
        <h4 className="text-sm text-muted-foreground">{t('location.places.notes')}</h4>
        <InlineText
          multiline
          value={place.description ?? ''}
          label={t('location.places.notes')}
          placeholder={t('location.places.notesPlaceholder')}
          onCommit={description => save({ description })}
          boxed
          className="text-sm leading-relaxed"
        />
      </section>

      <Button
        variant="link"
        size="sm"
        onClick={() => setConfirmDelete(true)}
        className="gap-1.5 px-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="size-3.5" /> {t('location.map.delete')}
      </Button>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display">{t('location.map.deleteTitle', { name: place.name })}</AlertDialogTitle>
            <AlertDialogDescription>{t('location.places.deleteBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('location.map.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => onDelete(place.id).catch(err => notifyPlaceError(t, err, 'location.map.deleteError'))}
            >
              {t('location.map.deleteConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

/**
 * Los caminos de un lugar: con qué otros lugares se conecta y a cuánto están,
 * en palabras de novelista («al lado», «dos días a caballo»). Un camino vale
 * en los dos sentidos. Sin caminos los lugares quedan aislados (Toni,
 * 2026-10-29); la distancia es lo que la continuidad necesita para saber si
 * alguien puede llegar de una escena a otra.
 */
function Routes({ place, places, routes, onConnect, onSetDistance, onDisconnect }: {
  place: LocationNode
  places: LocationNode[]
  routes: LocationEdge[]
  onConnect: Props['onConnect']
  onSetDistance: Props['onSetDistance']
  onDisconnect: Props['onDisconnect']
}) {
  const { t } = useTranslation()
  const [target, setTarget] = useState('')
  const [distance, setDistance] = useState('')
  const byId = new Map(places.map(p => [p.id, p]))
  const mine = routes
    .filter(r => r.source_node_id === place.id || r.target_node_id === place.id)
    .map(r => ({ route: r, other: byId.get(r.source_node_id === place.id ? r.target_node_id : r.source_node_id) }))
    .filter((x): x is { route: LocationEdge; other: LocationNode } => !!x.other)
    .sort((a, b) => a.other.name.localeCompare(b.other.name))
  const linked = new Set(mine.map(x => x.other.id))
  const candidates = places.filter(p => p.id !== place.id && !linked.has(p.id)).sort((a, b) => a.name.localeCompare(b.name))

  const add = async () => {
    if (!target) return
    try {
      await onConnect(place.id, Number(target), distance.trim())
      setTarget('')
      setDistance('')
    } catch (err) {
      notifyPlaceError(t, err, 'location.map.saveError')
    }
  }

  return (
    <section className="space-y-2">
      <h4 className="text-sm text-muted-foreground">{t('location.places.routes')}</h4>
      {mine.length > 0 && (
        <ul className="space-y-1.5">
          {mine.map(({ route, other }) => (
            <li key={route.id} className="flex items-center gap-2">
              <span className="w-40 shrink-0 truncate font-display text-[15px]">{other.name}</span>
              <InlineText
                value={route.note ?? ''}
                label={t('location.places.distanceTo', { name: other.name })}
                placeholder={t('location.places.distancePlaceholder')}
                onCommit={d => { onSetDistance(route, d).catch(err => notifyPlaceError(t, err, 'location.map.saveError')) }}
                boxed
                className="h-8 flex-1 text-sm"
              />
              <button
                type="button"
                onClick={() => { onDisconnect(route.id).catch(err => notifyPlaceError(t, err, 'location.map.saveError')) }}
                aria-label={t('location.places.disconnect', { name: other.name })}
                className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-destructive"
              >
                <X className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {candidates.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            value={target}
            onChange={e => setTarget(e.target.value)}
            aria-label={t('location.places.connectTo')}
            className="h-8 w-40 shrink-0 rounded-md border border-input bg-transparent px-2 text-sm"
          >
            <option value="">{t('location.places.connectTo')}</option>
            {candidates.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <Input
            value={distance}
            onChange={e => setDistance(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); void add() } }}
            disabled={!target}
            placeholder={t('location.places.distancePlaceholder')}
            aria-label={t('location.places.distance')}
            className="h-8 flex-1 text-sm"
          />
          <Button variant="outline" size="sm" onClick={() => void add()} disabled={!target} className="h-8">
            {t('location.places.connect')}
          </Button>
        </div>
      )}
      <p className="text-xs text-muted-foreground/80">{t('location.places.routesHint')}</p>
    </section>
  )
}

/** Las cosas que hay, como etiquetas: Enter añade, la × quita. */
function ThingsEditor({ things, onChange }: { things: string[]; onChange: (next: string[]) => void }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState('')
  const add = () => {
    const value = draft.trim()
    setDraft('')
    if (!value || things.includes(value) || things.length >= MAX_THINGS) return
    onChange([...things, value])
  }
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {things.map(thing => (
        <span key={thing} className={`${PILL} ${PILL_ON} pr-1.5`}>
          {thing}
          <button
            type="button"
            onClick={() => onChange(things.filter(x => x !== thing))}
            aria-label={t('location.places.removeThing', { thing })}
            className="rounded-full p-0.5 hover:bg-entity-location/15"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      {things.length < MAX_THINGS && (
        <Input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); add() }
            if (e.key === 'Escape') setDraft('')
          }}
          onBlur={add}
          placeholder={things.length === 0 ? t('location.places.thingsPlaceholder') : t('location.places.thingsMore')}
          aria-label={t('location.places.things')}
          className="h-8 w-56 text-sm"
        />
      )}
    </div>
  )
}

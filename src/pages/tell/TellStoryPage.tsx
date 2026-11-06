import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, Feather, Loader2, MoreHorizontal, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  getLocationGraph, getStoryGraph, getWorldById, getWorldDetail, listSceneNodes, refinePremise, updateWorld,
} from '@/services/api'
import type { StoryGraph, World } from '@/services/api'
import { describeError } from '@/services/telemetry'
import { LINES } from '@/components/world/worldLines'
import { firstSentence, orderScenes, provisionalName } from './tellFlow'

/**
 * Contar primero, pantalla 4: el mundo que crece. La historia como lista de
 * escenas en orden de lectura, cuántos sitios y cuánta gente tiene ya el
 * mundo, y «Escena N+1» como botón principal. Con dos o tres escenas, «Ya
 * puedo decirte cómo entiendo tu mundo» propone las tres líneas, que el
 * autor corrige en la pestaña Mundo o ignora.
 */

const STATUS_WORD: Record<string, string> = { generated: 'escrita', prose_only: 'escrita', stale: 'desactualizada', generating: 'escribiéndose' }

export default function TellStoryPage() {
  const navigate = useNavigate()
  const { id, storyId } = useParams()
  const worldId = Number(id)
  const sid = Number(storyId)
  const [world, setWorld] = useState<World | null>(null)
  const [graph, setGraph] = useState<StoryGraph | null>(null)
  const [counts, setCounts] = useState<{ places: number; people: number }>({ places: 0, people: 0 })
  const [telling, setTelling] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(() => {
    Promise.all([getWorldById(worldId), getStoryGraph(sid), getWorldDetail(worldId), getLocationGraph(worldId)])
      .then(([w, g, d, l]) => {
        setWorld(w)
        setGraph(g)
        setCounts({ places: l.nodes.length, people: d.characters.length })
      })
      .catch(err => setError(describeError(err, 'no se pudo cargar la historia')))
  }, [worldId, sid])

  useEffect(() => {
    document.title = 'Tu historia — StoryTeller'
    if (!Number.isFinite(worldId) || !Number.isFinite(sid)) { setError('historia desconocida'); return }
    load()
  }, [load, worldId, sid])

  const scenes = useMemo(() => (graph ? orderScenes(graph) : []), [graph])
  const last = scenes[scenes.length - 1]
  const linesEmpty = !!world && !world.rule && !world.scarcity && !world.power
  const offerReading = scenes.length >= 2 && linesEmpty

  // «Dímelo»: la lectura del mundo desde la premisa y los «qué pasa» de las
  // escenas; nombre de verdad si el provisional sigue ahí. Nunca bloquea.
  const handleTellMe = async () => {
    if (!world) return
    setTelling(true)
    try {
      const whats = await Promise.all(scenes.map(async s => {
        const nodes = await listSceneNodes(s.id).catch(() => [])
        return nodes.filter(n => n.node_kind === 'moment').map(n => n.description ?? '').filter(Boolean).join(' ')
      }))
      const r = await refinePremise([world.premise, ...whats].filter(Boolean).join('\n\n'))
      // El nombre y la premisa son provisionales si salieron del «qué pasa» (sin el « (2)» del sufijo).
      const baseName = world.name.replace(/\s\(\d+\)$/, '')
      const provisionalName_ = baseName === provisionalName(world.premise) || baseName === provisionalName(whats[0] ?? '') || /^Sin título/.test(baseName)
      const provisionalPremise = !world.premise.trim() || world.premise.trim() === firstSentence(whats[0] ?? '')
      const name = provisionalName_ && r.name ? r.name : world.name
      const premise = provisionalPremise && r.premise ? r.premise : world.premise
      const updated = await updateWorld(world.id, {
        name,
        premise, description: world.description ?? '',
        rule: r.rule || '', scarcity: r.scarcity || '', power: r.power || '',
      })
      setWorld({ ...world, ...updated, rule: r.rule || '', scarcity: r.scarcity || '', power: r.power || '', name, premise })
    } catch (err) {
      toast.error(`No se pudo leer el mundo: ${describeError(err, 'error desconocido')}`)
    } finally {
      setTelling(false)
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center">
        <p className="text-sm text-muted-foreground">{error}</p>
        <Button variant="ghost" onClick={() => navigate('/worlds')} className="mt-4 min-h-11">Volver a mis mundos</Button>
      </div>
    )
  }
  if (!world || !graph) {
    return <div className="flex justify-center py-24"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>
  }

  const nextHref = `/worlds/${worldId}/contar?story=${sid}${last ? `&after=${last.id}` : ''}&n=${scenes.length}`

  return (
    <div className="mx-auto max-w-xl px-5 py-6 md:px-8 md:py-10">
      <div className="flex items-center justify-between">
        <Link to="/worlds" className="inline-flex min-h-10 items-center gap-1.5 text-xs text-muted-foreground"><ArrowLeft className="size-3.5" />Mis mundos</Link>
        <Link to={`/worlds/${worldId}`} className="inline-flex min-h-10 items-center gap-1 text-xs text-muted-foreground"><MoreHorizontal className="size-4" />más</Link>
      </div>

      <header className="mt-4">
        <p className="text-[10px] tracking-[0.2em] uppercase text-entity-world">{world.name}</p>
        <h1 className="mt-1 font-display text-[1.7rem] leading-tight text-foreground">{world.premise || 'Tu historia'}</h1>
        <p className="mt-2 text-sm text-muted-foreground" data-testid="tell-summary">
          {scenes.length} {scenes.length === 1 ? 'escena' : 'escenas'}. El mundo ya tiene {counts.places} {counts.places === 1 ? 'sitio' : 'sitios'} y {counts.people} {counts.people === 1 ? 'persona' : 'personas'}.
        </p>
      </header>

      <Button size="lg" onClick={() => navigate(nextHref)} className="mt-6 min-h-12 w-full text-base">
        <Feather className="size-4" />
        Escena {scenes.length + 1}
      </Button>

      <ol className="mt-8 space-y-1">
        {scenes.map((s, i) => (
          <li key={s.id} className="flex items-center gap-2">
            <Link to={`/worlds/${worldId}/contar?story=${sid}&scene=${s.id}`} className="flex min-h-12 flex-1 items-baseline gap-3 rounded-md px-1 py-2 hover:bg-accent">
              <span className="w-6 shrink-0 text-right font-display text-sm text-muted-foreground">{i + 1}.</span>
              <span className="min-w-0 flex-1 truncate font-display text-[17px] text-foreground">{s.title}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{STATUS_WORD[s.status] ?? 'sin escribir'}</span>
            </Link>
            <Link to={`/worlds/${worldId}?tab=stories&story=${sid}&scene=${s.id}`} aria-label={`Abrir la escena ${i + 1} en el taller`} className="flex size-11 shrink-0 items-center justify-center text-muted-foreground"><MoreHorizontal className="size-4" /></Link>
          </li>
        ))}
      </ol>

      {offerReading && (
        <section className="mt-8 rounded-xl border border-entity-world/30 bg-entity-world-light px-4 py-4">
          <p className="font-display text-[17px] text-foreground">Ya puedo decirte cómo entiendo tu mundo</p>
          <p className="mt-1 text-sm text-muted-foreground">Tres líneas: qué es siempre verdad, qué falta y quién manda. Las corriges después en Mundo.</p>
          <Button onClick={() => void handleTellMe()} disabled={telling} className="mt-3 min-h-11 gap-1.5">
            {telling ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {telling ? 'Leyendo tu mundo…' : 'Dímelo'}
          </Button>
        </section>
      )}

      {!linesEmpty && (
        <section className="mt-8">
          <h2 className="font-display text-xl text-foreground">Así entiendo tu mundo</h2>
          <dl className="mt-3 space-y-4">
            {LINES.map(line => (
              <div key={line.key}>
                <dt className="text-sm text-muted-foreground">{line.question}</dt>
                <dd className="font-body text-[1rem] leading-relaxed text-foreground">{world[line.key] || '—'}</dd>
              </div>
            ))}
          </dl>
          <Link to={`/worlds/${worldId}`} className="mt-2 inline-flex min-h-10 items-center text-xs text-primary">Corregirlo en Mundo</Link>
        </section>
      )}

      <nav className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-border/60 pt-5 text-sm">
        <Link to={`/worlds/${worldId}?tab=locations`} className="min-h-10 inline-flex items-center text-entity-location">Sitios ({counts.places})</Link>
        <Link to={`/worlds/${worldId}?tab=characters`} className="min-h-10 inline-flex items-center text-entity-character">Gente ({counts.people})</Link>
        {scenes.length > 0 && (
          <Link to={`/worlds/${worldId}?tab=stories&story=${sid}&read=1`} className="min-h-10 inline-flex items-center gap-1.5 text-foreground"><BookOpen className="size-4" />Leer seguido</Link>
        )}
      </nav>
    </div>
  )
}

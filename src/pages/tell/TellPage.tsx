import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Feather, Loader2, MoreHorizontal, PenLine, RefreshCw, Server } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useInstallation } from '@/hooks/useInstallation'
import {
  dismissExtracted, extractScene, generateScene, getGenerationProgress, getLocationGraph, getWorldById, getWorldDetail,
  keepExtracted, listSceneOutputs, saveSceneProse,
} from '@/services/api'
import type { PersonFound, PlaceFound, World } from '@/services/api'
import { describeError, newRequestId } from '@/services/telemetry'
import { notifyError } from '@/lib/notifyError'
import { proseParagraphs } from '@/lib/prose'
import { AppearedCards } from '@/components/tell/AppearedCards'
import { appearedKey, type AppearedKind } from '@/components/tell/appeared'
import { createTellScene, ensureStory, ensureWorld } from './tellFlow'

/**
 * Contar primero (2026-11-03): las pantallas 1 a 3 del camino básico, una
 * cosa que hacer por pantalla y un solo botón grande. «¿De qué va?» y «¿Qué
 * pasa?» → la prosa → «Han aparecido N cosas». Mundo e historia se crean en
 * silencio con nombres provisionales. Rutas: /contar (mundo nuevo) y
 * /worlds/:id/contar?story=&after=&scene=.
 */
type Step = 'ask' | 'writing' | 'prose' | 'appeared'

function progressLabel(kind: string, phase: string, seconds: number): string {
  const what = kind === 'scene_extract_entities' ? 'mirando qué ha aparecido'
    : kind === 'scene_verify' ? 'comprobando lo que pasa'
    : phase || 'escribiendo la escena'
  return `${what} · ${seconds} s`
}

export default function TellPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [params] = useSearchParams()
  const { hasInstallation, checked } = useInstallation()

  const [worldId, setWorldId] = useState<number | null>(id ? Number(id) : null)
  const [world, setWorld] = useState<World | null>(null)
  const [storyId, setStoryId] = useState<number | null>(params.get('story') ? Number(params.get('story')) : null)
  // «after» sin «story» enlazaría con una escena de otra historia: se ignora.
  const afterSceneId = params.get('story') && params.get('after') ? Number(params.get('after')) : undefined
  const reopenSceneId = params.get('scene') ? Number(params.get('scene')) : undefined
  const sceneIndex = params.get('n') ? Number(params.get('n')) : (afterSceneId ? 1 : 0)

  const [step, setStep] = useState<Step>(reopenSceneId ? 'writing' : 'ask')
  const [premise, setPremise] = useState('')
  const [what, setWhat] = useState('')
  const [sceneId, setSceneId] = useState<number | null>(reopenSceneId ?? null)
  const [prose, setProse] = useState('')
  const [progress, setProgress] = useState('')
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [found, setFound] = useState<{ people: PersonFound[]; places: PlaceFound[] } | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [chips, setChips] = useState<{ people: string[]; places: string[] }>({ people: [], places: [] })
  const whatRef = useRef<HTMLTextAreaElement>(null)
  const left = useRef(false)

  useEffect(() => {
    document.title = 'Contar — StoryTeller'
    left.current = false
    return () => { left.current = true }
  }, [])

  // Con mundo: su premisa (no se vuelve a pedir) y, desde la segunda escena,
  // la gente y los sitios que ya existen como fichas tocables.
  useEffect(() => {
    if (!worldId) return
    getWorldById(worldId).then(w => { setWorld(w); setPremise(w.premise ?? '') }).catch(notifyError('No se pudo cargar el mundo'))
    if (!afterSceneId) return
    Promise.all([getWorldDetail(worldId), getLocationGraph(worldId)])
      .then(([d, g]) => setChips({ people: d.characters.map(c => c.name), places: g.nodes.map(n => n.name) }))
      .catch(() => { /* las fichas son una ayuda: sin ellas se escribe igual */ })
  }, [worldId, afterSceneId])

  // Una escena ya contada se reabre en su prosa.
  useEffect(() => {
    if (!reopenSceneId) return
    listSceneOutputs(reopenSceneId)
      .then(outs => {
        const current = outs.find(o => o.current) ?? outs[outs.length - 1]
        setProse(current?.content ?? '')
        setStep('prose')
      })
      .catch(err => { notifyError('No se pudo abrir la escena')(err); setStep('ask') })
  }, [reopenSceneId])

  const trackProgress = useCallback((requestId: string) => {
    const started = Date.now()
    return setInterval(async () => {
      try {
        const { runs } = await getGenerationProgress(requestId)
        const current = runs.find(r => r.status === 'running') ?? runs[runs.length - 1]
        const seconds = Math.round((Date.now() - started) / 1000)
        setProgress(current ? progressLabel(current.kind, current.phase, seconds) : `esperando al generador · ${seconds} s`)
      } catch {
        // el progreso es informativo
      }
    }, 800)
  }, [])

  // Escribir la escena y, después, mirar qué ha aparecido. Las dos cosas con
  // su contador; si la extracción falla, la prosa queda y se avisa.
  const writeAndExtract = useCallback(async (sid: number) => {
    const requestId = newRequestId()
    const poll = trackProgress(requestId)
    try {
      const res = await generateScene(sid, requestId)
      if (left.current) return
      setProse(res.prose)
      setStep('prose')
      setProgress('mirando qué ha aparecido…')
      try {
        const got = await extractScene(sid, newRequestId())
        if (left.current) return
        setFound(got)
        setSelected(new Set([...got.people.map(p => appearedKey('p', p.name)), ...got.places.map(p => appearedKey('s', p.name))]))
      } catch (err) {
        // found se queda en null: «Mirar qué ha aparecido» sigue ahí para reintentar.
        toast.error(`La escena está escrita, pero no se pudo mirar qué ha aparecido: ${describeError(err, 'error desconocido')}`)
      }
    } finally {
      clearInterval(poll)
      setProgress('')
    }
  }, [trackProgress])

  const handleWrite = async () => {
    if (!what.trim()) { whatRef.current?.focus(); return }
    setBusy(true)
    setStep('writing')
    try {
      let wid = worldId
      if (!wid) { wid = await ensureWorld(premise, what); setWorldId(wid) }
      let sid = storyId
      if (!sid) { sid = (await ensureStory(wid, what, premise)).id; setStoryId(sid) }
      // Si un intento anterior falló después de crear la escena, se reutiliza: no se duplica.
      let scene = sceneId
      if (!scene) {
        scene = await createTellScene(sid, what, afterSceneId, sceneIndex)
        setSceneId(scene)
      }
      await writeAndExtract(scene)
    } catch (err) {
      toast.error(`No se pudo escribir la escena: ${describeError(err, 'error desconocido')}`)
      setStep('ask')
    } finally {
      setBusy(false)
    }
  }

  const handleRewrite = async () => {
    if (!sceneId) return
    setBusy(true)
    setStep('writing')
    setFound(null)
    try {
      await writeAndExtract(sceneId)
    } catch (err) {
      toast.error(`No se pudo reescribir: ${describeError(err, 'error desconocido')}`)
      setStep('prose')
    } finally {
      setBusy(false)
    }
  }

  const handleSaveDraft = async () => {
    if (!sceneId) return
    setBusy(true)
    try {
      const res = await saveSceneProse(sceneId, draft)
      setProse(res.prose ?? draft)
      setEditing(false)
      setFound(null)
    } catch (err) {
      toast.error(`No se pudo guardar: ${describeError(err, 'error desconocido')}`)
    } finally {
      setBusy(false)
    }
  }

  // Reabierta o retocada: mirar qué ha aparecido se pide aparte.
  const handleLook = async () => {
    if (!sceneId) return
    setBusy(true)
    setProgress('mirando qué ha aparecido…')
    try {
      const got = await extractScene(sceneId, newRequestId())
      setFound(got)
      setSelected(new Set([...got.people.map(p => appearedKey('p', p.name)), ...got.places.map(p => appearedKey('s', p.name))]))
      if (got.people.length + got.places.length > 0) setStep('appeared')
      else toast('No ha aparecido nada nuevo.')
    } catch (err) {
      toast.error(`No se pudo mirar qué ha aparecido: ${describeError(err, 'error desconocido')}`)
    } finally {
      setBusy(false)
      setProgress('')
    }
  }

  const goStory = () => {
    if (worldId && storyId) navigate(`/worlds/${worldId}/contar/${storyId}`, { replace: true })
    else navigate('/worlds', { replace: true })
  }

  const toggle = (kind: AppearedKind, name: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      const k = appearedKey(kind, name)
      if (next.has(k)) next.delete(k)
      else next.add(k)
      return next
    })
  }

  // Quedarse con lo marcado; lo no marcado se tira (no se vuelve a proponer).
  const handleKeep = async () => {
    if (!sceneId || !found) return
    setBusy(true)
    try {
      const people = found.people.filter(p => selected.has(appearedKey('p', p.name)))
      const places = found.places.filter(p => selected.has(appearedKey('s', p.name)))
      const dropped = [
        ...found.people.filter(p => !selected.has(appearedKey('p', p.name))).map(p => p.name),
        ...found.places.filter(p => !selected.has(appearedKey('s', p.name))).map(p => p.name),
      ]
      if (people.length || places.length) {
        const res = await keepExtracted(sceneId, { people, places })
        const dup = [...res.people, ...res.places].filter(i => i.error === 'duplicate').map(i => i.name)
        const failed = [...res.people, ...res.places].filter(i => i.error && i.error !== 'duplicate')
        if (dup.length) toast(`Ya existían: ${dup.join(', ')}.`)
        if (failed.length) toast.error(`No se pudo guardar: ${failed.map(i => `${i.name} (${i.error})`).join('; ')}`)
      }
      if (dropped.length) await dismissExtracted(sceneId, dropped).catch(() => { /* tirar es un recuerdo; si falla, se vuelve a proponer */ })
      goStory()
    } catch (err) {
      toast.error(`No se pudo guardar: ${describeError(err, 'error desconocido')}`)
    } finally {
      setBusy(false)
    }
  }

  const handleNext = async () => {
    if (sceneId && found && found.people.length + found.places.length > 0) {
      await dismissExtracted(sceneId, [...found.people.map(p => p.name), ...found.places.map(p => p.name)]).catch(() => { /* idem */ })
    }
    goStory()
  }

  const insertChip = (name: string) => {
    setWhat(prev => (prev.trim() ? `${prev.replace(/\s+$/, '')} ${name}` : name))
    whatRef.current?.focus()
  }

  if (checked && !hasInstallation) {
    return (
      <div className="mx-auto max-w-xl px-5 py-16 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10"><Server className="size-6 text-primary" /></div>
        <h1 className="font-display text-2xl text-foreground">Para escribir hace falta tu generador</h1>
        <p className="mt-2 text-sm text-muted-foreground">Enlázalo una vez en Ajustes y vuelve aquí.</p>
        <div className="mt-6 flex flex-col gap-2">
          <Button onClick={() => navigate('/settings?tab=installation')} className="min-h-11">Enlazar el generador</Button>
          <Button variant="ghost" onClick={() => navigate('/worlds')} className="min-h-11">Volver</Button>
        </div>
      </div>
    )
  }

  const count = found ? found.people.length + found.places.length : 0
  const showPremise = !world?.premise
  const back = worldId && storyId ? `/worlds/${worldId}/contar/${storyId}` : '/worlds'

  return (
    <div className="min-h-[calc(100dvh-45px)] md:min-h-0">
      <div className="mx-auto max-w-xl px-5 py-6 md:px-8 md:py-10">
        {step === 'ask' && (
          <div className="space-y-8">
            <Link to={back} className="inline-flex min-h-10 items-center gap-1.5 text-xs text-muted-foreground"><ArrowLeft className="size-3.5" />Volver</Link>
            <div className="text-center">
              <div className="mx-auto mb-4 inline-flex size-12 items-center justify-center rounded-full bg-entity-world-light"><Feather className="size-5 text-entity-world" /></div>
              <h1 className="font-display text-[1.9rem] font-light leading-tight tracking-[-0.01em] text-foreground">{afterSceneId ? 'La siguiente escena' : 'Cuenta una historia'}</h1>
            </div>
            {showPremise && (
              <label className="block">
                <span className="mb-2 block text-[10px] tracking-[0.2em] uppercase text-primary/60">¿De qué va?</span>
                <textarea
                  value={premise}
                  onChange={e => setPremise(e.target.value)}
                  rows={2}
                  placeholder="Una frase, si la tienes. Si no, déjalo en blanco."
                  className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 font-body text-[1.05rem] leading-relaxed"
                />
              </label>
            )}
            <div>
              {(chips.people.length > 0 || chips.places.length > 0) && (
                <div className="mb-3 flex flex-wrap gap-1.5">
                  {chips.people.map(n => <button key={`p:${n}`} type="button" onClick={() => insertChip(n)} className="min-h-9 rounded-full border border-entity-character/40 bg-entity-character-light px-3 text-sm text-foreground">{n}</button>)}
                  {chips.places.map(n => <button key={`s:${n}`} type="button" onClick={() => insertChip(n)} className="min-h-9 rounded-full border border-entity-location/40 bg-entity-location-light px-3 text-sm text-foreground">{n}</button>)}
                </div>
              )}
              <label className="block">
                <span className="mb-2 block text-[10px] tracking-[0.2em] uppercase text-primary/60">{afterSceneId ? '¿Qué pasa?' : '¿Qué pasa en la primera escena?'}</span>
                <textarea
                  ref={whatRef}
                  value={what}
                  onChange={e => setWhat(e.target.value)}
                  rows={5}
                  placeholder="Dos o tres frases: quién, dónde, y qué tiene que haber pasado al final."
                  className="w-full resize-none rounded-lg border border-border bg-card px-3 py-2.5 font-display text-[1.1rem] leading-snug"
                />
              </label>
            </div>
            <Button size="lg" onClick={() => void handleWrite()} disabled={busy || !what.trim()} className="min-h-12 w-full text-base">
              <Feather className="size-4" />
              Escribirla
            </Button>
          </div>
        )}

        {step === 'writing' && (
          <div className="flex flex-col items-center gap-4 py-24 text-center">
            <Loader2 className="size-8 animate-spin text-entity-world" />
            <p className="text-sm text-muted-foreground">{progress || 'preparando la escena…'}</p>
          </div>
        )}

        {(step === 'prose' || step === 'appeared') && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Link to={back} className="inline-flex min-h-10 items-center gap-1.5 text-xs text-muted-foreground"><ArrowLeft className="size-3.5" />Volver</Link>
              {worldId && storyId && sceneId && (
                <Link to={`/worlds/${worldId}?tab=stories&story=${storyId}&scene=${sceneId}`} aria-label="Abrir en el taller" className="inline-flex min-h-10 items-center gap-1 text-xs text-muted-foreground">
                  <MoreHorizontal className="size-4" />más
                </Link>
              )}
            </div>

            {step === 'prose' && (
              <>
                {editing ? (
                  <div className="space-y-3">
                    <textarea value={draft} onChange={e => setDraft(e.target.value)} rows={14} className="w-full rounded-lg border border-border bg-card px-3 py-3 font-display text-[17px] leading-[1.75]" />
                    <div className="flex gap-2">
                      <Button onClick={() => void handleSaveDraft()} disabled={busy} className="min-h-11 flex-1">Guardar versión</Button>
                      <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy} className="min-h-11">Dejarlo</Button>
                    </div>
                  </div>
                ) : (
                  <article className="space-y-4 font-display text-[17px] leading-[1.75] text-foreground">
                    {proseParagraphs(prose).map((p, i) => <p key={i}>{p}</p>)}
                  </article>
                )}
                {!editing && (
                  <div className="space-y-2 pt-2">
                    {progress ? (
                      <p className="flex items-center justify-center gap-2 py-3 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />{progress}</p>
                    ) : found === null ? (
                      <Button size="lg" onClick={() => void handleLook()} disabled={busy} className="min-h-12 w-full text-base">Mirar qué ha aparecido</Button>
                    ) : count > 0 ? (
                      <Button size="lg" onClick={() => setStep('appeared')} disabled={busy} className="min-h-12 w-full text-base">Han aparecido {count} cosas</Button>
                    ) : (
                      <Button size="lg" onClick={() => void handleNext()} disabled={busy} className="min-h-12 w-full text-base">Siguiente escena</Button>
                    )}
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => void handleRewrite()} disabled={busy || !!progress} className="min-h-11 flex-1 gap-1.5"><RefreshCw className="size-4" />Reescribir</Button>
                      <Button variant="outline" onClick={() => { setDraft(prose); setEditing(true) }} disabled={busy || !!progress} className="min-h-11 flex-1 gap-1.5"><PenLine className="size-4" />Retocar a mano</Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {step === 'appeared' && found && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl text-foreground">Han aparecido {count} cosas</h2>
                  <p className="mt-1 text-sm text-muted-foreground">¿Me las quedo?</p>
                </div>
                <AppearedCards people={found.people} places={found.places} selected={selected} onToggle={toggle} />
                <div className="space-y-2">
                  <Button size="lg" onClick={() => void handleKeep()} disabled={busy} className="min-h-12 w-full text-base">
                    {busy ? <Loader2 className="size-4 animate-spin" /> : null}
                    {selected.size > 0 ? 'Quedarme con lo marcado' : 'Siguiente escena sin guardar nada'}
                  </Button>
                  {selected.size > 0 && (
                    <button type="button" onClick={() => void handleNext()} disabled={busy} className="block w-full min-h-10 text-center text-sm text-muted-foreground underline underline-offset-4 decoration-border">
                      Siguiente escena sin guardar nada
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

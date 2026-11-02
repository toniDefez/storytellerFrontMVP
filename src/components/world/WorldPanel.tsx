import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import type { World, WorldInput } from '@/services/api'
import { refinePremise } from '@/services/api'
import { notifyError } from '@/lib/notifyError'
import { LINES } from './worldLines'

/**
 * La pestaña Mundo (escena 0): la premisa y «el mundo en tres líneas». Las
 * tres líneas son lo que la propuesta de lugares lee del mundo, además de la
 * premisa; el autor las corrige o las deja. Se guarda al perder el foco.
 * Sustituye al lienzo del árbol causal, que no llegaba a ningún prompt.
 */

interface Props {
  world: World
  onSave: (input: WorldInput) => Promise<void>
  onDeleteWorld: () => void
}

const FIELD = 'w-full rounded-md border border-border/60 bg-background px-3 py-2 text-sm leading-relaxed resize-none outline-none focus:border-primary/50'

export function WorldPanel({ world, onSave, onDeleteWorld }: Props) {
  const [draft, setDraft] = useState<WorldInput>(toInput(world))
  const [proposing, setProposing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => { setDraft(toInput(world)) }, [world])

  const save = async (next: WorldInput) => {
    if (sameInput(next, toInput(world))) return
    setSaving(true)
    try {
      await onSave(next)
    } catch (err) {
      notifyError('No se pudo guardar el mundo')(err)
    } finally {
      setSaving(false)
    }
  }

  // «Proponme»: la lectura de la premisa rellena solo las tres líneas (no toca
  // la premisa ni el nombre). Lo que venga vacío se queda como está.
  const propose = async () => {
    if (!draft.premise.trim()) return
    setProposing(true)
    try {
      const r = await refinePremise(draft.premise.trim())
      const next = { ...draft, rule: r.rule || draft.rule, scarcity: r.scarcity || draft.scarcity, power: r.power || draft.power }
      setDraft(next)
      await save(next)
    } catch (err) {
      notifyError('No se pudo leer la premisa')(err)
    } finally {
      setProposing(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl space-y-8 px-4 py-5 md:px-8 md:py-8">
        <section className="space-y-2">
          <label className="block text-[10px] tracking-[0.2em] uppercase text-primary/70" htmlFor="world-premise">La premisa</label>
          <textarea
            id="world-premise"
            value={draft.premise}
            onChange={e => setDraft({ ...draft, premise: e.target.value })}
            onBlur={() => void save(draft)}
            rows={3}
            className={`${FIELD} font-body text-[1rem]`}
            placeholder="Una frase: quién quiere qué, y qué se lo impide."
          />
        </section>

        <section className="space-y-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-lg text-foreground">Así entiendo tu mundo</h3>
            <button
              type="button"
              onClick={() => void propose()}
              disabled={proposing || !draft.premise.trim()}
              className="flex min-h-10 items-center gap-1.5 text-xs text-primary disabled:opacity-50"
            >
              {proposing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
              <span>{proposing ? 'Leyendo tu mundo…' : 'Proponme'}</span>
            </button>
          </div>
          {LINES.map(line => (
            <div key={line.key} className="space-y-1">
              <label className="block text-sm text-muted-foreground" htmlFor={`world-${line.key}`}>{line.question}</label>
              <textarea
                id={`world-${line.key}`}
                value={draft[line.key]}
                onChange={e => setDraft({ ...draft, [line.key]: e.target.value })}
                onBlur={() => void save(draft)}
                rows={line.key === 'rule' ? 2 : 1}
                className={FIELD}
                placeholder={line.hint}
              />
            </div>
          ))}
          <p className="text-xs text-muted-foreground/80">
            Las tres líneas son el mundo antes de que pase nada: lo que leen los lugares propuestos. Lo que cambia en una historia vive en sus escenas.
            {saving ? ' · Guardando…' : ''}
          </p>
        </section>

        {/* Móvil: borrar al final, como en Personajes; en escritorio va en el menú ···. */}
        <div className="md:hidden mt-10 pt-4 border-t border-border/60">
          <button type="button" onClick={onDeleteWorld} className="min-h-11 text-sm text-muted-foreground underline underline-offset-4 decoration-border">
            Borrar este mundo…
          </button>
        </div>
      </div>
    </div>
  )
}

function toInput(w: World): WorldInput {
  return { name: w.name, premise: w.premise ?? '', description: w.description ?? '', rule: w.rule ?? '', scarcity: w.scarcity ?? '', power: w.power ?? '' }
}

function sameInput(a: WorldInput, b: WorldInput): boolean {
  return a.name === b.name && a.premise === b.premise && a.description === b.description && a.rule === b.rule && a.scarcity === b.scarcity && a.power === b.power
}

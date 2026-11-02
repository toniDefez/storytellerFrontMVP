import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import type { World, WorldInput } from '@/services/api'
import { refinePremise } from '@/services/api'
import { notifyError } from '@/lib/notifyError'
import { InlineText } from '@/components/places/InlineText'
import { LINES } from './worldLines'

/**
 * La pestaña Mundo (escena 0): la premisa y «el mundo en tres líneas». Una
 * ficha, no un formulario (Toni, 2026-11-02: «está todo muy junto y mucho
 * texto me agobia»): la premisa como texto que se toca para editar; las tres
 * respuestas como prosa bajo su pregunta; si están vacías, un solo «Proponme»
 * y nada más. Se guarda al salir del campo.
 */

interface Props {
  world: World
  onSave: (input: WorldInput) => Promise<void>
  onDeleteWorld: () => void
}

export function WorldPanel({ world, onSave, onDeleteWorld }: Props) {
  const [proposing, setProposing] = useState(false)
  const [writing, setWriting] = useState(false)
  const input = (): WorldInput => ({
    name: world.name, premise: world.premise ?? '', description: world.description ?? '',
    rule: world.rule ?? '', scarcity: world.scarcity ?? '', power: world.power ?? '',
  })
  const empty = !world.rule && !world.scarcity && !world.power

  const save = async (patch: Partial<WorldInput>) => {
    try {
      await onSave({ ...input(), ...patch })
    } catch (err) {
      notifyError('No se pudo guardar el mundo')(err)
    }
  }

  // «Proponme»: la lectura de la premisa rellena las tres líneas; la premisa
  // y el nombre no se tocan. Lo que venga vacío se queda como está.
  const propose = async () => {
    if (!world.premise?.trim()) return
    setProposing(true)
    try {
      const r = await refinePremise(world.premise.trim())
      await save({ rule: r.rule || world.rule, scarcity: r.scarcity || world.scarcity, power: r.power || world.power })
      setWriting(true)
    } catch (err) {
      notifyError('No se pudo leer la premisa')(err)
    } finally {
      setProposing(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto max-w-xl space-y-12 px-5 py-7 md:px-8 md:py-10">
        <section>
          <p className="mb-2 text-[10px] tracking-[0.2em] uppercase text-primary/60">La premisa</p>
          <InlineText
            multiline
            value={world.premise ?? ''}
            label="La premisa"
            placeholder="Una frase: quién quiere qué, y qué se lo impide."
            onCommit={premise => void save({ premise })}
            className="font-body text-[1.05rem] leading-relaxed"
          />
        </section>

        <section className="space-y-6">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-xl text-foreground">Así entiendo tu mundo</h3>
            {!empty && (
              <button type="button" onClick={() => void propose()} disabled={proposing || !world.premise?.trim()}
                className="flex min-h-10 items-center gap-1.5 text-xs text-primary disabled:opacity-50">
                {proposing ? <Loader2 className="size-3.5 animate-spin" /> : <Sparkles className="size-3.5" />}
                {proposing ? 'Leyendo…' : 'Proponme otra vez'}
              </button>
            )}
          </div>

          {empty && !writing ? (
            <div className="flex flex-col items-start gap-3">
              <button type="button" onClick={() => void propose()} disabled={proposing || !world.premise?.trim()}
                className="inline-flex min-h-11 items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-5 text-sm text-primary disabled:opacity-50">
                {proposing ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {proposing ? 'Leyendo tu mundo…' : 'Proponme'}
              </button>
              <button type="button" onClick={() => setWriting(true)} className="min-h-10 text-xs text-muted-foreground underline underline-offset-4 decoration-border">
                o escribirlo yo
              </button>
            </div>
          ) : (
            <dl className="space-y-7">
              {LINES.map(line => (
                <div key={line.key}>
                  <dt className="mb-1 text-sm text-muted-foreground">{line.question}</dt>
                  <dd>
                    <InlineText
                      multiline
                      value={world[line.key] ?? ''}
                      label={line.question}
                      placeholder="…"
                      onCommit={v => void save({ [line.key]: v })}
                      className="font-body text-[1rem] leading-relaxed"
                    />
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        {/* Móvil: borrar al final, como en Personajes; en escritorio va en el menú ···. */}
        <div className="md:hidden pt-6 border-t border-border/60">
          <button type="button" onClick={onDeleteWorld} className="min-h-11 text-sm text-muted-foreground underline underline-offset-4 decoration-border">
            Borrar este mundo…
          </button>
        </div>
      </div>
    </div>
  )
}

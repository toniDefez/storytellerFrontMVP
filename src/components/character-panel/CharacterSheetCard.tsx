import { useEffect, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { generateCharacterSheet, updateCharacterSheet, type CharacterSheet, type SheetSignature } from '@/services/api'
import { describeError } from '@/services/telemetry'

// La ficha corta (2026-10-31): seis campos redactados como acción, la biblia
// de personaje de una sala de guionistas. El autor la corrige campo a campo;
// eso es lo que hace al personaje suyo y no del modelo. No va a la prosa:
// alimenta al asistente del taller («Propuestas del reparto»).

interface Props {
  characterId: number
  characterName: string
  sheet: CharacterSheet | null | undefined
  onChange: (sheet: CharacterSheet) => void
}

const EMPTY: CharacterSheet = { quiere: '', cree: '', nunca: '', salvo: '', cuando: [], por_defecto: '' }

const label = 'text-[10px] tracking-[0.2em] uppercase'
const labelStyle = { fontFamily: 'var(--font-ui)', color: 'hsl(24 60% 45%)' } as const
const field = 'w-full bg-transparent border-b border-amber-400/30 px-0 py-1.5 text-[15px] font-display leading-snug text-foreground/85 placeholder:text-foreground/20 focus:outline-none focus:border-amber-400/60 resize-none'

function same(a: CharacterSheet, b: CharacterSheet): boolean {
  return JSON.stringify(a) === JSON.stringify(b)
}

export function CharacterSheetCard({ characterId, characterName, sheet, onChange }: Props) {
  const [draft, setDraft] = useState<CharacterSheet>(sheet ?? EMPTY)
  const [saving, setSaving] = useState(false)
  const [proposing, setProposing] = useState(false)
  useEffect(() => { setDraft(sheet ?? EMPTY) }, [sheet])
  const dirty = !same(draft, sheet ?? EMPTY)
  const has = !!sheet && !!sheet.quiere

  const set = (k: keyof CharacterSheet, v: string) => setDraft((d) => ({ ...d, [k]: v }))
  const setSig = (i: number, k: keyof SheetSignature, v: string) => setDraft((d) => {
    const cuando = [...d.cuando]
    while (cuando.length <= i) cuando.push({ si: '', hace: '' })
    cuando[i] = { ...cuando[i], [k]: v }
    return { ...d, cuando }
  })

  const save = async () => {
    setSaving(true)
    try {
      const clean: CharacterSheet = { ...draft, cuando: draft.cuando.filter((c) => c.si.trim() && c.hace.trim()) }
      await updateCharacterSheet(characterId, clean)
      onChange(clean)
      toast.success('Ficha guardada')
    } catch (err) {
      toast.error(`No se pudo guardar la ficha: ${describeError(err, 'error desconocido')}`)
    } finally {
      setSaving(false)
    }
  }

  const propose = async () => {
    setProposing(true)
    try {
      const s = await generateCharacterSheet(characterId)
      onChange(s)
    } catch (err) {
      toast.error(`No se pudo proponer la ficha: ${describeError(err, 'error desconocido')}`)
    } finally {
      setProposing(false)
    }
  }

  const sigs: SheetSignature[] = [0, 1, 2].map((i) => draft.cuando[i] ?? { si: '', hace: '' })

  return (
    <section className="px-4 md:px-6 py-4 flex flex-col gap-4 max-w-2xl">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-widest text-amber-600/60">Ficha</span>
        <div className="flex items-center gap-2">
          {dirty && (
            <button type="button" onClick={() => void save()} disabled={saving} className="min-h-9 px-3 rounded-lg bg-amber-700 text-white text-sm font-semibold disabled:opacity-50">
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          )}
          <button type="button" onClick={() => void propose()} disabled={proposing} className="min-h-9 inline-flex items-center gap-1.5 px-3 rounded-lg border border-amber-400/40 text-amber-800 text-sm disabled:opacity-50">
            {proposing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> proponiendo…</> : <><Sparkles className="w-3.5 h-3.5" /> {has ? 'Proponer otra' : 'Proponer ficha'}</>}
          </button>
        </div>
      </div>
      {!has && !proposing && (
        <p className="text-sm text-muted-foreground italic">{characterName} aún no tiene ficha. Pídesela al generador o escríbela: qué quiere, qué cree, qué no haría nunca y cómo reacciona.</p>
      )}

      <div className="flex flex-col gap-3.5">
        <div>
          <label className={label} style={labelStyle}>Quiere</label>
          <textarea rows={3} value={draft.quiere} onChange={(e) => set('quiere', e.target.value)} placeholder="Verbo, objeto concreto, plazo o contra quién" className={field} />
        </div>
        <div>
          <label className={label} style={labelStyle}>Cree</label>
          <textarea rows={2} value={draft.cree} onChange={(e) => set('cree', e.target.value)} placeholder="«Creo que…», sobre el mundo o la gente, y que la historia pueda desmentir" className={field} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className={label} style={labelStyle}>No haría nunca</label>
            <textarea rows={2} value={draft.nunca} onChange={(e) => set('nunca', e.target.value)} placeholder="Una acción concreta" className={field} />
          </div>
          <div>
            <label className={label} style={labelStyle}>…salvo</label>
            <textarea rows={2} value={draft.salvo} onChange={(e) => set('salvo', e.target.value)} placeholder="El precio que le haría romperlo" className={field} />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className={label} style={labelStyle}>Cuando… hace…</label>
          {sigs.map((s, i) => (
            <div key={i} className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 items-baseline">
              <span className="text-xs text-muted-foreground pt-1.5">Cuando</span>
              <textarea rows={2} value={s.si} onChange={(e) => setSig(i, 'si', e.target.value)} placeholder="situación observable" className={field} />
              <span className="text-xs text-muted-foreground pt-1.5">hace</span>
              <textarea rows={2} value={s.hace} onChange={(e) => setSig(i, 'hace', e.target.value)} placeholder="conducta observable" className={field} />
            </div>
          ))}
        </div>
        <div>
          <label className={label} style={labelStyle}>Por defecto</label>
          <textarea rows={2} value={draft.por_defecto} onChange={(e) => set('por_defecto', e.target.value)} placeholder="Qué hace y qué mira cuando nada aprieta" className={field} />
        </div>
      </div>
    </section>
  )
}

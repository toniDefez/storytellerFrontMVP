import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { HOOK_RULE_LABEL, type HookNovelty, type SceneHook } from '../../services/api';

// Los ganchos en el taller (2026-10-31). Lo que en los juegos convierte a un
// secundario en personaje de la trama: el reparto, mirando su ficha y su
// estado, propone pasos que el autor acepta, edita o descarta. Se piden a
// mano («Proponer»): cada petición son dos o tres llamadas al modelo. El
// silencio es una respuesta válida y se dice en voz alta. Al aceptar o
// descartar, un clic opcional mide el valor: «ya lo tenía» o «no se me había
// ocurrido» (solo lo segundo es valor; lo primero es continuidad).

export interface HookActions {
  accept: (hookId: number, edit?: { step?: string; outcomes?: string[]; novelty?: HookNovelty }) => Promise<void>;
  discard: (hookId: number, novelty?: HookNovelty) => Promise<void>;
}

interface ListProps {
  hooks: SceneHook[];
  actions: HookActions;
  busy: number | null;
  proposing: boolean;
  message: string;
  canPropose: boolean;
  onPropose: () => Promise<void>;
  /** En el escritorio la lista va en un panel; en el móvil, entre las tarjetas. */
  compact?: boolean;
}

const labelStyle = { fontFamily: 'var(--font-ui)' } as const;

export function HooksList({ hooks, actions, busy, proposing, message, canPropose, onPropose, compact }: ListProps) {
  const pending = hooks.filter((h) => h.status === 'proposed');
  return (
    <div className={`flex flex-col gap-2 ${compact ? '' : 'p-4'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] tracking-[0.18em] uppercase text-muted-foreground" style={labelStyle}>
          Propuestas del reparto{pending.length > 0 ? ` · ${pending.length}` : ''}
        </span>
        <button
          type="button"
          onClick={() => void onPropose()}
          disabled={proposing || !canPropose}
          title={canPropose ? 'El reparto mira el borrador y su estado y propone pasos si alguna regla se cumple' : 'Ningún personaje presente tiene ficha'}
          className="min-h-10 inline-flex items-center gap-1.5 px-3 rounded-lg border border-[#f1c7b0] bg-[#fff7ed] text-[#9a3412] text-sm font-semibold disabled:opacity-50"
        >
          {proposing ? <><Loader2 className="w-4 h-4 animate-spin" /> mirando el reparto…</> : <><Sparkles className="w-4 h-4" /> {pending.length > 0 ? 'Otra vez' : 'Proponer'}</>}
        </button>
      </div>
      {!canPropose && <p className="text-sm text-muted-foreground italic">Ningún personaje presente tiene ficha. Se crea desde Personajes.</p>}
      {canPropose && pending.length === 0 && !proposing && (
        <p className="text-sm text-muted-foreground italic">{message || 'Nada propuesto todavía. Cuando el borrador tenga pasos, pide propuestas.'}</p>
      )}
      {pending.map((h) => (
        <HookCard key={h.id} hook={h} actions={actions} busy={busy === h.id} />
      ))}
    </div>
  );
}

function HookCard({ hook: h, actions, busy }: { hook: SceneHook; actions: HookActions; busy: boolean }) {
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(h.step);
  const [novelty, setNovelty] = useState<HookNovelty>('');
  useEffect(() => { setStep(h.step); }, [h.step]);
  const pill = (value: HookNovelty, text: string) => (
    <button
      type="button"
      onClick={() => setNovelty(novelty === value ? '' : value)}
      className={`min-h-8 px-2.5 rounded-full border text-xs ${novelty === value ? 'border-[#9a3412] bg-[#9a3412] text-white' : 'border-border bg-card text-muted-foreground'}`}
    >
      {text}
    </button>
  );
  return (
    <div className="rounded-xl border-[1.5px] border-dashed border-[#c2410c] bg-[#fff7ed] px-3.5 py-3 flex flex-col gap-2">
      <div className="text-[11px] tracking-[0.18em] uppercase text-[#9a3412]" style={labelStyle}>
        {h.name} · {HOOK_RULE_LABEL[h.rule] ?? h.rule}
      </div>
      {editing ? (
        <textarea value={step} onChange={(e) => setStep(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-card px-3 py-2 font-display text-[16px] leading-snug" />
      ) : (
        <div className="font-display text-[17px] leading-snug">{h.step}</div>
      )}
      {h.outcomes.map((o) => <div key={o} className="text-[13px] text-muted-foreground">→ {o}</div>)}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs text-muted-foreground">¿Lo tenías pensado?</span>
        {pill('known', 'sí')}
        {pill('new', 'no, es nuevo')}
      </div>
      <div className="grid grid-cols-3 gap-1.5 mt-0.5">
        <button type="button" disabled={busy} onClick={() => void actions.accept(h.id, { step: editing ? step : undefined, outcomes: h.outcomes, novelty })} className="min-h-11 rounded-lg bg-[#9a3412] text-white font-semibold disabled:opacity-50">Aceptar</button>
        <button type="button" disabled={busy} onClick={() => setEditing((v) => !v)} className="min-h-11 rounded-lg border border-border bg-card disabled:opacity-50">{editing ? 'Ver' : 'Editar'}</button>
        <button type="button" disabled={busy} onClick={() => void actions.discard(h.id, novelty)} className="min-h-11 rounded-lg border border-border bg-card text-muted-foreground disabled:opacity-50">Descartar</button>
      </div>
    </div>
  );
}

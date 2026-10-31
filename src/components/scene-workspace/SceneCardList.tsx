import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { BookOpen, ChevronLeft, ChevronDown, ChevronUp, MoreHorizontal, Play, Plus, Trash2 } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import type { Arrival, CharacterCarry, CharacterState, SceneEdgeKind, SceneNode, SceneNodeEdge } from '../../services/api';
import type { ArrivalActions } from './SceneCanvas';
import type { ScenePlace } from './ContainerLocationNode';
import type { OutputNodeData } from './OutputNode';
import { StateBlock, type StateActions } from './StateBlock';
import { SceneProseView } from './SceneProseView';

// El taller de escena en el móvil (2026-10-31): el lienzo no se dibuja, se
// recorre. Los mismos nodos y aristas que el lienzo, como tarjetas en columna
// (tipo Atajos de iOS): la escena (lugar, reparto con su estado vivo,
// narrador), las llegadas por aceptar, y los eventos en orden de lectura
// unidos por un hilo. Tocar un evento abre su hoja: texto, «después», quién
// actúa, subir, bajar, eliminar. Abajo, Escribir y la prosa a pantalla
// completa con modo Corregir. Todo el estado vive en SceneWorkspace.

interface Props {
  storyTitle?: string;
  sceneTitle?: string;
  comesFrom: string;
  onBack: () => void;
  nodes: SceneNode[];
  edges: SceneNodeEdge[];
  charNameByID: Record<number, string>;
  carryByCharID: Record<number, CharacterCarry>;
  stateByCharID: Record<number, CharacterState>;
  stateActions: StateActions;
  locationByID: Record<number, ScenePlace>;
  castOptions: { id: number; name: string }[];
  locationOptions: { id: number; name: string }[];
  output: OutputNodeData;
  arrivals: Arrival[];
  arrivalActions: ArrivalActions;
  busyArrival: number | null;
  onMomentEdit: (id: number, patch: { description?: string; outcomes?: string[] }) => Promise<void>;
  onConnect: (fromId: number, toId: number, kind: SceneEdgeKind) => Promise<void>;
  onEdgeDelete: (id: number) => Promise<void>;
  onDeleteNode: (id: number) => Promise<void>;
  onAddMoment: () => Promise<void>;
  onAddNarrator: () => Promise<void>;
  onAddDirection: () => Promise<void>;
  onAddCharacter: (characterId: number) => Promise<void>;
  onAddLocation: (locationNodeId: number) => Promise<void>;
  generateLabel: string;
  /** Corregir la prosa: el texto editado y cómo guardarlo como versión nueva. */
  pastedText: string;
  onPastedTextChange: (text: string) => void;
  onSaveProse: () => Promise<void>;
  onCopySheet?: () => Promise<void>;
}

/** Eventos en orden de lectura: el mismo recorrido que «Ordenar» en el lienzo. */
function momentOrder(nodes: SceneNode[], edges: SceneNodeEdge[]): { ordered: SceneNode[]; branched: Set<number> } {
  const flow = edges.filter((e) => e.edge_kind === 'flow');
  const next = new Map<number, number[]>();
  const prevCount = new Map<number, number>();
  for (const e of flow) {
    if (!next.has(e.from_node_id)) next.set(e.from_node_id, []);
    next.get(e.from_node_id)!.push(e.to_node_id);
    prevCount.set(e.to_node_id, (prevCount.get(e.to_node_id) ?? 0) + 1);
  }
  const moments = nodes.filter((n) => n.node_kind === 'moment');
  const byId = new Map(moments.map((m) => [m.id, m]));
  const branched = new Set<number>();
  for (const [id, outs] of next) if (outs.length > 1 && byId.has(id)) branched.add(id);
  for (const [id, c] of prevCount) if (c > 1 && byId.has(id)) branched.add(id);
  const ordered: SceneNode[] = [];
  const seen = new Set<number>();
  const walk = (id: number) => {
    for (const t of next.get(id) ?? []) {
      if (seen.has(t) || !byId.has(t)) continue;
      seen.add(t);
      ordered.push(byId.get(t)!);
      walk(t);
    }
  };
  for (const head of moments.filter((m) => !prevCount.has(m.id)).sort((a, b) => a.canvas_y - b.canvas_y)) {
    if (seen.has(head.id)) continue;
    seen.add(head.id);
    ordered.push(head);
    walk(head.id);
  }
  ordered.push(...moments.filter((m) => !seen.has(m.id)).sort((a, b) => a.canvas_y - b.canvas_y));
  return { ordered, branched };
}

const ROMAN: [number, string][] = [[100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
function roman(n: number): string {
  let out = '';
  for (const [v, s] of ROMAN) while (n >= v) { out += s; n -= v; }
  return out;
}

const words = (s: string) => s.trim() ? s.trim().split(/\s+/).length : 0;

const label = 'text-[11px] tracking-[0.18em] uppercase text-muted-foreground';
const labelStyle = { fontFamily: 'var(--font-ui)' } as const;

export function SceneCardList(p: Props) {
  const { nodes, edges, output } = p;
  const { ordered, branched } = useMemo(() => momentOrder(nodes, edges), [nodes, edges]);
  const [openMoment, setOpenMoment] = useState<number | null>(null);
  const [sceneOpen, setSceneOpen] = useState(false);
  const [proseOpen, setProseOpen] = useState(false);

  const characters = nodes.filter((n) => n.node_kind === 'character');
  const location = nodes.find((n) => n.node_kind === 'location');
  const place = location?.location_node_id != null ? p.locationByID[location.location_node_id] : undefined;
  const narrator = nodes.find((n) => n.node_kind === 'narrator');
  const directions = nodes.filter((n) => n.node_kind === 'direction');
  const attachedTo = (momentId: number) => edges.filter((e) => e.edge_kind === 'attachment' && e.to_node_id === momentId).map((e) => nodes.find((n) => n.id === e.from_node_id)).filter((n): n is SceneNode => !!n);
  const charName = (n: SceneNode) => (n.character_id != null ? p.charNameByID[n.character_id] : undefined) ?? '?';
  const visibleArrivals = p.arrivals.filter((a) => a.status === 'propuesta' && (a.pending || a.step !== '' || !!a.warning));

  // Subir/Bajar reescribe las aristas de flujo de la cadena: fuera las de
  // los eventos implicados, y la cadena nueva entera en orden.
  const move = async (id: number, dir: -1 | 1) => {
    const i = ordered.findIndex((m) => m.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= ordered.length) return;
    const nextOrder = [...ordered];
    [nextOrder[i], nextOrder[j]] = [nextOrder[j], nextOrder[i]];
    const momentIds = new Set(ordered.map((m) => m.id));
    const chain = edges.filter((e) => e.edge_kind === 'flow' && momentIds.has(e.from_node_id) && momentIds.has(e.to_node_id));
    for (const e of chain) await p.onEdgeDelete(e.id);
    for (let k = 0; k + 1 < nextOrder.length; k++) await p.onConnect(nextOrder[k].id, nextOrder[k + 1].id, 'flow');
  };

  const open = openMoment != null ? nodes.find((n) => n.id === openMoment) ?? null : null;
  const proseWords = words(output.prose);

  return (
    <div className="flex h-full flex-col bg-background">
      <header className="flex items-center gap-1 px-1 py-2 border-b border-border/70 shrink-0">
        <button type="button" onClick={p.onBack} className="w-11 h-11 inline-flex items-center justify-center text-muted-foreground" aria-label="Volver a la historia">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="min-w-0 flex-1">
          {p.storyTitle && <div className="text-[11px] tracking-[0.18em] uppercase text-entity-scene-muted truncate" style={labelStyle}>{p.storyTitle}</div>}
          <h1 className="m-0 font-display text-[22px] leading-tight truncate">{p.sceneTitle || 'Escena'}</h1>
          {p.comesFrom && <div className="text-xs text-[#9a3412] truncate">{p.comesFrom}</div>}
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 pt-3 pb-28 flex flex-col gap-3">
        {/* La escena: lugar, reparto, narrador. */}
        <button type="button" onClick={() => setSceneOpen(true)} className="text-left rounded-xl border border-border bg-card px-3.5 py-3 flex flex-col gap-1.5 active:bg-accent/40">
          <div className="flex items-baseline justify-between">
            <span className={label} style={labelStyle}>Escena</span>
            <span className="text-xs text-muted-foreground">tocar para abrir</span>
          </div>
          <div className="font-display text-[17px] leading-snug">
            {place ? place.name : <span className="text-muted-foreground italic">Sin lugar</span>}
            {place?.rule && <span className="text-muted-foreground italic text-[15px]"> · {place.rule}</span>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {characters.length === 0 && <span className="text-sm text-muted-foreground italic">Sin personajes todavía</span>}
            {characters.map((c) => (
              <span key={c.id} className="rounded-full border border-[#f1c7b0] bg-[#fff7ed] text-[#9a3412] px-2.5 py-1 text-[13px]">{charName(c)}</span>
            ))}
            {narrator && <span className="rounded-full border border-dashed border-border text-muted-foreground px-2.5 py-1 text-[13px]">narrador</span>}
            {directions.length > 0 && <span className="rounded-full border border-dashed border-border text-muted-foreground px-2.5 py-1 text-[13px]">{directions.length === 1 ? '1 indicación' : `${directions.length} indicaciones`}</span>}
          </div>
        </button>

        {/* Llegadas por decidir. */}
        {visibleArrivals.map((a) => (
          <ArrivalCard key={a.character_id} arrival={a} actions={p.arrivalActions} busy={p.busyArrival === a.character_id} />
        ))}

        {/* Los eventos, con su hilo. */}
        <div className="relative flex flex-col gap-2.5 pl-6">
          {ordered.length > 0 && <span aria-hidden className="absolute left-[9px] top-4 bottom-6 border-l border-entity-scene" />}
          {ordered.map((m, i) => {
            const unmet = (m.outcomes ?? []).filter((o) => output.unmet.includes(o));
            const who = attachedTo(m.id);
            return (
              <button key={m.id} type="button" onClick={() => setOpenMoment(m.id)} className="relative text-left rounded-xl border border-border bg-card px-3.5 py-3 flex flex-col gap-1.5 active:bg-accent/40">
                <span aria-hidden className="absolute -left-[22px] top-4 size-[9px] rounded-full bg-entity-scene" />
                <div className="flex items-baseline gap-2.5">
                  <span className="font-display italic text-entity-scene-muted">{roman(i + 1)}</span>
                  <span className={label} style={labelStyle}>Evento</span>
                  {branched.has(m.id) && <span className="text-[11px] text-amber-700">con rama · se lee en este orden</span>}
                </div>
                <div className="font-display text-[17px] leading-snug">
                  {m.description?.trim() || <span className="text-muted-foreground italic">Sin texto: toca para escribir qué pasa</span>}
                </div>
                {(m.outcomes ?? []).length > 0 && (
                  <div className="text-[13px] flex flex-col gap-0.5">
                    {(m.outcomes ?? []).map((o) => (
                      <span key={o} className={unmet.includes(o) ? 'text-red-700' : 'text-muted-foreground'}>{unmet.includes(o) ? '✗' : '→'} {o}{unmet.includes(o) ? ' · el juez no lo vio' : ''}</span>
                    ))}
                  </div>
                )}
                {who.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {who.map((n) => (
                      <span key={n.id} className="rounded-full bg-[#fff7ed] text-[#9a3412] px-2 py-0.5 text-xs">{n.node_kind === 'character' ? charName(n) : n.node_kind === 'narrator' ? 'narrador' : (n.description?.trim() || 'indicación')}</span>
                    ))}
                  </div>
                )}
              </button>
            );
          })}
          <button type="button" onClick={() => void p.onAddMoment()} className="relative text-left rounded-xl border border-dashed border-border px-3.5 min-h-12 flex items-center gap-2 font-semibold text-entity-scene active:bg-entity-scene-light/60">
            <span aria-hidden className="absolute -left-[22px] top-[19px] size-[9px] rounded-full border border-entity-scene bg-background" />
            <Plus className="w-4 h-4" /> Evento
          </button>
        </div>
      </div>

      {/* Escribir y la prosa, fijos abajo. */}
      <div className="fixed inset-x-0 bottom-0 z-10 flex border-t border-border/70 bg-background/95 backdrop-blur-[2px] pb-[env(safe-area-inset-bottom)]">
        <button type="button" onClick={output.onGenerate} disabled={output.generating} className="flex-1 min-h-14 inline-flex items-center justify-center gap-2 font-semibold text-primary disabled:opacity-60 active:bg-accent px-3">
          {output.generating ? <span className="text-sm font-normal text-muted-foreground truncate">{output.progress || 'escribiendo…'}</span> : <><Play className="w-4 h-4" fill="currentColor" /> {p.generateLabel}</>}
        </button>
        <span className="w-px bg-border/70 my-3" />
        <button type="button" onClick={() => setProseOpen(true)} className="flex-1 min-h-14 inline-flex items-center justify-center gap-2 font-semibold active:bg-accent">
          <BookOpen className="w-4 h-4" /> Prosa {proseWords > 0 && <span className="font-normal text-muted-foreground">· {proseWords}</span>}
        </button>
      </div>

      {/* Hoja: un evento. */}
      <MomentSheet
        moment={open}
        index={open ? ordered.findIndex((m) => m.id === open.id) + 1 : 0}
        count={ordered.length}
        branched={open ? branched.has(open.id) : false}
        unmet={output.unmet}
        attachable={[...characters, ...directions, ...(narrator ? [narrator] : [])]}
        attached={open ? attachedTo(open.id).map((n) => n.id) : []}
        edgeFor={(fromId) => (open ? edges.find((e) => e.edge_kind === 'attachment' && e.from_node_id === fromId && e.to_node_id === open.id) : undefined)}
        nameOf={(n) => (n.node_kind === 'character' ? charName(n) : n.node_kind === 'narrator' ? 'narrador' : (n.description?.trim() || 'indicación'))}
        onClose={() => setOpenMoment(null)}
        onSave={(patch) => (open ? p.onMomentEdit(open.id, patch) : Promise.resolve())}
        onMove={(dir) => (open ? move(open.id, dir) : Promise.resolve())}
        onDelete={async () => { if (open) { await p.onDeleteNode(open.id); setOpenMoment(null); } }}
        onConnect={p.onConnect}
        onEdgeDelete={p.onEdgeDelete}
      />

      {/* Hoja: la escena. */}
      <Sheet open={sceneOpen} onOpenChange={(o) => !o && setSceneOpen(false)}>
        <SheetContent side="bottom" className="h-[90dvh] p-0 flex flex-col rounded-t-2xl">
          <SheetTitle className="sr-only">La escena</SheetTitle>
          <div className="shrink-0 px-4 pt-4 pb-2 border-b border-border/70 pr-12"><span className={label} style={labelStyle}>La escena</span></div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-5 pb-[max(16px,env(safe-area-inset-bottom))]">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="scene-place" className={label} style={labelStyle}>Lugar</label>
              <select id="scene-place" value={location?.location_node_id ?? ''} onChange={(e) => { const id = Number(e.target.value); if (id) void p.onAddLocation(id); }} className="h-12 rounded-lg border border-border bg-card px-3 text-base">
                <option value="">Sin lugar</option>
                {p.locationOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
              {place?.rule && <div className="text-[13px] text-muted-foreground italic">Aquí siempre: {place.rule}</div>}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-baseline justify-between">
                <span className={label} style={labelStyle}>Personajes</span>
                <select aria-label="Añadir del reparto" value="" onChange={(e) => { const id = Number(e.target.value); if (id) void p.onAddCharacter(id); }} className="h-9 rounded-md border border-border bg-card px-2 text-sm text-[#9a3412]">
                  <option value="">+ del reparto</option>
                  {p.castOptions.filter((o) => !characters.some((c) => c.character_id === o.id)).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </div>
              {characters.length === 0 && <p className="text-sm text-muted-foreground italic">Nadie todavía. Añade a quien esté en la escena.</p>}
              {characters.map((c) => {
                const carry = c.character_id != null ? p.carryByCharID[c.character_id] : undefined;
                const state = c.character_id != null ? p.stateByCharID[c.character_id] : undefined;
                return (
                  <div key={c.id} className="rounded-xl border border-[#f1c7b0] bg-card px-3 py-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="font-display text-[18px]">{charName(c)}</span>
                      <button type="button" onClick={() => void p.onDeleteNode(c.id)} className="min-h-9 text-xs text-muted-foreground">quitar</button>
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {carry?.from_scene_id ? `Viene de «${carry.from_scene_title || 'escena sin título'}»${carry.last_moment ? `: ${carry.last_moment}` : ''}` : 'Primera vez en la historia'}
                    </div>
                    {state && <StateBlock state={state} inCast actions={p.stateActions} />}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className={label} style={labelStyle}>Narrador</span>
                {!narrator && <button type="button" onClick={() => void p.onAddNarrator()} className="min-h-9 text-sm text-primary">+ narrador</button>}
              </div>
              {narrator ? (
                <div className="rounded-lg border border-border bg-card px-3 py-2.5 text-sm flex items-center justify-between gap-2">
                  <span>{[narrator.narrator_config?.pov, narrator.narrator_config?.style, narrator.narrator_config?.distance].filter(Boolean).join(' · ')}</span>
                  <button type="button" onClick={() => void p.onDeleteNode(narrator.id)} className="min-h-9 text-xs text-muted-foreground">quitar</button>
                </div>
              ) : <p className="text-sm text-muted-foreground italic">El de la historia.</p>}
              <p className="text-xs text-muted-foreground">Los ajustes finos del narrador se cambian en el ordenador.</p>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between">
                <span className={label} style={labelStyle}>Indicaciones</span>
                <button type="button" onClick={() => void p.onAddDirection()} className="min-h-9 text-sm text-primary">+ indicación</button>
              </div>
              {directions.length === 0 && <p className="text-sm text-muted-foreground italic">Cómo quieres que se escriba: suelta vale para toda la escena.</p>}
              {directions.map((d) => (
                <DirectionRow key={d.id} node={d} onSave={(text) => p.onMomentEdit(d.id, { description: text })} onDelete={() => p.onDeleteNode(d.id)} />
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Hoja: la prosa, a pantalla completa, con modo Corregir. */}
      <ProseSheet
        open={proseOpen}
        onClose={() => setProseOpen(false)}
        output={output}
        sceneTitle={p.sceneTitle}
        pastedText={p.pastedText}
        onPastedTextChange={p.onPastedTextChange}
        onSaveProse={p.onSaveProse}
        onCopySheet={p.onCopySheet}
      />
    </div>
  );
}

function ArrivalCard({ arrival: a, actions, busy }: { arrival: Arrival; actions: ArrivalActions; busy: boolean }) {
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(a.step);
  useEffect(() => { setStep(a.step); }, [a.step]);
  return (
    <div className="rounded-xl border-[1.5px] border-dashed border-amber-600 bg-amber-50 px-3.5 py-3 flex flex-col gap-2">
      <div className="text-[11px] tracking-[0.18em] uppercase text-amber-800" style={labelStyle}>Llegada · {a.name} · de {a.from}</div>
      {a.pending ? (
        <div className="text-sm text-muted-foreground italic">Redactando la llegada…</div>
      ) : editing ? (
        <textarea value={step} onChange={(e) => setStep(e.target.value)} rows={3} className="w-full rounded-lg border border-border bg-card px-3 py-2 font-display text-[16px] leading-snug" />
      ) : (
        <div className="font-display text-[17px] leading-snug">{a.step || <span className="italic text-muted-foreground">Sin paso</span>}</div>
      )}
      {a.warning && <div className="text-xs text-amber-800">{a.warning}</div>}
      {a.outcomes.map((o) => <div key={o} className="text-[13px] text-muted-foreground">→ {o}</div>)}
      <div className="grid grid-cols-4 gap-1.5 mt-0.5">
        <button type="button" disabled={busy || a.pending} onClick={() => void actions.accept(a.character_id, editing ? { step, outcomes: a.outcomes } : undefined)} className="min-h-11 rounded-lg bg-amber-700 text-white font-semibold disabled:opacity-50">Aceptar</button>
        <button type="button" disabled={busy || a.pending} onClick={() => setEditing((v) => !v)} className="min-h-11 rounded-lg border border-border bg-card disabled:opacity-50">{editing ? 'Ver' : 'Editar'}</button>
        <button type="button" disabled={busy || a.pending} onClick={() => void actions.again(a.character_id)} className="min-h-11 rounded-lg border border-border bg-card disabled:opacity-50">Otra</button>
        <button type="button" disabled={busy} onClick={() => void actions.dismiss(a.character_id)} className="min-h-11 rounded-lg border border-border bg-card text-muted-foreground disabled:opacity-50">Quitar</button>
      </div>
    </div>
  );
}

function DirectionRow({ node, onSave, onDelete }: { node: SceneNode; onSave: (text: string) => Promise<void>; onDelete: () => Promise<void> }) {
  const [text, setText] = useState(node.description ?? '');
  useEffect(() => { setText(node.description ?? ''); }, [node.description]);
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 flex flex-col gap-1">
      <textarea value={text} onChange={(e) => setText(e.target.value)} onBlur={() => { if (text !== (node.description ?? '')) void onSave(text); }} rows={2} placeholder="Cómo quieres que se escriba" className="w-full bg-transparent text-base leading-snug resize-none" />
      <div className="flex justify-between">
        <button type="button" onClick={() => { if (text !== (node.description ?? '')) void onSave(text); }} className="min-h-9 text-xs text-primary">guardar</button>
        <button type="button" onClick={() => void onDelete()} className="min-h-9 text-xs text-muted-foreground">quitar</button>
      </div>
    </div>
  );
}

function MomentSheet({ moment, index, count, branched, unmet, attachable, attached, edgeFor, nameOf, onClose, onSave, onMove, onDelete, onConnect, onEdgeDelete }: {
  moment: SceneNode | null;
  index: number;
  count: number;
  branched: boolean;
  unmet: string[];
  attachable: SceneNode[];
  attached: number[];
  edgeFor: (fromId: number) => SceneNodeEdge | undefined;
  nameOf: (n: SceneNode) => string;
  onClose: () => void;
  onSave: (patch: { description?: string; outcomes?: string[] }) => Promise<void>;
  onMove: (dir: -1 | 1) => Promise<void>;
  onDelete: () => Promise<void>;
  onConnect: (fromId: number, toId: number, kind: SceneEdgeKind) => Promise<void>;
  onEdgeDelete: (id: number) => Promise<void>;
}) {
  const [text, setText] = useState('');
  const [after, setAfter] = useState('');
  useEffect(() => {
    setText(moment?.description ?? '');
    setAfter((moment?.outcomes ?? []).join('\n'));
  }, [moment?.id, moment?.description, moment?.outcomes]);
  const save = async () => {
    if (!moment) return;
    const outcomes = after.split('\n').map((s) => s.trim()).filter(Boolean);
    const patch: { description?: string; outcomes?: string[] } = {};
    if (text !== (moment.description ?? '')) patch.description = text;
    if (outcomes.join('\n') !== (moment.outcomes ?? []).join('\n')) patch.outcomes = outcomes;
    if (Object.keys(patch).length) await onSave(patch);
  };
  const close = async () => { await save(); onClose(); };
  const toggle = async (n: SceneNode) => {
    if (!moment) return;
    const e = edgeFor(n.id);
    if (e) await onEdgeDelete(e.id); else await onConnect(n.id, moment.id, 'attachment');
  };
  const notSeen = (moment?.outcomes ?? []).filter((o) => unmet.includes(o));
  return (
    <Sheet open={!!moment} onOpenChange={(o) => { if (!o) void close(); }}>
      <SheetContent side="bottom" className="h-[88dvh] p-0 flex flex-col rounded-t-2xl">
        <SheetTitle className="sr-only">Evento {index}</SheetTitle>
        <div className="shrink-0 flex items-center justify-between px-4 pt-3 pb-2 border-b border-border/70 pr-12">
          <div className="flex items-baseline gap-2.5">
            <span className="font-display italic text-entity-scene-muted text-lg">{roman(index)}</span>
            <span className={label} style={labelStyle}>Evento</span>
            {branched && <span className="text-[11px] text-amber-700">con rama</span>}
          </div>
          <button type="button" onClick={() => void close()} className="min-h-11 px-3 font-semibold text-primary">Listo</button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="moment-text" className={label} style={labelStyle}>Qué pasa</label>
            <textarea id="moment-text" value={text} onChange={(e) => setText(e.target.value)} onBlur={() => void save()} rows={3} className="w-full rounded-lg border border-border bg-card px-3 py-2.5 font-display text-[17px] leading-snug resize-none" placeholder="Olga sorprende a Rufo asaltando a Ezequías." />
          </div>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="moment-after" className={label} style={labelStyle}>Después, es verdad que… <span className="normal-case tracking-normal">(una por línea)</span></label>
            <textarea id="moment-after" value={after} onChange={(e) => setAfter(e.target.value)} onBlur={() => void save()} rows={3} className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-base leading-snug resize-none" placeholder="Rufo huye hacia el mesón" />
            {notSeen.map((o) => <div key={o} className="text-[13px] text-red-700">✗ «{o}»: el juez no lo vio en la prosa.</div>)}
          </div>
          <div className="flex flex-col gap-2">
            <span className={label} style={labelStyle}>Quién actúa</span>
            {attachable.length === 0 && <p className="text-sm text-muted-foreground italic">Añade personajes a la escena primero.</p>}
            <div className="flex flex-wrap gap-2">
              {attachable.map((n) => {
                const on = attached.includes(n.id);
                return (
                  <button key={n.id} type="button" aria-pressed={on} onClick={() => void toggle(n)} className={`min-h-10 px-3.5 rounded-full border text-[15px] ${on ? 'border-[#c2410c] bg-[#fff7ed] text-[#9a3412]' : 'border-border bg-card text-muted-foreground'}`}>
                    {nameOf(n)}{on ? ' ✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        <div className="shrink-0 border-t border-border/70 grid grid-cols-3 gap-1 px-2 pt-1 pb-[max(12px,env(safe-area-inset-bottom))]">
          <button type="button" disabled={branched || index <= 1} onClick={() => void onMove(-1)} className="min-h-12 flex flex-col items-center justify-center text-xs disabled:opacity-40"><ChevronUp className="w-5 h-5" />Subir</button>
          <button type="button" disabled={branched || index >= count} onClick={() => void onMove(1)} className="min-h-12 flex flex-col items-center justify-center text-xs disabled:opacity-40"><ChevronDown className="w-5 h-5" />Bajar</button>
          <button type="button" onClick={() => void onDelete()} className="min-h-12 flex flex-col items-center justify-center text-xs text-muted-foreground"><Trash2 className="w-5 h-5" />Eliminar</button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ProseSheet({ open, onClose, output, sceneTitle, pastedText, onPastedTextChange, onSaveProse, onCopySheet }: {
  open: boolean;
  onClose: () => void;
  output: OutputNodeData;
  sceneTitle?: string;
  pastedText: string;
  onPastedTextChange: (t: string) => void;
  onSaveProse: () => Promise<void>;
  onCopySheet?: () => Promise<void>;
}) {
  const [fixing, setFixing] = useState(false);
  const [menu, setMenu] = useState(false);
  useEffect(() => { if (!open) { setFixing(false); setMenu(false); } }, [open]);
  const startFixing = () => { onPastedTextChange(output.prose); setFixing(true); setMenu(false); };
  const save = async () => { await onSaveProse(); setFixing(false); };
  const n = words(output.prose);
  let body: ReactNode;
  if (fixing) {
    body = <textarea value={pastedText} onChange={(e) => onPastedTextChange(e.target.value)} disabled={output.generating} className="w-full h-full resize-none bg-transparent px-4 py-3 font-display text-[17px] leading-[1.75]" style={{ fontSize: 17 }} />;
  } else if (output.prose) {
    body = <SceneProseView content={output.prose} />;
  } else {
    body = <div className="px-4 py-8 text-muted-foreground font-display italic">Aún no hay prosa. Escribe la escena desde el taller o pega una escrita fuera.</div>;
  }
  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o && !output.generating) onClose(); }}>
      <SheetContent side="bottom" className="h-[100dvh] p-0 flex flex-col rounded-none [&>button]:hidden">
        <SheetTitle className="sr-only">Prosa de la escena</SheetTitle>
        <div className="shrink-0 flex items-center gap-1 px-1 py-2 border-b border-border/70">
          <button type="button" onClick={onClose} disabled={output.generating} className="w-11 h-11 inline-flex items-center justify-center text-muted-foreground" aria-label="Volver al taller"><ChevronLeft className="w-6 h-6" /></button>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] tracking-[0.18em] uppercase text-entity-scene-muted" style={labelStyle}>Prosa{n > 0 ? ` · ${n}` : ''}{output.live ? ' · en marcha' : ''}</div>
            <div className="font-display text-[20px] leading-tight truncate">{sceneTitle || 'Escena'}</div>
          </div>
          <div className="[&_button]:min-h-10">{output.versions}</div>
          <button type="button" onClick={() => setMenu((v) => !v)} className="w-11 h-11 inline-flex items-center justify-center text-muted-foreground" aria-label="Más acciones"><MoreHorizontal className="w-5 h-5" /></button>
        </div>
        {menu && (
          <div className="shrink-0 border-b border-border/70 bg-card flex flex-col">
            <button type="button" onClick={() => { void output.onCopy(); setMenu(false); }} className="min-h-12 px-4 text-left">Copiar la prosa</button>
            {onCopySheet && <button type="button" onClick={() => { void onCopySheet(); setMenu(false); }} className="min-h-12 px-4 text-left">Copiar la hoja para otro modelo</button>}
            <button type="button" onClick={() => { onPastedTextChange(''); setFixing(true); setMenu(false); }} className="min-h-12 px-4 text-left">Pegar una prosa escrita fuera</button>
          </div>
        )}
        {output.unmet.length > 0 && !fixing && (
          <div className="shrink-0 mx-4 mt-2 border-l-[3px] border-red-700 bg-red-50 rounded-r-lg px-3 py-2 text-[13px] text-red-800">El juez no ve: {output.unmet.map((u) => `«${u}»`).join(', ')}.</div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto">{body}</div>
        <div className="shrink-0 flex items-center justify-between gap-2 border-t border-border/70 px-4 py-2 pb-[max(8px,env(safe-area-inset-bottom))]">
          {fixing ? (
            <>
              <span className="text-[13px] text-muted-foreground truncate">{output.generating ? (output.progress || 'comprobando…') : 'Corrigiendo'}</span>
              <div className="flex gap-2">
                <button type="button" onClick={() => setFixing(false)} disabled={output.generating} className="min-h-11 px-3 text-sm text-muted-foreground">Cancelar</button>
                <button type="button" onClick={() => void save()} disabled={output.generating || !pastedText.trim()} className="min-h-11 px-4 rounded-lg bg-primary text-primary-foreground font-semibold disabled:opacity-50">Guardar versión</button>
              </div>
            </>
          ) : (
            <>
              <span className="text-[13px] text-muted-foreground truncate">{output.generating ? (output.progress || 'escribiendo…') : 'Al guardar, el juez comprueba lo declarado.'}</span>
              <button type="button" onClick={startFixing} disabled={output.generating || !output.prose} className="min-h-11 px-4 rounded-lg border border-border bg-card font-semibold disabled:opacity-50">Corregir</button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

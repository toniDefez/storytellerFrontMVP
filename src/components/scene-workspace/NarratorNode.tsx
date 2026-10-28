import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useState } from 'react';
import { NodeCard } from './NodeCard';
import { NODE_COLORS } from './nodeColors';
import type { NarratorNodeConfig } from '../../services/api';

export interface NarratorNodeData extends Record<string, unknown> {
  pov: string;
  style: string;
  distance: string;
  reliability: string;
  focus_character_id?: number | null;
  views?: { character_id: number; text: string }[];
  focusName?: string;
  /** El reparto de la escena: quién puede narrar y a quién se mira. */
  cast?: { id: number; name: string }[];
  /** Lo que dicen las relaciones de cómo ve quien narra a cada uno. */
  hints?: Record<number, string>;
  onChange?: (patch: Partial<NarratorNodeConfig>) => void;
}

const POV_OPTIONS = ['1st', '3rd-limited', '3rd-omniscient'] as const;
const POV_LABEL: Record<string, string> = {
  '1st': 'Primera persona', '3rd-limited': 'Tercera, pegada a alguien', '3rd-omniscient': 'Tercera omnisciente',
};
const STYLE_OPTIONS = ['sparse', 'lyrical', 'journalistic', 'clinical'] as const;
const DISTANCE_OPTIONS = ['intimate', 'observational', 'detached'] as const;

// Quien narra es uno de los personajes y ve a los demás a su manera (Toni,
// 2026-10-28: "meter a dos personajes y cómo uno ve al otro"). La mirada es
// lo que da color a un personaje en la prosa; describir cómo habla solo daba
// tics (tres pruebas a ciegas).
export function NarratorNode({ data, selected }: NodeProps<Node<NarratorNodeData>>) {
  const [open, setOpen] = useState(false);
  const cast = data.cast ?? [];
  const focus = data.pov === '3rd-omniscient' ? undefined : (data.focus_character_id ?? undefined);
  const focusName = focus ? cast.find((c) => c.id === focus)?.name : undefined;
  const others = focus ? cast.filter((c) => c.id !== focus) : [];
  const viewOf = (id: number) => data.views?.find((v) => v.character_id === id)?.text ?? '';
  const setView = (id: number, text: string) => {
    const rest = (data.views ?? []).filter((v) => v.character_id !== id);
    data.onChange?.({ views: text ? [...rest, { character_id: id, text }] : rest });
  };

  return (
    <NodeCard label="Narrador" color={NODE_COLORS.narrator} width={280} selected={selected}
      aside={<button className="nodrag" onClick={() => setOpen(!open)} style={{ fontSize: 13, color: '#5b21b6', background: 'none', border: 0, cursor: 'pointer' }}>{open ? 'cerrar' : 'editar'}</button>}>
      <div style={{ fontSize: 14 }}>
        {focusName ? `Narra ${focusName}` : 'Narra nadie en concreto'} · {POV_LABEL[data.pov] ?? data.pov}
      </div>
      {!open && others.map((c) => viewOf(c.id) && (
        <div key={c.id} style={{ fontSize: 13, color: '#5f5868' }}>Ve a {c.name}: {viewOf(c.id)}</div>
      ))}
      {open && (
        <div className="nodrag" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          <label style={row}>
            Narra
            <select value={focus ?? ''} onChange={(e) => data.onChange?.({ focus_character_id: e.target.value ? Number(e.target.value) : null })} style={selectStyle}>
              <option value="">nadie en concreto</option>
              {cast.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <Select label="Persona" value={data.pov} options={POV_OPTIONS} labels={POV_LABEL} onChange={(v) => data.onChange?.({ pov: v })} />
          <Select label="Estilo" value={data.style} options={STYLE_OPTIONS} onChange={(v) => data.onChange?.({ style: v })} />
          <Select label="Distancia" value={data.distance} options={DISTANCE_OPTIONS} onChange={(v) => data.onChange?.({ distance: v })} />
          {cast.length > 0 && !focus && data.pov !== '3rd-omniscient' && (
            <div style={{ fontSize: 12, color: '#5f5868' }}>Elige quién narra para decir cómo ve a los demás.</div>
          )}
          {others.map((c) => (
            <ViewField key={c.id} who={focusName ?? ''} name={c.name} value={viewOf(c.id)} hint={data.hints?.[c.id]} onSave={(t) => setView(c.id, t)} />
          ))}
        </div>
      )}
      <Handle type="source" position={Position.Right} id="attach" style={{ background: '#6b6371', width: 12, height: 12 }} />
    </NodeCard>
  );
}

// Se guarda al salir del campo: guardar en cada tecla mandaba una petición por
// letra.
function ViewField({ who, name, value, hint, onSave }: { who: string; name: string; value: string; hint?: string; onSave: (t: string) => void }) {
  const [text, setText] = useState(value);
  const save = (t: string) => { if (t.trim() !== value) onSave(t.trim()); };
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
      Cómo ve {who} a {name}
      <textarea rows={2} value={text} onChange={(e) => setText(e.target.value)} onBlur={() => save(text)}
        placeholder="En qué se fija, qué le parece, qué le molesta…"
        style={{ fontSize: 13, padding: 6, borderRadius: 6, border: '1px solid #ddd5cb', resize: 'vertical', fontFamily: 'inherit' }} />
      {hint && !text.trim() && (
        <button type="button" onClick={() => { setText(hint); save(hint); }}
          style={{ alignSelf: 'flex-start', fontSize: 12, color: '#5b21b6', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 6, padding: '2px 6px', cursor: 'pointer', textAlign: 'left' }}>
          Usar la relación: {hint}
        </button>
      )}
    </label>
  );
}

function Select({ label, value, options, labels, onChange }: { label: string; value: string; options: readonly string[]; labels?: Record<string, string>; onChange: (v: string) => void }) {
  return (
    <label style={row}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={selectStyle}>
        {options.map((o) => <option key={o} value={o}>{labels?.[o] ?? o}</option>)}
      </select>
    </label>
  );
}

const row = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, gap: 6 } as const;
const selectStyle = { fontSize: 13, padding: '2px 4px' } as const;

import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useState } from 'react';
import type { Arrival } from '../../services/api';

// El nodo fantasma de «La llegada» (2026-10-30). Un personaje entra en la
// escena viniendo de otro lugar por un camino del mapa; el backend calcula
// qué le cuesta el umbral y lo propone aquí como un paso que el autor acepta,
// edita, pide otro o descarta. Misma anatomía que un evento, borde
// discontinuo y apagado: no entra en la escena hasta aceptarlo.

export interface ArrivalNodeActions {
  accept: (characterId: number, edit?: { step: string; outcomes: string[] }) => Promise<void>;
  dismiss: (characterId: number) => Promise<void>;
  again: (characterId: number) => Promise<void>;
}

export interface ArrivalNodeData extends Record<string, unknown> {
  arrival: Arrival;
  actions?: ArrivalNodeActions;
  /** Una acción en curso: todo deshabilitado. */
  busy: boolean;
}

export function ArrivalNode({ data, selected }: NodeProps<Node<ArrivalNodeData>>) {
  const { arrival: a, actions, busy } = data;
  const [editing, setEditing] = useState(false);
  const [step, setStep] = useState(a.step);
  const [outs, setOuts] = useState(a.outcomes.join('\n'));
  const canAccept = !busy && !a.pending && (a.step !== '' || editing);

  const save = () => {
    const text = step.trim();
    if (!text || !actions) return;
    setEditing(false);
    void actions.accept(a.character_id, { step: text, outcomes: outs.split('\n').map((l) => l.trim()).filter(Boolean) });
  };

  return (
    <div style={{
      background: '#fff', border: `2px dashed ${selected ? '#0e7490' : '#7fb8c2'}`, opacity: selected ? 1 : 0.6,
      borderRadius: 12, width: 300, boxSizing: 'border-box', fontSize: 15, lineHeight: 1.45, color: '#1e1a24',
    }}>
      <Handle type="target" position={Position.Left} id="attach-in" style={{ background: '#c2410c', width: 12, height: 12, opacity: 0.6 }} isConnectable={false} />
      <div style={{ padding: '8px 12px', borderBottom: '1px dashed #dceff2', display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0e6470', minWidth: 0 }}>
          Llegada · {a.name} · {a.from} → {a.to}
        </span>
        <span style={{ fontSize: 11, padding: '1px 6px', borderRadius: 999, background: '#fef3c7', color: '#92400e', whiteSpace: 'nowrap' }}>Propuesta</span>
      </div>
      <div style={{ padding: '10px 12px' }}>
        {a.warning && <div style={{ fontSize: 13, color: '#b91c1c', marginBottom: 6 }}>{a.warning}</div>}
        {editing ? (
          <textarea
            className="nodrag"
            autoFocus
            value={step}
            onChange={(e) => setStep(e.target.value)}
            rows={3}
            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none', resize: 'vertical', fontSize: 15, fontFamily: 'inherit', lineHeight: 1.45 }}
          />
        ) : (
          <div style={{ whiteSpace: 'pre-wrap', minHeight: 40 }}>
            {a.pending ? <span style={{ color: '#6b6371' }}>calculando…</span> : a.step}
          </div>
        )}
        <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: '#f6f2ec', fontSize: 14 }}>
          <div style={{ color: '#5f5868', fontWeight: 600, fontSize: 12, marginBottom: 2 }}>Después</div>
          {editing ? (
            <textarea
              className="nodrag"
              value={outs}
              onChange={(e) => setOuts(e.target.value)}
              rows={2}
              placeholder="Una por línea"
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none', resize: 'vertical', fontSize: 14, fontFamily: 'inherit' }}
            />
          ) : (
            <>
              {a.outcomes.length === 0 && <span style={{ color: '#6b6371' }}>nada</span>}
              {a.outcomes.map((o) => <div key={o}>→ {o}</div>)}
            </>
          )}
        </div>
        <div className="nodrag" style={{ display: 'flex', gap: 6, marginTop: 10, flexWrap: 'wrap' }}>
          {editing ? (
            <>
              <button type="button" onClick={save} disabled={busy || !step.trim()} style={primary}>Guardar</button>
              <button type="button" onClick={() => { setEditing(false); setStep(a.step); setOuts(a.outcomes.join('\n')); }} style={secondary}>Cancelar</button>
            </>
          ) : (
            <>
              <button type="button" onClick={() => void actions?.accept(a.character_id)} disabled={!canAccept} style={primary}>Aceptar</button>
              <button type="button" onClick={() => { setStep(a.step); setOuts(a.outcomes.join('\n')); setEditing(true); }} disabled={busy || a.pending} style={secondary}>Editar</button>
              <button type="button" onClick={() => void actions?.again(a.character_id)} disabled={busy || a.pending || !a.route} style={secondary}>Otra</button>
              <button type="button" onClick={() => void actions?.dismiss(a.character_id)} disabled={busy} style={secondary}>Descartar</button>
            </>
          )}
        </div>
      </div>
      <div style={{ padding: '6px 12px', borderTop: '1px dashed #dceff2', fontSize: 12, color: '#5f5868' }}>
        No entra en la escena hasta aceptarla
      </div>
      <Handle type="source" position={Position.Bottom} id="flow-out" style={{ background: '#0e7490', width: 12, height: 12, opacity: 0.6 }} isConnectable={false} />
    </div>
  );
}

const primary = {
  height: 32, padding: '0 12px', border: 'none', borderRadius: 8,
  background: '#0e7490', color: '#fff', fontSize: 14, cursor: 'pointer',
} as const;

const secondary = {
  height: 32, padding: '0 10px', border: '1px solid #ddd5cb', borderRadius: 8,
  background: '#fff', color: '#1e1a24', fontSize: 14, cursor: 'pointer',
} as const;

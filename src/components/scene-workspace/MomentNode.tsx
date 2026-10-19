import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useState, useCallback } from 'react';

export interface MomentNodeData extends Record<string, unknown> {
  description: string;
  /** Lo que es cierto después del momento: el contrato que la prosa debe cumplir. */
  outcomes?: string[];
  /** Salidas que la última prosa generada no muestra. */
  unmet?: string[];
  hasNarratorOverride?: boolean;
  hasActiveCharOverride?: boolean;
  onChange?: (description: string) => void;
  onOutcomesChange?: (outcomes: string[]) => void;
}

export function MomentNode({ data, selected }: NodeProps<Node<MomentNodeData>>) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(data.description);

  const commit = useCallback(() => {
    setEditing(false);
    if (text !== data.description) data.onChange?.(text);
  }, [text, data]);

  const outcomes = data.outcomes ?? [];
  const [editingOutcomes, setEditingOutcomes] = useState(false);
  const [outcomesText, setOutcomesText] = useState(outcomes.join('\n'));

  const commitOutcomes = useCallback(() => {
    setEditingOutcomes(false);
    const next = outcomesText.split('\n').map((l) => l.trim()).filter(Boolean);
    if (next.join('\n') !== (data.outcomes ?? []).join('\n')) data.onOutcomesChange?.(next);
  }, [outcomesText, data]);

  return (
    <div style={{
      background: '#fff', border: `2px solid ${selected ? '#7c3aed' : '#9ca3af'}`,
      borderRadius: 8, padding: 10, minWidth: 240, maxWidth: 320, fontSize: 13,
    }}>
      <Handle type="target" position={Position.Top} id="flow-in" style={{ background: '#9ca3af' }} />
      <Handle type="target" position={Position.Left} id="attach-in" style={{ background: '#a78bfa' }} />
      {editing ? (
        <textarea
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          rows={3}
          style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontSize: 13, fontFamily: 'inherit' }}
        />
      ) : (
        <div onDoubleClick={() => setEditing(true)} style={{ whiteSpace: 'pre-wrap', cursor: 'text', minHeight: 36 }}>
          {data.description || <span style={{ color: '#9ca3af' }}>Doble click para editar…</span>}
        </div>
      )}
      <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px dashed #e5e7eb', fontSize: 11 }}>
        <div style={{ color: '#6b7280', fontWeight: 600, marginBottom: 2 }}
          title="Lo que tiene que ser cierto cuando acaba el momento. El cómo ocurre lo decide el modelo.">
          Después
        </div>
        {editingOutcomes ? (
          <textarea
            autoFocus
            value={outcomesText}
            onChange={(e) => setOutcomesText(e.target.value)}
            onBlur={commitOutcomes}
            rows={3}
            placeholder="Una por línea: El lobo se ha tragado a la abuela"
            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none', resize: 'vertical', fontSize: 11, fontFamily: 'inherit' }}
          />
        ) : (
          <div onDoubleClick={() => { setOutcomesText(outcomes.join('\n')); setEditingOutcomes(true); }} style={{ cursor: 'text', minHeight: 16 }}>
            {outcomes.length === 0 && <span style={{ color: '#9ca3af' }}>Doble click: qué es cierto después…</span>}
            {outcomes.map((o) => {
              const unmet = data.unmet?.includes(o);
              return (
                <div key={o} style={{ color: unmet ? '#b91c1c' : '#374151' }}
                  title={unmet ? 'La última prosa generada no lo muestra' : undefined}>
                  {unmet ? '✗' : '→'} {o}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, marginTop: 6, fontSize: 10 }}>
        {data.hasNarratorOverride && <span style={{ background: '#ede9fe', padding: '1px 6px', borderRadius: 4 }}>narrador ✦</span>}
        {data.hasActiveCharOverride && <span style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: 4 }}>activo ●</span>}
      </div>
      <Handle type="source" position={Position.Bottom} id="flow-out" style={{ background: '#9ca3af' }} />
    </div>
  );
}

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
      background: '#fff', border: `2px solid ${selected ? '#0e7490' : '#7fb8c2'}`,
      borderRadius: 12, width: 300, boxSizing: 'border-box', fontSize: 15, lineHeight: 1.45, color: '#1e1a24',
    }}>
      <Handle type="target" position={Position.Top} id="flow-in" style={{ background: '#0e7490', width: 12, height: 12 }} />
      <Handle type="target" position={Position.Left} id="attach-in" style={{ background: '#c2410c', width: 12, height: 12 }} />
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #dceff2', fontSize: 12, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#0e6470' }}>
        Evento
      </div>
      <div style={{ padding: '10px 12px' }}>
      {editing ? (
        <textarea
          className="nodrag"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          rows={4}
          style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontSize: 15, fontFamily: 'inherit', lineHeight: 1.45 }}
        />
      ) : (
        <div onDoubleClick={() => setEditing(true)} style={{ whiteSpace: 'pre-wrap', cursor: 'text', minHeight: 40 }}>
          {data.description || <span style={{ color: '#6b6371' }}>Doble clic: qué pasa en este evento…</span>}
        </div>
      )}
      <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: '#f6f2ec', fontSize: 14 }}>
        <div style={{ color: '#5f5868', fontWeight: 600, fontSize: 12, marginBottom: 2 }}
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
            className="nodrag"
            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: 4, outline: 'none', resize: 'vertical', fontSize: 14, fontFamily: 'inherit' }}
          />
        ) : (
          <div onDoubleClick={() => { setOutcomesText(outcomes.join('\n')); setEditingOutcomes(true); }} style={{ cursor: 'text', minHeight: 18 }}>
            {outcomes.length === 0 && <span style={{ color: '#6b6371' }}>Doble clic: qué es cierto después…</span>}
            {outcomes.map((o) => {
              // El juez recibe las líneas de control (§) sin la marca.
              const unmet = data.unmet?.includes(o.replace(/^\s*§\s*/, '').trim());
              return (
                <div key={o} style={{ color: unmet ? '#b91c1c' : '#1e1a24' }}
                  title={unmet ? 'La última prosa generada no lo muestra' : undefined}>
                  {unmet ? '✗' : '→'} {o}
                </div>
              );
            })}
          </div>
        )}
      </div>
      </div>
      <Handle type="source" position={Position.Bottom} id="flow-out" style={{ background: '#0e7490', width: 12, height: 12 }} />
      <Handle type="source" position={Position.Right} id="out" style={{ background: '#0e7490', width: 12, height: 12, opacity: 0 }} isConnectable={false} />
    </div>
  );
}

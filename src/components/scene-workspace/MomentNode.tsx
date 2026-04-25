import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useState, useCallback } from 'react';

export interface MomentNodeData extends Record<string, unknown> {
  description: string;
  hasNarratorOverride?: boolean;
  hasActiveCharOverride?: boolean;
  onChange?: (description: string) => void;
}

export function MomentNode({ data, selected }: NodeProps<Node<MomentNodeData>>) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(data.description);

  const commit = useCallback(() => {
    setEditing(false);
    if (text !== data.description) data.onChange?.(text);
  }, [text, data]);

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
      <div style={{ display: 'flex', gap: 6, marginTop: 6, fontSize: 10 }}>
        {data.hasNarratorOverride && <span style={{ background: '#ede9fe', padding: '1px 6px', borderRadius: 4 }}>narrador ✦</span>}
        {data.hasActiveCharOverride && <span style={{ background: '#fef3c7', padding: '1px 6px', borderRadius: 4 }}>activo ●</span>}
      </div>
      <Handle type="source" position={Position.Bottom} id="flow-out" style={{ background: '#9ca3af' }} />
    </div>
  );
}

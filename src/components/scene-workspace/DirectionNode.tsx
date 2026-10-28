import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useCallback, useState } from 'react';
import { NodeCard } from './NodeCard';
import { NODE_COLORS } from './nodeColors';

// Una indicación del autor para quien escribe ("frases cortas", "que la
// niebla se sienta fría"): la entrada tipo prompt del grafo. Conectada a un
// evento vale para él; suelta, para toda la escena.
export interface DirectionNodeData extends Record<string, unknown> {
  text: string;
  onChange?: (text: string) => void;
}

export function DirectionNode({ data, selected }: NodeProps<Node<DirectionNodeData>>) {
  const [editing, setEditing] = useState(!data.text);
  const [text, setText] = useState(data.text);
  const commit = useCallback(() => {
    setEditing(false);
    if (text !== data.text) data.onChange?.(text.trim());
  }, [text, data]);

  return (
    <NodeCard label="Indicación" color={NODE_COLORS.direction} width={240} selected={selected}>
      {editing ? (
        <textarea
          className="nodrag"
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          rows={3}
          placeholder="Cómo quieres que se escriba: tono, ritmo, qué evitar…"
          aria-label="Indicación para quien escribe"
          style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontSize: 15, fontFamily: 'inherit', lineHeight: 1.45 }}
        />
      ) : (
        <div onDoubleClick={() => setEditing(true)} style={{ whiteSpace: 'pre-wrap', cursor: 'text', minHeight: 40 }}>
          {data.text || <span style={{ color: '#6b6371' }}>Doble clic: cómo quieres que se escriba…</span>}
        </div>
      )}
      <Handle type="source" position={Position.Right} id="attach" style={{ background: '#6b6371', width: 12, height: 12 }} />
    </NodeCard>
  );
}

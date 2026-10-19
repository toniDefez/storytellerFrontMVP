import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useState } from 'react';

export interface NarratorNodeData extends Record<string, unknown> {
  pov: string;
  style: string;
  distance: string;
  reliability: string;
  focusName?: string;
  onChange?: (patch: Partial<{ pov: string; style: string; distance: string; reliability: string }>) => void;
}

const POV_OPTIONS = ['1st', '3rd-limited', '3rd-omniscient'] as const;
const STYLE_OPTIONS = ['sparse', 'lyrical', 'journalistic', 'clinical'] as const;
const DISTANCE_OPTIONS = ['intimate', 'observational', 'detached'] as const;

export function NarratorNode({ data }: NodeProps<Node<NarratorNodeData>>) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: '#ede9fe', border: '1px solid #7c3aed', borderRadius: 8,
      padding: '8px 12px', minWidth: 180, fontSize: 12,
    }}>
      <div style={{ fontWeight: 600 }}>🎙 Narrador</div>
      <div style={{ color: '#5b21b6', fontSize: 11 }}>
        {data.pov} · {data.style} · {data.distance}
        {data.focusName ? ` · focus: ${data.focusName}` : ''}
      </div>
      <button onClick={() => setOpen(!open)} style={{ marginTop: 4, fontSize: 10 }}>
        {open ? 'cerrar' : 'editar'}
      </button>
      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 6 }}>
          <Select label="POV" value={data.pov} options={POV_OPTIONS as readonly string[]} onChange={(v) => data.onChange?.({ pov: v })} />
          <Select label="Style" value={data.style} options={STYLE_OPTIONS as readonly string[]} onChange={(v) => data.onChange?.({ style: v })} />
          <Select label="Dist" value={data.distance} options={DISTANCE_OPTIONS as readonly string[]} onChange={(v) => data.onChange?.({ distance: v })} />
        </div>
      )}
      <Handle type="source" position={Position.Right} id="attach" style={{ background: '#7c3aed' }} />
    </div>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, gap: 4 }}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ fontSize: 10 }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

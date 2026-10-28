import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { useState } from 'react';
import { NodeCard } from './NodeCard';
import { NODE_COLORS } from './nodeColors';

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

export function NarratorNode({ data, selected }: NodeProps<Node<NarratorNodeData>>) {
  const [open, setOpen] = useState(false);
  return (
    <NodeCard label="Narrador" color={NODE_COLORS.narrator} width={220} selected={selected}
      aside={<button className="nodrag" onClick={() => setOpen(!open)} style={{ fontSize: 13, color: '#5b21b6', background: 'none', border: 0, cursor: 'pointer' }}>{open ? 'cerrar' : 'editar'}</button>}>
      <div style={{ fontSize: 14 }}>
        {data.pov} · {data.style} · {data.distance}
        {data.focusName ? ` · foco: ${data.focusName}` : ''}
      </div>
      {open && (
        <div className="nodrag" style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
          <Select label="Persona" value={data.pov} options={POV_OPTIONS as readonly string[]} onChange={(v) => data.onChange?.({ pov: v })} />
          <Select label="Estilo" value={data.style} options={STYLE_OPTIONS as readonly string[]} onChange={(v) => data.onChange?.({ style: v })} />
          <Select label="Distancia" value={data.distance} options={DISTANCE_OPTIONS as readonly string[]} onChange={(v) => data.onChange?.({ distance: v })} />
        </div>
      )}
      <Handle type="source" position={Position.Right} id="attach" style={{ background: '#6b6371', width: 12, height: 12 }} />
    </NodeCard>
  );
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: readonly string[]; onChange: (v: string) => void }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, gap: 6 }}>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{ fontSize: 13, padding: '2px 4px' }}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </label>
  );
}

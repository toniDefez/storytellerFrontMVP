import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { NodeCard } from './NodeCard';
import { NODE_COLORS } from './nodeColors';
import type { CharacterCarry } from '../../services/api';

export interface ContainerCharacterData extends Record<string, unknown> {
  name: string;
  voiceRegisterSummary?: string;
  speechPattern?: string;
  soulSummary?: string;
  /** De dónde viene: lo mismo que recibe el escritor. Sin cargar, undefined. */
  carry?: CharacterCarry;
}

export function ContainerCharacterNode({ data, selected }: NodeProps<Node<ContainerCharacterData>>) {
  return (
    <NodeCard label="Personaje" color={NODE_COLORS.character} width={260} selected={selected}>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{data.name}</div>
      {data.speechPattern && <div style={{ fontSize: 13, color: '#5f5868', fontStyle: 'italic' }}>{data.speechPattern}</div>}
      {data.carry && <CarryBlock carry={data.carry} />}
      <Handle type="source" position={Position.Right} id="attach" style={{ background: '#c2410c', width: 12, height: 12 }} />
    </NodeCard>
  );
}

// "Viene de…" (2026-10-28): Toni enlazó una escena a la de la pesadilla y
// nada le decía que Irene llegaba de despertarse empapada de sudor. Aquí se ve
// lo que el escritor va a recibir de este personaje, ni más ni menos.
function CarryBlock({ carry }: { carry: CharacterCarry }) {
  if (!carry.from_scene_id) {
    return <div style={{ ...box, color: '#5f5868' }}>Primera vez en la historia</div>;
  }
  const where = [carry.from_scene_title ? `«${carry.from_scene_title}»` : 'la escena anterior', carry.place].filter(Boolean).join(' · ');
  return (
    <div style={box}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#9a3412' }}>Viene de {where}</div>
      {carry.last_moment && <div style={{ fontSize: 13 }}>{carry.last_moment}</div>}
      {(carry.outcomes ?? []).map((o) => (
        <div key={o} style={{ fontSize: 13, fontWeight: 600 }}>→ {o}</div>
      ))}
      {(carry.earlier ?? []).length > 0 && (
        <div style={{ marginTop: 4, fontSize: 12, color: '#5f5868' }}>
          Antes: {(carry.earlier ?? []).join(' · ')}
        </div>
      )}
    </div>
  );
}

const box = {
  marginTop: 8, padding: '6px 8px', borderRadius: 8, background: '#fff7ed',
  border: '1px solid #fed7aa', fontSize: 13, lineHeight: 1.4,
} as const;

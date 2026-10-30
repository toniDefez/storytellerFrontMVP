import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { NodeCard } from './NodeCard';
import { NODE_COLORS } from './nodeColors';
import type { Arrival, CharacterCarry, CharacterState } from '../../services/api';
import { StateBlock, type StateActions } from './StateBlock';

export interface ContainerCharacterData extends Record<string, unknown> {
  name: string;
  voiceRegisterSummary?: string;
  speechPattern?: string;
  soulSummary?: string;
  /** De dónde viene: lo mismo que recibe el escritor. Sin cargar, undefined. */
  carry?: CharacterCarry;
  /** Cómo está y qué sabe al entrar en la escena; el autor lo corrige aquí. */
  state?: CharacterState;
  stateActions?: StateActions;
  /** Su llegada por un camino del mapa (La llegada), si la hay. */
  arrival?: Arrival;
  /** Pulsar «1 llegada» centra el lienzo en su fantasma. */
  onFocusArrival?: (characterId: number) => void;
  /** «Proponer llegada»: la descartada vuelve. */
  onRepropose?: (characterId: number) => Promise<void>;
}

export function ContainerCharacterNode({ data, selected }: NodeProps<Node<ContainerCharacterData>>) {
  return (
    <NodeCard label="Personaje" color={NODE_COLORS.character} width={260} selected={selected}>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{data.name}</div>
      {data.speechPattern && <div style={{ fontSize: 13, color: '#5f5868', fontStyle: 'italic' }}>{data.speechPattern}</div>}
      {data.carry && <CarryBlock carry={data.carry} />}
      {data.arrival && <ArrivalBadge arrival={data.arrival} onFocus={data.onFocusArrival} onRepropose={data.onRepropose} />}
      {data.state && <StateBlock state={data.state} inCast actions={data.stateActions} />}
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
    </div>
  );
}

// «1 llegada» (La llegada, 2026-10-30): sin modal ni toast; el aviso vive en
// el nodo del personaje y pulsarlo lleva al fantasma. Si el autor la
// descartó, desde aquí la puede pedir otra vez.
function ArrivalBadge({ arrival, onFocus, onRepropose }: {
  arrival: Arrival;
  onFocus?: (characterId: number) => void;
  onRepropose?: (characterId: number) => Promise<void>;
}) {
  if (arrival.status === 'propuesta') {
    return (
      <button type="button" className="nodrag" onClick={() => onFocus?.(arrival.character_id)} style={badge}
        title={`Llega de ${arrival.from}: ver la propuesta`}>
        1 llegada
      </button>
    );
  }
  if (arrival.status === 'descartada') {
    return (
      <button type="button" className="nodrag" onClick={() => void onRepropose?.(arrival.character_id)} style={{ ...badge, borderStyle: 'solid' }}
        title={`Volver a proponer la llegada desde ${arrival.from}`}>
        Proponer llegada
      </button>
    );
  }
  return null;
}

const badge = {
  marginTop: 6, padding: '2px 8px', borderRadius: 999, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9a3412',
  background: '#fff', color: '#9a3412', fontSize: 12, fontWeight: 600, cursor: 'pointer',
} as const;

const box = {
  marginTop: 8, padding: '6px 8px', borderRadius: 8, background: '#fff7ed',
  border: '1px solid #fed7aa', fontSize: 13, lineHeight: 1.4,
} as const;

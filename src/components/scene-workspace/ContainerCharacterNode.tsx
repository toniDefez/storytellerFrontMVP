import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { NodeCard } from './NodeCard';
import { NODE_COLORS } from './nodeColors';

export interface ContainerCharacterData extends Record<string, unknown> {
  name: string;
  voiceRegisterSummary?: string;
  speechPattern?: string;
  soulSummary?: string;
}

export function ContainerCharacterNode({ data, selected }: NodeProps<Node<ContainerCharacterData>>) {
  return (
    <NodeCard label="Personaje" color={NODE_COLORS.character} width={200} selected={selected}>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{data.name}</div>
      {data.speechPattern && <div style={{ fontSize: 13, color: '#5f5868', fontStyle: 'italic' }}>{data.speechPattern}</div>}
      <Handle type="source" position={Position.Right} id="attach" style={{ background: '#c2410c', width: 12, height: 12 }} />
    </NodeCard>
  );
}

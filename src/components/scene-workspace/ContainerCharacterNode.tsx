import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';

export interface ContainerCharacterData extends Record<string, unknown> {
  name: string;
  voiceRegisterSummary?: string;
  speechPattern?: string;
  soulSummary?: string;
}

export function ContainerCharacterNode({ data }: NodeProps<Node<ContainerCharacterData>>) {
  return (
    <div style={{
      background: '#fef3c7', border: '1px solid #f59e0b', borderRadius: 8,
      padding: '8px 12px', minWidth: 160, fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>{data.name}</div>
      {data.voiceRegisterSummary && <div style={{ color: '#78350f', fontSize: 10 }}>{data.voiceRegisterSummary}</div>}
      {data.speechPattern && <div style={{ color: '#78350f', fontSize: 10, fontStyle: 'italic' }}>{data.speechPattern}</div>}
      <Handle type="source" position={Position.Right} id="attach" style={{ background: '#f59e0b' }} />
    </div>
  );
}

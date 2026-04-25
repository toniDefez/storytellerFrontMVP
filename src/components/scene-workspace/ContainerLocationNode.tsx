import type { Node, NodeProps } from '@xyflow/react';

export interface ContainerLocationData extends Record<string, unknown> {
  name: string;
  nodeType?: string;
  narrativeFunction?: string;
  atmosphere?: string;
}

export function ContainerLocationNode({ data }: NodeProps<Node<ContainerLocationData>>) {
  return (
    <div style={{
      background: '#dbeafe', border: '1px solid #3b82f6', borderRadius: 8,
      padding: '8px 12px', minWidth: 180, fontSize: 12,
    }}>
      <div style={{ fontWeight: 600, marginBottom: 2 }}>📍 {data.name}</div>
      <div style={{ color: '#1e3a8a', fontSize: 10 }}>
        {[data.nodeType, data.narrativeFunction, data.atmosphere].filter(Boolean).join(' · ')}
      </div>
    </div>
  );
}

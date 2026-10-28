import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { narrativeFnLabel, nodeTypeLabel } from '../world-graph/locationLabels';
import { NodeCard } from './NodeCard';
import { NODE_COLORS } from './nodeColors';

export interface ContainerLocationData extends Record<string, unknown> {
  name: string;
  nodeType?: string;
  narrativeFunction?: string;
  atmosphere?: string;
}

export function ContainerLocationNode({ data, selected }: NodeProps<Node<ContainerLocationData>>) {
  const detail = [nodeTypeLabel(data.nodeType), narrativeFnLabel(data.narrativeFunction), data.atmosphere].filter(Boolean).join(' · ');
  return (
    <NodeCard label="Lugar" color={NODE_COLORS.location} width={220} selected={selected}>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{data.name}</div>
      {detail && <div style={{ fontSize: 13, color: '#5f5868' }}>{detail}</div>}
      {/* El lugar es de toda la escena: su cable va siempre a la Escena. */}
      <Handle type="source" position={Position.Right} id="attach" style={{ background: '#4f46e5', width: 12, height: 12 }} isConnectable={false} />
    </NodeCard>
  );
}

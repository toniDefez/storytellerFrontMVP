import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import { NodeCard } from './NodeCard';
import { NODE_COLORS } from './nodeColors';

/** Lo que el taller sabe de un lugar: su ficha (nombre, tipo, qué hay, regla). */
export interface ScenePlace {
  name: string;
  nodeType?: string;
  props?: string[];
  rule?: string;
}

export type ContainerLocationData = ScenePlace & Record<string, unknown>;

// La ficha del lugar, tal como la recibe la escena: lo que hay y lo que
// siempre se cumple. La función narrativa y la atmósfera no llegan a la
// prosa (la atmósfera se midió como ruido), así que no se enseñan.
export function ContainerLocationNode({ data, selected }: NodeProps<Node<ContainerLocationData>>) {
  const things = data.props ?? [];
  return (
    <NodeCard label="Lugar" color={NODE_COLORS.location} width={240} selected={selected}>
      <div style={{ fontSize: 16, fontWeight: 600 }}>{data.name}</div>
      {data.rule && <div style={{ fontSize: 13, color: '#5f5868', fontStyle: 'italic', marginTop: 4 }}>Aquí siempre: {data.rule}</div>}
      {things.length > 0 && <div style={{ fontSize: 13, color: '#5f5868', marginTop: 2 }}>Hay: {things.join(' · ')}</div>}
      {/* El lugar es de toda la escena: su cable va siempre a la Escena. */}
      <Handle type="source" position={Position.Right} id="attach" style={{ background: NODE_COLORS.location, width: 12, height: 12 }} isConnectable={false} />
    </NodeCard>
  );
}

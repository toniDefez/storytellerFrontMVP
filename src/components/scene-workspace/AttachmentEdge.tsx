import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

/** Un personaje o un narrador conectado a un evento concreto. */
export function AttachmentEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return <BaseEdge id={id} path={path} style={{ stroke: '#c2410c', strokeWidth: 2.5 }} />;
}

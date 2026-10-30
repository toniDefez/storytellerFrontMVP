import { BaseEdge, getBezierPath, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

// Las aristas de un fantasma (La llegada): ya dibujadas, discontinuas y
// apagadas, para que se vea dónde entrará el momento cuando el autor acepte.

/** Del fantasma al primer evento: el mismo trazo que el flujo, punteado. */
export function GhostFlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) {
  const [path] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return <BaseEdge id={id} path={path} style={{ stroke: '#0e7490', strokeWidth: 2.5, strokeDasharray: '6 5', opacity: 0.6 }} />;
}

/** Del personaje a su fantasma: el mismo trazo que el attachment, punteado. */
export function GhostAttachmentEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return <BaseEdge id={id} path={path} style={{ stroke: '#c2410c', strokeWidth: 2.5, strokeDasharray: '6 5', opacity: 0.6 }} />;
}

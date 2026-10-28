import { BaseEdge, getBezierPath, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

/** Un evento lleva al siguiente (y los últimos, a la Escena). */
export function FlowEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, markerEnd }: EdgeProps) {
  const [path] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke: '#0e7490', strokeWidth: 2.5 }} />;
}

/**
 * Lo que no está conectado a ningún evento afecta a toda la escena: se dibuja
 * hasta la Escena, discontinuo. Es lo que ya hace el generador sin conexiones.
 */
export function ScopeEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition }: EdgeProps) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition });
  return <BaseEdge id={id} path={path} style={{ stroke: '#8a8291', strokeWidth: 2, strokeDasharray: '6 5' }} />;
}

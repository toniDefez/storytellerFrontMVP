import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

export function FlowEdge({ id, sourceX, sourceY, targetX, targetY, markerEnd }: EdgeProps) {
  const [path] = getSmoothStepPath({ sourceX, sourceY, targetX, targetY });
  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={{ stroke: '#374151', strokeWidth: 2 }} />;
}

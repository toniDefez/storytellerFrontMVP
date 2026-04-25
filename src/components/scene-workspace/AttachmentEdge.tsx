import { BaseEdge, getBezierPath, type EdgeProps } from '@xyflow/react';

export function AttachmentEdge({ id, sourceX, sourceY, targetX, targetY }: EdgeProps) {
  const [path] = getBezierPath({ sourceX, sourceY, targetX, targetY });
  return <BaseEdge id={id} path={path} style={{ stroke: '#a78bfa', strokeWidth: 1.5, strokeDasharray: '6 4', opacity: 0.75 }} />;
}

import { useCallback, useMemo } from 'react';
import {
  ReactFlow, Background, Controls, MiniMap,
  type Node, type Edge, type Connection, type NodeTypes, type EdgeTypes, type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ContainerCharacterNode } from './ContainerCharacterNode';
import { ContainerLocationNode } from './ContainerLocationNode';
import { MomentNode } from './MomentNode';
import { NarratorNode } from './NarratorNode';
import { FlowEdge } from './FlowEdge';
import { AttachmentEdge } from './AttachmentEdge';
import type { SceneNode, SceneNodeEdge, SceneEdgeKind } from '../../services/api';

interface SceneCanvasProps {
  nodes: SceneNode[];
  edges: SceneNodeEdge[];
  onConnect: (fromId: number, toId: number, kind: SceneEdgeKind) => void;
  onNodeMove: (id: number, x: number, y: number) => void;
  onMomentEdit: (id: number, description: string) => void;
  onNarratorEdit: (id: number, patch: { pov?: string; style?: string; distance?: string; reliability?: string }) => void;
  onEdgeDelete: (id: number) => void;
  charNameByID: Record<number, string>;
  locationByID: Record<number, { name: string; nodeType?: string; narrativeFunction?: string; atmosphere?: string }>;
}

const nodeTypes: NodeTypes = {
  character: ContainerCharacterNode as unknown as NodeTypes[string],
  location: ContainerLocationNode as unknown as NodeTypes[string],
  moment: MomentNode as unknown as NodeTypes[string],
  narrator: NarratorNode as unknown as NodeTypes[string],
};

const edgeTypes: EdgeTypes = {
  flow: FlowEdge,
  attachment: AttachmentEdge,
};

export function SceneCanvas(props: SceneCanvasProps) {
  const { nodes, edges, onConnect, onNodeMove, onMomentEdit, onNarratorEdit, onEdgeDelete, charNameByID, locationByID } = props;

  const rfNodes = useMemo<Node[]>(() => nodes.map((n) => ({
    id: String(n.id),
    type: n.node_kind,
    position: { x: n.canvas_x, y: n.canvas_y },
    data: nodeData(n, charNameByID, locationByID, onMomentEdit, onNarratorEdit, edges) as Record<string, unknown>,
  })), [nodes, edges, charNameByID, locationByID, onMomentEdit, onNarratorEdit]);

  const rfEdges = useMemo<Edge[]>(() => edges.map((e) => ({
    id: String(e.id),
    source: String(e.from_node_id),
    target: String(e.to_node_id),
    type: e.edge_kind,
  })), [edges]);

  const handleConnect: OnConnect = useCallback((c: Connection) => {
    if (!c.source || !c.target) return;
    const from = nodes.find((n) => String(n.id) === c.source);
    const to = nodes.find((n) => String(n.id) === c.target);
    if (!from || !to) return;
    const kind = resolveEdgeKind(from.node_kind, to.node_kind);
    if (!kind) return;
    onConnect(from.id, to.id, kind);
  }, [nodes, onConnect]);

  return (
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onConnect={handleConnect}
      onNodeDragStop={(_, node) => onNodeMove(Number(node.id), node.position.x, node.position.y)}
      onEdgesDelete={(removed) => removed.forEach((r) => onEdgeDelete(Number(r.id)))}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}

function resolveEdgeKind(fromKind: string, toKind: string): SceneEdgeKind | null {
  if (fromKind === 'moment' && toKind === 'moment') return 'flow';
  if ((fromKind === 'narrator' || fromKind === 'character') && toKind === 'moment') return 'attachment';
  return null;
}

function nodeData(
  n: SceneNode,
  charNameByID: Record<number, string>,
  locByID: Record<number, { name: string; nodeType?: string; narrativeFunction?: string; atmosphere?: string }>,
  onMomentEdit: (id: number, description: string) => void,
  onNarratorEdit: (id: number, patch: Partial<{ pov: string; style: string; distance: string; reliability: string }>) => void,
  edges: SceneNodeEdge[],
): Record<string, unknown> {
  switch (n.node_kind) {
    case 'character':
      return { name: n.character_id ? (charNameByID[n.character_id] ?? '?') : '?' };
    case 'location':
      return n.location_node_id ? (locByID[n.location_node_id] ?? { name: '?' }) : { name: '?' };
    case 'moment': {
      const incoming = edges.filter((e) => e.to_node_id === n.id && e.edge_kind === 'attachment');
      return {
        description: n.description ?? '',
        hasNarratorOverride: incoming.length > 0,
        hasActiveCharOverride: incoming.length > 0,
        onChange: (desc: string) => onMomentEdit(n.id, desc),
      };
    }
    case 'narrator': {
      const cfg = n.narrator_config ?? { pov: '3rd-limited', style: 'sparse', distance: 'intimate', reliability: 'reliable' };
      return {
        ...cfg,
        focusName: cfg.focus_character_id ? charNameByID[cfg.focus_character_id] : undefined,
        onChange: (patch: Partial<{ pov: string; style: string; distance: string; reliability: string }>) => onNarratorEdit(n.id, patch),
      };
    }
  }
  return {};
}

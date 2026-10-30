import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ReactFlow, Background, Controls, Panel, useReactFlow,
  type Node, type Edge, type Connection, type NodeTypes, type EdgeTypes, type OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { ContainerCharacterNode } from './ContainerCharacterNode';
import { ContainerLocationNode, type ScenePlace } from './ContainerLocationNode';
import { MomentNode } from './MomentNode';
import { NarratorNode } from './NarratorNode';
import { DirectionNode } from './DirectionNode';
import { FlowEdge, ScopeEdge } from './FlowEdge';
import { OutputNode, type OutputNodeData } from './OutputNode';
import { AttachmentEdge } from './AttachmentEdge';
import { ArrivalNode, type ArrivalNodeActions } from './ArrivalNode';
import { GhostFlowEdge, GhostAttachmentEdge } from './GhostEdge';
import type { SceneNode, SceneNodeEdge, SceneEdgeKind, CharacterCarry, CharacterState, NarratorNodeConfig, Arrival } from '../../services/api';
import type { StateActions } from './StateBlock';

/** Las acciones sobre un fantasma; la posición es la que tiene en el lienzo al aceptar. */
export interface ArrivalActions {
  accept: (characterId: number, edit?: { step: string; outcomes: string[] }, pos?: { x: number; y: number }) => Promise<void>;
  dismiss: (characterId: number) => Promise<void>;
  again: (characterId: number) => Promise<void>;
  repropose: (characterId: number) => Promise<void>;
}

interface SceneCanvasProps {
  nodes: SceneNode[];
  edges: SceneNodeEdge[];
  onConnect: (fromId: number, toId: number, kind: SceneEdgeKind) => void;
  onNodeMove: (id: number, x: number, y: number) => void;
  onMomentEdit: (id: number, patch: { description?: string; outcomes?: string[] }) => void;
  onNarratorEdit: (id: number, patch: Partial<NarratorNodeConfig>) => void;
  /** Sugerencias de "cómo ve a…" sacadas de las relaciones, por "quien-mirado". */
  viewHints?: Record<string, string>;
  onEdgeDelete: (id: number) => void;
  /** Salidas que la última generación no logró mostrar en la prosa. */
  unmetOutcomes?: string[];
  charNameByID: Record<number, string>;
  /** De dónde viene cada personaje (por character_id). */
  carryByCharID?: Record<number, CharacterCarry>;
  /** Cómo está y qué sabe cada personaje al entrar, y cómo corregirlo. */
  stateByCharID?: Record<number, CharacterState>;
  stateActions?: StateActions;
  locationByID: Record<number, ScenePlace>;
  /** La escena como nodo de salida (como en ComfyUI); sin ella no se dibuja. */
  output?: OutputNodeData;
  /** Las llegadas (La llegada): un fantasma por personaje que entra por un camino. */
  arrivals?: Arrival[];
  arrivalActions?: ArrivalActions;
  /** Personaje cuya llegada tiene una acción en curso. */
  busyArrival?: number | null;
  /** Con «1 llegada» pulsado en un personaje, el lienzo se centra en su fantasma. */
  focusArrival?: { characterId: number; n: number } | null;
}

const OUTPUT_ID = 'output';
const ghostID = (characterId: number) => `g-${characterId}`;
const isVirtual = (id: string) => id === OUTPUT_ID || id.startsWith('v-') || id.startsWith('g-');

/** Un fantasma se dibuja mientras está propuesto y tiene algo que enseñar. */
function ghostVisible(a: Arrival): boolean {
  return a.status === 'propuesta' && (a.pending || a.step !== '' || !!a.warning);
}

/** El primer evento en orden de lectura: sin flujo entrante y más arriba. */
function firstMoment(nodes: SceneNode[], edges: SceneNodeEdge[]): SceneNode | undefined {
  const hasPrev = new Set(edges.filter((e) => e.edge_kind === 'flow').map((e) => e.to_node_id));
  const moments = nodes.filter((n) => n.node_kind === 'moment').sort((a, b) => a.canvas_y - b.canvas_y);
  return moments.find((m) => !hasPrev.has(m.id)) ?? moments[0];
}

// Con «1 llegada» pulsado en un personaje, el lienzo se centra en su fantasma.
function FocusNode({ target }: { target: { id: string; n: number } | null }) {
  const { fitView } = useReactFlow();
  useEffect(() => {
    if (!target) return;
    const t = setTimeout(() => { void fitView({ nodes: [{ id: target.id }], duration: 250, maxZoom: 1 }); }, 50);
    return () => clearTimeout(t);
  }, [target, fitView]);
  return null;
}

// Con zoom máximo 1: sobre un lienzo casi vacío, fitView acercaba tanto que
// los nodos nuevos caían fuera de la vista, detrás del panel de prosa.
// Y mínimo 0,2: con el lienzo partido a la mitad, 0,5 no bastaba para que
// cupieran personaje, lugar y momentos.
const FIT = { padding: 0.2, maxZoom: 1, minZoom: 0.2, duration: 250 };

// Al aparecer un nodo (momento, personaje, lugar) el lienzo se reajusta para
// que se vea: antes se creaba fuera de pantalla y parecía que el botón no
// hacía nada.
function FitWhenNodesAppear({ count }: { count: number }) {
  const { fitView } = useReactFlow();
  const previous = useRef(count);
  useEffect(() => {
    if (count > previous.current) {
      // tras el render, cuando el nodo nuevo ya tiene tamaño medido
      const t = setTimeout(() => { void fitView(FIT); }, 50);
      previous.current = count;
      return () => clearTimeout(t);
    }
    previous.current = count;
  }, [count, fitView]);
  return null;
}

const nodeTypes: NodeTypes = {
  character: ContainerCharacterNode as unknown as NodeTypes[string],
  location: ContainerLocationNode as unknown as NodeTypes[string],
  moment: MomentNode as unknown as NodeTypes[string],
  narrator: NarratorNode as unknown as NodeTypes[string],
  direction: DirectionNode as unknown as NodeTypes[string],
  // No "output": React Flow ya trae un tipo con ese nombre y le pone su marco.
  sceneOutput: OutputNode as unknown as NodeTypes[string],
  arrival: ArrivalNode as unknown as NodeTypes[string],
};

const edgeTypes: EdgeTypes = {
  flow: FlowEdge,
  attachment: AttachmentEdge,
  scope: ScopeEdge,
  ghostFlow: GhostFlowEdge,
  ghostAttachment: GhostAttachmentEdge,
};

export function SceneCanvas(props: SceneCanvasProps) {
  const { nodes, edges, onConnect, onNodeMove, onMomentEdit, onNarratorEdit, onEdgeDelete, charNameByID, carryByCharID, stateByCharID, stateActions, viewHints, locationByID, unmetOutcomes, output, arrivals, arrivalActions, busyArrival, focusArrival } = props;

  // Los fantasmas van antes del primer evento, apilados; si los mueves se
  // quedan donde los dejes y esa posición es la del momento al aceptar.
  const [ghostMoved, setGhostMoved] = useState<Record<number, { x: number; y: number }>>({});
  const ghosts = useMemo(() => (arrivals ?? []).filter(ghostVisible), [arrivals]);
  const ghostPositions = useMemo(() => {
    const first = firstMoment(nodes, edges);
    const base = first ? { x: first.canvas_x, y: first.canvas_y } : { x: 340, y: 0 };
    return Object.fromEntries(ghosts.map((a, i) => [a.character_id, ghostMoved[a.character_id] ?? { x: base.x, y: base.y - 200 - 180 * i }])) as Record<number, { x: number; y: number }>;
  }, [ghosts, ghostMoved, nodes, edges]);
  const ghostActions = useMemo<ArrivalNodeActions | undefined>(() => arrivalActions && {
    accept: (cid, edit) => arrivalActions.accept(cid, edit, ghostPositions[cid]),
    dismiss: arrivalActions.dismiss,
    again: arrivalActions.again,
  }, [arrivalActions, ghostPositions]);
  // El fantasma seleccionado responde al teclado: Enter acepta, Supr descarta.
  const [selectedGhost, setSelectedGhost] = useState<number | null>(null);
  const onKeyDownCapture = useCallback((e: React.KeyboardEvent) => {
    if (selectedGhost == null || !ghostActions) return;
    const tag = (e.target as HTMLElement).tagName;
    if (tag === 'TEXTAREA' || tag === 'INPUT') return;
    const a = ghosts.find((g) => g.character_id === selectedGhost);
    if (!a) return;
    if (e.key === 'Enter' && !a.pending && a.step) { e.preventDefault(); void ghostActions.accept(a.character_id); }
    if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); e.stopPropagation(); void ghostActions.dismiss(a.character_id); }
  }, [selectedGhost, ghostActions, ghosts]);

  // La Escena va a la derecha de los eventos; si la mueves, se queda donde la
  // dejes mientras estés en el taller (no se guarda: no es un nodo del backend).
  const [outputMoved, setOutputMoved] = useState<{ x: number; y: number } | null>(null);
  const outputPos = useMemo(() => {
    if (outputMoved) return outputMoved;
    const moments = nodes.filter((n) => n.node_kind === 'moment');
    const base = moments.length ? moments : nodes;
    if (!base.length) return { x: 400, y: 0 };
    return { x: Math.max(...base.map((n) => n.canvas_x)) + 420, y: Math.min(...base.map((n) => n.canvas_y)) - 40 };
  }, [nodes, outputMoved]);

  const rfNodes = useMemo<Node[]>(() => {
    // El reparto de esta escena: quién puede narrar y a quién se mira.
    const cast = nodes
      .filter((n) => n.node_kind === 'character' && n.character_id)
      .map((n) => ({ id: n.character_id as number, name: charNameByID[n.character_id as number] ?? '?' }));
    const scene = { cast, viewHints: viewHints ?? {} };
    const real: Node[] = nodes.map((n) => ({
      id: String(n.id),
      type: n.node_kind,
      position: { x: n.canvas_x, y: n.canvas_y },
      data: nodeData(n, charNameByID, carryByCharID ?? {}, stateByCharID ?? {}, stateActions, locationByID, onMomentEdit, onNarratorEdit, edges, unmetOutcomes ?? [], scene) as Record<string, unknown>,
    }));
    const ghostNodes: Node[] = ghosts.map((a) => ({
      id: ghostID(a.character_id), type: 'arrival', position: ghostPositions[a.character_id], deletable: false, connectable: false,
      data: { arrival: a, actions: ghostActions, busy: busyArrival === a.character_id } as Record<string, unknown>,
    }));
    if (!output) return [...real, ...ghostNodes];
    return [...real, ...ghostNodes, { id: OUTPUT_ID, type: 'sceneOutput', position: outputPos, deletable: false, data: output }];
  }, [nodes, edges, charNameByID, carryByCharID, stateByCharID, stateActions, viewHints, locationByID, onMomentEdit, onNarratorEdit, unmetOutcomes, output, outputPos, ghosts, ghostPositions, ghostActions, busyArrival]);

  const rfEdges = useMemo<Edge[]>(() => {
    const real: Edge[] = edges.map((e) => ({
      id: String(e.id),
      source: String(e.from_node_id),
      target: String(e.to_node_id),
      type: e.edge_kind,
    }));
    // Las aristas punteadas de cada fantasma: flujo hacia el primer evento y
    // attachment desde su personaje.
    const first = firstMoment(nodes, edges);
    const ghostEdges: Edge[] = ghosts.flatMap((a): Edge[] => {
      const out: Edge[] = [];
      if (first) out.push({ id: `gf-${a.character_id}`, source: ghostID(a.character_id), sourceHandle: 'flow-out', target: String(first.id), targetHandle: 'flow-in', type: 'ghostFlow', deletable: false, selectable: false });
      const charNode = nodes.find((n) => n.node_kind === 'character' && n.character_id === a.character_id);
      if (charNode) out.push({ id: `ga-${a.character_id}`, source: String(charNode.id), sourceHandle: 'attach', target: ghostID(a.character_id), targetHandle: 'attach-in', type: 'ghostAttachment', deletable: false, selectable: false });
      return out;
    });
    real.push(...ghostEdges);
    if (!output) return real;
    // Los últimos eventos desembocan en la Escena; lo que no está conectado a
    // ningún evento (reparto, lugar, narrador) afecta a toda la escena.
    const hasNext = new Set(edges.filter((e) => e.edge_kind === 'flow').map((e) => e.from_node_id));
    const attached = new Set(edges.filter((e) => e.edge_kind === 'attachment').map((e) => e.from_node_id));
    const virtual: Edge[] = nodes.flatMap((n): Edge[] => {
      if (n.node_kind === 'moment' && !hasNext.has(n.id)) {
        return [{ id: `v-${n.id}`, source: String(n.id), sourceHandle: 'out', target: OUTPUT_ID, type: 'flow', deletable: false, selectable: false }];
      }
      if (n.node_kind !== 'moment' && !attached.has(n.id)) {
        return [{ id: `v-${n.id}`, source: String(n.id), sourceHandle: 'attach', target: OUTPUT_ID, type: 'scope', deletable: false, selectable: false }];
      }
      return [];
    });
    return [...real, ...virtual];
  }, [edges, nodes, output, ghosts]);

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
    <div style={{ width: '100%', height: '100%' }} onKeyDownCapture={onKeyDownCapture}>
    <ReactFlow
      nodes={rfNodes}
      edges={rfEdges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      onConnect={handleConnect}
      onNodeDragStop={(_, node) => {
        if (node.id === OUTPUT_ID) setOutputMoved(node.position);
        else if (node.id.startsWith('g-')) setGhostMoved((m) => ({ ...m, [Number(node.id.slice(2))]: node.position }));
        else if (!isVirtual(node.id)) onNodeMove(Number(node.id), node.position.x, node.position.y);
      }}
      onSelectionChange={({ nodes: sel }) => {
        const g = sel.find((n) => n.id.startsWith('g-'));
        setSelectedGhost(g ? Number(g.id.slice(2)) : null);
      }}
      onEdgesDelete={(removed) => removed.filter((r) => !isVirtual(r.id)).forEach((r) => onEdgeDelete(Number(r.id)))}
      fitView
      fitViewOptions={FIT}
      proOptions={{ hideAttribution: true }}
      minZoom={0.2}
    >
      <FitWhenNodesAppear count={rfNodes.length} />
      <FocusNode target={focusArrival ? { id: ghostID(focusArrival.characterId), n: focusArrival.n } : null} />
      <Panel position="top-left">
        <TidyButton nodes={nodes} edges={edges} onNodeMove={onNodeMove} onDone={() => setOutputMoved(null)} />
      </Panel>
      <Background />
      <Controls showInteractive={false} />
    </ReactFlow>
    </div>
  );
}

// Ordenar: entradas en una columna, eventos en otra en su orden de lectura y
// la Escena a la derecha, sin solapes (con el tamaño real de cada nodo: los
// eventos con texto largo o muchos "después" son altos).
function TidyButton({ nodes, edges, onNodeMove, onDone }: {
  nodes: SceneNode[];
  edges: SceneNodeEdge[];
  onNodeMove: (id: number, x: number, y: number) => void;
  onDone: () => void;
}) {
  const { getNode, fitView } = useReactFlow();
  const tidy = () => {
    // El tamaño medido por React Flow, o el del nodo en la página si aún no lo tiene.
    const height = (id: number) => getNode(String(id))?.measured?.height
      ?? (document.querySelector(`.react-flow__node[data-id="${id}"]`) as HTMLElement | null)?.offsetHeight ?? 220;
    const next = new Map(edges.filter((e) => e.edge_kind === 'flow').map((e) => [e.from_node_id, e.to_node_id]));
    const hasPrev = new Set(next.values());
    const moments = nodes.filter((n) => n.node_kind === 'moment');
    const ordered: SceneNode[] = [];
    const seen = new Set<number>();
    for (const start of moments.filter((m) => !hasPrev.has(m.id)).sort((a, b) => a.canvas_y - b.canvas_y)) {
      for (let cur: number | undefined = start.id; cur != null && !seen.has(cur); cur = next.get(cur)) {
        seen.add(cur);
        const m = moments.find((x) => x.id === cur);
        if (m) ordered.push(m);
      }
    }
    ordered.push(...moments.filter((m) => !seen.has(m.id)));
    const inputs = ['location', 'character', 'narrator', 'direction'].flatMap((k) => nodes.filter((n) => n.node_kind === k));
    let y = 0;
    for (const n of inputs) { onNodeMove(n.id, 0, y); y += height(n.id) + 24; }
    y = 0;
    for (const m of ordered) { onNodeMove(m.id, 340, y); y += height(m.id) + 48; }
    onDone();
    setTimeout(() => { void fitView(FIT); }, 80);
  };
  return (
    <button onClick={tidy} style={{ height: 36, padding: '0 12px', border: '1px solid #ddd5cb', borderRadius: 10, background: '#fff', fontSize: 14, cursor: 'pointer' }}>
      Ordenar
    </button>
  );
}

function resolveEdgeKind(fromKind: string, toKind: string): SceneEdgeKind | null {
  if (fromKind === 'moment' && toKind === 'moment') return 'flow';
  if ((fromKind === 'narrator' || fromKind === 'character' || fromKind === 'direction') && toKind === 'moment') return 'attachment';
  return null;
}

function nodeData(
  n: SceneNode,
  charNameByID: Record<number, string>,
  carryByCharID: Record<number, CharacterCarry>,
  stateByCharID: Record<number, CharacterState>,
  stateActions: StateActions | undefined,
  locByID: Record<number, ScenePlace>,
  onMomentEdit: (id: number, patch: { description?: string; outcomes?: string[] }) => void,
  onNarratorEdit: (id: number, patch: Partial<NarratorNodeConfig>) => void,
  edges: SceneNodeEdge[],
  unmetOutcomes: string[],
  scene: { cast: { id: number; name: string }[]; viewHints: Record<string, string> },
): Record<string, unknown> {
  switch (n.node_kind) {
    case 'character':
      return {
        name: n.character_id ? (charNameByID[n.character_id] ?? '?') : '?',
        carry: n.character_id ? carryByCharID[n.character_id] : undefined,
        state: n.character_id ? stateByCharID[n.character_id] : undefined,
        stateActions,
      };
    case 'location':
      return n.location_node_id ? { ...(locByID[n.location_node_id] ?? { name: '?' }) } : { name: '?' };
    case 'moment': {
      const incoming = edges.filter((e) => e.to_node_id === n.id && e.edge_kind === 'attachment');
      return {
        description: n.description ?? '',
        outcomes: n.outcomes ?? [],
        unmet: (n.outcomes ?? []).filter((o) => unmetOutcomes.includes(o)),
        hasNarratorOverride: incoming.length > 0,
        hasActiveCharOverride: incoming.length > 0,
        onChange: (desc: string) => onMomentEdit(n.id, { description: desc }),
        onOutcomesChange: (outcomes: string[]) => onMomentEdit(n.id, { outcomes }),
      };
    }
    case 'direction':
      return { text: n.description ?? '', onChange: (text: string) => onMomentEdit(n.id, { description: text }) };
    case 'narrator': {
      const cfg = n.narrator_config ?? { pov: '3rd-limited', style: 'sparse', distance: 'intimate', reliability: 'reliable' };
      const focus = cfg.focus_character_id ?? undefined;
      return {
        ...cfg,
        focusName: focus ? charNameByID[focus] : undefined,
        cast: scene.cast,
        // Lo que dicen las relaciones de la historia de cómo ve quien narra a
        // cada uno; el autor lo usa, lo cambia o lo ignora.
        hints: focus ? Object.fromEntries(scene.cast.map((c) => [c.id, scene.viewHints[`${focus}-${c.id}`]]).filter(([, h]) => h)) : {},
        onChange: (patch: Partial<NarratorNodeConfig>) => onNarratorEdit(n.id, patch),
      };
    }
  }
  return {};
}

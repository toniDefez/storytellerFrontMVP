import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  listSceneNodes, listSceneNodeEdges, createSceneNode, updateSceneNode, deleteSceneNode,
  updateSceneNodePosition, deleteSceneNodeEdge, createSceneNodeEdge,
  generateScene, listSceneOutputs, revertSceneOutput, getGenerationProgress,
  getWritingPlan, saveSceneProse, getSceneCarry,
  getSceneState, addStateChange, deleteStateChange, proposeSceneState, type CharacterState, type StateList,
  getSceneArrivals, proposeSceneArrivals, acceptArrival, dismissArrival, regenerateArrival, reproposeArrival, type Arrival,
  type SceneNode, type SceneNodeEdge, type SceneEdgeKind, type SceneOutput, type SceneCarry, type NarratorNodeConfig, type StoryRelationship,
} from '../../services/api';
import { SceneCanvas, type ArrivalActions } from './SceneCanvas';
import type { ScenePlace } from './ContainerLocationNode';
import { ScenePalette } from './ScenePalette';
import { SceneProseView } from './SceneProseView';
import { SceneVersionDropdown } from './SceneVersionDropdown';
import type { OutputNodeData } from './OutputNode';
import { formatInfo, type SceneFormat } from '@/lib/sceneFormats';
import { toast } from 'sonner';
import { describeError, newRequestId } from '../../services/telemetry';
import { notifyError } from '@/lib/notifyError';
import { writingPlanMarkdown, copyOrDownload } from '@/lib/writingPlan';

// Qué hace el generador, dicho para quien espera.
function progressLabel(kind: string, phase: string, seconds: number): string {
  const what = kind === 'scene_delta_extract' ? 'resumiendo lo que ha pasado'
    : kind === 'scene_verify' ? 'el juez comprueba lo declarado'
    : phase || 'preparando la escena';
  return `${what} · ${seconds} s`;
}

interface SceneWorkspaceProps {
  sceneId: number;
  onBack: () => void;
  charNameByID?: Record<number, string>;
  locationByID?: Record<number, ScenePlace>;
  /** Crea un lugar en el mundo de la historia y devuelve su id. */
  onCreateLocation?: (name: string) => Promise<number>;
  /** Relaciones de la historia: sugieren cómo ve quien narra a los demás. */
  relationships?: StoryRelationship[];
  /** Para copiar la hoja de esta escena del plan de escritura de la historia. */
  storyId?: number;
  storyTitle?: string;
  sceneTitle?: string;
}

export function SceneWorkspace({ sceneId, storyId, storyTitle, sceneTitle, onBack, charNameByID, locationByID, onCreateLocation, relationships }: SceneWorkspaceProps) {
  const charMap = useMemo(() => charNameByID ?? {}, [charNameByID]);
  const locMap = useMemo(() => locationByID ?? {}, [locationByID]);
  const castOptions = useMemo(
    () => Object.entries(charMap).map(([id, name]) => ({ id: Number(id), name })),
    [charMap],
  );
  // "Cómo ve a…": lo que dice la relación entre los dos, por "quien-mirado".
  const viewHints = useMemo(() => {
    const out: Record<string, string> = {};
    for (const r of relationships ?? []) {
      const text = r.description?.trim() || [r.rel_type, r.subtype].filter(Boolean).join(', ');
      if (!text) continue;
      out[`${r.character_a_id}-${r.character_b_id}`] = text;
      if (!r.directional) out[`${r.character_b_id}-${r.character_a_id}`] ??= text;
    }
    return out;
  }, [relationships]);
  const locationOptions = useMemo(
    () => Object.entries(locMap).map(([id, loc]) => ({ id: Number(id), name: loc.name })),
    [locMap],
  );

  const [nodes, setNodes] = useState<SceneNode[]>([]);
  const [edges, setEdges] = useState<SceneNodeEdge[]>([]);
  const [outputs, setOutputs] = useState<SceneOutput[]>([]);
  const [currentVersion, setCurrentVersion] = useState<number | null>(null);
  const [generating, setGenerating] = useState(false);
  const [unmetOutcomes, setUnmetOutcomes] = useState<string[]>([]);
  const [progress, setProgress] = useState('');
  // Lo que el escritor lleva escrito mientras genera: se lee en un par de
  // segundos en vez de esperar de 20 s a 2 min a la versión final.
  const [liveDraft, setLiveDraft] = useState('');
  // Prosa escrita fuera (otro modelo o el autor) pegada aquí.
  const [pasting, setPasting] = useState(false);
  const [pastedText, setPastedText] = useState('');
  // La prosa en grande, en un panel sobre el lienzo.
  const [expanded, setExpanded] = useState(false);
  // El formato de la salida: cada uno con sus versiones, sin mezclarse.
  const [format, setFormat] = useState<SceneFormat>('prose');

  // nodesLoaded: el reparto real ya está; antes no se piden las llegadas.
  const [nodesLoaded, setNodesLoaded] = useState(false);
  const refresh = useCallback(async () => {
    const [n, e, o] = await Promise.all([
      listSceneNodes(sceneId), listSceneNodeEdges(sceneId), listSceneOutputs(sceneId),
    ]);
    setNodes(n); setEdges(e); setOutputs(o); setNodesLoaded(true);
    if (o.length && currentVersion === null) setCurrentVersion((o.find((x) => x.current) ?? o[0]).version);
  }, [sceneId, currentVersion]);

  useEffect(() => { void refresh(); }, [refresh]);

  // De dónde viene cada personaje. Se vuelve a pedir al cambiar el reparto:
  // al añadir a Irene, su nodo dice enseguida que viene de la pesadilla.
  const [carry, setCarry] = useState<SceneCarry | null>(null);
  const castKey = useMemo(
    () => nodes.filter((n) => n.node_kind === 'character').map((n) => n.character_id).sort().join(','),
    [nodes],
  );
  useEffect(() => {
    let alive = true;
    getSceneCarry(sceneId).then((c) => { if (alive) setCarry(c); }).catch((err) => console.error(err));
    return () => { alive = false; };
  }, [sceneId, castKey]);
  const carryByCharID = useMemo(
    () => Object.fromEntries((carry?.characters ?? []).map((c) => [c.character_id, c])),
    [carry],
  );

  // El estado vivo de cada presente al entrar. Lo mismo que recibe el escritor;
  // el autor lo corrige desde el nodo y la corrección vale desde esta escena.
  const [states, setStates] = useState<CharacterState[]>([]);
  // Cada carga lleva su número: una respuesta lenta no pisa a una más nueva.
  const stateLoad = useRef(0);
  const refreshState = useCallback(() => {
    const n = ++stateLoad.current;
    return getSceneState(sceneId).then((s) => { if (n === stateLoad.current) setStates(s); }).catch((err) => console.error(err));
  }, [sceneId]);
  useEffect(() => { void refreshState(); }, [refreshState, castKey]);
  const stateByCharID = useMemo(() => Object.fromEntries(states.map((s) => [s.character_id, s])), [states]);
  const stateActions = useMemo(() => ({
    sceneId,
    add: async (characterId: number, list: StateList, text: string) => {
      try { await addStateChange(sceneId, { character_id: characterId, list, op: 'add', text }); await refreshState(); }
      catch (err) { toast.error(`No se pudo guardar el estado: ${describeError(err, 'error desconocido')}`); }
    },
    remove: async (characterId: number, list: StateList, text: string) => {
      try { await addStateChange(sceneId, { character_id: characterId, list, op: 'remove', text }); await refreshState(); }
      catch (err) { toast.error(`No se pudo tachar: ${describeError(err, 'error desconocido')}`); }
    },
    undo: async (changeId: number) => {
      try { await deleteStateChange(sceneId, changeId); await refreshState(); }
      catch (err) { toast.error(`No se pudo quitar: ${describeError(err, 'error desconocido')}`); }
    },
  }), [sceneId, refreshState]);
  // Las llegadas (La llegada, 2026-10-30): quién entra por un camino del mapa.
  // Leer es inmediato y sin modelo; si alguna está por redactar, se pide la
  // redacción aparte y el fantasma sale como «calculando» mientras tanto.
  // Sin toasts salvo error: la llegada es una propuesta, no un aviso.
  const [arrivals, setArrivals] = useState<Arrival[]>([]);
  const arrivalLoad = useRef(0);
  // Una sola redacción en vuelo por escena: dos a la vez serían dos llamadas
  // al modelo por llegada.
  const proposing = useRef(false);
  const refreshArrivals = useCallback(async () => {
    const n = ++arrivalLoad.current;
    let first: Arrival[];
    try {
      first = await getSceneArrivals(sceneId);
    } catch (err) { console.error(err); return; }
    if (n !== arrivalLoad.current) return;
    setArrivals(first);
    if (!first.some((a) => a.pending) || proposing.current) return;
    proposing.current = true;
    try {
      const written = await proposeSceneArrivals(sceneId);
      if (n === arrivalLoad.current) setArrivals(written);
    } catch (err) {
      // Sin generador el fantasma no se queda en «calculando…» para siempre:
      // el autor puede editarlo o descartarlo; al reabrir se vuelve a pedir.
      toast.error(`No se pudo redactar la llegada: ${describeError(err, 'error desconocido')}`);
      if (n === arrivalLoad.current) setArrivals(first.map((a) => (a.pending ? { ...a, pending: false, warning: 'el generador no respondió' } : a)));
    } finally { proposing.current = false; }
  }, [sceneId]);
  // Se piden cuando los nodos ya están cargados: antes, el reparto vacío y
  // el reparto real disparaban dos lecturas seguidas.
  useEffect(() => { if (nodesLoaded) void refreshArrivals(); }, [refreshArrivals, castKey, nodesLoaded]);
  const [busyArrival, setBusyArrival] = useState<number | null>(null);
  const arrivalActions = useMemo<ArrivalActions>(() => {
    const run = async (characterId: number, what: string, fn: () => Promise<void>) => {
      setBusyArrival(characterId);
      try { await fn(); }
      catch (err) { toast.error(`${what}: ${describeError(err, 'error desconocido')}`); }
      finally { setBusyArrival(null); }
    };
    return {
      accept: (characterId, edit, pos) => run(characterId, 'No se pudo aceptar la llegada', async () => {
        await acceptArrival(sceneId, characterId, { ...edit, canvas_x: pos?.x, canvas_y: pos?.y });
        await refresh();
        await refreshArrivals();
      }),
      dismiss: (characterId) => run(characterId, 'No se pudo descartar la llegada', async () => {
        await dismissArrival(sceneId, characterId);
        await refreshArrivals();
        await refreshState();
      }),
      again: (characterId) => run(characterId, 'No se pudo pedir otra llegada', async () => {
        await regenerateArrival(sceneId, characterId);
        await refreshArrivals();
      }),
      repropose: (characterId) => run(characterId, 'No se pudo proponer la llegada', async () => {
        await reproposeArrival(sceneId, characterId);
        await refreshArrivals();
        await refreshState();
      }),
    };
  }, [sceneId, refresh, refreshArrivals, refreshState]);
  const pendingArrivals = useMemo(() => arrivals.filter((a) => a.status === 'propuesta' && (a.step !== '' || a.pending)).length, [arrivals]);

  const comesFrom = useMemo(() => {
    const titles = [...new Set((carry?.characters ?? []).filter((c) => c.from_scene_id).map((c) => c.from_scene_title || 'escena sin título'))];
    return titles.length ? `Viene de ${titles.map((t) => `«${t}»`).join(', ')}` : '';
  }, [carry]);

  const handleConnect = useCallback(async (fromId: number, toId: number, kind: SceneEdgeKind) => {
    try {
      const e = await createSceneNodeEdge(sceneId, fromId, toId, kind);
      setEdges((prev) => [...prev, e]);
    } catch (err) {
      notifyError('No se pudo conectar')(err);
    }
  }, [sceneId]);

  const handleNodeMove = useCallback(async (id: number, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, canvas_x: x, canvas_y: y } : n));
    try { await updateSceneNodePosition(id, x, y); } catch (err) { console.error(err); }
  }, []);

  const handleMomentEdit = useCallback(async (id: number, patch: { description?: string; outcomes?: string[] }) => {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, ...patch } : n));
    try { await updateSceneNode(id, patch); } catch (err) { console.error(err); }
  }, []);

  const handleNarratorEdit = useCallback(async (id: number, patch: Partial<NarratorNodeConfig>) => {
    const node = nodes.find((n) => n.id === id);
    if (!node) return;
    const cfg = { ...(node.narrator_config ?? { pov: '3rd-limited', style: 'sparse', distance: 'intimate', reliability: 'reliable' }), ...patch };
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, narrator_config: cfg } : n));
    try { await updateSceneNode(id, { narrator_config: cfg }); } catch (err) { console.error(err); }
  }, [nodes]);

  const handleEdgeDelete = useCallback(async (id: number) => {
    setEdges((prev) => prev.filter((e) => e.id !== id));
    try { await deleteSceneNodeEdge(id); } catch (err) { console.error(err); }
  }, []);

  // Un momento nuevo va después del último y queda unido a él: los momentos
  // sueltos no tienen orden de lectura, y nada le decía al autor que había
  // que conectarlos arrastrando.
  const handleAddMoment = useCallback(async () => {
    const withNext = new Set(edges.filter((e) => e.edge_kind === 'flow').map((e) => e.from_node_id));
    const last = nodes
      .filter((n) => n.node_kind === 'moment' && !withNext.has(n.id))
      .sort((a, b) => b.canvas_y - a.canvas_y)[0];
    try {
      const created = await createSceneNode(sceneId, {
        node_kind: 'moment',
        description: '',
        canvas_x: last ? last.canvas_x : 200,
        canvas_y: last ? last.canvas_y + 280 : 200,
      });
      setNodes((prev) => [...prev, created]);
      if (last) {
        const edge = await createSceneNodeEdge(sceneId, last.id, created.id, 'flow');
        setEdges((prev) => [...prev, edge]);
      }
    } catch (err) {
      notifyError('No se pudo añadir el momento')(err);
    }
  }, [sceneId, nodes, edges]);

  const handleAddNarrator = useCallback(async () => {
    const created = await createSceneNode(sceneId, {
      node_kind: 'narrator',
      narrator_config: { pov: '3rd-limited', style: 'sparse', distance: 'intimate', reliability: 'reliable' },
      canvas_x: 80,
      canvas_y: 40 + nodes.filter((n) => n.node_kind === 'narrator').length * 120,
    });
    setNodes((prev) => [...prev, created]);
  }, [sceneId, nodes]);

  // Una indicación nueva sale suelta (vale para toda la escena) y en edición.
  const handleAddDirection = useCallback(async () => {
    try {
      const created = await createSceneNode(sceneId, {
        node_kind: 'direction',
        description: '',
        canvas_x: -500,
        canvas_y: 40 + nodes.filter((n) => n.node_kind === 'direction').length * 150,
      });
      setNodes((prev) => [...prev, created]);
    } catch (err) {
      notifyError('No se pudo añadir la indicación')(err);
    }
  }, [sceneId, nodes]);

  const handleAddCharacter = useCallback(async (characterId: number) => {
    const created = await createSceneNode(sceneId, {
      node_kind: 'character',
      character_id: characterId,
      canvas_x: -220,
      // El nodo trae de dónde viene el personaje: cabe con 230 px entre uno y otro.
      canvas_y: 120 + nodes.filter((n) => n.node_kind === 'character').length * 230,
    });
    setNodes((prev) => [...prev, created]);
  }, [sceneId, nodes]);

  // Una escena ocurre en un solo lugar: elegir otro sustituye al anterior.
  const handleAddLocation = useCallback(async (locationNodeId: number) => {
    const previous = nodes.filter((n) => n.node_kind === 'location');
    const created = await createSceneNode(sceneId, {
      node_kind: 'location',
      location_node_id: locationNodeId,
      canvas_x: -220,
      canvas_y: -60, // encima de la columna de personajes (empieza en 120): no tapa los eventos
    });
    await Promise.all(previous.map((n) => deleteSceneNode(n.id)));
    setNodes((prev) => [...prev.filter((n) => n.node_kind !== 'location'), created]);
  }, [sceneId, nodes]);

  // Con el identificador de la petición se consulta la fase real mientras
  // tanto: escribir, comprobar y reparar puede llevar minutos.
  const trackProgress = useCallback((requestId: string) => {
    const started = Date.now();
    return setInterval(async () => {
      try {
        const { runs, draft } = await getGenerationProgress(requestId);
        if (draft) setLiveDraft(draft);
        const current = runs.find((r) => r.status === 'running') ?? runs[runs.length - 1];
        const seconds = Math.round((Date.now() - started) / 1000);
        setProgress(current ? progressLabel(current.kind, current.phase, seconds) : `esperando al generador · ${seconds} s`);
      } catch {
        // el progreso es informativo: si falla, la generación sigue
      }
    }, 800);
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setProgress('');
    const requestId = newRequestId();
    const poll = trackProgress(requestId);
    try {
      const res = await generateScene(sceneId, requestId, format);
      setUnmetOutcomes(res.unmet_outcomes ?? []);
      const fresh = await listSceneOutputs(sceneId);
      setOutputs(fresh);
      setCurrentVersion(res.version);
      // Tras escribir, el modelo propone cómo queda cada uno; se ve en la
      // escena siguiente, donde el autor lo tacha o corrige.
      setProgress('proponiendo cómo queda cada personaje…');
      try { await proposeSceneState(sceneId); }
      catch (err) { toast.error(`La escena está escrita, pero no se pudo proponer el estado: ${describeError(err, 'error desconocido')}`); }
    } catch (err) {
      toast.error(`No se pudo generar la escena: ${describeError(err, 'error desconocido')}`);
    } finally {
      clearInterval(poll);
      setGenerating(false);
      setProgress('');
      setLiveDraft('');
    }
  }, [sceneId, trackProgress, format]);

  // La hoja de esta escena con las reglas del escritor, para pegarla en otro
  // modelo. Es la misma que recibe el escritor local.
  const handleCopySheet = useCallback(async () => {
    if (storyId == null) return;
    try {
      const plan = await getWritingPlan(storyId);
      if (!plan.scenes.some((s) => s.scene_id === sceneId)) {
        toast.info('La escena no tiene momentos todavía: no hay nada que escribir.');
        return;
      }
      const how = await copyOrDownload(writingPlanMarkdown(plan, sceneId), `hoja-escena-${sceneId}.md`);
      toast.success(how === 'copied' ? 'Hoja copiada. Pégala en el modelo que quieras.' : 'Hoja descargada como fichero.');
    } catch (err) {
      notifyError('No se pudo preparar la hoja')(err);
    }
  }, [storyId, sceneId]);

  // Guarda la prosa pegada como versión nueva y el juez local dice qué
  // "después" no ve. Se guarda aunque falte alguno: decide el autor.
  const handleSaveProse = useCallback(async () => {
    setGenerating(true);
    setProgress('');
    const requestId = newRequestId();
    const poll = trackProgress(requestId);
    try {
      const res = await saveSceneProse(sceneId, pastedText, requestId);
      const unmet = res.unmet_outcomes ?? [];
      setUnmetOutcomes(unmet);
      setOutputs(await listSceneOutputs(sceneId));
      setCurrentVersion(res.version);
      setPasting(false);
      setPastedText('');
      if (unmet.length) toast.warning(`Guardada. El juez no ve ${unmet.length === 1 ? 'una cosa' : `${unmet.length} cosas`} de lo declarado.`);
      else toast.success('Guardada. El juez ve cumplido todo lo declarado.');
    } catch (err) {
      notifyError('No se pudo guardar la prosa')(err);
    } finally {
      clearInterval(poll);
      setGenerating(false);
      setProgress('');
    }
  }, [sceneId, pastedText, trackProgress]);

  const handleVersionSelect = useCallback(async (version: number) => {
    setCurrentVersion(version);
    // El veredicto del juez era de la última prosa, no de la que se elige.
    setUnmetOutcomes([]);
    // Solo la novela es la versión vigente de la escena.
    if (format !== 'prose') return;
    try { await revertSceneOutput(sceneId, version); } catch (err) { console.error(err); }
  }, [sceneId, format]);

  // Las versiones del formato elegido (las antiguas, sin vehicle, son novela).
  const formatOutputs = useMemo(() => outputs.filter((o) => (o.vehicle || 'prose') === format), [outputs, format]);

  const handleFormatChange = useCallback((next: SceneFormat) => {
    setFormat(next);
    setUnmetOutcomes([]);
    const of = outputs.filter((o) => (o.vehicle || 'prose') === next);
    setCurrentVersion((of.find((o) => o.current) ?? of[0])?.version ?? null);
  }, [outputs]);

  const currentProse = useMemo(() => formatOutputs.find((o) => o.version === currentVersion)?.content ?? '', [formatOutputs, currentVersion]);

  const handleCopyOutput = useCallback(async () => {
    try {
      const how = await copyOrDownload(currentProse, `escena-${sceneId}-${format}.txt`);
      toast.success(how === 'copied' ? `Copiado: ${formatInfo(format).label}.` : 'Descargado como fichero.');
    } catch (err) {
      notifyError('No se pudo copiar')(err);
    }
  }, [currentProse, sceneId, format]);

  const outputData = useMemo<OutputNodeData>(() => ({
    prose: generating && liveDraft ? liveDraft : currentProse,
    live: generating && !!liveDraft,
    progress,
    generating,
    unmet: unmetOutcomes,
    versions: <SceneVersionDropdown outputs={formatOutputs} current={currentVersion} onSelect={handleVersionSelect} />,
    onExpand: () => { setPasting(false); setExpanded(true); },
    onPaste: () => { setExpanded(false); setPasting(true); },
    format,
    onFormatChange: handleFormatChange,
    onCopy: handleCopyOutput,
    pendingArrivals,
    onGenerate: handleGenerate,
  }), [generating, liveDraft, currentProse, progress, unmetOutcomes, formatOutputs, currentVersion, handleVersionSelect, format, handleFormatChange, handleCopyOutput, pendingArrivals, handleGenerate]);

  // Ampliar para leer, o pegar una prosa escrita fuera: un panel a la derecha
  // sobre el lienzo, que sigue a la vista.
  const drawer = (expanded || pasting) && (
    <aside aria-label={pasting ? 'Pegar prosa' : 'Prosa de la escena'} style={{
      position: 'absolute', top: 0, right: 0, bottom: 0, width: 'min(640px, 100%)', zIndex: 20,
      display: 'flex', flexDirection: 'column', background: '#fff', borderLeft: '1px solid #e5ded4',
      boxShadow: '-8px 0 24px rgba(30,26,36,0.08)',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, padding: '10px 16px', borderBottom: '1px solid #e5ded4' }}>
        <strong style={{ fontSize: 15 }}>{pasting ? 'Pegar prosa escrita fuera' : 'Prosa de la escena'}</strong>
        <div style={{ display: 'flex', gap: 8 }}>
          {!pasting && storyId != null && (
            <button onClick={handleCopySheet} disabled={generating} style={toolButton} title="Las reglas y la hoja de esta escena, para que escriba otro modelo">Copiar hoja</button>
          )}
          <button onClick={() => { setExpanded(false); setPasting(false); setPastedText(''); }} disabled={generating && pasting} style={toolButton}>Cerrar</button>
        </div>
      </div>
      {pasting ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 16, gap: 10 }}>
          <textarea
            autoFocus
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            disabled={generating}
            placeholder="Pega aquí la escena escrita por otro modelo o por ti. Al guardarla, el juez comprueba que cumple lo que declaraste en cada evento."
            style={{ flex: 1, resize: 'none', padding: 12, border: '1px solid #e5ded4', borderRadius: 8, fontFamily: 'inherit', fontSize: 15, lineHeight: 1.6 }}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
            {generating && <span role="status" style={{ fontSize: 13, color: '#5f5868' }}>{progress || 'guardando…'}</span>}
            <button onClick={handleSaveProse} disabled={generating || !pastedText.trim()} style={primaryButton}>
              {generating ? 'Comprobando…' : 'Guardar y comprobar'}
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, minHeight: 0 }}>
          {outputData.prose ? <SceneProseView content={outputData.prose} /> : <div style={{ padding: 24, color: '#5f5868' }}>Aún no hay prosa.</div>}
        </div>
      )}
    </aside>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#f4f1ec' }}>
      <header style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', background: '#fff', borderBottom: '1px solid #e5ded4' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <button onClick={onBack} style={toolButton} aria-label="Volver a la historia">←</button>
          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {storyTitle && <span style={{ fontSize: 13, color: '#5f5868' }}>{storyTitle}</span>}
            <h1 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {sceneTitle || 'Escena'}
            </h1>
            {comesFrom && <span style={{ fontSize: 13, color: '#9a3412' }}>{comesFrom}</span>}
          </div>
        </div>
        <ScenePalette
          onAddMoment={handleAddMoment}
          onAddNarrator={handleAddNarrator}
          onAddDirection={handleAddDirection}
          onAddCharacter={handleAddCharacter}
          onAddLocation={handleAddLocation}
          onCreateLocation={onCreateLocation}
          castOptions={castOptions}
          locationOptions={locationOptions}
          onGenerate={handleGenerate}
          generating={generating}
          generateLabel={format === 'prose' ? 'Escribir escena' : `Escribir · ${formatInfo(format).label}`}
        />
      </header>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <SceneCanvas
          nodes={nodes}
          edges={edges}
          onConnect={handleConnect}
          onNodeMove={handleNodeMove}
          onMomentEdit={handleMomentEdit}
          onNarratorEdit={handleNarratorEdit}
          onEdgeDelete={handleEdgeDelete}
          unmetOutcomes={unmetOutcomes}
          charNameByID={charMap}
          carryByCharID={carryByCharID}
          stateByCharID={stateByCharID}
          stateActions={stateActions}
          viewHints={viewHints}
          locationByID={locMap}
          output={outputData}
          arrivals={arrivals}
          arrivalActions={arrivalActions}
          busyArrival={busyArrival}
        />
        {drawer}
      </div>
    </div>
  );
}

const toolButton = {
  height: 40, padding: '0 14px', border: '1px solid #ddd5cb', borderRadius: 10,
  background: '#fff', color: '#1e1a24', fontSize: 14, cursor: 'pointer',
} as const;

const primaryButton = {
  height: 40, padding: '0 18px', border: 0, borderRadius: 10,
  background: '#7f2d2d', color: '#fff', fontSize: 15, fontWeight: 600, cursor: 'pointer',
} as const;

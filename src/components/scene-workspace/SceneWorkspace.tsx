import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  listSceneNodes, listSceneNodeEdges, createSceneNode, updateSceneNode, deleteSceneNode,
  updateSceneNodePosition, deleteSceneNodeEdge, createSceneNodeEdge,
  generateScene, listSceneOutputs, revertSceneOutput, getGenerationProgress,
  getWritingPlan, saveSceneProse,
  type SceneNode, type SceneNodeEdge, type SceneEdgeKind, type SceneOutput,
} from '../../services/api';
import { SceneCanvas } from './SceneCanvas';
import { ScenePalette } from './ScenePalette';
import { SceneProseView } from './SceneProseView';
import { SceneVersionDropdown } from './SceneVersionDropdown';
import { SplitView } from './SplitView';
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
  locationByID?: Record<number, { name: string; nodeType?: string; narrativeFunction?: string; atmosphere?: string }>;
  /** Para copiar la hoja de esta escena del plan de escritura de la historia. */
  storyId?: number;
}

export function SceneWorkspace({ sceneId, storyId, onBack, charNameByID, locationByID }: SceneWorkspaceProps) {
  const charMap = useMemo(() => charNameByID ?? {}, [charNameByID]);
  const locMap = useMemo(() => locationByID ?? {}, [locationByID]);
  const castOptions = useMemo(
    () => Object.entries(charMap).map(([id, name]) => ({ id: Number(id), name })),
    [charMap],
  );
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
  // Prosa escrita fuera (otro modelo o el autor) pegada aquí.
  const [pasting, setPasting] = useState(false);
  const [pastedText, setPastedText] = useState('');

  const refresh = useCallback(async () => {
    const [n, e, o] = await Promise.all([
      listSceneNodes(sceneId), listSceneNodeEdges(sceneId), listSceneOutputs(sceneId),
    ]);
    setNodes(n); setEdges(e); setOutputs(o);
    if (o.length && currentVersion === null) setCurrentVersion(o[0].version);
  }, [sceneId, currentVersion]);

  useEffect(() => { void refresh(); }, [refresh]);

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

  const handleNarratorEdit = useCallback(async (id: number, patch: Partial<{ pov: string; style: string; distance: string; reliability: string }>) => {
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

  const handleAddCharacter = useCallback(async (characterId: number) => {
    const created = await createSceneNode(sceneId, {
      node_kind: 'character',
      character_id: characterId,
      canvas_x: -160,
      canvas_y: 120 + nodes.filter((n) => n.node_kind === 'character').length * 100,
    });
    setNodes((prev) => [...prev, created]);
  }, [sceneId, nodes]);

  // Una escena ocurre en un solo lugar: elegir otro sustituye al anterior.
  const handleAddLocation = useCallback(async (locationNodeId: number) => {
    const previous = nodes.filter((n) => n.node_kind === 'location');
    const created = await createSceneNode(sceneId, {
      node_kind: 'location',
      location_node_id: locationNodeId,
      canvas_x: 80,
      canvas_y: -80,
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
        const { runs } = await getGenerationProgress(requestId);
        const current = runs.find((r) => r.status === 'running') ?? runs[runs.length - 1];
        const seconds = Math.round((Date.now() - started) / 1000);
        setProgress(current ? progressLabel(current.kind, current.phase, seconds) : `esperando al generador · ${seconds} s`);
      } catch {
        // el progreso es informativo: si falla, la generación sigue
      }
    }, 2000);
  }, []);

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    setProgress('');
    const requestId = newRequestId();
    const poll = trackProgress(requestId);
    try {
      const res = await generateScene(sceneId, requestId);
      setUnmetOutcomes(res.unmet_outcomes ?? []);
      const fresh = await listSceneOutputs(sceneId);
      setOutputs(fresh);
      setCurrentVersion(res.version);
    } catch (err) {
      toast.error(`No se pudo generar la escena: ${describeError(err, 'error desconocido')}`);
    } finally {
      clearInterval(poll);
      setGenerating(false);
      setProgress('');
    }
  }, [sceneId, trackProgress]);

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
    try { await revertSceneOutput(sceneId, version); } catch (err) { console.error(err); }
  }, [sceneId]);

  const currentProse = useMemo(() => outputs.find((o) => o.version === currentVersion)?.content ?? '', [outputs, currentVersion]);

  const canvas = (
    <>
      <ScenePalette
        onAddMoment={handleAddMoment}
        onAddNarrator={handleAddNarrator}
        onAddCharacter={handleAddCharacter}
        onAddLocation={handleAddLocation}
        castOptions={castOptions}
        locationOptions={locationOptions}
        onGenerate={handleGenerate}
        generating={generating}
        progress={progress}
      />
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
        locationByID={locMap}
      />
    </>
  );

  const prose = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #e5e7eb', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
        <SceneVersionDropdown outputs={outputs} current={currentVersion} onSelect={handleVersionSelect} />
        <div style={{ display: 'flex', gap: 10, whiteSpace: 'nowrap', flexWrap: 'wrap' }}>
          {storyId != null && (
            <button onClick={handleCopySheet} disabled={generating} title="Las reglas y la hoja de esta escena, para que escriba otro modelo">
              Copiar hoja
            </button>
          )}
          <button onClick={() => setPasting((v) => !v)} disabled={generating} title="Pegar una prosa escrita fuera y que el juez la compruebe">
            {pasting ? 'Ver prosa' : 'Pegar prosa'}
          </button>
          <button onClick={handleGenerate} disabled={generating}>
            {generating ? 'Generando…' : 'Regenerar'}
          </button>
        </div>
      </div>
      {unmetOutcomes.length > 0 && !pasting && (
        <div style={{ padding: '6px 12px', background: '#fef2f2', borderBottom: '1px solid #fecaca', fontSize: 12, color: '#b91c1c' }}>
          El juez no ve en esta prosa: {unmetOutcomes.join(' · ')}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {pasting ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 12, gap: 8 }}>
            <textarea
              autoFocus
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              disabled={generating}
              placeholder="Pega aquí la escena escrita por otro modelo o por ti. Al guardarla, el juez comprueba que cumple lo que declaraste en cada momento."
              style={{ flex: 1, resize: 'none', padding: 12, border: '1px solid #e5e7eb', borderRadius: 6, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 8 }}>
              {generating && <span style={{ fontSize: 12, color: '#6b7280' }}>{progress || 'guardando…'}</span>}
              <button onClick={() => { setPasting(false); setPastedText(''); }} disabled={generating}>Cancelar</button>
              <button onClick={handleSaveProse} disabled={generating || !pastedText.trim()}>
                {generating ? 'Comprobando…' : 'Guardar y comprobar'}
              </button>
            </div>
          </div>
        ) : currentProse ? <SceneProseView content={currentProse} /> : <div style={{ padding: 24, color: '#9ca3af' }}>Aún no se ha generado prosa.</div>}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <div style={{ padding: 8, borderBottom: '1px solid #e5e7eb' }}>
        <button onClick={onBack}>← Volver al grafo</button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <SplitView left={canvas} right={prose} />
      </div>
    </div>
  );
}

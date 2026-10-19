import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  listSceneNodes, listSceneNodeEdges, createSceneNode, updateSceneNode, deleteSceneNode,
  updateSceneNodePosition, deleteSceneNodeEdge, createSceneNodeEdge,
  generateScene, listSceneOutputs, revertSceneOutput,
  type SceneNode, type SceneNodeEdge, type SceneEdgeKind, type SceneOutput,
} from '../../services/api';
import { SceneCanvas } from './SceneCanvas';
import { ScenePalette } from './ScenePalette';
import { SceneProseView } from './SceneProseView';
import { SceneVersionDropdown } from './SceneVersionDropdown';
import { SplitView } from './SplitView';

interface SceneWorkspaceProps {
  sceneId: number;
  onBack: () => void;
  charNameByID?: Record<number, string>;
  locationByID?: Record<number, { name: string; nodeType?: string; narrativeFunction?: string; atmosphere?: string }>;
  /** Accepted for backwards compatibility with StoryGraphCanvas; not used. */
  storyId?: number;
}

export function SceneWorkspace({ sceneId, onBack, charNameByID, locationByID }: SceneWorkspaceProps) {
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
      console.error('edge create failed', err);
    }
  }, [sceneId]);

  const handleNodeMove = useCallback(async (id: number, x: number, y: number) => {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, canvas_x: x, canvas_y: y } : n));
    try { await updateSceneNodePosition(id, x, y); } catch (err) { console.error(err); }
  }, []);

  const handleMomentEdit = useCallback(async (id: number, description: string) => {
    setNodes((prev) => prev.map((n) => n.id === id ? { ...n, description } : n));
    try { await updateSceneNode(id, { description }); } catch (err) { console.error(err); }
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

  const handleAddMoment = useCallback(async () => {
    const created = await createSceneNode(sceneId, {
      node_kind: 'moment',
      description: '',
      canvas_x: 200 + Math.random() * 100,
      canvas_y: 200 + nodes.filter((n) => n.node_kind === 'moment').length * 120,
    });
    setNodes((prev) => [...prev, created]);
  }, [sceneId, nodes]);

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

  const handleGenerate = useCallback(async () => {
    setGenerating(true);
    try {
      const res = await generateScene(sceneId);
      const fresh = await listSceneOutputs(sceneId);
      setOutputs(fresh);
      setCurrentVersion(res.version);
    } catch (err) {
      console.error(err);
      alert(`Error generando: ${(err as Error).message}`);
    } finally {
      setGenerating(false);
    }
  }, [sceneId]);

  const handleVersionSelect = useCallback(async (version: number) => {
    setCurrentVersion(version);
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
      />
      <SceneCanvas
        nodes={nodes}
        edges={edges}
        onConnect={handleConnect}
        onNodeMove={handleNodeMove}
        onMomentEdit={handleMomentEdit}
        onNarratorEdit={handleNarratorEdit}
        onEdgeDelete={handleEdgeDelete}
        charNameByID={charMap}
        locationByID={locMap}
      />
    </>
  );

  const prose = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', padding: 8, borderBottom: '1px solid #e5e7eb', alignItems: 'center' }}>
        <SceneVersionDropdown outputs={outputs} current={currentVersion} onSelect={handleVersionSelect} />
        <button onClick={handleGenerate} disabled={generating}>
          {generating ? 'Generando…' : 'Regenerar'}
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {currentProse ? <SceneProseView content={currentProse} /> : <div style={{ padding: 24, color: '#9ca3af' }}>Aún no se ha generado prosa.</div>}
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

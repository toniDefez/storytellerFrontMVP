import { useState, useCallback, useEffect, useRef } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  type Node,
  type Edge,
  type Connection,
  type OnNodeDrag,
  type NodeMouseHandler,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  getStoryDetail,
  updateStory,
  addStoryCharacter,
  removeStoryCharacter,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  createFact,
  updateFact,
  deleteFact,
  getStoryGraph,
  getLocationGraph,
  createScene,
  createSceneEdge,
  updateScenePosition,
  setSceneOpening,
  getWritingPlan,
} from '@/services/api'
import type {
  StoryBrief,
  CharacterBrief,
  StoryDetail,
  StoryCharacter,
  NarratorConfig,
  SceneBrief,
  SceneEdge,
} from '@/services/api'
import { InicioNode, type InicioNodeData } from './InicioNode'
import { SceneNode, type SceneNodeData } from './SceneNode'
import { StoryGraphPanel, type PanelMode } from './StoryGraphPanel'
import { SceneWorkspace } from '@/components/scene-workspace/SceneWorkspace'
import { StoryReader } from './StoryReader'
import { writingPlanMarkdown, copyOrDownload } from '@/lib/writingPlan'
import { notifyError } from '@/lib/notifyError'

/* ── Node types ─────────────────────────────────────────────────── */

const nodeTypes = {
  inicio: InicioNode,
  scene: SceneNode,
}

/* ── Build INICIO node ──────────────────────────────────────────── */

function buildInicioNode(
  story: StoryBrief,
  isConfigured: boolean,
  onOpen: () => void,
): Node<InicioNodeData> {
  return {
    id: 'inicio',
    type: 'inicio',
    position: { x: 400, y: 80 },
    draggable: true,
    selectable: true,
    data: {
      storyTitle: story.title,
      isConfigured,
      onOpen,
    },
  }
}

/* ── Convert SceneBrief to ReactFlow Node ───────────────────────── */

function buildSceneNode(scene: SceneBrief, charactersById: Map<number, string>): Node<SceneNodeData> {
  const ids = scene.character_ids ?? []
  const characterNames = ids
    .map(id => charactersById.get(id))
    .filter((name): name is string => typeof name === 'string')
  return {
    id: `scene-${scene.id}`,
    type: 'scene',
    position: { x: scene.canvas_x, y: scene.canvas_y },
    draggable: true,
    selectable: true,
    data: {
      title: scene.title,
      status: scene.status,
      locationName: scene.location_name,
      characterCount: scene.character_count,
      characterNames,
    },
  }
}

/* ── Convert SceneEdge to ReactFlow Edge ───────────────────────── */

function buildFlowEdge(edge: SceneEdge): Edge {
  return {
    id: `edge-${edge.id}`,
    source: `scene-${edge.from_scene_id}`,
    target: `scene-${edge.to_scene_id}`,
    animated: true,
    style: { stroke: '#06b6d4' },
    data: { backendId: edge.id },
  }
}

/* ── Build INICIO→scene edge (persistence via scene.is_opening) ──── */

function buildInicioEdge(sceneId: number): Edge {
  return {
    id: `inicio-scene-${sceneId}`,
    source: 'inicio',
    target: `scene-${sceneId}`,
    animated: true,
    style: { stroke: '#06b6d4', strokeDasharray: '5 5' },
  }
}

/* ── Props ──────────────────────────────────────────────────────── */

interface Props {
  storyBrief: StoryBrief
  worldCharacters: CharacterBrief[]
  onSceneEntered?: (entered: boolean) => void
}

/* ── Main component ─────────────────────────────────────────────── */

export function StoryGraphCanvas({ storyBrief, worldCharacters, onSceneEntered }: Props) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelMode, setPanelMode] = useState<PanelMode>('inicio')
  const [selectedSceneId, setSelectedSceneId] = useState<number | undefined>()
  const [detail, setDetail] = useState<StoryDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)
  const [graphLoading, setGraphLoading] = useState(false)

  // Create scene dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newSceneTitle, setNewSceneTitle] = useState('')
  const [creatingScene, setCreatingScene] = useState(false)

  // Entered scene workspace
  const [enteredSceneId, setEnteredSceneId] = useState<number | null>(null)
  const [reading, setReading] = useState(false)

  // Plan de escritura: para que la prosa la escriba otro modelo o el autor.
  const [copyingPlan, setCopyingPlan] = useState(false)
  const handleCopyPlan = useCallback(async () => {
    setCopyingPlan(true)
    try {
      const plan = await getWritingPlan(storyBrief.id)
      if (plan.scenes.length === 0) {
        toast.info('Ninguna escena tiene momentos todavía: no hay nada que escribir.')
        return
      }
      const how = await copyOrDownload(writingPlanMarkdown(plan), `plan-${storyBrief.id}.md`)
      toast.success(how === 'copied'
        ? `Plan copiado: ${plan.scenes.length === 1 ? 'una escena' : `${plan.scenes.length} escenas`}. Pégalo en el modelo que quieras.`
        : 'Plan descargado como fichero.')
    } catch (err) {
      notifyError('No se pudo preparar el plan')(err)
    } finally {
      setCopyingPlan(false)
    }
  }, [storyBrief.id])

  // Track last created node position to offset next one
  const lastPositionRef = useRef({ x: 400, y: 300 })

  const openInicioPanel = useCallback(() => {
    setPanelMode('inicio')
    setPanelOpen(true)
  }, [])

  const closePanel = useCallback(() => setPanelOpen(false), [])

  /* ── React Flow state ─── */
  type AnyNode = Node<InicioNodeData> | Node<SceneNodeData>
  const [nodes, setNodes, onNodesChange] = useNodesState<AnyNode>([
    buildInicioNode(storyBrief, false, openInicioPanel),
  ])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  /* ── Load story detail (for INICIO panel) ─── */
  useEffect(() => {
    if (!panelOpen || panelMode !== 'inicio') return
    if (detail?.story.id === storyBrief.id) return

    setLoadingDetail(true)
    getStoryDetail(storyBrief.id)
      .then(setDetail)
      .catch(err => toast.error(err instanceof Error ? err.message : 'Error al cargar la historia.'))
      .finally(() => setLoadingDetail(false))
  }, [panelOpen, panelMode, storyBrief.id, detail?.story.id])

  /* ── Cast and places for the scene workspace ─── */
  // El workspace pinta personajes y lugares por id, y su paleta ofrece el
  // reparto de la historia y las localizaciones del mundo. Sin estos mapas los
  // nodos salían como "?" y no había forma de añadirlos a la escena.
  const [workspaceCharNames, setWorkspaceCharNames] = useState<Record<number, string>>({})
  const [workspaceLocations, setWorkspaceLocations] = useState<Record<number, { name: string; nodeType?: string; narrativeFunction?: string; atmosphere?: string }>>({})

  useEffect(() => {
    if (enteredSceneId == null) return
    let cancelled = false
    getStoryDetail(storyBrief.id)
      .then(async d => {
        const graph = await getLocationGraph(d.story.world_id)
        if (cancelled) return
        setWorkspaceCharNames(Object.fromEntries((d.characters ?? []).map(c => [c.character_id, c.name])))
        setWorkspaceLocations(Object.fromEntries((graph.nodes ?? []).map(n => [n.id, {
          name: n.name,
          nodeType: n.node_type,
          narrativeFunction: n.narrative_function,
        }])))
      })
      .catch(err => toast.error(err instanceof Error ? err.message : 'Error al cargar el reparto de la escena.'))
    return () => { cancelled = true }
  }, [enteredSceneId, storyBrief.id])

  /* ── Load scene graph ─── */
  const loadGraph = useCallback(async () => {
    setGraphLoading(true)
    try {
      const graph = await getStoryGraph(storyBrief.id)
      const charactersById = new Map(worldCharacters.map(c => [c.id, c.name]))
      const sceneNodes = graph.scenes.map(s => buildSceneNode(s, charactersById))
      const inicioEdges = graph.scenes
        .filter(s => s.is_opening)
        .map(s => buildInicioEdge(s.id))
      const flowEdges = [...inicioEdges, ...graph.edges.map(buildFlowEdge)]

      // Track last position from scenes
      if (graph.scenes.length > 0) {
        const last = graph.scenes[graph.scenes.length - 1]
        lastPositionRef.current = { x: last.canvas_x, y: last.canvas_y + 160 }
      }

      // Rebuild INICIO node preserving its position if already set
      const isConfigured = (detail?.characters?.length ?? 0) > 0
      const inicioNode = buildInicioNode(storyBrief, isConfigured, openInicioPanel)

      setNodes([inicioNode, ...sceneNodes] as AnyNode[])
      setEdges(flowEdges)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar el grafo de escenas.')
    } finally {
      setGraphLoading(false)
    }
  }, [storyBrief, worldCharacters, detail?.characters?.length, openInicioPanel, setNodes, setEdges])

  // Initial load + reload when story changes
  useEffect(() => {
    setDetail(null)
    setPanelOpen(false)
    setSelectedSceneId(undefined)
    loadGraph()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storyBrief.id])

  /* ── Keep INICIO node in sync with isConfigured ─── */
  const isConfigured = (detail?.characters?.length ?? 0) > 0
  useEffect(() => {
    setNodes(prev =>
      prev.map(n =>
        n.id === 'inicio'
          ? { ...n, data: { ...n.data, storyTitle: storyBrief.title, isConfigured, onOpen: openInicioPanel } }
          : n
      ) as AnyNode[]
    )
  }, [storyBrief, isConfigured, openInicioPanel, setNodes])

  /* ── Reload detail ─── */
  const reloadDetail = useCallback(async () => {
    try {
      const d = await getStoryDetail(storyBrief.id)
      setDetail(d)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al recargar la historia.')
    }
  }, [storyBrief.id])

  /* ── Double-click on canvas closes panel ─── */
  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.closest('.react-flow__node')) return
    if (panelOpen) closePanel()
  }, [panelOpen, closePanel])

  /* ── Node click ─── */
  const handleNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    if (node.id === 'inicio') {
      openInicioPanel()
      return
    }
    if (node.id.startsWith('scene-')) {
      const sceneId = parseInt(node.id.replace('scene-', ''), 10)
      setSelectedSceneId(sceneId)
      setPanelMode('scene')
      setPanelOpen(true)
    }
  }, [openInicioPanel])

  /* ── Node double-click → enter scene workspace ─── */
  const handleNodeDoubleClick: NodeMouseHandler = useCallback((_event, node) => {
    if (!node.id.startsWith('scene-')) return
    const sceneId = parseInt(node.id.replace('scene-', ''), 10)
    setEnteredSceneId(sceneId)
    setPanelOpen(false)
    onSceneEntered?.(true)
  }, [onSceneEntered])

  /* ── Create scene ─── */
  const handleOpenCreateDialog = () => {
    setNewSceneTitle('')
    setCreateDialogOpen(true)
  }

  const handleCreateScene = async () => {
    if (!newSceneTitle.trim()) return
    setCreatingScene(true)
    try {
      const pos = lastPositionRef.current
      await createScene(storyBrief.id, newSceneTitle.trim(), pos.x, pos.y)
      lastPositionRef.current = { x: pos.x, y: pos.y + 160 }
      await loadGraph()
      toast.success('Escena creada.')
      setCreateDialogOpen(false)
      setNewSceneTitle('')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al crear la escena.')
    } finally {
      setCreatingScene(false)
    }
  }

  /* ── Connect scenes ─── */
  const handleConnect = useCallback(async (connection: Connection) => {
    const { source, target } = connection
    if (!source || !target) return

    // INICIO → scene: mark scene as opening
    if (source === 'inicio' && target.startsWith('scene-')) {
      const sceneId = parseInt(target.replace('scene-', ''), 10)
      if (isNaN(sceneId)) return
      try {
        await setSceneOpening(sceneId, true)
        setEdges(eds => addEdge(buildInicioEdge(sceneId), eds))
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Error al marcar escena de apertura.')
      }
      return
    }

    // Real edge between scene nodes
    if (!source.startsWith('scene-') || !target.startsWith('scene-')) return

    const fromId = parseInt(source.replace('scene-', ''), 10)
    const toId = parseInt(target.replace('scene-', ''), 10)
    if (isNaN(fromId) || isNaN(toId)) return

    try {
      const edge = await createSceneEdge(fromId, toId)
      const flowEdge = buildFlowEdge(edge)
      setEdges(eds => addEdge(flowEdge, eds))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al conectar escenas.')
    }
  }, [setEdges])

  /* ── Edge delete → unset is_opening for INICIO edges ─── */
  const handleEdgesDelete = useCallback((deleted: Edge[]) => {
    for (const edge of deleted) {
      if (edge.source !== 'inicio') continue
      if (!edge.target.startsWith('scene-')) continue
      const sceneId = parseInt(edge.target.replace('scene-', ''), 10)
      if (isNaN(sceneId)) continue
      setSceneOpening(sceneId, false).catch(err => {
        toast.error(err instanceof Error ? err.message : 'Error al desmarcar escena de apertura.')
      })
    }
  }, [])

  /* ── Drag stop → persist position ─── */
  const handleNodeDragStop: OnNodeDrag = useCallback((_event, node) => {
    if (!node.id.startsWith('scene-')) return
    const sceneId = parseInt(node.id.replace('scene-', ''), 10)
    updateScenePosition(sceneId, node.position.x, node.position.y).catch(() => {
      // silent — position drift is acceptable
    })
  }, [])

  /* ── Scene delete ─── */
  const handleSceneDelete = useCallback(async () => {
    closePanel()
    setSelectedSceneId(undefined)
    await loadGraph()
  }, [closePanel, loadGraph])

  /* ── Scene title change → refresh node labels ─── */
  const handleSceneTitleChange = useCallback(async () => {
    await loadGraph()
  }, [loadGraph])

  /* ── Derived data for INICIO panel ─── */
  const storyCharacters = detail?.characters ?? []
  const relationships = detail?.relationships ?? []
  const facts = detail?.facts ?? []
  const rosteredIds = new Set(storyCharacters.map((c: StoryCharacter) => c.character_id))
  const availableCharacters = worldCharacters.filter(c => !rosteredIds.has(c.id))
  const narratorConfig: NarratorConfig = detail?.story.narrator_default ?? {
    pov: '',
    style: '',
    distance: '',
    reliability: '',
  }

  /* ── Story-level handlers ─── */
  const handleAddCharacter = async (characterId: number) => {
    await addStoryCharacter(storyBrief.id, characterId)
    await reloadDetail()
    toast.success('Personaje añadido al reparto.')
  }

  const handleRemoveCharacter = async (characterId: number) => {
    await removeStoryCharacter(storyBrief.id, characterId)
    await reloadDetail()
    toast.success('Personaje eliminado del reparto.')
  }

  const handleCreateRelationship = async (data: {
    character_a_id: number
    character_b_id: number
    rel_type: string
    subtype: string
    description?: string
    directional: boolean
  }) => {
    await createRelationship(storyBrief.id, data)
    await reloadDetail()
    toast.success('Relación creada.')
  }

  const handleUpdateRelationship = async (
    relId: number,
    data: { rel_type: string; subtype: string; description?: string; directional: boolean },
  ) => {
    await updateRelationship(relId, data)
    await reloadDetail()
    toast.success('Relación actualizada.')
  }

  const handleDeleteRelationship = async (relId: number) => {
    await deleteRelationship(relId)
    await reloadDetail()
    toast.success('Relación eliminada.')
  }

  const handleAddFact = async (content: string, knownBy: number[]) => {
    await createFact(storyBrief.id, content, knownBy)
    await reloadDetail()
    toast.success('Hecho añadido.')
  }

  const handleUpdateFact = async (factId: number, content: string, knownBy: number[]) => {
    await updateFact(factId, content, knownBy)
    await reloadDetail()
  }

  const handleDeleteFact = async (factId: number) => {
    await deleteFact(factId)
    await reloadDetail()
    toast.success('Hecho eliminado.')
  }

  const handleNarratorChange = async (config: NarratorConfig) => {
    if (!detail) return
    setDetail(prev => prev ? { ...prev, story: { ...prev.story, narrator_default: config } } : prev)
    try {
      await updateStory(storyBrief.id, { narrator_default: config })
    } catch {
      toast.error('Error al guardar la configuración del narrador.')
      await reloadDetail()
    }
  }

  /* ── Reader view ─── */
  if (reading) {
    return (
      <StoryReader
        storyId={storyBrief.id}
        title={storyBrief.title}
        onBack={() => {
          setReading(false)
          onSceneEntered?.(false)
        }}
      />
    )
  }

  /* ── Scene workspace view ─── */
  if (enteredSceneId != null) {
    return (
      <SceneWorkspace
        sceneId={enteredSceneId}
        storyId={storyBrief.id}
        storyTitle={storyBrief.title}
        sceneTitle={String(nodes.find((n) => n.id === `scene-${enteredSceneId}`)?.data?.title ?? '')}
        charNameByID={workspaceCharNames}
        locationByID={workspaceLocations}
        onBack={() => {
          setEnteredSceneId(null)
          onSceneEntered?.(false)
        }}
      />
    )
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Canvas ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 h-full relative" onDoubleClick={handleCanvasDoubleClick}>
        <div className="absolute top-3 right-3 z-20 flex gap-2" onDoubleClick={e => e.stopPropagation()}>
          <button
            onClick={handleCopyPlan}
            disabled={copyingPlan}
            title="Las reglas y la hoja de cada escena, para que escriba otro modelo"
            className="bg-white/90 border border-stone-200 rounded-lg shadow-sm px-3 py-1.5 text-sm text-stone-700 hover:text-foreground transition-colors disabled:opacity-60"
          >
            {copyingPlan ? 'Preparando plan…' : 'Copiar plan de escritura'}
          </button>
          <button
            onClick={() => {
              setReading(true)
              onSceneEntered?.(true)
            }}
            className="bg-white/90 border border-stone-200 rounded-lg shadow-sm px-3 py-1.5 text-sm text-stone-700 hover:text-foreground transition-colors"
          >
            Leer historia
          </button>
        </div>
        {(loadingDetail || graphLoading) && (
          <div className="absolute top-14 right-3 z-10 flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-lg shadow-sm text-xs text-muted-foreground">
            <div className="w-3 h-3 border border-[#06b6d4]/30 border-t-[#06b6d4] rounded-full animate-spin" />
            Cargando…
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={handleNodeClick}
          onNodeDoubleClick={handleNodeDoubleClick}
          onConnect={handleConnect}
          onEdgesDelete={handleEdgesDelete}
          onNodeDragStop={handleNodeDragStop}
          onPaneClick={closePanel}
          fitView
          fitViewOptions={{ padding: 0.4 }}
          minZoom={0.3}
          maxZoom={2}
          className="bg-[hsl(40_20%_97%)]"
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#e8e0d4" gap={20} size={1} />
          <Controls
            showInteractive={false}
            className="!border-stone-200 !shadow-sm"
          />
        </ReactFlow>

        {/* ── Create scene FAB ─── */}
        <button
          onClick={handleOpenCreateDialog}
          className="
            absolute bottom-14 right-4 z-10
            bg-cyan-500 text-white rounded-full w-10 h-10 shadow-lg
            hover:bg-cyan-600 active:scale-95
            flex items-center justify-center
            transition-all duration-150
          "
          title="Nueva escena"
          aria-label="Crear nueva escena"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* ── Right panel ────────────────────────────────────────── */}
      <StoryGraphPanel
        open={panelOpen}
        onClose={closePanel}
        selectedMode={panelMode}
        selectedSceneId={selectedSceneId}
        storyTitle={storyBrief.title}
        storyCharacters={storyCharacters}
        availableCharacters={availableCharacters}
        relationships={relationships}
        facts={facts}
        narratorConfig={narratorConfig}
        onAddCharacter={handleAddCharacter}
        onRemoveCharacter={handleRemoveCharacter}
        onCreateRelationship={handleCreateRelationship}
        onUpdateRelationship={handleUpdateRelationship}
        onDeleteRelationship={handleDeleteRelationship}
        onAddFact={handleAddFact}
        onUpdateFact={handleUpdateFact}
        onDeleteFact={handleDeleteFact}
        onNarratorChange={handleNarratorChange}
        onSceneDelete={handleSceneDelete}
        onSceneTitleChange={handleSceneTitleChange}
      />

      {/* ── Create scene dialog ──────────────────────────────────── */}
      <Dialog open={createDialogOpen} onOpenChange={open => { if (!open) setCreateDialogOpen(false) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva escena</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Input
              placeholder="Título de la escena…"
              value={newSceneTitle}
              onChange={e => setNewSceneTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleCreateScene() }}
              autoFocus
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setCreateDialogOpen(false)}
              disabled={creatingScene}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateScene}
              disabled={!newSceneTitle.trim() || creatingScene}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {creatingScene ? 'Creando…' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

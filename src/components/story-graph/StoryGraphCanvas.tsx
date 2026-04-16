import { useState, useCallback, useEffect } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toast } from 'sonner'
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
} from '@/services/api'
import type {
  StoryBrief,
  CharacterBrief,
  StoryDetail,
  StoryCharacter,
  NarratorConfig,
} from '@/services/api'
import { InicioNode, type InicioNodeData } from './InicioNode'
import { StoryGraphPanel } from './StoryGraphPanel'

/* ── Node types ─────────────────────────────────────────────────── */

const nodeTypes = {
  inicio: InicioNode,
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
    position: { x: 400, y: 200 },
    draggable: false,
    selectable: false,
    data: {
      storyTitle: story.title,
      isConfigured,
      onOpen,
    },
  }
}

/* ── Props ──────────────────────────────────────────────────────── */

interface Props {
  storyBrief: StoryBrief
  worldCharacters: CharacterBrief[]
}

/* ── Main component ─────────────────────────────────────────────── */

export function StoryGraphCanvas({ storyBrief, worldCharacters }: Props) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [detail, setDetail] = useState<StoryDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const openPanel = useCallback(() => setPanelOpen(true), [])
  const closePanel = useCallback(() => setPanelOpen(false), [])

  // Load story detail when panel opens (lazy)
  useEffect(() => {
    if (!panelOpen) return
    if (detail?.story.id === storyBrief.id) return // already loaded for this story

    setLoadingDetail(true)
    getStoryDetail(storyBrief.id)
      .then(setDetail)
      .catch(err => toast.error(err instanceof Error ? err.message : 'Error al cargar la historia.'))
      .finally(() => setLoadingDetail(false))
  }, [panelOpen, storyBrief.id, detail?.story.id])

  // Re-fetch when story changes
  useEffect(() => {
    setDetail(null)
    setPanelOpen(false)
  }, [storyBrief.id])

  const reload = useCallback(async () => {
    try {
      const d = await getStoryDetail(storyBrief.id)
      setDetail(d)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al recargar la historia.')
    }
  }, [storyBrief.id])

  /* ── Derive configured status ─── */
  const isConfigured = (detail?.characters?.length ?? 0) > 0

  /* ── React Flow nodes ─── */
  const [nodes, setNodes, onNodesChange] = useNodesState<Node<InicioNodeData>>([
    buildInicioNode(storyBrief, isConfigured, openPanel),
  ])
  const [edges, , onEdgesChange] = useEdgesState([])

  // Re-sync node data when story or config status changes
  useEffect(() => {
    setNodes([buildInicioNode(storyBrief, isConfigured, openPanel)])
  }, [storyBrief, isConfigured, openPanel, setNodes])

  /* ── Double-click on canvas closes panel ─── */
  // We listen to dblclick at the DOM level via onDoubleClick on the wrapper div
  const handleCanvasDoubleClick = useCallback((e: React.MouseEvent) => {
    // Only close if the click target is the pane itself (not a node)
    const target = e.target as HTMLElement
    if (target.closest('.react-flow__node')) return
    if (panelOpen) closePanel()
  }, [panelOpen, closePanel])

  /* ── Derived data for panel ─── */
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

  /* ── Handlers ─── */

  const handleAddCharacter = async (characterId: number) => {
    await addStoryCharacter(storyBrief.id, characterId)
    await reload()
    toast.success('Personaje añadido al reparto.')
  }

  const handleRemoveCharacter = async (characterId: number) => {
    await removeStoryCharacter(storyBrief.id, characterId)
    await reload()
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
    await reload()
    toast.success('Relación creada.')
  }

  const handleUpdateRelationship = async (
    relId: number,
    data: { rel_type: string; subtype: string; description?: string; directional: boolean },
  ) => {
    await updateRelationship(relId, data)
    await reload()
    toast.success('Relación actualizada.')
  }

  const handleDeleteRelationship = async (relId: number) => {
    await deleteRelationship(relId)
    await reload()
    toast.success('Relación eliminada.')
  }

  const handleAddFact = async (content: string, knownBy: number[]) => {
    await createFact(storyBrief.id, content, knownBy)
    await reload()
    toast.success('Hecho añadido.')
  }

  const handleUpdateFact = async (factId: number, content: string, knownBy: number[]) => {
    await updateFact(factId, content, knownBy)
    await reload()
  }

  const handleDeleteFact = async (factId: number) => {
    await deleteFact(factId)
    await reload()
    toast.success('Hecho eliminado.')
  }

  const handleNarratorChange = async (config: NarratorConfig) => {
    if (!detail) return
    // Optimistic update
    setDetail(prev => prev ? { ...prev, story: { ...prev.story, narrator_default: config } } : prev)
    try {
      await updateStory(storyBrief.id, { narrator_default: config })
    } catch {
      toast.error('Error al guardar la configuración del narrador.')
      await reload()
    }
  }

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Canvas ─────────────────────────────────────────────── */}
      <div className="flex-1 min-w-0 h-full relative" onDoubleClick={handleCanvasDoubleClick}>
        {loadingDetail && (
          <div className="absolute top-3 right-3 z-10 flex items-center gap-2 px-3 py-1.5 bg-white border border-stone-200 rounded-lg shadow-sm text-xs text-muted-foreground">
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
      </div>

      {/* ── Right panel ────────────────────────────────────────── */}
      <StoryGraphPanel
        open={panelOpen}
        onClose={closePanel}
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
      />
    </div>
  )
}

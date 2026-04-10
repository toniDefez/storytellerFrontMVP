import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { getWorldById, deleteWorld, getWorldDetail } from '../../services/api'
import type { World, WorldNode, WorldDetail } from '../../services/api'
import type { NodeFormInput } from '@/components/world-graph/NodeFormDialog'
import { useWorldGraph } from '@/hooks/useWorldGraph'
import ConfirmModal from '../../components/ConfirmModal'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { MoreHorizontal, Trash2, Pencil, BookOpen, Download } from 'lucide-react'
import { CausalTreeCanvas } from '@/components/world-graph/CausalTreeCanvas'
import { GhostCandidates } from '@/components/world-graph/GhostCandidates'
import { LocationGraphCanvas } from '@/components/world-graph/LocationGraphCanvas'
import { EdgeFormDialog } from '@/components/world-graph/EdgeFormDialog'
import { useLocationGraph } from '@/hooks/useLocationGraph'
import { toast } from 'sonner'
import { CharacterPanel } from '@/components/character-panel/CharacterPanel'
import { WorldScenesList } from '@/components/world-detail/WorldScenesList'
import { exportWorld } from '../../services/worldExport'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

function inferDotColor(world: World): string {
  const text = (world.premise || world.description || '').toLowerCase()
  if (/ceniza|volcan|fuego/.test(text)) return '#dc2626'
  if (/hielo|nieve|glaciar/.test(text)) return '#06b6d4'
  if (/agua|oceano|lluvia/.test(text)) return '#3b82f6'
  if (/bosque|selva|verde/.test(text)) return '#10b981'
  if (/desierto|arena|sol|gusano/.test(text)) return '#f59e0b'
  if (/oscuridad|sombra/.test(text)) return '#475569'
  if (/magia|hechizo/.test(text)) return '#8b5cf6'
  return '#7c3aed'
}

export default function WorldDetailPage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const [world, setWorld] = useState<World | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [isExpanding, setIsExpanding] = useState(false)
  const [graphView, setGraphView] = useState<'causal' | 'locations' | 'characters' | 'scenes'>('causal')
  const [worldDetail, setWorldDetail] = useState<WorldDetail | null>(null)
  const [pendingConn, setPendingConn] = useState<{ src: number; tgt: number } | null>(null)
  const [confirmRegen, setConfirmRegen] = useState(false)
  const graph = useWorldGraph()

  const refreshWorldDetail = useCallback(() => {
    const worldId = Number(id)
    if (!id || Number.isNaN(worldId)) return
    getWorldDetail(worldId).then(setWorldDetail).catch(() => {})
  }, [id])

  const {
    nodes: locationNodes, edges: locationEdges,
    selected: locationSelected, setSelected: setLocationSelected,
    generating: locationGenerating,
    expandingNodeId: locationExpandingNodeId,
    loadGraph: loadLocationGraph, generate: generateLocations,
    expandNode: expandLocationNode,
    moveNode, addNode: addLocationNode, addEdge, editNode: editLocationNode, removeNode,
    editEdge, removeEdge,
  } = useLocationGraph(Number(id))

  const handleAddNode = useCallback(async (input: NodeFormInput, parentNode: WorldNode | null) => {
    const wid = Number(id)
    if (!id || Number.isNaN(wid)) return
    await graph.addNodeManually(wid, {
      parentId: parentNode?.id,
      parentEdgeType: input.parentEdgeType,
      domain: input.domain,
      role: input.role,
      label: input.label,
      description: input.description,
      causalSummary: input.description,
    })
  }, [id, graph])

  const handleUpdateNode = useCallback(async (input: NodeFormInput, nodeId: number) => {
    const wid = Number(id)
    if (!id || Number.isNaN(wid)) return
    await graph.updateNodeManually(wid, nodeId, {
      label: input.label,
      domain: input.domain,
      role: input.role,
      description: input.description,
    })
  }, [id, graph])

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [id])

  useEffect(() => {
    document.title = `${t('pageTitle.worldDetail', { name: world?.name ?? '' })} — StoryTeller`
  }, [t, i18n.language, world?.name])

  useEffect(() => {
    const worldId = Number(id)
    if (!id || Number.isNaN(worldId)) {
      setError(t('world.detail.invalidId'))
      setLoading(false)
      return
    }

    Promise.all([
      getWorldById(worldId),
      graph.loadGraph(worldId),
      getWorldDetail(worldId),
    ])
      .then(([w, , detail]) => {
        setWorld(w)
        setWorldDetail(detail)
        document.title = `${w.name} — StoryTeller`
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, t])

  useEffect(() => {
    if (id) loadLocationGraph()
  }, [id, loadLocationGraph])

  const handleExport = async () => {
    setExporting(true)
    try {
      await exportWorld(Number(id))
    } catch {
      toast.error(t('importExport.exportError'))
    } finally {
      setExporting(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteWorld(Number(id))
      toast.success('Mundo eliminado correctamente.')
      navigate('/worlds')
    } catch {
      setError(t('world.detail.deleteError'))
      setLoading(false)
    }
  }

  if (loading) return <DetailSkeleton />
  if (error) return (
    <div className="flex justify-center items-center h-96">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  )
  if (!world) {
    return (
      <div className="flex justify-center items-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>{t('world.detail.notFound')}</AlertDescription>
        </Alert>
      </div>
    )
  }

  const dotColor = inferDotColor(world)

  return (
    <div>
      <ConfirmModal
        open={showConfirmDelete}
        title={t('world.detail.deleteTitle')}
        message={t('world.detail.deleteMessage', { name: world.name })}
        confirmText={t('world.detail.deleteConfirm')}
        cancelText={t('common.cancel')}
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* ── Slim toolbar 44px ─────────────────────────────────────────── */}
      <div
        className="flex items-center gap-0 px-4 border-b border-border/60 bg-background"
        style={{ height: 44 }}
      >
        {/* Left: back + world identity + tab switcher */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Back link */}
          <Link
            to="/worlds"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1 mr-1"
          >
            ← {t('nav.worlds')}
          </Link>

          <span className="text-border/60 text-xs shrink-0">/</span>

          {/* World dot */}
          <div
            className="w-2 h-2 rounded-full shrink-0 ml-1"
            style={{ backgroundColor: dotColor }}
          />

          {/* World name */}
          <span
            className="text-sm font-medium text-foreground truncate max-w-[180px]"
            title={world.name}
          >
            {world.name}
          </span>

          {/* Separator */}
          <span className="text-border/60 text-xs shrink-0 mx-1">·</span>

          {/* Tab switcher */}
          <div className="flex items-center gap-0 shrink-0">
            <button
              onClick={() => setGraphView('causal')}
              className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
                graphView === 'causal'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Causal
            </button>
            <button
              onClick={() => setGraphView('locations')}
              className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
                graphView === 'locations'
                  ? 'bg-[#14b8a6]/10 text-[#0f766e]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Locs
            </button>
            <button
              onClick={() => setGraphView('characters')}
              className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
                graphView === 'characters'
                  ? 'bg-[#f97316]/10 text-[#c2410c]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Personajes
            </button>
            <button
              onClick={() => setGraphView('scenes')}
              className={`text-xs font-medium px-3 py-1 rounded-sm transition-colors ${
                graphView === 'scenes'
                  ? 'bg-[#06b6d4]/10 text-[#0e7490]'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              Escenas
            </button>
          </div>
        </div>

        {/* Right: ··· menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center justify-center w-8 h-8 rounded-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors shrink-0"
              aria-label="Más opciones"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link to={`/worlds/${id}/bible`} className="flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                {t('bible.viewBible')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport} disabled={exporting}>
              <Download className="w-3.5 h-3.5 mr-2" />
              {exporting ? t('importExport.exporting') : t('importExport.exportButton')}
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to={`/worlds/${id}/edit`} className="flex items-center gap-2">
                <Pencil className="w-3.5 h-3.5" />
                {t('world.detail.editButton')}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowConfirmDelete(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-3.5 h-3.5 mr-2" />
              {t('world.detail.deleteButton')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Full-viewport graph ───────────────────────────────────────── */}
      <div
        className="overflow-hidden"
        style={{ height: 'calc(100vh - 44px)' }}
      >
        <div className="relative h-full">
          {/* Causal canvas */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: graphView === 'causal' ? 'block' : 'none',
            }}
          >
            <div className="relative h-full">
              <CausalTreeCanvas
                nodes={graph.nodes}
                worldId={Number(id)}
                selectedNode={graph.selectedNode}
                onSelectNode={graph.selectNode}
                onAddNode={handleAddNode}
                onUpdateNode={handleUpdateNode}
                isExpanding={isExpanding}
                chatHistory={graph.chatHistory}
                chatLoading={graph.chatLoading}
                onSendMessage={(text) => graph.sendChatMessage(Number(id), text)}
                onExpand={async () => {
                  setIsExpanding(true)
                  try { await graph.expandNode(Number(id), graph.selectedNode!.id) }
                  finally { setIsExpanding(false) }
                }}
                onDeleteSubtree={() => graph.removeSubtree(Number(id), graph.selectedNode!.id)}
                onDeleteConfirmed={() => graph.deleteConfirmed(Number(id), graph.selectedNode!.id)}
              />
              {graph.ghostCandidates.length > 0 && graph.ghostParentId && (
                <GhostCandidates
                  candidates={graph.ghostCandidates}
                  parentLabel={graph.nodes.find(n => n.id === graph.ghostParentId)?.label ?? ''}
                  onConfirm={c => graph.confirmCandidate(Number(id), graph.ghostParentId!, c)}
                  onDismiss={graph.dismissGhosts}
                />
              )}
            </div>
          </div>

          {/* Locations canvas */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: graphView === 'locations' ? 'block' : 'none',
            }}
          >
            <LocationGraphCanvas
              worldId={Number(id)}
              locationNodes={locationNodes}
              locationEdges={locationEdges}
              selected={locationSelected}
              visible={graphView === 'locations'}
              onSelectNode={node => setLocationSelected(node ? { type: 'node', item: node } : null)}
              onSelectEdge={edge => setLocationSelected(edge ? { type: 'edge', item: edge } : null)}
              onMoveNode={moveNode}
              onConnect={(src, tgt) => setPendingConn({ src, tgt })}
              onAddNode={async (input, parentId) => {
                await addLocationNode({
                  world_id: Number(id),
                  parent_id: parentId,
                  name: input.name,
                  node_type: input.node_type,
                  description: input.description,
                  properties: {},
                  canvas_x: 200 + Math.random() * 800,
                  canvas_y: 100 + Math.random() * 600,
                })
              }}
              onEditNode={async (nodeId, input) => {
                await editLocationNode(nodeId, {
                  name: input.name,
                  node_type: input.node_type,
                  description: input.description,
                  properties: {},
                })
              }}
              onDeleteNode={removeNode}
              onUpdateEdge={editEdge}
              onDeleteEdge={removeEdge}
              onGenerate={() => setConfirmRegen(true)}
              generating={locationGenerating}
              onExpandWithAI={node => expandLocationNode(Number(id), node.id)}
              expandingNodeId={locationExpandingNodeId}
            />
          </div>

          {/* Characters view */}
          <div
            style={{
              position: 'absolute', inset: 0,
              display: graphView === 'characters' ? 'block' : 'none',
            }}
          >
            <CharacterPanel
              worldId={Number(id)}
              worldPremise={worldDetail?.summary || world?.premise || ''}
              characterBriefs={worldDetail?.characters ?? []}
              onCharacterListChanged={refreshWorldDetail}
            />
          </div>

          {/* Scenes view */}
          {graphView === 'scenes' && (
            <div style={{ position: 'absolute', inset: 0 }}>
              <WorldScenesList
                worldId={Number(id)}
                scenes={worldDetail?.scenes ?? []}
                worldSummary={worldDetail?.summary || world?.premise || ''}
              />
            </div>
          )}
        </div>
      </div>

      {/* EdgeFormDialog */}
      <EdgeFormDialog
        open={pendingConn !== null}
        onConfirm={(edgeType, effort, bidirectional) => {
          if (pendingConn && id) {
            addEdge({
              world_id: Number(id),
              source_node_id: pendingConn.src,
              target_node_id: pendingConn.tgt,
              edge_type: edgeType,
              effort,
              dramatic_charge: 'medium',
              bidirectional,
              note: '',
            })
          }
          setPendingConn(null)
        }}
        onCancel={() => setPendingConn(null)}
      />

      {/* Regenerate confirmation */}
      {confirmRegen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-background border border-border rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="font-semibold text-base mb-2">¿Regenerar el mapa?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Se eliminará el mapa actual y se generará uno nuevo desde el grafo causal.
            </p>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setConfirmRegen(false)}
                className="text-sm px-3 py-1.5 rounded-lg border border-border hover:bg-accent"
              >
                Cancelar
              </button>
              <button
                onClick={() => { setConfirmRegen(false); generateLocations() }}
                className="text-sm px-3 py-1.5 rounded-lg bg-[#14b8a6] text-white hover:bg-[#0f766e]"
              >
                Regenerar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

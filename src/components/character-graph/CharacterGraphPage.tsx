import { useEffect, useState } from 'react'
import { Network, MessageCircle, Sparkles } from 'lucide-react'
import { useCharacterGraph } from './useCharacterGraph'
import { CharacterGraphCanvas } from './CharacterGraphCanvas'
import { CharacterChatPanel } from './CharacterChatPanel'
import { GraphMinimap } from './GraphMinimap'
import { CharacterNodeForm } from './CharacterNodeForm'
import { AIGeneratingIndicator } from '@/components/world-creation/AIGeneratingIndicator'
import type { CharacterNode, CharacterEdgeType } from '@/services/api'

interface Props {
  characterId: number
  worldId: number
}

export function CharacterGraphPage({ characterId }: Props) {
  const {
    nodes, edges, voiceRegister, chatMessages, characterName,
    mode, selectedNodeId, loading, chatLoading, generating, error,
    loadGraph, addNode, editNode, removeNode, moveNode,
    addEdge, updateVoice, sendMessage, generateNodes,
    toggleMode, setSelectedNodeId,
  } = useCharacterGraph(characterId)

  const [showNodeForm, setShowNodeForm] = useState(false)
  const [editingNode, setEditingNode] = useState<CharacterNode | undefined>()
  const [premise, setPremise] = useState('')
  const [pendingEdge, setPendingEdge] = useState<{ source: number; target: number } | null>(null)

  useEffect(() => { loadGraph() }, [loadGraph])

  // Handle node creation from form
  const handleSaveNode = async (data: Omit<CharacterNode, 'id'>) => {
    if (editingNode) {
      await editNode(editingNode.id, data)
    } else {
      await addNode(data)
    }
    setShowNodeForm(false)
    setEditingNode(undefined)
  }

  // Handle node selection — open edit form
  const handleSelectNode = (id: number | null) => {
    setSelectedNodeId(id)
    if (id) {
      const node = nodes.find(n => n.id === id)
      if (node) {
        setEditingNode(node)
        setShowNodeForm(true)
      }
    } else {
      setEditingNode(undefined)
      setShowNodeForm(false)
    }
  }

  // Handle edge creation
  const handleAddEdge = (sourceId: number, targetId: number) => {
    setPendingEdge({ source: sourceId, target: targetId })
  }

  const confirmEdge = async (edgeType: CharacterEdgeType) => {
    if (pendingEdge) {
      await addEdge({
        source_node_id: pendingEdge.source,
        target_node_id: pendingEdge.target,
        edge_type: edgeType,
      })
      setPendingEdge(null)
    }
  }

  // Handle harvest from chat
  const handleHarvest = async () => {
    // For now, open a pre-filled node form. Later: AI proposes a node.
    setEditingNode(undefined)
    setShowNodeForm(true)
  }

  // Handle initial generation
  const handleGenerate = async () => {
    if (!premise.trim()) return
    await generateNodes(premise.trim())
    setPremise('')
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground/40">Cargando...</div>
  }

  // Initial state — no nodes, show premise input
  if (nodes.length === 0 && !generating) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-8 max-w-xl mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600/60 mb-6">
          Derivar personaje
        </p>
        <p className="text-sm text-muted-foreground/60 mb-4 text-center">
          Escribe una premisa para generar el grafo psicologico inicial de <strong>{characterName}</strong>
        </p>
        <textarea
          value={premise}
          onChange={e => setPremise(e.target.value)}
          placeholder="Una excavadora que descubrio que el Acuifero es un mito..."
          rows={3}
          className="w-full border-2 border-dashed border-amber-400/25 rounded-xl px-4 py-3
                     text-sm font-[family-name:var(--font-display)] italic text-foreground/80
                     placeholder:text-foreground/20 resize-none
                     focus:outline-none focus:border-amber-400/50 bg-transparent"
        />
        <button
          onClick={handleGenerate}
          disabled={!premise.trim()}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     bg-gradient-to-r from-amber-600 to-orange-500 text-white font-medium text-sm
                     disabled:opacity-40 hover:shadow-lg hover:shadow-amber-500/20
                     transition-all duration-200"
        >
          <Sparkles className="w-4 h-4" />
          Derivar grafo
        </button>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      </div>
    )
  }

  if (generating) {
    return (
      <div className="flex items-center justify-center h-full">
        <AIGeneratingIndicator />
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top bar with mode toggle */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 shrink-0">
        <span className="text-sm font-medium text-foreground/80">{characterName}</span>
        <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5">
          <button
            onClick={() => toggleMode()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${mode === 'graph' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground/60 hover:text-foreground/80'}`}
          >
            <Network className="w-3.5 h-3.5" />
            Grafo
          </button>
          <button
            onClick={() => toggleMode()}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
              ${mode === 'talk' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground/60 hover:text-foreground/80'}`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Hablar
          </button>
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 relative overflow-hidden">
        {mode === 'graph' && (
          <div className="absolute inset-0">
            <CharacterGraphCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onSelectNode={handleSelectNode}
              onMoveNode={moveNode}
              onAddNode={() => { setEditingNode(undefined); setShowNodeForm(true) }}
              onAddEdge={handleAddEdge}
            />
            {/* Node form panel */}
            {showNodeForm && (
              <div className="absolute top-4 right-4 w-80 z-10">
                <CharacterNodeForm
                  node={editingNode}
                  onSave={handleSaveNode}
                  onDelete={editingNode ? () => { removeNode(editingNode.id); setShowNodeForm(false) } : undefined}
                  onCancel={() => { setShowNodeForm(false); setEditingNode(undefined) }}
                />
              </div>
            )}
            {/* Edge type picker */}
            {pendingEdge && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 bg-background border border-border/40 rounded-xl shadow-lg p-3">
                <p className="text-xs text-muted-foreground mb-2">Tipo de conexion:</p>
                <div className="flex flex-wrap gap-1">
                  {(['contradicts','fuels','masks','forged_by','costs','constrains','evolved_from','could_resolve'] as CharacterEdgeType[]).map(t => (
                    <button
                      key={t}
                      onClick={() => confirmEdge(t)}
                      className="px-2 py-1 rounded text-[10px] bg-muted/30 hover:bg-muted/60 transition-colors"
                    >
                      {t.replace('_', ' ')}
                    </button>
                  ))}
                  <button onClick={() => setPendingEdge(null)} className="px-2 py-1 rounded text-[10px] text-muted-foreground/40">
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {mode === 'talk' && (
          <div className="absolute inset-0 grid grid-cols-[200px_1fr]">
            <div className="border-r border-border/30 overflow-hidden">
              <GraphMinimap
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={(id) => setSelectedNodeId(id)}
              />
            </div>
            <CharacterChatPanel
              messages={chatMessages}
              characterName={characterName}
              voiceRegister={voiceRegister}
              loading={chatLoading}
              onSend={sendMessage}
              onHarvest={handleHarvest}
              onVoiceChange={updateVoice}
            />
          </div>
        )}
      </div>
    </div>
  )
}

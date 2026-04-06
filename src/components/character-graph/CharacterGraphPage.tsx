import { useEffect, useState } from 'react'
import { Network, MessageCircle, Sparkles, Trash2 } from 'lucide-react'
import { useCharacterGraph } from './useCharacterGraph'
import { CharacterGraphCanvas } from './CharacterGraphCanvas'
import { CharacterChatPanel } from './CharacterChatPanel'
import { GraphMinimap } from './GraphMinimap'
import { CharacterNodeForm } from './CharacterNodeForm'
import { CatalogDrawer } from './CatalogDrawer'
import { AIGeneratingIndicator } from '@/components/world-creation/AIGeneratingIndicator'
import type { CharacterNode, CharacterNodeDomain } from '@/services/api'

interface Props {
  characterId: number
  worldId: number
  onDelete?: () => void
}

export function CharacterGraphPage({ characterId, worldId, onDelete }: Props) {
  const {
    nodes, voiceRegister, chatMessages, characterName,
    mode, selectedNodeId, loading, chatLoading, generating, error,
    synthesis, synthesisLoading,
    loadGraph, addNode, editNode, removeNode,
    updateVoice, sendMessage, generateNodes, clearChat,
    toggleMode, setSelectedNodeId,
    addFromCatalog, addFromWorldCatalog, regenerateSynthesis,
  } = useCharacterGraph(characterId)

  const [showNodeForm, setShowNodeForm] = useState(false)
  const [editingNode, setEditingNode] = useState<CharacterNode | undefined>()
  const [newNodeDomain, setNewNodeDomain] = useState<CharacterNodeDomain | undefined>()
  const [premise, setPremise] = useState('')
  const [selectedContainer, setSelectedContainer] = useState<CharacterNodeDomain | null>(null)

  useEffect(() => { loadGraph() }, [loadGraph])

  const handleSelectNode = (id: number | null) => {
    setSelectedNodeId(id)
    if (id) {
      const node = nodes.find(n => n.id === id)
      if (node) {
        setEditingNode(node)
        setNewNodeDomain(undefined)
        setShowNodeForm(true)
      }
    } else {
      setEditingNode(undefined)
      setShowNodeForm(false)
    }
  }

  const handleContainerClick = (domain: CharacterNodeDomain) => {
    setSelectedContainer(domain)
  }

  const handleCloseDrawer = () => {
    setSelectedContainer(null)
  }

  const handleAddFromCatalog = async (catalogNodeId: number) => {
    await addFromCatalog(catalogNodeId)
  }

  const handleAddFromWorldCatalog = async (worldCatalogNodeId: number) => {
    await addFromWorldCatalog(worldCatalogNodeId)
  }

  const handleRegenerateSynthesis = (domain: CharacterNodeDomain) => {
    regenerateSynthesis(domain)
  }

  const handleSaveNode = async (data: Omit<CharacterNode, 'id'>) => {
    if (editingNode) {
      await editNode(editingNode.id, data)
    } else {
      await addNode(data)
    }
    setShowNodeForm(false)
    setEditingNode(undefined)
    setNewNodeDomain(undefined)
  }

  const handleHarvest = async () => {
    setEditingNode(undefined)
    setShowNodeForm(true)
  }

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
          Definir personaje
        </p>
        <p className="text-sm text-muted-foreground/60 mb-4 text-center">
          Escribe una premisa para generar el flujo de decision de <strong>{characterName}</strong>
        </p>
        <textarea
          value={premise}
          onChange={e => setPremise(e.target.value)}
          placeholder="Una excavadora que descubrio que el Acuifero es un mito..."
          rows={3}
          className="w-full border-2 border-dashed border-amber-400/25 rounded-xl px-4 py-3
                     text-sm font-display italic text-foreground/80
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
          Generar flujo de decision
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
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 shrink-0">
        <span className="text-sm font-medium text-foreground/80">{characterName}</span>
        <div className="flex items-center gap-2">
          <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5">
            <button
              onClick={() => { if (mode !== 'graph') toggleMode() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === 'graph' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground/60 hover:text-foreground/80'}`}
            >
              <Network className="w-3.5 h-3.5" />
              Flujo
            </button>
            <button
              onClick={() => { if (mode !== 'talk') toggleMode() }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === 'talk' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground/60 hover:text-foreground/80'}`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Hablar
            </button>
          </div>
          {onDelete && (
            <button
              onClick={() => { if (window.confirm(`¿Eliminar a ${characterName}?`)) onDelete() }}
              className="p-1.5 rounded-md text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 relative overflow-hidden">
        {mode === 'graph' && (
          <div className="absolute inset-0">
            <CharacterGraphCanvas
              nodes={nodes}
              selectedNodeId={selectedNodeId}
              synthesis={synthesis}
              synthesisLoading={synthesisLoading}
              onSelectNode={handleSelectNode}
              onContainerClick={handleContainerClick}
              onRegenerateSynthesis={handleRegenerateSynthesis}
            />
            {/* Node form — centered below pipeline */}
            {showNodeForm && (
              <div className="absolute bottom-0 left-0 right-0 flex justify-center p-4 z-10 bg-gradient-to-t from-[hsl(40_20%_97%)] via-[hsl(40_20%_97%/0.95)] to-transparent pt-8">
                <div className="w-full max-w-md">
                  <CharacterNodeForm
                    node={editingNode}
                    defaultDomain={newNodeDomain}
                    onSave={handleSaveNode}
                    onDelete={editingNode ? () => { removeNode(editingNode.id); setShowNodeForm(false) } : undefined}
                    onCancel={() => { setShowNodeForm(false); setEditingNode(undefined); setNewNodeDomain(undefined) }}
                  />
                </div>
              </div>
            )}

            {/* Catalog drawer */}
            <CatalogDrawer
              open={selectedContainer !== null}
              domain={selectedContainer}
              worldId={worldId}
              onClose={handleCloseDrawer}
              onAddFromCatalog={handleAddFromCatalog}
              onAddFromWorldCatalog={handleAddFromWorldCatalog}
            />
          </div>
        )}

        {mode === 'talk' && (
          <div className="absolute inset-0 grid grid-cols-[200px_1fr] min-h-0">
            <div className="border-r border-border/30 overflow-hidden min-h-0">
              <GraphMinimap
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                onSelectNode={(id) => setSelectedNodeId(id)}
              />
            </div>
            <div className="overflow-hidden min-h-0">
              <CharacterChatPanel
                messages={chatMessages}
                characterName={characterName}
                voiceRegister={voiceRegister}
                loading={chatLoading}
                onSend={sendMessage}
                onHarvest={handleHarvest}
                onVoiceChange={updateVoice}
                onClearChat={clearChat}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

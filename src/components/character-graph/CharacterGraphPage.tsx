import { useEffect, useState } from 'react'
import { Network, MessageCircle, Sparkles, Trash2, X, Mic } from 'lucide-react'
import { useIsMobile } from '@/hooks/useIsMobile'
import { VoiceTab } from './VoiceTab'
import { VoiceBadge } from './VoiceBadge'
import { useCharacterGraph } from './useCharacterGraph'
import { CharacterGraphCanvas, type ContextMenuEvent } from './CharacterGraphCanvas'
import { CharacterChatPanel } from './CharacterChatPanel'
import { DecisionFlowOutline } from './DecisionFlowOutline'
import { CatalogDrawer } from './CatalogDrawer'
import { ContainerContextMenu, OrbitalContextMenu } from './CharacterContextMenu'
import { AIGeneratingIndicator } from '@/components/world-creation/AIGeneratingIndicator'
import { CharacterSheetCard } from '@/components/character-panel/CharacterSheetCard'
import { getCharacterById, type CharacterNode, type CharacterNodeDomain, type CharacterSheet } from '@/services/api'
import { CHARACTER_DOMAIN_LABEL } from './domainLabels'

interface Props {
  characterId: number
  worldId: number
  onDelete?: () => void
}

export function CharacterGraphPage({ characterId, worldId, onDelete }: Props) {
  const {
    nodes, voiceRegister, chatMessages, characterName,
    mode, selectedNodeId, loading, chatLoading, generating, generatingProgress, error,
    synthesis, synthesisLoading,
    soul, soulLoading,
    voiceExamples, premise, speechPattern, generatingExamples,
    loadGraph, removeNode, editNode, moveNode,
    updateVoice, saveExamples, generateExamples, sendMessage, generateNodes, clearChat,
    toggleMode, setSelectedNodeId, setMode,
    addFromCatalog, addFromContextual, regenerateSynthesis,
    regenerateSoul,
  } = useCharacterGraph(characterId)
  // Móvil (2026-10-31): el lienzo de nodos no se recorre con el dedo; la
  // ficha abre en la vista de texto (Voz). Flujo sigue ahí por si se quiere.
  const isMobile = useIsMobile()
  useEffect(() => {
    if (isMobile) setMode('voice')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile, characterId])

  // La ficha corta arriba (2026-10-31): es lo que define al personaje. El
  // grafo, el alma, la voz y el chat quedan debajo como «Profundizar».
  const [sheet, setSheet] = useState<CharacterSheet | null | undefined>(undefined)
  useEffect(() => {
    let alive = true
    getCharacterById(characterId).then((c) => { if (alive) setSheet(c.sheet ?? null) }).catch(() => { if (alive) setSheet(null) })
    return () => { alive = false }
  }, [characterId])
  const [deep, setDeep] = useState(false)

  const [selectedNode, setSelectedNode] = useState<CharacterNode | undefined>()
  // null: aún sin tocar, se propone la premisa con la que se creó el
  // personaje (si generar falló al crearlo, reintentar es un clic).
  const [localPremise, setLocalPremise] = useState<string | null>(null)
  const draftPremise = localPremise ?? premise
  const [selectedContainer, setSelectedContainer] = useState<CharacterNodeDomain | null>(null)
  const [contextMenu, setContextMenu] = useState<ContextMenuEvent | null>(null)

  useEffect(() => { loadGraph() }, [loadGraph])

  // The backend only implements the soul-based chat, so a character without a
  // fresh soul cannot answer. It used to accept the message and return silence;
  // now the composer explains what is missing and offers the one action that
  // fixes it. Generating the soul now synthesizes any missing domain first, so
  // the only real blocker left is a character with no psychological nodes.
  const chatBlockedReason = (() => {
    if (soul && !soul.is_stale) return undefined
    if (nodes.length === 0) {
      return {
        message: `${characterName} aún no tiene psicología. Deriva o añade nodos antes de hablar.`,
        actionLabel: 'Ir al grafo',
        onAction: () => toggleMode('graph'),
      }
    }
    return {
      message: soul?.is_stale
        ? `El alma de ${characterName} está desactualizada. Regenérala para que responda con su psicología actual.`
        : `${characterName} todavía no tiene alma. Genérala para poder hablar.`,
      actionLabel: soul?.is_stale ? 'Regenerar alma' : 'Generar alma',
      onAction: regenerateSoul,
      busy: soulLoading,
    }
  })()

  const handleSelectNode = (id: number | null) => {
    setSelectedNodeId(id)
    if (id) {
      const node = nodes.find(n => n.id === id)
      setSelectedNode(node)
      setSelectedContainer(null) // close catalog if open
    } else {
      setSelectedNode(undefined)
    }
  }

  const handleContainerClick = (domain: CharacterNodeDomain) => {
    setSelectedContainer(domain)
    setSelectedNode(undefined) // close detail if open
    setSelectedNodeId(null)
  }

  const handleCloseDrawer = () => {
    setSelectedContainer(null)
  }

  const handleAddFromCatalog = async (catalogNodeId: number) => {
    await addFromCatalog(catalogNodeId)
  }

  const handleAddFromContextual = async (contextualNodeId: number) => {
    await addFromContextual(contextualNodeId)
  }

  const handleRegenerateSynthesis = (domain: CharacterNodeDomain) => {
    regenerateSynthesis(domain)
  }

  const handleRemoveNode = async (id: number) => {
    await removeNode(id)
    setSelectedNode(undefined)
    setSelectedNodeId(null)
  }

  const handleContextMenu = (event: ContextMenuEvent) => {
    setContextMenu(event)
  }

  const closeContextMenu = () => setContextMenu(null)

  const handleGenerate = async () => {
    if (!draftPremise.trim()) return
    await generateNodes(draftPremise.trim())
    setLocalPremise(null)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground/40">Cargando...</div>
  }

  // Lo profundo: sin nodos, la premisa para generarlos; generando, la espera;
  // y si no, el grafo, la voz y el chat.
  const deepBody = nodes.length === 0 && !generating ? (
      <div className="flex flex-col items-center justify-center h-full px-8 py-6 max-w-xl mx-auto">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600/60 mb-6">
          Definir personaje
        </p>
        <p className="text-sm text-muted-foreground/60 mb-4 text-center">
          Escribe una premisa para generar el flujo de decisión de <strong>{characterName}</strong>
        </p>
        <textarea
          value={draftPremise}
          onChange={e => setLocalPremise(e.target.value)}
          placeholder="Una excavadora que descubrió que el Acuífero es un mito..."
          rows={3}
          className="w-full border-2 border-dashed border-amber-400/25 rounded-xl px-4 py-3
                     text-sm font-display italic text-foreground/80
                     placeholder:text-foreground/20 resize-none
                     focus:outline-none focus:border-amber-400/50 bg-transparent"
        />
        <button
          onClick={handleGenerate}
          disabled={!draftPremise.trim()}
          className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                     bg-gradient-to-r from-amber-600 to-orange-500 text-white font-medium text-sm
                     disabled:opacity-40 hover:shadow-lg hover:shadow-amber-500/20
                     transition-all duration-200"
        >
          <Sparkles className="w-4 h-4" />
          Generar flujo de decisión
        </button>
        {error && <p className="text-sm text-red-500 mt-3">{error}</p>}
      </div>
  ) : generating ? (
      <div className="flex items-center justify-center h-full">
        <AIGeneratingIndicator label="Profundizando en el personaje…" detail={generatingProgress} accent="character" />
      </div>
  ) : (
    <div className="h-full flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border/30 shrink-0">
        <span className="text-sm font-medium text-foreground/80">{characterName}</span>
        <div className="flex items-center gap-2">
          {soul === null && nodes.length > 0 && (
            <button
              onClick={regenerateSoul}
              disabled={soulLoading}
              className="text-xs text-amber-600 hover:text-amber-700 disabled:opacity-50"
            >
              {soulLoading ? '...' : 'Generar alma del personaje'}
            </button>
          )}
          {soul?.is_stale && (
            <button
              onClick={regenerateSoul}
              disabled={soulLoading}
              className="text-xs text-amber-600 hover:text-amber-700 disabled:opacity-50"
            >
              {soulLoading ? '...' : 'Regenerar alma (desactualizada)'}
            </button>
          )}
          <div className="flex gap-1 bg-muted/30 rounded-lg p-0.5">
            <button
              onClick={() => { if (mode !== 'graph') toggleMode('graph') }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === 'graph' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground/60 hover:text-foreground/80'}`}
            >
              <Network className="w-3.5 h-3.5" />
              Flujo
            </button>
            <button
              onClick={() => { if (mode !== 'voice') toggleMode('voice') }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors
                ${mode === 'voice' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground/60 hover:text-foreground/80'}`}
            >
              <Mic className="w-3.5 h-3.5" />
              Voz
            </button>
            <button
              onClick={() => { if (mode !== 'talk') toggleMode('talk') }}
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
          <div className="absolute inset-0 flex">
            {/* Canvas */}
            <div className="flex-1 relative">
              <CharacterGraphCanvas
                nodes={nodes}
                selectedNodeId={selectedNodeId}
                synthesis={synthesis}
                synthesisLoading={synthesisLoading}
                onSelectNode={handleSelectNode}
                onContainerClick={handleContainerClick}
                onContextMenu={handleContextMenu}
                onPersistPosition={moveNode}
                drawerOpen={selectedContainer !== null}
              />
            </div>

            {/* Right panel — node detail */}
            {selectedNode && (
              <div className="w-[320px] border-l border-border/30 bg-background overflow-y-auto shrink-0">
                <div className="px-4 py-3 border-b border-border/20 flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/50">
                    Detalle
                  </span>
                  <button
                    onClick={() => { setSelectedNode(undefined); setSelectedNodeId(null) }}
                    className="p-1 rounded hover:bg-muted/30 text-muted-foreground/40 hover:text-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="px-4 py-4 space-y-4">
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Dominio</p>
                    <span className="text-xs font-medium text-foreground/80">{CHARACTER_DOMAIN_LABEL[selectedNode.domain] ?? selectedNode.domain}</span>
                  </div>
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Etiqueta</p>
                    <p className="text-sm font-semibold text-foreground">{selectedNode.label}</p>
                  </div>
                  {selectedNode.description && (
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Descripción</p>
                      <p className="text-xs text-foreground/70 leading-relaxed">{selectedNode.description}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">
                      Intensidad <span className="text-foreground/70 font-bold">{selectedNode.salience}</span>/10
                    </p>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={selectedNode.salience}
                      onChange={e => {
                        const val = Number(e.target.value)
                        const updated = { ...selectedNode, salience: val }
                        setSelectedNode(updated)
                        editNode(selectedNode.id, updated)
                      }}
                      className="w-full accent-amber-500"
                    />
                  </div>
                  {selectedNode.arc_destination && (
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Destino del arco</p>
                      <p className="text-xs text-foreground/70 italic">{selectedNode.arc_destination}</p>
                    </div>
                  )}
                  <div className="pt-3 border-t border-border/20">
                    <button
                      onClick={() => handleRemoveNode(selectedNode.id)}
                      className="w-full px-3 py-2 rounded-lg text-xs font-medium text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
                    >
                      Quitar del personaje
                    </button>
                  </div>
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
              onAddFromContextual={handleAddFromContextual}
            />

            {/* Context menus */}
            {contextMenu?.type === 'container' && contextMenu.domain && (
              <ContainerContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                domainLabel={contextMenu.domainLabel || ''}
                hasNodes={contextMenu.hasNodes || false}
                isStale={contextMenu.isStale || false}
                onOpenCatalog={() => handleContainerClick(contextMenu.domain!)}
                onRegenerate={() => handleRegenerateSynthesis(contextMenu.domain!)}
                onClose={closeContextMenu}
              />
            )}
            {contextMenu?.type === 'orbital' && contextMenu.nodeId && (
              <OrbitalContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                nodeLabel={contextMenu.nodeLabel || ''}
                onViewDetail={() => {
                  handleSelectNode(contextMenu.nodeId!)
                  closeContextMenu()
                }}
                onRemove={() => {
                  handleRemoveNode(contextMenu.nodeId!)
                  closeContextMenu()
                }}
                onClose={closeContextMenu}
              />
            )}
          </div>
        )}

        {mode === 'talk' && (
          <div className="absolute inset-0 grid grid-cols-[160px_1fr] min-h-0">
            {/* Col 1 — minimap */}
            <div className="border-r border-border/30 overflow-hidden min-h-0 flex flex-col">
              <div className="shrink-0 px-3 py-1.5 border-b border-border/20 flex justify-end">
                {soul && !soul.is_stale && (
                  <span className="text-[10px] text-emerald-600/50">alma activa</span>
                )}
                {soul?.is_stale && (
                  <span className="text-[10px] text-amber-600/50">alma desactualizada</span>
                )}
                {!soul && (
                  <span className="text-[10px] text-muted-foreground/30">sin alma</span>
                )}
              </div>
              <div className="flex-1 overflow-hidden min-h-0">
                <DecisionFlowOutline
                  nodes={nodes}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={(id) => setSelectedNodeId(id)}
                  onRemoveNode={handleRemoveNode}
                />
              </div>
            </div>

            {/* Col 2 — chat */}
            <div className="overflow-hidden min-h-0">
              <CharacterChatPanel
                messages={chatMessages}
                characterName={characterName}
                loading={chatLoading}
                onSend={sendMessage}
                onClearChat={clearChat}
                blockedReason={chatBlockedReason}
                voiceBadge={
                  <VoiceBadge
                    characterId={characterId}
                    onClick={() => toggleMode('voice')}
                  />
                }
              />
            </div>
          </div>
        )}

        {mode === 'voice' && (
          <div className="absolute inset-0">
            <VoiceTab
              characterId={characterId}
              voiceRegister={voiceRegister}
              voiceExamples={voiceExamples}
              characterName={characterName}
              premise={premise}
              speechPattern={speechPattern}
              onVoiceChange={updateVoice}
              onExamplesChange={saveExamples}
              onGenerateExamples={generateExamples}
              generating={generatingExamples}
            />
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="md:h-full flex flex-col">
      <div className="shrink-0 flex items-center justify-between px-4 md:px-6 pt-3">
        <span className="font-display text-[22px] leading-tight">{characterName}</span>
        {onDelete && isMobile && (
          <button
            type="button"
            onClick={() => { if (window.confirm(`¿Eliminar a ${characterName}?`)) onDelete() }}
            className="min-h-9 px-2 text-xs text-muted-foreground underline underline-offset-4"
          >
            Eliminar
          </button>
        )}
      </div>
      <CharacterSheetCard characterId={characterId} characterName={characterName} sheet={sheet} onChange={setSheet} />
      {isMobile ? (
        <div className="border-t border-border/30">
          <button type="button" onClick={() => setDeep((v) => !v)} className="w-full min-h-12 px-4 flex items-center justify-between text-sm">
            <span className="font-semibold">Profundizar</span>
            <span className="text-muted-foreground">{deep ? 'cerrar' : 'alma, voz y chat'}</span>
          </button>
          {deep && <div className="h-[75dvh] border-t border-border/30">{deepBody}</div>}
        </div>
      ) : (
        <div className="flex-1 min-h-0 border-t border-border/30">{deepBody}</div>
      )}
    </div>
  )
}

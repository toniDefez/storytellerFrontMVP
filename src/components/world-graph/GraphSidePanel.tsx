import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Network, Send, Loader2 } from 'lucide-react'
import type { WorldNode } from '@/services/api'
import type { ChatMessage } from '@/hooks/useWorldGraph'
import { NodeDetailPanel } from './NodeDetailPanel'

interface GraphSidePanelProps {
  selectedNode: WorldNode | null
  worldId: number
  isExpanding: boolean
  chatHistory: ChatMessage[]
  chatLoading: boolean
  onSendMessage: (text: string) => void
  onClose: () => void
  onExpand: () => void
  onDeleteSubtree: () => Promise<{ count: number; labels: string[] }>
  onDeleteConfirmed: () => Promise<void>
}

export function GraphSidePanel({
  selectedNode, isExpanding,
  chatHistory, chatLoading,
  onSendMessage, onClose, onExpand, onDeleteSubtree, onDeleteConfirmed,
}: GraphSidePanelProps) {
  const [activeTab, setActiveTab] = useState<'chat' | 'node'>('chat')
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Auto-switch tabs when node selection changes
  useEffect(() => {
    if (selectedNode) setActiveTab('node')
    else setActiveTab('chat')
  }, [selectedNode?.id])

  // Auto-scroll chat to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatHistory])

  const handleSend = () => {
    const text = input.trim()
    if (!text || chatLoading) return
    setInput('')
    onSendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="w-[280px] shrink-0 border-l border-border flex flex-col bg-card overflow-hidden">
      {/* Tab bar */}
      <div className="flex border-b border-border shrink-0">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-foreground border-b-2 border-foreground -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('node')}
          disabled={!selectedNode}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-default ${
            activeTab === 'node'
              ? 'text-foreground border-b-2 border-foreground -mb-px'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Network className="w-3.5 h-3.5" />
          Nodo
        </button>
      </div>

      {/* Chat tab */}
      {activeTab === 'chat' && (
        <>
          {/* Message list */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {chatHistory.length === 0 && (
              <p className="text-xs text-muted-foreground text-center mt-6 leading-relaxed">
                Pregunta algo sobre tu mundo o pide que añada nodos al grafo.
              </p>
            )}
            {chatHistory.map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg px-3 py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border px-3 py-2 flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje..."
              rows={2}
              className="flex-1 resize-none text-xs bg-muted/50 border border-border rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-foreground/20 placeholder:text-muted-foreground leading-relaxed"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || chatLoading}
              className="shrink-0 p-2 rounded-lg bg-foreground text-background disabled:opacity-40 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </>
      )}

      {/* Node tab */}
      {activeTab === 'node' && selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          isExpanding={isExpanding}
          onClose={() => { onClose(); setActiveTab('chat') }}
          onExpand={onExpand}
          onDeleteSubtree={onDeleteSubtree}
          onDeleteConfirmed={onDeleteConfirmed}
        />
      )}

      {activeTab === 'node' && !selectedNode && (
        <div className="flex-1 flex items-center justify-center p-6">
          <p className="text-xs text-muted-foreground text-center">
            Selecciona un nodo en el grafo para ver su detalle.
          </p>
        </div>
      )}
    </div>
  )
}

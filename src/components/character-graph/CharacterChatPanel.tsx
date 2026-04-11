import { useRef, useEffect, useState, type KeyboardEvent } from 'react'
import { Send, Trash2 } from 'lucide-react'
import type { ChatMessage } from '@/services/api'
import { HarvestButton } from './HarvestButton'

interface Props {
  messages: ChatMessage[]
  characterName: string
  loading: boolean
  onSend: (text: string) => void
  onHarvest: (messageContent: string) => void
  onClearChat?: () => void
  voiceBadge?: React.ReactNode
}

export function CharacterChatPanel({
  messages,
  characterName,
  loading,
  onSend,
  onHarvest,
  onClearChat,
  voiceBadge,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [input, setInput] = useState('')

  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const handleSend = () => {
    const text = input.trim()
    if (!text || loading) return
    onSend(text)
    setInput('')
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const showCharacterLabel = (idx: number) =>
    messages[idx].role === 'character' &&
    (idx === 0 || messages[idx - 1].role !== 'character')

  return (
    <div className="h-full flex flex-col">
      {/* Header with clear button */}
      {messages.length > 0 && (
        <div className="shrink-0 flex items-center justify-between px-3 py-1.5 border-b border-border/20">
          <span className="text-[10px] text-foreground/30">{messages.length} mensajes</span>
          {onClearChat && (
            <button
              onClick={onClearChat}
              className="flex items-center gap-1 text-[10px] text-foreground/30 hover:text-red-500 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Limpiar chat
            </button>
          )}
        </div>
      )}

      {voiceBadge && (
        <div className="shrink-0 px-3 py-1.5 border-b border-border/20">
          {voiceBadge}
        </div>
      )}

      {/* Messages — scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-foreground/25 italic">Escribe algo para empezar a hablar con {characterName}</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {showCharacterLabel(i) && (
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600 mb-1">
                {characterName}
              </span>
            )}
            <div
              className={`group relative max-w-[85%] flex items-start gap-1.5 ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`rounded-xl px-4 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-100 text-amber-950'
                    : 'bg-stone-100 text-stone-800'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'character' && (
                <div className="pt-2">
                  <HarvestButton onClick={() => onHarvest(msg.content)} />
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start">
            <div className="bg-stone-100 rounded-xl px-4 py-2.5">
              <span className="inline-flex gap-1 text-stone-400">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input — always visible */}
      <div className="shrink-0 border-t border-border/30 p-3 flex items-end gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Escribe un mensaje..."
          rows={1}
          className="flex-1 resize-none rounded-lg border border-border/40 bg-background px-3 py-2
                     text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-amber-400/60
                     disabled:opacity-50 placeholder:text-foreground/30"
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          className="p-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

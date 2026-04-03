import { useRef, useEffect, useState, type KeyboardEvent } from 'react'
import { Send } from 'lucide-react'
import type { ChatMessage, VoiceRegister } from '@/services/api'
import { VoiceRegisterEditor } from './VoiceRegisterEditor'
import { HarvestButton } from './HarvestButton'

interface Props {
  messages: ChatMessage[]
  characterName: string
  voiceRegister: VoiceRegister
  loading: boolean
  onSend: (text: string) => void
  onHarvest: (messageContent: string) => void
  onVoiceChange: (vr: VoiceRegister) => void
}

export function CharacterChatPanel({
  messages,
  characterName,
  voiceRegister,
  loading,
  onSend,
  onHarvest,
  onVoiceChange,
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
      {/* Messages — scrollable */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto min-h-0 px-3 py-4 space-y-2">
        {messages.map((msg, i) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {showCharacterLabel(i) && (
              <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-600/60 mb-1">
                {characterName}
              </span>
            )}
            <div
              className={`group relative max-w-[85%] flex items-start gap-1 ${
                msg.role === 'user'
                  ? 'flex-row-reverse'
                  : 'flex-row'
              }`}
            >
              <div
                className={`rounded-lg px-3 py-2 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-amber-100/60 text-foreground/90'
                    : 'bg-muted/30 text-foreground/80'
                }`}
              >
                {msg.content}
              </div>
              {msg.role === 'character' && (
                <div className="pt-1.5">
                  <HarvestButton onClick={() => onHarvest(msg.content)} />
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-2">
            <div className="bg-muted/30 rounded-lg px-3 py-2">
              <span className="inline-flex gap-1 text-muted-foreground/50">
                <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Voice register — collapsible, max height limited */}
      <div className="shrink-0 border-t border-border/30 max-h-[50vh] overflow-y-auto">
        <VoiceRegisterEditor voiceRegister={voiceRegister} onChange={onVoiceChange} />
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
                     text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/60
                     disabled:opacity-50 placeholder:text-muted-foreground/40"
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

import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system'
  content: string
}

type Props = {
  messages: ChatMessage[]
  loading: boolean
  onSend: (text: string) => void
}

export function WorldGraphChat({ messages, loading, onSend }: Props) {
  const [input, setInput] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50 shrink-0">
        <MessageCircle className="w-3.5 h-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Chat con la IA</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 min-h-0">
        {messages.length === 0 && (
          <p className="text-[11px] text-muted-foreground italic text-center mt-4">
            Pídele a la IA que añada nodos, modifique relaciones o expanda conceptos del grafo.
          </p>
        )}
        {messages.map((m, i) =>
          m.role === 'system' ? (
            <div key={i} className="text-[10px] text-muted-foreground italic text-center py-0.5">
              {m.content}
            </div>
          ) : (
            <div
              key={i}
              className={`text-[12px] rounded-lg px-2.5 py-1.5 leading-relaxed max-w-[90%] ${
                m.role === 'user'
                  ? 'ml-auto bg-primary/10 text-foreground'
                  : 'bg-accent text-foreground'
              }`}
            >
              {m.content}
            </div>
          )
        )}
        {loading && (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            <span className="text-[11px]">Pensando...</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-1.5 px-2 py-2 border-t border-border/50 shrink-0">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          className="flex-1 text-[12px] rounded-md border border-border bg-background px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground"
          placeholder="Añade una facción nómada..."
          disabled={loading}
        />
        <Button type="submit" size="icon" variant="ghost" className="h-7 w-7 shrink-0" disabled={loading || !input.trim()}>
          <Send className="w-3.5 h-3.5" />
        </Button>
      </form>
    </div>
  )
}

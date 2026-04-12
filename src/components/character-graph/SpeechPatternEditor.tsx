import { useState, useRef, useCallback, useEffect } from 'react'
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react'
import { updateSpeechPattern } from '@/services/api'

interface Props {
  characterId: number
  initialValue: string
}

export function SpeechPatternEditor({ characterId, initialValue }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [value, setValue] = useState(initialValue)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setValue(initialValue) }, [initialValue])

  const handleChange = useCallback((text: string) => {
    setValue(text)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      updateSpeechPattern(characterId, text).catch(console.error)
    }, 800)
  }, [characterId])

  const summary = value
    ? (value.length > 60 ? value.slice(0, 60) + '...' : value)
    : 'Define como suena al hablar'

  return (
    <div className="border border-border/40 rounded-lg bg-background/80 backdrop-blur-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <MessageSquare className="w-4 h-4 text-amber-500" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
          Patron de habla
        </span>
        <span className="flex-1 text-[11px] text-foreground/60 truncate ml-2">
          {summary}
        </span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-foreground/40" />
          : <ChevronDown className="w-4 h-4 text-foreground/40" />
        }
      </button>

      {expanded && (
        <div className="px-3 pb-3 border-t border-border/30 pt-3">
          <p className="text-[11px] text-foreground/50 mb-2">
            Describe como suena este personaje. Incluye una regla, 1-2 ejemplos, y un limite.
          </p>
          <textarea
            value={value}
            onChange={e => handleChange(e.target.value)}
            placeholder={'Tartamudea en consonantes fuertes (p, t, k).\nEjemplo: "P-pues yo creo que... que t-tenemos que irnos."\nNo mas de 2 veces por frase.'}
            className="w-full rounded-md border border-border/40 bg-background p-2 text-sm leading-relaxed resize-none focus:outline-none focus:ring-1 focus:ring-amber-500/30"
            rows={4}
          />
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Plus, Trash2, Theater, ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export interface VoiceExample {
  id: string
  userLine: string
  characterLine: string
}

interface Props {
  characterName: string
  examples: VoiceExample[]
  onChange: (examples: VoiceExample[]) => void
}

function generateId() {
  return Math.random().toString(36).slice(2, 9)
}

/* ── Empty state ────────────────────────────────────────────── */

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-10 px-6 text-center"
    >
      <div className="w-10 h-10 rounded-full bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-4">
        <Theater className="w-5 h-5 text-amber-400" />
      </div>
      <p className="text-[13px] font-display italic text-foreground/50 leading-relaxed mb-1">
        "El personaje aún no ha ensayado."
      </p>
      <p className="text-[11px] text-foreground/30 mb-5 max-w-[180px]">
        Escribe un par de líneas para mostrarle al LLM cómo habla exactamente
      </p>
      <button
        onClick={onAdd}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                   text-[12px] font-medium text-amber-600 border border-amber-300/60
                   hover:bg-amber-50 hover:border-amber-400/60 transition-all duration-150"
      >
        <Plus className="w-3.5 h-3.5" />
        Primer ensayo
      </button>
    </motion.div>
  )
}

/* ── Single exchange card ───────────────────────────────────── */

function ExchangeCard({
  example,
  index,
  characterName,
  onChange,
  onRemove,
}: {
  example: VoiceExample
  index: number
  characterName: string
  onChange: (updated: VoiceExample) => void
  onRemove: () => void
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6, scale: 0.97 }}
      transition={{ duration: 0.2 }}
      className="group relative rounded-xl border border-border/30 bg-background/60
                 hover:border-border/50 hover:shadow-sm transition-all duration-200 overflow-hidden"
    >
      {/* Exchange number badge */}
      <div className="absolute top-3 left-3 w-5 h-5 rounded-full bg-stone-100 flex items-center justify-center">
        <span className="text-[10px] font-bold text-stone-400">{index + 1}</span>
      </div>

      {/* Delete button */}
      <button
        onClick={onRemove}
        className="absolute top-2.5 right-2.5 p-1 rounded-md
                   text-foreground/20 hover:text-red-400 hover:bg-red-50
                   opacity-0 group-hover:opacity-100 transition-all duration-150"
        aria-label="Eliminar ejemplo"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      <div className="pt-3 pb-3 px-3 space-y-2 pl-10">
        {/* User line */}
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-foreground/30 mb-1 pl-0.5">
            Usuario
          </p>
          <textarea
            value={example.userLine}
            onChange={e => onChange({ ...example, userLine: e.target.value })}
            placeholder="¿De dónde vienes?"
            rows={1}
            className="w-full resize-none rounded-lg px-2.5 py-1.5
                       text-[12px] text-foreground/70 leading-relaxed
                       bg-amber-50/60 border border-amber-200/40
                       placeholder:text-foreground/20 placeholder:italic
                       focus:outline-none focus:border-amber-400/50 focus:bg-amber-50
                       transition-all duration-150"
            style={{ minHeight: '2rem', fieldSizing: 'content' } as React.CSSProperties}
          />
        </div>

        {/* Thin divider with arrow hint */}
        <div className="flex items-center gap-2 pl-0.5">
          <div className="flex-1 border-t border-dashed border-border/20" />
          <span className="text-[10px] text-foreground/20 font-mono">↓</span>
          <div className="flex-1 border-t border-dashed border-border/20" />
        </div>

        {/* Character line */}
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-amber-600/60 mb-1 pl-0.5">
            {characterName || 'Personaje'}
          </p>
          <textarea
            value={example.characterLine}
            onChange={e => onChange({ ...example, characterLine: e.target.value })}
            placeholder="Desierto. Sin más."
            rows={1}
            className="w-full resize-none rounded-lg px-2.5 py-1.5
                       text-[12px] text-foreground/80 leading-relaxed font-display italic
                       bg-stone-50 border border-border/30
                       placeholder:text-foreground/20 placeholder:not-italic
                       focus:outline-none focus:border-amber-400/40 focus:bg-stone-50
                       transition-all duration-150"
            style={{ minHeight: '2rem', fieldSizing: 'content' } as React.CSSProperties}
          />
        </div>
      </div>
    </motion.div>
  )
}

/* ── Main component ─────────────────────────────────────────── */

export function VoiceExamplesPanel({ characterName, examples, onChange }: Props) {
  const [expanded, setExpanded] = useState(true)

  const handleAdd = () => {
    if (examples.length >= 3) return
    onChange([...examples, { id: generateId(), userLine: '', characterLine: '' }])
  }

  const handleChange = (id: string, updated: VoiceExample) => {
    onChange(examples.map(ex => (ex.id === id ? updated : ex)))
  }

  const handleRemove = (id: string) => {
    onChange(examples.filter(ex => ex.id !== id))
  }

  const canAdd = examples.length < 3

  return (
    <div className="h-full flex flex-col border-l border-border/30 bg-background/50">
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-border/30
                   hover:bg-muted/20 transition-colors text-left w-full"
      >
        <Theater className="w-4 h-4 text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
            Ensayos de voz
          </span>
          {examples.length > 0 && (
            <span className="ml-2 text-[10px] text-foreground/30">
              {examples.length}/3
            </span>
          )}
        </div>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
          : <ChevronDown className="w-3.5 h-3.5 text-foreground/30 shrink-0" />
        }
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-1 overflow-y-auto min-h-0"
          >
            {examples.length === 0 ? (
              <EmptyState onAdd={handleAdd} />
            ) : (
              <div className="px-3 py-3 space-y-3">
                <AnimatePresence>
                  {examples.map((ex, i) => (
                    <ExchangeCard
                      key={ex.id}
                      example={ex}
                      index={i}
                      characterName={characterName}
                      onChange={updated => handleChange(ex.id, updated)}
                      onRemove={() => handleRemove(ex.id)}
                    />
                  ))}
                </AnimatePresence>

                {canAdd && (
                  <motion.button
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={handleAdd}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl
                               border border-dashed border-border/30 text-[11px] text-foreground/30
                               hover:border-amber-300/50 hover:text-amber-500 hover:bg-amber-50/40
                               transition-all duration-150"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Añadir ensayo
                  </motion.button>
                )}

                {!canAdd && (
                  <p className="text-center text-[10px] text-foreground/25 pb-1">
                    Máximo 3 ensayos — así el LLM puede memorizarlos bien
                  </p>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { Plus, Sparkles, X } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

interface VoiceExample {
  id?: number
  user_text: string
  char_text: string
}

interface Props {
  examples: VoiceExample[]
  characterName: string
  onChange: (examples: VoiceExample[]) => void
  onGenerate?: () => void
  generating?: boolean
}

export function VoiceExamplesEditor({ examples, characterName, onChange, onGenerate, generating }: Props) {
  const updateExample = (index: number, field: 'user_text' | 'char_text', value: string) => {
    const updated = examples.map((e, i) => i === index ? { ...e, [field]: value } : e)
    onChange(updated)
  }

  const removeExample = (index: number) => {
    onChange(examples.filter((_, i) => i !== index))
  }

  const addExample = () => {
    if (examples.length >= 3) return
    onChange([...examples, { user_text: '', char_text: '' }])
  }

  if (examples.length === 0 && !generating) {
    return (
      <div className="py-8 text-center">
        <p className="text-sm text-foreground/40 italic mb-4">
          Todavia no sabes como suena {characterName}.<br />
          Escribe algo que le dirias — y luego como te responderia.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={addExample}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium
                       border border-dashed border-amber-400/40 text-amber-600
                       hover:border-amber-400 hover:bg-amber-50 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Escribir primera muestra
          </button>
          {onGenerate && (
            <button
              onClick={onGenerate}
              disabled={generating}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium
                         bg-gradient-to-r from-amber-600 to-orange-500 text-white
                         hover:shadow-md hover:shadow-amber-500/20
                         disabled:opacity-40 transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generar con IA
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <AnimatePresence mode="popLayout">
        {examples.map((example, i) => (
          <motion.div
            key={i}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, delay: i * 0.05 }}
            className="group relative bg-stone-50/50 border border-dashed border-stone-200
                       rounded-xl px-4 py-3 space-y-2"
          >
            <button
              onClick={() => removeExample(i)}
              className="absolute top-2 right-2 p-1 rounded-md text-stone-300
                         opacity-0 group-hover:opacity-100 hover:text-red-500
                         hover:bg-red-50 transition-all"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* User line */}
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-widest text-stone-400 mb-1 block">
                Tu
              </span>
              <input
                value={example.user_text}
                onChange={e => updateExample(i, 'user_text', e.target.value)}
                placeholder="¿De donde vienes?"
                className="w-full bg-transparent text-sm italic text-stone-500
                           placeholder:text-stone-300 focus:outline-none"
              />
            </div>

            {/* Character line */}
            <div className="flex gap-2">
              <div className="w-[3px] rounded-full bg-amber-500 shrink-0" />
              <div className="flex-1">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-600 mb-1 block">
                  {characterName}
                </span>
                <textarea
                  value={example.char_text}
                  onChange={e => updateExample(i, 'char_text', e.target.value)}
                  placeholder="Desierto. Sin mas."
                  rows={2}
                  className="w-full bg-transparent text-sm font-display text-foreground/80
                             placeholder:text-foreground/20 resize-none focus:outline-none"
                />
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Actions */}
      <div className="flex items-center gap-3 pt-1">
        {examples.length < 3 && (
          <button
            onClick={addExample}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                       border border-dashed border-stone-300 text-stone-500
                       hover:border-amber-400 hover:text-amber-600 transition-all"
          >
            <Plus className="w-3 h-3" />
            Anadir muestra
          </button>
        )}
        {onGenerate && (
          <button
            onClick={onGenerate}
            disabled={generating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium
                       bg-amber-500/10 text-amber-600 hover:bg-amber-500/20
                       disabled:opacity-40 transition-all"
          >
            <Sparkles className="w-3 h-3" />
            {generating ? 'Generando...' : 'Generar con IA'}
          </button>
        )}
      </div>
    </div>
  )
}

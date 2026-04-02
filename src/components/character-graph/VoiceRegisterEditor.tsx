import { useState } from 'react'
import { ChevronDown, ChevronUp, Mic } from 'lucide-react'
import type { VoiceRegister } from '@/services/api'

interface Props {
  voiceRegister: VoiceRegister
  onChange: (vr: VoiceRegister) => void
}

const FIELDS: { key: keyof VoiceRegister; label: string; placeholder: string }[] = [
  { key: 'emotional_rhythm', label: 'Ritmo emocional', placeholder: 'Cómo siente y expresa emociones...' },
  { key: 'social_posture', label: 'Postura social', placeholder: 'Cómo se orienta hacia otros...' },
  { key: 'cognitive_tempo', label: 'Tempo cognitivo', placeholder: 'Cómo piensa y decide...' },
  { key: 'expressive_style', label: 'Estilo expresivo', placeholder: 'Cómo habla...' },
]

export function VoiceRegisterEditor({ voiceRegister, onChange }: Props) {
  const [expanded, setExpanded] = useState(false)

  const summary = FIELDS
    .map(f => voiceRegister[f.key])
    .filter(Boolean)
    .join(' · ')

  const handleBlur = (key: keyof VoiceRegister, value: string) => {
    if (value !== voiceRegister[key]) {
      onChange({ ...voiceRegister, [key]: value })
    }
  }

  return (
    <div className="border border-border/30 rounded-lg bg-muted/20">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        <Mic className="w-3.5 h-3.5 text-amber-500/60" />
        <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-600/60">Voz</span>
        <span className="flex-1 text-xs text-muted-foreground/50 truncate ml-2">
          {summary || 'Sin definir'}
        </span>
        {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground/40" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground/40" />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2.5">
          {FIELDS.map(f => (
            <div key={f.key}>
              <label className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-0.5 block">
                {f.label}
              </label>
              <input
                type="text"
                defaultValue={voiceRegister[f.key]}
                placeholder={f.placeholder}
                onBlur={e => handleBlur(f.key, e.target.value)}
                className="w-full text-xs text-foreground/80 bg-transparent border-b border-border/30
                           focus:border-amber-400/60 focus:outline-none pb-1 placeholder:text-muted-foreground/30"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

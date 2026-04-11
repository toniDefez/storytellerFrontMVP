import { Mic } from 'lucide-react'

interface VoiceRegister {
  emotional_rhythm: string
  social_posture: string
  cognitive_tempo: string
  expressive_style: string
}

interface Props {
  voiceRegister: VoiceRegister
  onClick: () => void
}

export function VoiceBadge({ voiceRegister, onClick }: Props) {
  const parts = [
    voiceRegister.emotional_rhythm,
    voiceRegister.social_posture,
    voiceRegister.cognitive_tempo,
    voiceRegister.expressive_style,
  ]
    .filter(Boolean)
    .map(s => s.split('—')[0].trim())

  if (parts.length === 0) return null

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md
                 bg-amber-50 text-amber-700 text-[10px] font-medium
                 hover:bg-amber-100 transition-colors"
    >
      <Mic className="w-3 h-3" />
      <span className="truncate max-w-[180px]">{parts.join(' · ')}</span>
    </button>
  )
}

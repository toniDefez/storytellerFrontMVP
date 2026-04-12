import { useState } from 'react'
import { ChevronDown, ChevronUp, Mic } from 'lucide-react'
import type { VoiceRegister, VoiceExample } from '@/services/api'
import { VoiceRegisterEditor } from './VoiceRegisterEditor'
import { VoiceExamplesEditor } from './VoiceExamplesEditor'
import { SpeechPatternEditor } from './SpeechPatternEditor'

interface Props {
  characterId: number
  voiceRegister: VoiceRegister
  voiceExamples: VoiceExample[]
  characterName: string
  premise?: string
  speechPattern?: string
  onVoiceChange: (vr: VoiceRegister) => void
  onExamplesChange: (examples: VoiceExample[]) => void
  onGenerateExamples?: () => void
  generating?: boolean
}

export function VoiceTab({
  characterId, voiceExamples, characterName, premise, speechPattern,
  onExamplesChange,
  onGenerateExamples, generating,
}: Props) {
  const [examplesExpanded, setExamplesExpanded] = useState(false)

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Premise reference */}
        {premise && (
          <section>
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400/60 mb-2">
              Premisa
            </p>
            <p className="text-sm italic text-foreground/50 leading-relaxed border-l-2 border-stone-200 pl-3">
              {premise}
            </p>
          </section>
        )}

        {/* Voice register */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60 mb-3">
            Registro de voz
          </p>
          <VoiceRegisterEditor characterId={characterId} />
        </section>

        {/* Speech pattern */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60 mb-3">
            Patron de habla
          </p>
          <SpeechPatternEditor
            characterId={characterId}
            initialValue={speechPattern ?? ''}
          />
        </section>

        {/* Voice examples — collapsable */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60 mb-3">
            Muestras de voz
          </p>
          <div className="border border-border/40 rounded-lg bg-background/80 backdrop-blur-sm">
            <button
              onClick={() => setExamplesExpanded(!examplesExpanded)}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
            >
              <Mic className="w-4 h-4 text-amber-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">
                Muestras
              </span>
              <span className="flex-1 text-[11px] text-foreground/60 truncate ml-2">
                {voiceExamples.length} ejemplo{voiceExamples.length !== 1 ? 's' : ''}
              </span>
              {examplesExpanded
                ? <ChevronUp className="w-4 h-4 text-foreground/40" />
                : <ChevronDown className="w-4 h-4 text-foreground/40" />
              }
            </button>
            {examplesExpanded && (
              <div className="border-t border-border/30 p-3">
                <VoiceExamplesEditor
                  examples={voiceExamples}
                  characterName={characterName}
                  onChange={onExamplesChange}
                  onGenerate={onGenerateExamples}
                  generating={generating}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

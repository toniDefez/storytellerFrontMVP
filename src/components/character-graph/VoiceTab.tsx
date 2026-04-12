import type { VoiceRegister, VoiceExample } from '@/services/api'
import { VoiceRegisterEditor } from './VoiceRegisterEditor'
import { VoiceExamplesEditor } from './VoiceExamplesEditor'

interface Props {
  characterId: number
  voiceRegister: VoiceRegister
  voiceExamples: VoiceExample[]
  characterName: string
  premise?: string
  onVoiceChange: (vr: VoiceRegister) => void
  onExamplesChange: (examples: VoiceExample[]) => void
  onGenerateExamples?: () => void
  generating?: boolean
}

export function VoiceTab({
  characterId, voiceExamples, characterName, premise,
  onExamplesChange,
  onGenerateExamples, generating,
}: Props) {
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

        {/* Voice examples */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60 mb-3">
            Muestras de voz
          </p>
          <VoiceExamplesEditor
            examples={voiceExamples}
            characterName={characterName}
            onChange={onExamplesChange}
            onGenerate={onGenerateExamples}
            generating={generating}
          />
        </section>
      </div>
    </div>
  )
}

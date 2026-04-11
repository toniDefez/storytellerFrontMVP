import type { VoiceRegister, VoiceExample } from '@/services/api'
import { VoiceRegisterEditor } from './VoiceRegisterEditor'
import { VoiceExamplesEditor } from './VoiceExamplesEditor'

interface Props {
  voiceRegister: VoiceRegister
  voiceExamples: VoiceExample[]
  characterName: string
  onVoiceChange: (vr: VoiceRegister) => void
  onExamplesChange: (examples: VoiceExample[]) => void
  onGenerateExamples?: () => void
  generating?: boolean
}

export function VoiceTab({
  voiceRegister, voiceExamples, characterName,
  onVoiceChange, onExamplesChange,
  onGenerateExamples, generating,
}: Props) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* Voice register */}
        <section>
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-600/60 mb-3">
            Registro de voz
          </p>
          <VoiceRegisterEditor voiceRegister={voiceRegister} onChange={onVoiceChange} />
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

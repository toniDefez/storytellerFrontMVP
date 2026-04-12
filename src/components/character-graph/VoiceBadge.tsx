import { useEffect, useState } from 'react'
import { Mic } from 'lucide-react'
import { getVoiceOptions, getVoiceSelections, type VoiceOption } from '@/services/api'

interface Props {
  characterId: number
  onClick: () => void
}

export function VoiceBadge({ characterId, onClick }: Props) {
  const [labels, setLabels] = useState<string[]>([])

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [options, selections] = await Promise.all([
          getVoiceOptions(),
          getVoiceSelections(characterId),
        ])
        if (cancelled) return
        const selectedIds = new Set((selections ?? []).map((s: VoiceOption) => s.id))
        const parts = (options ?? [])
          .filter((o: VoiceOption) => selectedIds.has(o.id))
          .map((o: VoiceOption) => o.label)
        setLabels(parts)
      } catch {
        // badge is non-critical
      }
    }
    load()
    return () => { cancelled = true }
  }, [characterId])

  if (labels.length === 0) return null

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md
                 bg-amber-50 text-amber-700 text-[10px] font-medium
                 hover:bg-amber-100 transition-colors"
    >
      <Mic className="w-3 h-3" />
      <span className="truncate max-w-[180px]">{labels.join(' · ')}</span>
    </button>
  )
}

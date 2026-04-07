import { useState, useEffect } from 'react'
import { getCharacterProfiles } from '@/services/api'
import type { ProfileTemplateBrief } from '@/services/api'
import { User, Check } from 'lucide-react'

interface Props {
  selectedId: number | null
  onSelect: (id: number | null) => void
}

export function CharacterProfilePicker({ selectedId, onSelect }: Props) {
  const [profiles, setProfiles] = useState<ProfileTemplateBrief[]>([])

  useEffect(() => {
    getCharacterProfiles().then(setProfiles).catch(() => {})
  }, [])

  if (profiles.length === 0) return null

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/30">
        Perfil psicologico (opcional)
      </p>
      <div className="grid grid-cols-1 gap-2">
        {profiles.map(p => {
          const active = selectedId === p.id
          return (
            <button
              key={p.id}
              onClick={() => onSelect(active ? null : p.id)}
              className={`text-left px-3 py-2.5 rounded-lg border transition-all duration-150
                ${active
                  ? 'border-amber-400/60 bg-amber-50/50 dark:bg-amber-900/10'
                  : 'border-border/30 hover:border-border/60 hover:bg-muted/30'}`}
            >
              <div className="flex items-start gap-2">
                <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0
                  ${active ? 'bg-amber-500 text-white' : 'bg-muted/50 text-muted-foreground/40'}`}>
                  {active ? <Check className="w-3 h-3" /> : <User className="w-3 h-3" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-medium ${active ? 'text-amber-700 dark:text-amber-400' : 'text-foreground/70'}`}>
                    {p.title}
                  </p>
                  <p className="text-[11px] text-foreground/40 mt-0.5 line-clamp-2">{p.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

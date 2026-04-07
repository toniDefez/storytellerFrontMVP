import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { getCharacterProfiles } from '@/services/api'
import type { ProfileTemplateBrief } from '@/services/api'

const ARCHETYPE_ICONS: Record<string, string> = {
  control: '🎯',
  dependencia: '🤲',
  trauma: '🩹',
  orden: '🔍',
  carisma: '✨',
}

function pickIcon(tags: string[]): string {
  for (const tag of tags) {
    if (ARCHETYPE_ICONS[tag]) return ARCHETYPE_ICONS[tag]
  }
  return '🧠'
}

interface Props {
  selectedId: number | null
  onSelect: (id: number | null) => void
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}

export function CharacterProfilePicker({ selectedId, onSelect }: Props) {
  const [profiles, setProfiles] = useState<ProfileTemplateBrief[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCharacterProfiles()
      .then(p => setProfiles(p ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (profiles.length === 0) return null

  return (
    <div>
      <div className="flex items-center justify-between mb-2.5">
        <p className="text-[10px] tracking-[0.2em] uppercase"
          style={{ fontFamily: 'var(--font-ui)', color: 'hsl(24 60% 45%)' }}>
          Empieza desde un arquetipo
        </p>
        {selectedId && (
          <button
            onClick={() => onSelect(null)}
            className="text-[10px] underline underline-offset-2"
            style={{ fontFamily: 'var(--font-ui)', color: 'hsl(24 60% 40%)' }}
          >
            Desde cero
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {profiles.map((p, i) => {
          const isSelected = selectedId === p.id
          const icon = pickIcon(p.tags ?? [])
          return (
            <motion.button
              key={p.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : p.id)}
              custom={i}
              initial="hidden"
              animate="show"
              variants={cardVariants}
              className={`text-left rounded-xl border p-3 transition-all duration-200 cursor-pointer
                ${isSelected
                  ? 'border-amber-500/60 bg-amber-50/60 shadow-[0_0_0_2px_hsl(24_80%_50%/0.12)]'
                  : 'border-border/40 bg-background hover:border-amber-400/40'}`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5">{icon}</span>
                <div className="min-w-0">
                  <div className="font-medium text-xs text-foreground leading-tight mb-0.5"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    {p.title}
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                    {p.description}
                  </p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

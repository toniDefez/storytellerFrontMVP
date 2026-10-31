import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Castle, Ghost, Loader2, Rocket, Sprout, type LucideIcon } from 'lucide-react'
import { listSeedTemplates } from '@/services/api'
import type { SeedTemplateBrief } from '@/services/api'
import { notifyError } from '@/lib/notifyError'

// Las plantillas van después de la premisa, como atajo: «o parte de una
// plantilla». Iconos de línea en vez de emojis y sin contar nodos, que a quien
// escribe no le dice nada (2026-10-31, revisión desde el móvil).
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  fantasy: Castle,
  'sci-fi': Rocket,
  horror: Ghost,
  default: Sprout,
}

interface Props {
  selected: SeedTemplateBrief | null
  onSelect: (seed: SeedTemplateBrief | null) => void
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
}

export function SeedTemplatePicker({ selected, onSelect }: Props) {
  const [seeds, setSeeds] = useState<SeedTemplateBrief[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listSeedTemplates()
      .then(s => setSeeds(s ?? []))
      .catch(notifyError('No se pudieron cargar las plantillas'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (seeds.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <label
          className="text-[10px] tracking-[0.2em] uppercase"
          style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 30% 58%)' }}
        >
          O parte de una plantilla
        </label>
        {selected && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="min-h-9 text-[11px] underline underline-offset-2"
            style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 38% 40%)' }}
          >
            Desde cero
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {seeds.map((seed, i) => {
          const isSelected = selected?.id === seed.id
          const Icon = CATEGORY_ICONS[seed.category] ?? CATEGORY_ICONS.default
          return (
            <motion.button
              key={seed.id}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onSelect(isSelected ? null : seed)}
              custom={i}
              initial="hidden"
              animate="show"
              variants={cardVariants}
              className={`text-left rounded-xl border p-3 min-h-[76px] transition-all duration-200 cursor-pointer
                ${isSelected
                  ? 'border-[hsl(260_38%_40%)] bg-[hsl(260_25%_96%)] shadow-[0_0_0_2px_hsl(260_38%_40%/0.15)]'
                  : 'border-border/60 bg-background hover:border-[hsl(260_30%_70%)]'}`}
            >
              <div className="flex items-start gap-2.5">
                <Icon className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'hsl(260 38% 40%)' }} aria-hidden="true" />
                <div className="min-w-0">
                  <div className="font-medium text-[13px] text-foreground leading-tight mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}>
                    {seed.title}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">{seed.description}</p>
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

import { ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { NarratorConfig } from '@/services/api'
import { Separator } from '@/components/ui/separator'

interface Props {
  narratorConfig: NarratorConfig
  onChange: (config: NarratorConfig) => void
}

// ── Preset definitions ────────────────────────────────────────────────────────

interface NarratorPreset {
  id: string
  name: string
  description: string
  sample: string
  config: NarratorConfig
}

const PRESETS: NarratorPreset[] = [
  {
    id: 'sombra',
    name: 'Sombra cercana',
    description: 'Pegado a la mente del personaje, crudo e íntimo.',
    sample: 'El puente crujía. Kael contó los pasos: doce. Una distancia calculable.',
    config: { pov: 'third_limited', style: 'sparse', distance: 'intimate', reliability: 'reliable' },
  },
  {
    id: 'cronista',
    name: 'Cronista',
    description: 'Observa todo desde arriba, neutral y completo.',
    sample: 'Los dos se encontraron en el puente al atardecer, como habían acordado, aunque ninguno confiaba ya en el otro.',
    config: { pov: 'third_omniscient', style: 'journalistic', distance: 'observational', reliability: 'reliable' },
  },
  {
    id: 'testigo',
    name: 'Testigo',
    description: 'Cuenta lo que vio, con sus propios sesgos y lagunas.',
    sample: 'Yo estaba allí cuando Kael sacó el sello. No sé qué significaba, pero Mira dejó de respirar.',
    config: { pov: 'first', style: 'lyrical', distance: 'intimate', reliability: 'unreliable' },
  },
  {
    id: 'oraculo',
    name: 'Oráculo',
    description: 'Lo sabe todo, lo cuenta con solemnidad y belleza.',
    sample: 'Aún no lo sabían, pero el puente que cruzaban esa noche sería el último suelo firme bajo sus pies.',
    config: { pov: 'third_omniscient', style: 'lyrical', distance: 'detached', reliability: 'reliable' },
  },
]

function configsMatch(a: NarratorConfig, b: NarratorConfig): boolean {
  return (
    a.pov === b.pov &&
    a.style === b.style &&
    a.distance === b.distance &&
    a.reliability === b.reliability
  )
}

function findActivePreset(config: NarratorConfig): NarratorPreset | null {
  return PRESETS.find(p => configsMatch(p.config, config)) ?? null
}

// ── PresetCard ────────────────────────────────────────────────────────────────

interface PresetCardProps {
  preset: NarratorPreset
  selected: boolean
  onSelect: () => void
}

function PresetCard({ preset, selected, onSelect }: PresetCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full text-left rounded-lg border p-3 flex flex-col gap-1.5 transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400
        ${selected
          ? 'border-cyan-400 bg-cyan-500/5 shadow-sm'
          : 'border-border bg-card hover:border-border/80 hover:bg-muted/30'
        }
      `}
      aria-pressed={selected}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={`text-sm font-semibold leading-tight ${selected ? 'text-cyan-700 dark:text-cyan-400' : 'text-foreground'}`}>
          {preset.name}
        </span>
        {selected && (
          <span className="shrink-0 w-2 h-2 rounded-full bg-cyan-400" />
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-snug">{preset.description}</p>
      <p className="text-xs italic text-muted-foreground/70 leading-relaxed border-l-2 border-border pl-2 mt-0.5">
        &ldquo;{preset.sample}&rdquo;
      </p>
    </button>
  )
}

// ── NarratorDefaultPanel ──────────────────────────────────────────────────────

export function NarratorDefaultPanel({ narratorConfig, onChange }: Props) {
  const [open, setOpen] = useState(false)

  const activePreset = findActivePreset(narratorConfig)
  const isCustom = !activePreset && (
    narratorConfig.pov || narratorConfig.style || narratorConfig.distance || narratorConfig.reliability
  )

  const handleSelect = (preset: NarratorPreset) => {
    onChange(preset.config)
  }

  return (
    <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent/50 transition-colors"
        aria-expanded={open}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span>Narrador por defecto</span>
          {activePreset && (
            <span className="text-xs font-normal text-muted-foreground truncate">
              · {activePreset.name}
            </span>
          )}
          {isCustom && (
            <span className="text-xs font-normal text-muted-foreground">
              · Personalizado
            </span>
          )}
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        )}
      </button>

      {open && (
        <>
          <Separator />
          <div className="px-4 py-4 flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Elige la voz narrativa por defecto para las escenas de esta historia.
            </p>

            {/* 2x2 grid of preset cards */}
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map(preset => (
                <PresetCard
                  key={preset.id}
                  preset={preset}
                  selected={activePreset?.id === preset.id}
                  onSelect={() => handleSelect(preset)}
                />
              ))}
            </div>

            {/* Custom config notice */}
            {isCustom && (
              <div className="rounded-md bg-muted/50 border border-border px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Configuración personalizada.</span>{' '}
                  Selecciona un preset para reemplazarla.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

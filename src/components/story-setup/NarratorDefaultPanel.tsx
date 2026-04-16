import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { NarratorConfig } from '@/services/api'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'

interface Props {
  narratorConfig: NarratorConfig
  onChange: (config: NarratorConfig) => void
}

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

export function NarratorDefaultPanel({ narratorConfig, onChange }: Props) {
  const [open, setOpen] = useState(false)

  function update(field: keyof NarratorConfig, value: string) {
    onChange({ ...narratorConfig, [field]: value })
  }

  return (
    <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-5 py-3 text-sm font-semibold text-foreground hover:bg-accent/50 transition-colors"
        aria-expanded={open}
      >
        <span>Narrador por defecto</span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <>
          <Separator />
          <div className="px-5 py-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="narrator-pov" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Punto de vista
              </Label>
              <select
                id="narrator-pov"
                value={narratorConfig.pov ?? ''}
                onChange={e => update('pov', e.target.value)}
                className={selectClass}
              >
                <option value="">— elige —</option>
                <option value="first">Primera persona</option>
                <option value="third_limited">Tercera limitada</option>
                <option value="third_omniscient">Tercera omnisciente</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="narrator-style" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Estilo
              </Label>
              <select
                id="narrator-style"
                value={narratorConfig.style ?? ''}
                onChange={e => update('style', e.target.value)}
                className={selectClass}
              >
                <option value="">— elige —</option>
                <option value="sparse">Escueto</option>
                <option value="lyrical">Lírico</option>
                <option value="journalistic">Periodístico</option>
                <option value="clinical">Clínico</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="narrator-distance" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Distancia
              </Label>
              <select
                id="narrator-distance"
                value={narratorConfig.distance ?? ''}
                onChange={e => update('distance', e.target.value)}
                className={selectClass}
              >
                <option value="">— elige —</option>
                <option value="intimate">Íntima</option>
                <option value="observational">Observacional</option>
                <option value="detached">Distante</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="narrator-reliability" className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Fiabilidad
              </Label>
              <select
                id="narrator-reliability"
                value={narratorConfig.reliability ?? ''}
                onChange={e => update('reliability', e.target.value)}
                className={selectClass}
              >
                <option value="">— elige —</option>
                <option value="reliable">Fiable</option>
                <option value="unreliable">No fiable</option>
                <option value="partially_occluded">Parcialmente velado</option>
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

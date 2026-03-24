import { useState, useEffect } from 'react'
import type { LocationEdgeType, LocationEffort } from '@/services/api'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  onConfirm: (edgeType: LocationEdgeType, effort: LocationEffort, bidirectional: boolean) => void
  onCancel: () => void
}

const EDGE_TYPES: { value: LocationEdgeType; label: string }[] = [
  { value: 'road', label: 'Camino' },
  { value: 'wilderness', label: 'Naturaleza' },
  { value: 'waterway', label: 'Vía fluvial' },
]

const EFFORTS: { value: LocationEffort; label: string }[] = [
  { value: 'easy', label: 'Fácil' },
  { value: 'moderate', label: 'Moderado' },
  { value: 'difficult', label: 'Difícil' },
]

export function EdgeFormDialog({ open, onConfirm, onCancel }: Props) {
  const [edgeType, setEdgeType] = useState<LocationEdgeType>('road')
  const [effort, setEffort] = useState<LocationEffort>('moderate')
  const [bidirectional, setBidirectional] = useState(true)

  useEffect(() => {
    if (open) {
      setEdgeType('road')
      setEffort('moderate')
      setBidirectional(true)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-background border border-border rounded-xl p-5 max-w-xs w-full mx-4 shadow-xl space-y-4">
        <h3 className="font-semibold text-sm">Nueva conexión</h3>

        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Tipo de ruta</label>
          <div className="flex gap-1.5">
            {EDGE_TYPES.map(t => (
              <button key={t.value} onClick={() => setEdgeType(t.value)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${edgeType === t.value ? 'bg-[#14b8a6] text-white border-[#14b8a6]' : 'border-border text-muted-foreground hover:border-[#14b8a6]/50'}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs text-muted-foreground block mb-1.5">Dificultad</label>
          <div className="flex gap-1.5">
            {EFFORTS.map(e => (
              <button key={e.value} onClick={() => setEffort(e.value)}
                className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${effort === e.value ? 'bg-[#14b8a6] text-white border-[#14b8a6]' : 'border-border text-muted-foreground hover:border-[#14b8a6]/50'}`}>
                {e.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ef-bidir" checked={bidirectional} onChange={e => setBidirectional(e.target.checked)} className="w-3.5 h-3.5" />
          <label htmlFor="ef-bidir" className="text-xs text-muted-foreground">Bidireccional</label>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <Button variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button size="sm" className="bg-[#14b8a6] hover:bg-[#0f766e]"
            onClick={() => onConfirm(edgeType, effort, bidirectional)}>
            Añadir
          </Button>
        </div>
      </div>
    </div>
  )
}

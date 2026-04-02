import { useState } from 'react'
import { Trash2, Save } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { LocationEdge, LocationEdgeType, LocationEffort, DramaticCharge } from '@/services/api'

interface Props {
  edge: LocationEdge
  sourceNode?: { name: string }
  targetNode?: { name: string }
  onUpdate: (id: number, data: Pick<LocationEdge, 'edge_type' | 'effort' | 'dramatic_charge' | 'bidirectional' | 'note'>) => Promise<void>
  onDelete: (id: number) => void
  onClose: () => void
}

const EDGE_TYPE_LABELS: Record<LocationEdgeType, string> = {
  road: 'Camino',
  wilderness: 'Naturaleza',
  waterway: 'Vía fluvial',
}

const EFFORT_LABELS: Record<LocationEffort, string> = {
  easy: 'Fácil',
  moderate: 'Moderado',
  difficult: 'Difícil',
}

const DRAMATIC_CHARGE_LABELS: Record<DramaticCharge, string> = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
}

export function LocationEdgeDetailPanel({ edge, sourceNode, targetNode, onUpdate, onDelete, onClose }: Props) {
  const [effort, setEffort] = useState<LocationEffort>(edge.effort)
  const [edgeType, setEdgeType] = useState<LocationEdgeType>(edge.edge_type)
  const [dramaticCharge, setDramaticCharge] = useState<DramaticCharge>(edge.dramatic_charge ?? 'medium')
  const [bidirectional, setBidirectional] = useState(edge.bidirectional)
  const [note, setNote] = useState(edge.note ?? '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    await onUpdate(edge.id, { edge_type: edgeType, effort, dramatic_charge: dramaticCharge, bidirectional, note })
    setSaving(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <span className="text-xs uppercase tracking-widest text-[#14b8a6] font-semibold">Conexión</span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {sourceNode && targetNode && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{sourceNode.name}</span>
            <span>{bidirectional ? '↔' : '→'}</span>
            <span>{targetNode.name}</span>
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Tipo de ruta</label>
            <div className="flex gap-1.5">
              {(['road', 'wilderness', 'waterway'] as LocationEdgeType[]).map(t => (
                <button
                  key={t}
                  onClick={() => setEdgeType(t)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${edgeType === t ? 'bg-[#14b8a6] text-white border-[#14b8a6]' : 'border-border text-muted-foreground hover:border-[#14b8a6]/50'}`}
                >
                  {EDGE_TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Dificultad</label>
            <div className="flex gap-1.5">
              {(['easy', 'moderate', 'difficult'] as LocationEffort[]).map(e => (
                <button
                  key={e}
                  onClick={() => setEffort(e)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${effort === e ? 'bg-[#14b8a6] text-white border-[#14b8a6]' : 'border-border text-muted-foreground hover:border-[#14b8a6]/50'}`}
                >
                  {EFFORT_LABELS[e]}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Carga dramática</label>
            <div className="flex gap-1.5">
              {(['low', 'medium', 'high'] as DramaticCharge[]).map(c => (
                <button
                  key={c}
                  onClick={() => setDramaticCharge(c)}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-colors ${dramaticCharge === c ? 'bg-[#14b8a6] text-white border-[#14b8a6]' : 'border-border text-muted-foreground hover:border-[#14b8a6]/50'}`}
                >
                  {DRAMATIC_CHARGE_LABELS[c]}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="bidir" checked={bidirectional} onChange={e => setBidirectional(e.target.checked)} className="w-3.5 h-3.5" />
            <label htmlFor="bidir" className="text-xs text-muted-foreground">Bidireccional</label>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1.5">Nota (opcional)</label>
            <input
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Este paso cierra en invierno..."
              className="w-full text-xs border border-border rounded-lg px-2.5 py-1.5 bg-background focus:outline-none focus:border-[#14b8a6]"
            />
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border/50 flex gap-2">
        <Button size="sm" className="flex-1 gap-1.5 bg-[#14b8a6] hover:bg-[#0f766e]" onClick={handleSave} disabled={saving}>
          <Save className="w-3.5 h-3.5" /> {saving ? 'Guardando...' : 'Guardar'}
        </Button>
        <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => onDelete(edge.id)}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  )
}

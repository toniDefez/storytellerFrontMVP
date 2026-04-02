import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import type { CharacterNode, CharacterNodeDomain, CharacterNodeRole } from '@/services/api'

const DOMAINS: { value: CharacterNodeDomain; label: string; color: string }[] = [
  { value: 'origin', label: 'Origen', color: 'bg-stone-200 text-stone-700' },
  { value: 'belief', label: 'Creencia', color: 'bg-amber-100 text-amber-700' },
  { value: 'drive', label: 'Impulso', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'fear', label: 'Miedo', color: 'bg-rose-100 text-rose-700' },
  { value: 'mask', label: 'Máscara', color: 'bg-slate-100 text-slate-700' },
  { value: 'tension', label: 'Tensión', color: 'bg-red-100 text-red-700' },
  { value: 'bond', label: 'Vínculo', color: 'bg-purple-100 text-purple-700' },
]

const ROLES: { value: CharacterNodeRole; label: string }[] = [
  { value: 'trait', label: 'Rasgo' },
  { value: 'wound', label: 'Herida' },
  { value: 'arc_seed', label: 'Semilla de arco' },
]

const SALIENCE: { value: string; label: string }[] = [
  { value: 'high', label: 'Alta' },
  { value: 'medium', label: 'Media' },
  { value: 'low', label: 'Baja' },
]

interface Props {
  node?: CharacterNode  // undefined = create mode
  onSave: (data: Omit<CharacterNode, 'id'>) => void
  onDelete?: () => void
  onCancel: () => void
}

export function CharacterNodeForm({ node, onSave, onDelete, onCancel }: Props) {
  const [label, setLabel] = useState(node?.label || '')
  const [description, setDescription] = useState(node?.description || '')
  const [domain, setDomain] = useState<CharacterNodeDomain>(node?.domain || 'belief')
  const [role, setRole] = useState<CharacterNodeRole>(node?.role || 'trait')
  const [salience, setSalience] = useState(node?.salience || 'medium')
  const [arcDestination, setArcDestination] = useState(node?.arc_destination || '')

  const handleSubmit = () => {
    if (!label.trim() || !description.trim()) return
    onSave({
      domain, role, label: label.trim(), description: description.trim(),
      salience, arc_destination: role === 'arc_seed' ? arcDestination : undefined,
      canvas_x: node?.canvas_x || 0, canvas_y: node?.canvas_y || 0,
    })
  }

  return (
    <div className="space-y-3 p-4 bg-background border border-border/40 rounded-xl shadow-sm">
      {/* Label — write first */}
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        placeholder="Nombre del nodo (3-6 palabras)..."
        autoFocus
        className="w-full text-sm font-medium text-foreground bg-transparent
                   border-b-2 border-amber-400/40 focus:border-amber-500 focus:outline-none pb-1"
      />

      {/* Description */}
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Descripción (1-2 frases, anclada al mundo)..."
        rows={2}
        className="w-full text-xs text-foreground/80 bg-transparent border border-border/30 rounded-lg
                   px-3 py-2 focus:border-amber-400/60 focus:outline-none resize-none"
      />

      {/* Domain pills — classify after writing */}
      <div>
        <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1.5">Dominio</p>
        <div className="flex flex-wrap gap-1">
          {DOMAINS.map(d => (
            <button
              key={d.value}
              onClick={() => setDomain(d.value)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all
                ${domain === d.value ? d.color + ' ring-1 ring-current/30' : 'bg-muted/30 text-muted-foreground/50 hover:bg-muted/50'}`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Role + Salience row */}
      <div className="flex gap-4">
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1.5">Rol</p>
          <div className="flex gap-1">
            {ROLES.map(r => (
              <button
                key={r.value}
                onClick={() => setRole(r.value)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all
                  ${role === r.value ? 'bg-foreground/10 text-foreground ring-1 ring-foreground/20' : 'bg-muted/30 text-muted-foreground/50 hover:bg-muted/50'}`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1.5">Saliencia</p>
          <div className="flex gap-1">
            {SALIENCE.map(s => (
              <button
                key={s.value}
                onClick={() => setSalience(s.value)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all
                  ${salience === s.value ? 'bg-foreground/10 text-foreground ring-1 ring-foreground/20' : 'bg-muted/30 text-muted-foreground/50 hover:bg-muted/50'}`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Arc destination — only for arc_seed */}
      {role === 'arc_seed' && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1">Destino del arco</p>
          <input
            type="text"
            value={arcDestination}
            onChange={e => setArcDestination(e.target.value)}
            placeholder="Podría llegar a creer/sentir/hacer..."
            className="w-full text-xs text-foreground/80 bg-transparent border-b border-border/30
                       focus:border-amber-400/60 focus:outline-none pb-1 placeholder:text-muted-foreground/30"
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <button
          onClick={handleSubmit}
          disabled={!label.trim() || !description.trim()}
          className="px-3 py-1.5 rounded-lg bg-amber-500 text-white text-xs font-medium
                     disabled:opacity-40 hover:bg-amber-600 transition-colors"
        >
          {node ? 'Guardar' : 'Crear nodo'}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 rounded-lg text-xs text-muted-foreground hover:bg-muted/30">
          Cancelar
        </button>
        {node && onDelete && (
          <button onClick={onDelete} className="ml-auto p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}

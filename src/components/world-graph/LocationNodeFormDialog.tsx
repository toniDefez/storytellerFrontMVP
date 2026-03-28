import { useState, useEffect } from 'react'
import { X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { LocationNode, LocationNodeType } from '@/services/api'

const NODE_TYPES: { value: LocationNodeType; label: string; icon: string }[] = [
  { value: 'settlement', label: 'Asentamiento', icon: '🏘' },
  { value: 'wilderness', label: 'Naturaleza', icon: '🌲' },
  { value: 'ruin', label: 'Ruina', icon: '🏚' },
  { value: 'landmark', label: 'Referencia', icon: '⛰' },
  { value: 'passage', label: 'Paso', icon: '🚪' },
  { value: 'structure', label: 'Estructura', icon: '🏛' },
]

export interface LocationNodeFormInput {
  name: string
  node_type: LocationNodeType
  description: string
}

interface Props {
  mode: 'create' | 'edit'
  editingNode?: LocationNode
  parentName?: string
  onConfirm: (input: LocationNodeFormInput) => Promise<void>
  onClose: () => void
}

export function LocationNodeFormDialog({ mode, editingNode, parentName, onConfirm, onClose }: Props) {
  const [name, setName] = useState(editingNode?.name ?? '')
  const [nodeType, setNodeType] = useState<LocationNodeType>(editingNode?.node_type ?? 'settlement')
  const [description, setDescription] = useState(editingNode?.description ?? '')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      await onConfirm({ name: name.trim(), node_type: nodeType, description: description.trim() })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[300px] bg-card border border-border rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <p className="text-xs font-semibold text-muted-foreground truncate max-w-[230px]">
            {mode === 'create'
              ? parentName ? `Nuevo lugar dentro de: ${parentName}` : 'Nueva localización'
              : `Editar: ${editingNode?.name}`
            }
          </p>
          <button onClick={onClose} className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-3 space-y-3">
          {/* Name */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
              Nombre
            </label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Aldea del Bosque..."
              className="h-8 text-xs"
              autoFocus
              required
            />
          </div>

          {/* Node type pills */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1.5">
              Tipo
            </label>
            <div className="flex flex-wrap gap-1.5">
              {NODE_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setNodeType(t.value)}
                  className={`text-[10px] px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                    nodeType === t.value
                      ? 'bg-[#14b8a6] text-white border-[#14b8a6]'
                      : 'border-border text-muted-foreground hover:border-[#14b8a6]/50'
                  }`}
                >
                  <span>{t.icon}</span>
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
              Descripción <span className="font-normal normal-case">(opcional)</span>
            </label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Un lugar donde..."
              className="min-h-[60px] text-xs resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <Button
              type="submit"
              size="sm"
              className="flex-1 h-8 text-xs bg-[#14b8a6] hover:bg-[#0f766e]"
              disabled={submitting || !name.trim()}
            >
              {submitting
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : mode === 'create' ? 'Crear' : 'Guardar'
              }
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}

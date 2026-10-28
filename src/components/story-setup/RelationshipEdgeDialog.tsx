import { useState, useEffect } from 'react'
import type { StoryCharacter, StoryRelationship } from '@/services/api'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

const SUBTYPES: Record<string, { value: string; label: string }[]> = {
  family: [
    { value: 'parent', label: 'Progenitor/a' },
    { value: 'child', label: 'Hijo/a' },
    { value: 'sibling', label: 'Hermano/a' },
    { value: 'spouse', label: 'Cónyuge' },
  ],
  social: [
    { value: 'ally', label: 'Aliado/a' },
    { value: 'enemy', label: 'Enemigo/a' },
    { value: 'rival', label: 'Rival' },
    { value: 'lord_vassal', label: 'Señor / vasallo' },
  ],
  professional: [
    { value: 'mentor', label: 'Mentor/a' },
    { value: 'student', label: 'Estudiante' },
    { value: 'colleague', label: 'Colega' },
    { value: 'subordinate', label: 'Subordinado/a' },
  ],
  romantic: [
    { value: 'lovers', label: 'Amantes' },
    { value: 'ex_lovers', label: 'Ex amantes' },
    { value: 'unrequited', label: 'Amor no correspondido' },
  ],
}

const TYPE_LABELS: Record<string, string> = {
  family: 'Familiar',
  social: 'Social',
  professional: 'Profesional',
  romantic: 'Romántica',
}

const selectClass =
  'flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'

interface Props {
  open: boolean
  storyCharacters: StoryCharacter[]
  existing?: StoryRelationship | null
  onSave: (data: {
    character_a_id: number
    character_b_id: number
    rel_type: string
    subtype: string
    description?: string
    directional: boolean
  }) => Promise<void>
  onDelete?: () => Promise<void>
  onClose: () => void
}

export function RelationshipEdgeDialog({
  open,
  storyCharacters,
  existing,
  onSave,
  onDelete,
  onClose,
}: Props) {
  const [charAId, setCharAId] = useState<number | ''>('')
  const [charBId, setCharBId] = useState<number | ''>('')
  const [relType, setRelType] = useState('social')
  const [subtype, setSubtype] = useState('ally')
  const [directional, setDirectional] = useState(false)
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (existing) {
      setCharAId(existing.character_a_id)
      setCharBId(existing.character_b_id)
      setRelType(existing.rel_type)
      setSubtype(existing.subtype)
      setDirectional(existing.directional)
      setDescription(existing.description ?? '')
    } else {
      setCharAId('')
      setCharBId('')
      setRelType('social')
      setSubtype('ally')
      setDirectional(false)
      setDescription('')
    }
  }, [existing, open])

  // Reset subtype when type changes
  useEffect(() => {
    const options = SUBTYPES[relType]
    if (options && !options.find(o => o.value === subtype)) {
      setSubtype(options[0].value)
    }
  }, [relType, subtype])

  const isEdit = !!existing
  const canSave = charAId !== '' && charBId !== '' && charAId !== charBId

  const handleSave = async () => {
    if (!canSave) return
    setSaving(true)
    try {
      await onSave({
        character_a_id: charAId as number,
        character_b_id: charBId as number,
        rel_type: relType,
        subtype,
        description: description.trim() || undefined,
        directional,
      })
      onClose()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try {
      await onDelete()
      onClose()
    } finally {
      setDeleting(false)
    }
  }

  const charBOptions = storyCharacters.filter(c => c.character_id !== charAId)

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar relación' : 'Nueva relación'}</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-1">
          {/* Character A */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rel-char-a">Personaje A</Label>
            <select
              id="rel-char-a"
              value={charAId}
              onChange={e => setCharAId(Number(e.target.value))}
              disabled={isEdit}
              className={selectClass}
            >
              <option value="">— selecciona —</option>
              {storyCharacters.map(c => (
                <option key={c.character_id} value={c.character_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Character B */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rel-char-b">Personaje B</Label>
            <select
              id="rel-char-b"
              value={charBId}
              onChange={e => setCharBId(Number(e.target.value))}
              disabled={isEdit}
              className={selectClass}
            >
              <option value="">— selecciona —</option>
              {charBOptions.map(c => (
                <option key={c.character_id} value={c.character_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type */}
          <div className="flex flex-col gap-1.5">
            <Label>Tipo de relación</Label>
            <div className="flex gap-2 flex-wrap">
              {Object.keys(SUBTYPES).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setRelType(t)}
                  className={`text-xs px-3 py-1.5 rounded-md border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    relType === t
                      ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                      : 'border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {TYPE_LABELS[t]}
                </button>
              ))}
            </div>
          </div>

          {/* Subtype */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rel-subtype">Subtipo</Label>
            <select
              id="rel-subtype"
              value={subtype}
              onChange={e => setSubtype(e.target.value)}
              className={selectClass}
            >
              {(SUBTYPES[relType] ?? []).map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Direction */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">Dirección:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setDirectional(false)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  !directional
                    ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                ↔ Simétrica
              </button>
              <button
                type="button"
                onClick={() => setDirectional(true)}
                className={`text-xs px-3 py-1.5 rounded-md border transition-colors ${
                  directional
                    ? 'bg-primary/10 border-primary/40 text-primary font-medium'
                    : 'border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                → Direccional
              </button>
            </div>
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rel-desc">
              Descripción <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Textarea
              id="rel-desc"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Contexto o matiz de la relación…"
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          {isEdit && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              disabled={deleting || saving}
              className="mr-auto"
            >
              {deleting ? 'Eliminando…' : 'Eliminar'}
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={saving || deleting}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!canSave || saving || deleting}>
            {saving ? 'Guardando…' : isEdit ? 'Actualizar' : 'Crear'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

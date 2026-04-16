import { useState } from 'react'
import { Plus, Pencil } from 'lucide-react'
import type { StoryRelationship, StoryCharacter } from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { RelationshipEdgeDialog } from './RelationshipEdgeDialog'

const TYPE_LABELS: Record<string, string> = {
  family: 'Familiar',
  social: 'Social',
  professional: 'Profesional',
  romantic: 'Romántica',
}

const TYPE_COLORS: Record<string, string> = {
  family: 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  social: 'bg-sky-500/10 text-sky-700 border-sky-500/20',
  professional: 'bg-violet-500/10 text-violet-700 border-violet-500/20',
  romantic: 'bg-rose-500/10 text-rose-700 border-rose-500/20',
}

interface Props {
  relationships: StoryRelationship[]
  storyCharacters: StoryCharacter[]
  onCreateRelationship: (data: {
    character_a_id: number
    character_b_id: number
    rel_type: string
    subtype: string
    description?: string
    directional: boolean
  }) => Promise<void>
  onUpdateRelationship: (relId: number, data: {
    rel_type: string
    subtype: string
    description?: string
    directional: boolean
  }) => Promise<void>
  onDeleteRelationship: (relId: number) => Promise<void>
}

export function RelationshipBoard({
  relationships,
  storyCharacters,
  onCreateRelationship,
  onUpdateRelationship,
  onDeleteRelationship,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRel, setEditingRel] = useState<StoryRelationship | null>(null)

  function getCharName(id: number) {
    return storyCharacters.find(c => c.character_id === id)?.name ?? `#${id}`
  }

  function handleOpenCreate() {
    setEditingRel(null)
    setDialogOpen(true)
  }

  function handleOpenEdit(rel: StoryRelationship) {
    setEditingRel(rel)
    setDialogOpen(true)
  }

  function handleClose() {
    setDialogOpen(false)
    setEditingRel(null)
  }

  async function handleSave(data: {
    character_a_id: number
    character_b_id: number
    rel_type: string
    subtype: string
    description?: string
    directional: boolean
  }) {
    if (editingRel) {
      await onUpdateRelationship(editingRel.id, {
        rel_type: data.rel_type,
        subtype: data.subtype,
        description: data.description,
        directional: data.directional,
      })
    } else {
      await onCreateRelationship(data)
    }
  }

  async function handleDelete() {
    if (editingRel) {
      await onDeleteRelationship(editingRel.id)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Relaciones{' '}
          {relationships.length > 0 && (
            <Badge variant="outline" className="ml-1 text-xs">
              {relationships.length}
            </Badge>
          )}
        </h3>
        {storyCharacters.length >= 2 && (
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-md bg-primary/10 text-primary hover:bg-primary/20 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir
          </button>
        )}
      </div>

      {relationships.length === 0 ? (
        <p className="text-sm text-muted-foreground italic py-2">
          {storyCharacters.length < 2
            ? 'Añade al menos dos personajes para crear relaciones.'
            : 'Sin relaciones todavía. Define cómo se conocen los personajes.'}
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {relationships.map(rel => (
            <div
              key={rel.id}
              className="border border-border rounded-lg px-4 py-3 bg-card flex items-start gap-3 group cursor-pointer hover:bg-accent/30 transition-colors"
              onClick={() => handleOpenEdit(rel)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') handleOpenEdit(rel) }}
              aria-label={`Editar relación entre ${getCharName(rel.character_a_id)} y ${getCharName(rel.character_b_id)}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground truncate">
                    {getCharName(rel.character_a_id)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {rel.directional ? '→' : '↔'}
                  </span>
                  <span className="text-sm font-medium text-foreground truncate">
                    {getCharName(rel.character_b_id)}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <Badge
                    className={`text-[10px] px-1.5 py-0 font-medium border ${
                      TYPE_COLORS[rel.rel_type] ?? 'bg-muted text-muted-foreground border-border'
                    } hover:bg-opacity-80`}
                  >
                    {TYPE_LABELS[rel.rel_type] ?? rel.rel_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{rel.subtype}</span>
                  {rel.description && (
                    <span className="text-xs text-muted-foreground italic truncate max-w-[180px]">
                      — {rel.description}
                    </span>
                  )}
                </div>
              </div>
              <Pencil className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
            </div>
          ))}
        </div>
      )}

      <RelationshipEdgeDialog
        open={dialogOpen}
        storyCharacters={storyCharacters}
        existing={editingRel}
        onSave={handleSave}
        onDelete={editingRel ? handleDelete : undefined}
        onClose={handleClose}
      />
    </div>
  )
}

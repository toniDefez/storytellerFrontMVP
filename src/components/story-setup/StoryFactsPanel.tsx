import { useState } from 'react'
import { X, Plus, Check } from 'lucide-react'
import type { StoryFact, StoryCharacter } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'

interface Props {
  facts: StoryFact[]
  storyCharacters: StoryCharacter[]
  onAdd: (content: string, knownBy: number[]) => Promise<void>
  onUpdate: (factId: number, content: string, knownBy: number[]) => Promise<void>
  onDelete: (factId: number) => Promise<void>
}

function FactCard({
  fact,
  storyCharacters,
  onUpdate,
  onDelete,
}: {
  fact: StoryFact
  storyCharacters: StoryCharacter[]
  onUpdate: (content: string, knownBy: number[]) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(fact.content)
  const [knownBy, setKnownBy] = useState<number[]>(fact.known_by ?? [])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const toggleCharacter = async (charId: number) => {
    const next = knownBy.includes(charId)
      ? knownBy.filter(id => id !== charId)
      : [...knownBy, charId]
    setKnownBy(next)
    // save immediately on toggle
    try {
      await onUpdate(content, next)
    } catch {
      // revert on error
      setKnownBy(knownBy)
    }
  }

  const handleSave = async () => {
    if (!content.trim()) return
    setSaving(true)
    try {
      await onUpdate(content.trim(), knownBy)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await onDelete()
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="border border-border rounded-lg p-4 bg-card flex flex-col gap-3">
      {editing ? (
        <>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="min-h-[72px] resize-none text-sm"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setContent(fact.content)
                setEditing(false)
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving || !content.trim()}>
              {saving ? 'Guardando…' : (
                <>
                  <Check className="w-3.5 h-3.5 mr-1" />
                  Guardar
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <div className="flex items-start gap-2">
          <p
            className="flex-1 text-sm text-foreground leading-relaxed cursor-pointer hover:text-primary transition-colors"
            onClick={() => setEditing(true)}
            role="button"
            tabIndex={0}
            onKeyDown={e => { if (e.key === 'Enter') setEditing(true) }}
          >
            {fact.content}
          </p>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-0.5"
            aria-label="Eliminar hecho"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Known by */}
      {storyCharacters.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Conocido por:</span>
          <div className="flex flex-wrap gap-1.5">
            {storyCharacters.map(char => {
              const known = knownBy.includes(char.character_id)
              return (
                <button
                  key={char.character_id}
                  onClick={() => toggleCharacter(char.character_id)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                    known
                      ? 'bg-primary/10 border-primary/30 text-primary font-medium'
                      : 'bg-muted border-border text-muted-foreground hover:bg-accent'
                  }`}
                >
                  {char.name}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function StoryFactsPanel({ facts, storyCharacters, onAdd, onUpdate, onDelete }: Props) {
  const [newContent, setNewContent] = useState('')
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!newContent.trim()) return
    setAdding(true)
    try {
      await onAdd(newContent.trim(), [])
      setNewContent('')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Hechos iniciales{' '}
          {facts.length > 0 && (
            <Badge variant="outline" className="ml-1 text-xs">
              {facts.length}
            </Badge>
          )}
        </h3>
      </div>

      {facts.length === 0 && (
        <p className="text-sm text-muted-foreground italic py-2">
          Sin hechos todavía. Los hechos son verdades que los personajes conocen (o desconocen) al comenzar la historia.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {facts.map(fact => (
          <FactCard
            key={fact.id}
            fact={fact}
            storyCharacters={storyCharacters}
            onUpdate={(content, knownBy) => onUpdate(fact.id, content, knownBy)}
            onDelete={() => onDelete(fact.id)}
          />
        ))}
      </div>

      {/* Add new fact */}
      <div className="flex flex-col gap-2 mt-1 border border-dashed border-border rounded-lg p-3 bg-muted/30">
        <Textarea
          value={newContent}
          onChange={e => setNewContent(e.target.value)}
          placeholder="Escribe un hecho conocido al inicio…"
          className="min-h-[60px] resize-none text-sm bg-background"
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleAdd()
            }
          }}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleAdd}
            disabled={adding || !newContent.trim()}
            variant="secondary"
          >
            {adding ? 'Añadiendo…' : (
              <>
                <Plus className="w-3.5 h-3.5 mr-1" />
                Añadir hecho
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}

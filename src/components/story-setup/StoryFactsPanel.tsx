import { useState } from 'react'
import { X, Plus, Check, Globe, Lock } from 'lucide-react'
import type { StoryFact, StoryCharacter } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'

interface Props {
  facts: StoryFact[]
  storyCharacters: StoryCharacter[]
  onAdd: (content: string, knownBy: number[]) => Promise<void>
  onUpdate: (factId: number, content: string, knownBy: number[]) => Promise<void>
  onDelete: (factId: number) => Promise<void>
}

// ── FactCard ──────────────────────────────────────────────────────────────────

interface FactCardProps {
  fact: StoryFact
  storyCharacters: StoryCharacter[]
  isSecret: boolean
  onUpdate: (content: string, knownBy: number[]) => Promise<void>
  onDelete: () => Promise<void>
}

function FactCard({ fact, storyCharacters, isSecret, onUpdate, onDelete }: FactCardProps) {
  const [editing, setEditing] = useState(false)
  const [content, setContent] = useState(fact.content)
  const [knownBy, setKnownBy] = useState<number[]>(fact.known_by ?? [])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const toggleCharacter = async (charId: number) => {
    const prev = knownBy
    const next = knownBy.includes(charId)
      ? knownBy.filter(id => id !== charId)
      : [...knownBy, charId]
    setKnownBy(next)
    try {
      await onUpdate(content, next)
    } catch {
      setKnownBy(prev)
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
    <div className="group relative border border-border rounded-lg p-3 bg-card flex flex-col gap-2.5 hover:border-border/80 transition-colors">
      {editing ? (
        <>
          <Textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="min-h-[68px] resize-none text-sm"
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
            className="shrink-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-0.5"
            aria-label="Eliminar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Character chips — only for secrets */}
      {isSecret && storyCharacters.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {storyCharacters.map(char => {
            const known = knownBy.includes(char.character_id)
            return (
              <button
                key={char.character_id}
                onClick={() => toggleCharacter(char.character_id)}
                className={`text-xs px-2 py-0.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                  known
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 font-medium'
                    : 'bg-muted border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {char.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── AddFactRow ────────────────────────────────────────────────────────────────

interface AddFactRowProps {
  placeholder: string
  buttonLabel: string
  initialKnownBy: number[]
  storyCharacters: StoryCharacter[]
  isSecret: boolean
  onAdd: (content: string, knownBy: number[]) => Promise<void>
}

function AddFactRow({ placeholder, buttonLabel, initialKnownBy, storyCharacters, isSecret, onAdd }: AddFactRowProps) {
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [knownBy, setKnownBy] = useState<number[]>(initialKnownBy)
  const [adding, setAdding] = useState(false)

  const handleAdd = async () => {
    if (!content.trim()) return
    setAdding(true)
    try {
      await onAdd(content.trim(), knownBy)
      setContent('')
      setKnownBy(initialKnownBy)
      setOpen(false)
    } finally {
      setAdding(false)
    }
  }

  const toggleChar = (id: number) => {
    setKnownBy(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-1.5 px-3 py-2 rounded-lg border border-dashed border-border
                   text-xs text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted/40
                   transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        {buttonLabel}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-2 border border-dashed border-border rounded-lg p-3 bg-muted/30">
      <Textarea
        value={content}
        onChange={e => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[60px] resize-none text-sm bg-background"
        autoFocus
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            handleAdd()
          }
          if (e.key === 'Escape') {
            setContent('')
            setOpen(false)
          }
        }}
      />

      {/* Character toggles for secrets */}
      {isSecret && storyCharacters.length > 0 && (
        <div className="flex flex-col gap-1">
          <span className="text-xs text-muted-foreground">¿Quién lo sabe?</span>
          <div className="flex flex-wrap gap-1.5">
            {storyCharacters.map(char => {
              const selected = knownBy.includes(char.character_id)
              return (
                <button
                  key={char.character_id}
                  onClick={() => toggleChar(char.character_id)}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    selected
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 font-medium'
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

      <div className="flex gap-2 justify-end">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setContent('')
            setKnownBy(initialKnownBy)
            setOpen(false)
          }}
          disabled={adding}
        >
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleAdd}
          disabled={adding || !content.trim()}
          variant="secondary"
        >
          {adding ? 'Añadiendo…' : (
            <>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Añadir
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// ── StoryFactsPanel ───────────────────────────────────────────────────────────

export function StoryFactsPanel({ facts, storyCharacters, onAdd, onUpdate, onDelete }: Props) {
  // A fact is "public" if known_by is empty (everyone knows)
  const publicFacts = facts.filter(f => !f.known_by || f.known_by.length === 0)
  const secretFacts = facts.filter(f => f.known_by && f.known_by.length > 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground">Verdades del mundo</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Lo que es verdad cuando la historia comienza</p>
      </div>

      {/* ── Bucket 1: Lo que todos saben ────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Lo que todos saben
          </span>
        </div>

        {publicFacts.length === 0 && (
          <p className="text-xs text-muted-foreground/60 italic px-1">
            No hay verdades públicas aún
          </p>
        )}

        <div className="flex flex-col gap-2">
          {publicFacts.map(fact => (
            <FactCard
              key={fact.id}
              fact={fact}
              storyCharacters={storyCharacters}
              isSecret={false}
              onUpdate={(content, knownBy) => onUpdate(fact.id, content, knownBy)}
              onDelete={() => onDelete(fact.id)}
            />
          ))}
        </div>

        <AddFactRow
          placeholder="Una verdad que todos en esta historia conocen…"
          buttonLabel="Añadir verdad pública"
          initialKnownBy={[]}
          storyCharacters={storyCharacters}
          isSecret={false}
          onAdd={(content, knownBy) => onAdd(content, knownBy)}
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border/40" />

      {/* ── Bucket 2: Secretos ──────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-1.5">
          <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Secretos
          </span>
        </div>

        {secretFacts.length === 0 && (
          <p className="text-xs text-muted-foreground/60 italic px-1">
            No hay secretos aún
          </p>
        )}

        <div className="flex flex-col gap-2">
          {secretFacts.map(fact => (
            <FactCard
              key={fact.id}
              fact={fact}
              storyCharacters={storyCharacters}
              isSecret={true}
              onUpdate={(content, knownBy) => onUpdate(fact.id, content, knownBy)}
              onDelete={() => onDelete(fact.id)}
            />
          ))}
        </div>

        <AddFactRow
          placeholder="Algo que solo algunos personajes saben…"
          buttonLabel="Añadir secreto"
          initialKnownBy={storyCharacters.length > 0 ? [storyCharacters[0].character_id] : []}
          storyCharacters={storyCharacters}
          isSecret={true}
          onAdd={(content, knownBy) => onAdd(content, knownBy)}
        />
      </div>
    </div>
  )
}

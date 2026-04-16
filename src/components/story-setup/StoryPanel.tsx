import { useState, useEffect, useCallback, useRef } from 'react'
import { Plus, BookOpen, Trash2, Check, X } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  createStory,
  getStoryDetail,
  updateStory,
  deleteStory,
  addStoryCharacter,
  removeStoryCharacter,
  createRelationship,
  updateRelationship,
  deleteRelationship,
  createFact,
  updateFact,
  deleteFact,
} from '@/services/api'
import type {
  StoryBrief,
  CharacterBrief,
  StoryDetail,
  StoryCharacter,
  NarratorConfig,
} from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { StoryRoster } from './StoryRoster'
import { RelationshipBoard } from './RelationshipBoard'
import { StoryFactsPanel } from './StoryFactsPanel'
import { NarratorDefaultPanel } from './NarratorDefaultPanel'

// ── Helpers ───────────────────────────────────────────────────────────────────

function statusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <Badge className="text-[10px] px-1.5 py-0 font-medium bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/10">
          activa
        </Badge>
      )
    case 'archived':
      return (
        <Badge className="text-[10px] px-1.5 py-0 font-medium bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/10">
          archivada
        </Badge>
      )
    default:
      return (
        <Badge className="text-[10px] px-1.5 py-0 font-medium bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/10">
          borrador
        </Badge>
      )
  }
}

// ── InlineEdit ────────────────────────────────────────────────────────────────

interface InlineEditProps {
  value: string
  onSave: (val: string) => Promise<void>
  placeholder?: string
  multiline?: boolean
  className?: string
}

function InlineEdit({ value, onSave, placeholder, multiline, className }: InlineEditProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLInputElement & HTMLTextAreaElement>(null)

  useEffect(() => {
    if (editing && ref.current) ref.current.focus()
  }, [editing])

  // Keep draft in sync when value changes externally (e.g. after story switch)
  useEffect(() => {
    if (!editing) setDraft(value)
  }, [value, editing])

  async function handleSave() {
    if (draft.trim() === value) { setEditing(false); return }
    setSaving(true)
    try {
      await onSave(draft.trim())
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setDraft(value); setEditing(false) }
    if (e.key === 'Enter' && !multiline) { e.preventDefault(); handleSave() }
    if (e.key === 'Enter' && multiline && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handleSave() }
  }

  if (!editing) {
    return (
      <span
        onClick={() => { setDraft(value); setEditing(true) }}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter') { setDraft(value); setEditing(true) } }}
        className={`cursor-pointer hover:opacity-70 transition-opacity focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm ${className ?? ''}`}
        title="Clic para editar"
      >
        {value || <span className="opacity-40">{placeholder}</span>}
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1 w-full">
      {multiline ? (
        <Textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className={`resize-none text-sm ${className ?? ''}`}
          disabled={saving}
        />
      ) : (
        <Input
          ref={ref as React.Ref<HTMLInputElement>}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`h-auto py-0.5 text-inherit font-inherit bg-transparent ${className ?? ''}`}
          disabled={saving}
        />
      )}
      <button
        onClick={handleSave}
        disabled={saving}
        className="shrink-0 text-primary hover:text-primary/70 transition-colors"
        aria-label="Confirmar"
      >
        <Check className="w-4 h-4" />
      </button>
      <button
        onClick={() => { setDraft(value); setEditing(false) }}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Cancelar"
      >
        <X className="w-4 h-4" />
      </button>
    </span>
  )
}

// ── StorySidebarItem ──────────────────────────────────────────────────────────

interface StorySidebarItemProps {
  story: StoryBrief
  index: number
  selected: boolean
  onClick: () => void
  onDelete: () => void
}

function StorySidebarItem({ story, index, selected, onClick, onDelete }: StorySidebarItemProps) {
  return (
    <motion.button
      onClick={onClick}
      className={`
        group w-full flex items-center gap-3 px-3 py-3 rounded-lg text-left
        transition-colors duration-150 relative
        ${selected
          ? 'bg-[hsl(188_94%_94%/0.6)] border border-[#06b6d4]/30 shadow-sm'
          : 'border border-transparent hover:bg-[hsl(188_94%_94%/0.3)]'
        }
      `}
      whileHover={{ x: selected ? 0 : 2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {selected && (
        <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-[#06b6d4]/60" />
      )}

      {/* Chapter number */}
      <span className={`
        font-display text-lg italic leading-none select-none shrink-0 w-8 text-right
        transition-colors duration-150
        ${selected ? 'text-[#06b6d4]/70' : 'text-[#06b6d4]/25 group-hover:text-[#06b6d4]/50'}
      `}>
        {String(index + 1).padStart(2, '0')}
      </span>

      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-medium truncate transition-colors duration-150 ${selected ? 'text-[#0e7490]' : 'text-foreground group-hover:text-[#0e7490]'}`}>
          {story.title}
        </span>
      </span>

      <span className="shrink-0 self-center">
        {statusBadge(story.status)}
      </span>

      <span
        role="button"
        tabIndex={0}
        onClick={e => { e.stopPropagation(); onDelete() }}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onDelete() } }}
        className="opacity-0 group-hover:opacity-100 shrink-0 p-1 rounded-md
                   text-muted-foreground/40 hover:text-red-500 hover:bg-red-50
                   transition-all duration-150"
        aria-label={`Eliminar ${story.title}`}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </span>
    </motion.button>
  )
}

// ── StoryDetailPane ───────────────────────────────────────────────────────────

interface StoryDetailPaneProps {
  storyId: number
  worldCharacters: CharacterBrief[]
  onStoryUpdated: (title: string) => void
}

function StoryDetailPane({ storyId, worldCharacters, onStoryUpdated }: StoryDetailPaneProps) {
  const [detail, setDetail] = useState<StoryDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const sd = await getStoryDetail(storyId)
      setDetail(sd)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la historia.')
    } finally {
      setLoading(false)
    }
  }, [storyId])

  useEffect(() => { load() }, [load])

  const handleUpdateTitle = async (title: string) => {
    await updateStory(storyId, { title })
    setDetail(prev => prev ? { ...prev, story: { ...prev.story, title } } : prev)
    onStoryUpdated(title)
    toast.success('Título actualizado.')
  }

  const handleUpdatePremise = async (premise: string) => {
    await updateStory(storyId, { premise })
    setDetail(prev => prev ? { ...prev, story: { ...prev.story, premise } } : prev)
    toast.success('Premisa actualizada.')
  }

  const handleAddCharacter = async (characterId: number) => {
    await addStoryCharacter(storyId, characterId)
    await load()
    toast.success('Personaje añadido al reparto.')
  }

  const handleRemoveCharacter = async (characterId: number) => {
    await removeStoryCharacter(storyId, characterId)
    await load()
    toast.success('Personaje eliminado del reparto.')
  }

  const handleCreateRelationship = async (data: {
    character_a_id: number
    character_b_id: number
    rel_type: string
    subtype: string
    description?: string
    directional: boolean
  }) => {
    await createRelationship(storyId, data)
    await load()
    toast.success('Relación creada.')
  }

  const handleUpdateRelationship = async (
    relId: number,
    data: { rel_type: string; subtype: string; description?: string; directional: boolean },
  ) => {
    await updateRelationship(relId, data)
    await load()
    toast.success('Relación actualizada.')
  }

  const handleDeleteRelationship = async (relId: number) => {
    await deleteRelationship(relId)
    await load()
    toast.success('Relación eliminada.')
  }

  const handleAddFact = async (content: string, knownBy: number[]) => {
    await createFact(storyId, content, knownBy)
    await load()
    toast.success('Hecho añadido.')
  }

  const handleUpdateFact = async (factId: number, content: string, knownBy: number[]) => {
    await updateFact(factId, content, knownBy)
    await load()
  }

  const handleDeleteFact = async (factId: number) => {
    await deleteFact(factId)
    await load()
    toast.success('Hecho eliminado.')
  }

  const handleNarratorChange = async (config: NarratorConfig) => {
    if (!detail) return
    setDetail(prev => prev ? { ...prev, story: { ...prev.story, narrator_default: config } } : prev)
    try {
      await updateStory(storyId, { narrator_default: config })
    } catch {
      toast.error('Error al guardar la configuración del narrador.')
      await load()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#06b6d4]/30 border-t-[#06b6d4] rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando historia...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full px-8">
        <p className="text-sm text-destructive text-center">{error}</p>
      </div>
    )
  }

  if (!detail) return null

  const { story, characters, relationships, facts } = detail
  const rosteredIds = new Set((characters ?? []).map((c: StoryCharacter) => c.character_id))
  const availableCharacters = worldCharacters.filter(c => !rosteredIds.has(c.id))
  const narratorConfig: NarratorConfig = story.narrator_default ?? {
    pov: '',
    style: '',
    distance: '',
    reliability: '',
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Story identity bar */}
      <div className="px-6 pt-5 pb-0 shrink-0">
        {/* Inline-editable title */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-[#06b6d4] shrink-0" />
          <span className="text-base font-semibold text-foreground min-w-0 flex-1">
            <InlineEdit
              value={story.title}
              onSave={handleUpdateTitle}
              placeholder="Título de la historia"
              className="font-semibold text-base"
            />
          </span>
          <span className="shrink-0">{statusBadge(story.status)}</span>
        </div>

        {/* Inline-editable premise */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground font-medium mb-1">Premisa</p>
          <InlineEdit
            value={story.premise ?? ''}
            onSave={handleUpdatePremise}
            placeholder="¿De qué trata esta historia?"
            multiline
            className="text-sm text-foreground"
          />
        </div>

        <Separator className="mb-4" />

        <TabsList className="mb-0">
          <TabsTrigger value="roster">Reparto y relaciones</TabsTrigger>
          <TabsTrigger value="facts">Hechos y narrador</TabsTrigger>
        </TabsList>
      </div>

      {/* Tab: Roster + Relationships */}
      <TabsContent value="roster" className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-8 max-w-3xl">
          <StoryRoster
            storyCharacters={characters}
            availableCharacters={availableCharacters}
            onAdd={handleAddCharacter}
            onRemove={handleRemoveCharacter}
          />
          <Separator />
          <RelationshipBoard
            relationships={relationships}
            storyCharacters={characters}
            onCreateRelationship={handleCreateRelationship}
            onUpdateRelationship={handleUpdateRelationship}
            onDeleteRelationship={handleDeleteRelationship}
          />
        </div>
      </TabsContent>

      {/* Tab: Facts + Narrator */}
      <TabsContent value="facts" className="flex-1 overflow-y-auto px-6 py-5">
        <div className="flex flex-col gap-8 max-w-3xl">
          <StoryFactsPanel
            facts={facts}
            storyCharacters={characters}
            onAdd={handleAddFact}
            onUpdate={handleUpdateFact}
            onDelete={handleDeleteFact}
          />
          <Separator />
          <NarratorDefaultPanel
            narratorConfig={narratorConfig}
            onChange={handleNarratorChange}
          />
        </div>
      </TabsContent>
    </div>
  )
}

// ── StoryPanel (main export) ──────────────────────────────────────────────────

interface Props {
  worldId: number
  stories: StoryBrief[]
  characters: CharacterBrief[]
  onStoryListChanged: () => void
}

export function StoryPanel({ worldId, stories: initialStories, characters, onStoryListChanged }: Props) {
  const [stories, setStories] = useState<StoryBrief[]>(initialStories)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [premise, setPremise] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Keep local list in sync when parent refreshes world detail
  useEffect(() => {
    setStories(initialStories)
  }, [initialStories])

  const handleSelect = (id: number) => {
    setSelectedId(id)
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteStory(id)
      setStories(prev => prev.filter(s => s.id !== id))
      if (selectedId === id) setSelectedId(null)
      onStoryListChanged()
      toast.success('Historia eliminada.')
    } catch {
      toast.error('Error al eliminar la historia.')
    }
  }

  const handleCreate = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setCreateError('El título es obligatorio.')
      return
    }
    setCreating(true)
    setCreateError('')
    try {
      const story = await createStory(worldId, trimmedTitle, premise.trim() || undefined)
      const newBrief: StoryBrief = { id: story.id, title: story.title, status: story.status }
      setStories(prev => [...prev, newBrief])
      setSelectedId(story.id)
      setDialogOpen(false)
      setTitle('')
      setPremise('')
      onStoryListChanged()
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : 'Error al crear la historia.')
    } finally {
      setCreating(false)
    }
  }

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      setTitle('')
      setPremise('')
      setCreateError('')
    }
    setDialogOpen(open)
  }

  // When a story's title is updated inline, sync local brief list
  const handleStoryTitleUpdated = (id: number, newTitle: string) => {
    setStories(prev => prev.map(s => s.id === id ? { ...s, title: newTitle } : s))
  }

  return (
    <div className="grid grid-cols-[320px_1fr] h-full min-h-0">
      {/* ── Left sidebar: story list ────────────────────────────────────── */}
      <div className="flex flex-col h-full min-h-0 border-r border-border/40">
        {/* Story list */}
        <div className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-1.5">
          {stories.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <p className="font-display text-xl italic text-foreground/15 mb-2">Sin historias aún</p>
              <p className="text-sm text-muted-foreground/50">Cada historia vive en este mundo y sigue su propio arco.</p>
            </div>
          ) : (
            stories.map((s, index) => (
              <StorySidebarItem
                key={s.id}
                story={s}
                index={index}
                selected={selectedId === s.id}
                onClick={() => handleSelect(s.id)}
                onDelete={() => handleDelete(s.id)}
              />
            ))
          )}
        </div>

        {/* New story button — sticky bottom */}
        <div className="sticky bottom-0 px-3 py-3 bg-gradient-to-t from-[var(--background)] to-transparent">
          <button
            onClick={() => setDialogOpen(true)}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg
                       border-2 border-dashed border-[#06b6d4]/20
                       text-[#0e7490] text-xs font-medium
                       hover:border-[#06b6d4]/40 hover:bg-[#06b6d4]/[0.04]
                       transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva historia
          </button>
        </div>
      </div>

      {/* ── Right pane: story detail ────────────────────────────────────── */}
      <div className="h-full overflow-hidden">
        {selectedId == null ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/15 mb-3" />
            <p className="font-display text-lg italic text-foreground/15">
              Selecciona una historia o crea una nueva
            </p>
          </div>
        ) : (
          <Tabs defaultValue="roster" className="flex-1 flex flex-col overflow-hidden h-full" key={selectedId}>
            <StoryDetailPane
              storyId={selectedId}
              worldCharacters={characters}
              onStoryUpdated={(newTitle) => handleStoryTitleUpdated(selectedId, newTitle)}
            />
          </Tabs>
        )}
      </div>

      {/* ── Create Story Dialog ─────────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl italic">Nueva historia</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="story-title" className="text-sm font-medium">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="story-title"
                placeholder="El nombre de esta historia..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="story-premise" className="text-sm font-medium">
                Premisa <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="story-premise"
                placeholder="De qué trata esta historia, qué conflicto central la mueve..."
                value={premise}
                onChange={e => setPremise(e.target.value)}
                rows={3}
                className="resize-none"
              />
            </div>
            {createError && (
              <p className="text-sm text-destructive">{createError}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => handleDialogOpenChange(false)} disabled={creating}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !title.trim()}
              className="bg-[#06b6d4] hover:bg-[#0891b2] text-white"
            >
              {creating ? 'Creando...' : 'Crear historia'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

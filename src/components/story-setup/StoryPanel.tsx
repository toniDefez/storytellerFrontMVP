import { useState, useEffect } from 'react'
import { Plus, BookOpen, Trash2 } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  createStory,
  deleteStory,
} from '@/services/api'
import type {
  StoryBrief,
  CharacterBrief,
} from '@/services/api'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { StoryGraphCanvas } from '@/components/story-graph/StoryGraphCanvas'

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

      {/* ── Right pane: story graph canvas ─────────────────────────────── */}
      <div className="h-full overflow-hidden">
        {selectedId == null ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/15 mb-3" />
            <p className="font-display text-lg italic text-foreground/15">
              Selecciona una historia o crea una nueva
            </p>
          </div>
        ) : (
          <StoryGraphCanvas
            key={selectedId}
            storyBrief={stories.find(s => s.id === selectedId)!}
            worldCharacters={characters}
          />
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

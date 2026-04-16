import { useState } from 'react'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { createStory } from '@/services/api'
import type { StoryBrief } from '@/services/api'
import { StoryCatalogCard } from './StoryCatalogCard'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  worldId: number
  stories: StoryBrief[]
  onStorySelect: (id: number) => void
  onStoryCreated: (story: StoryBrief) => void
}

// ── StoryCatalog ──────────────────────────────────────────────────────────────

export function StoryCatalog({ worldId, stories, onStorySelect, onStoryCreated }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [premise, setPremise] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

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
      onStoryCreated(newBrief)
      setDialogOpen(false)
      setTitle('')
      setPremise('')
      onStorySelect(story.id)
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
    <div className="max-w-5xl mx-auto px-10 py-8">
      {/* ── Header ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl italic text-foreground/80">Historias</h1>
        <Button
          onClick={() => setDialogOpen(true)}
          className="bg-[#06b6d4] hover:bg-[#0891b2] text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Nueva historia
        </Button>
      </div>

      {/* ── Empty state ──────────────────────────────────────────────── */}
      {stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <p className="font-display text-2xl italic text-foreground/15 mb-2">Sin historias aún</p>
          <p className="text-sm text-muted-foreground/50 max-w-xs">
            Cada historia vive en este mundo y sigue su propio arco.
          </p>
        </div>
      ) : (
        /* ── Grid ──────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story, index) => (
            <StoryCatalogCard
              key={story.id}
              story={story}
              index={index}
              onClick={() => onStorySelect(story.id)}
            />
          ))}

          {/* Create new card */}
          <motion.button
            onClick={() => setDialogOpen(true)}
            className="aspect-[3/4] rounded-sm border-2 border-dashed border-cyan-400/20
                       flex flex-col items-center justify-center gap-3
                       text-[#0e7490]/40 hover:text-[#0e7490]/70
                       transition-colors duration-200 cursor-pointer
                       focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/60"
            whileHover={{ borderColor: 'rgba(6,182,212,0.35)' }}
            transition={{ duration: 0.15 }}
          >
            <Plus className="w-8 h-8" />
            <span className="text-sm font-medium">Nueva historia</span>
          </motion.button>
        </div>
      )}

      {/* ── Create Story Dialog ──────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-xl italic">Nueva historia</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="story-title-catalog" className="text-sm font-medium">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="story-title-catalog"
                placeholder="El nombre de esta historia..."
                value={title}
                onChange={e => setTitle(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleCreate() }}
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="story-premise-catalog" className="text-sm font-medium">
                Premisa <span className="text-xs text-muted-foreground font-normal">(opcional)</span>
              </Label>
              <Textarea
                id="story-premise-catalog"
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

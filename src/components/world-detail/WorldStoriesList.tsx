import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { createStory } from '@/services/api'
import type { StoryBrief } from '@/services/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface Props {
  worldId: number
  stories: StoryBrief[]
}

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

export function WorldStoriesList({ worldId, stories }: Props) {
  const navigate = useNavigate()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [premise, setPremise] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  const handleCreate = async () => {
    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('El título es obligatorio.')
      return
    }
    setCreating(true)
    setError('')
    try {
      const story = await createStory(worldId, trimmedTitle, premise.trim() || undefined)
      setDialogOpen(false)
      setTitle('')
      setPremise('')
      navigate(`/worlds/${worldId}/stories/${story.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la historia.')
    } finally {
      setCreating(false)
    }
  }

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setTitle('')
      setPremise('')
      setError('')
    }
    setDialogOpen(open)
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="px-10 py-8 max-w-3xl">

        {/* Section heading */}
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl italic text-foreground tracking-tight">Historias</h2>
            {stories.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">{stories.length} en este mundo</p>
            )}
          </div>
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-[#06b6d4]/10 text-[#0e7490] hover:bg-[#06b6d4]/20 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/50 focus-visible:ring-offset-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva historia
          </button>
        </div>

        {/* Empty state */}
        {stories.length === 0 ? (
          <div className="py-20 text-center">
            <p className="font-display text-2xl italic text-foreground/20 mb-3">Sin historias aún</p>
            <p className="text-sm text-muted-foreground mb-5">Cada historia vive en este mundo y sigue su propio arco.</p>
            <button
              onClick={() => setDialogOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-[#0e7490] hover:text-[#06b6d4] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/50 focus-visible:ring-offset-2 rounded-sm"
            >
              <Plus className="w-4 h-4" />
              Crear la primera
            </button>
          </div>
        ) : (
          <div className="flex flex-col">
            {stories.map((s, index) => (
              <Link
                key={s.id}
                to={`/worlds/${worldId}/stories/${s.id}`}
                className="group flex items-baseline gap-5 py-4 border-b border-border/30 last:border-0 -mx-4 px-4 rounded-sm hover:bg-[#06b6d4]/[0.03] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/50 focus-visible:ring-offset-2"
              >
                {/* Chapter-style number */}
                <span className="font-display text-3xl italic leading-none text-[#06b6d4]/25 group-hover:text-[#06b6d4]/60 transition-colors duration-150 w-9 text-right shrink-0">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="flex-1 text-sm font-medium text-foreground group-hover:text-[#0e7490] transition-colors duration-150 leading-snug">
                  {s.title}
                </span>
                <span className="shrink-0 self-center">
                  {statusBadge(s.status)}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Create Story Dialog */}
      <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
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
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={creating}>
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

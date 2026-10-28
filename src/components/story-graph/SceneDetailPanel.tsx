import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { Trash2, UserPlus, X, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  getSceneDetail,
  getSceneCharacters,
  updateScene,
  deleteScene,
  addSceneCharacter,
  removeSceneCharacter,
} from '@/services/api'
import type { StoryScene, SceneCharacter, StoryCharacter } from '@/services/api'

interface Props {
  sceneId: number
  storyCharacters: StoryCharacter[] // full story roster
  onDelete: () => void
  onTitleChange?: () => void // signal canvas to reload
}

function statusLabel(status: string): { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } {
  switch (status) {
    case 'generated':
      return { label: 'Generado', variant: 'default' }
    case 'stale':
      return { label: 'Desactualizado', variant: 'destructive' }
    default:
      return { label: 'Borrador', variant: 'secondary' }
  }
}

export function SceneDetailPanel({ sceneId, storyCharacters, onDelete, onTitleChange }: Props) {
  const [scene, setScene] = useState<StoryScene | null>(null)
  const [characters, setCharacters] = useState<SceneCharacter[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [s, chars] = await Promise.all([
        getSceneDetail(sceneId),
        getSceneCharacters(sceneId),
      ])
      setScene(s)
      setCharacters(chars)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar la escena.')
    } finally {
      setLoading(false)
    }
  }, [sceneId])

  useEffect(() => {
    load()
  }, [load])

  const handleTitleSave = async () => {
    if (!scene || titleDraft.trim() === scene.title) {
      setEditingTitle(false)
      return
    }
    const trimmed = titleDraft.trim()
    if (!trimmed) return
    try {
      await updateScene(sceneId, { title: trimmed })
      setScene(prev => prev ? { ...prev, title: trimmed } : prev)
      onTitleChange?.()
      toast.success('Título actualizado.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar.')
    } finally {
      setEditingTitle(false)
    }
  }

  const handleAddCharacter = async (characterId: number) => {
    try {
      await addSceneCharacter(sceneId, characterId)
      await load()
      toast.success('Personaje añadido a la escena.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al añadir personaje.')
    }
  }

  const handleRemoveCharacter = async (characterId: number) => {
    try {
      await removeSceneCharacter(sceneId, characterId)
      await load()
      toast.success('Personaje eliminado de la escena.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar personaje.')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta escena? Esta acción no se puede deshacer.')) return
    setDeleting(true)
    try {
      await deleteScene(sceneId)
      toast.success('Escena eliminada.')
      onDelete()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al eliminar la escena.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="w-4 h-4 border border-[#06b6d4]/30 border-t-[#06b6d4] rounded-full animate-spin" />
      </div>
    )
  }

  if (!scene) return null

  const assignedIds = new Set(characters.map(c => c.character_id))
  const available = storyCharacters.filter(c => !assignedIds.has(c.character_id))
  const { label: statusText, variant: statusVariant } = statusLabel(scene.status)

  return (
    <div className="flex flex-col gap-5">
      {/* Title */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          Título
        </p>
        {editingTitle ? (
          <div className="flex gap-1.5">
            <Input
              value={titleDraft}
              onChange={e => setTitleDraft(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleTitleSave()
                if (e.key === 'Escape') setEditingTitle(false)
              }}
              autoFocus
              className="h-8 text-sm"
            />
            <Button size="sm" variant="outline" onClick={handleTitleSave} className="h-8 px-2 text-xs">
              Guardar
            </Button>
          </div>
        ) : (
          <button
            className="text-sm font-semibold text-stone-800 hover:text-cyan-700 text-left w-full transition-colors"
            onClick={() => {
              setTitleDraft(scene.title)
              setEditingTitle(true)
            }}
          >
            {scene.title}
          </button>
        )}
      </div>

      {/* Status */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          Estado
        </p>
        <Badge variant={statusVariant}>{statusText}</Badge>
      </div>

      <Separator />

      {/* Location */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
          Locación
        </p>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 shrink-0" />
          {scene.location_name ? (
            <span className="text-stone-700">{scene.location_name}</span>
          ) : (
            <span className="italic text-xs">Sin locación asignada (próximamente)</span>
          )}
        </div>
      </div>

      <Separator />

      {/* Characters */}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
          Personajes en escena
        </p>

        {characters.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">Sin personajes asignados.</p>
        ) : (
          <ul className="flex flex-col gap-1.5 mb-3">
            {characters.map(c => (
              <li key={c.character_id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-orange-100 border border-orange-300 text-[10px] text-orange-600 flex items-center justify-center font-medium uppercase">
                    {(c.name ?? '?').charAt(0)}
                  </span>
                  <span className="text-sm text-stone-700">{c.name ?? `#${c.character_id}`}</span>
                </div>
                <button
                  className="text-muted-foreground hover:text-rose-500 transition-colors"
                  onClick={() => handleRemoveCharacter(c.character_id)}
                  aria-label="Eliminar personaje"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* Add character */}
        {available.length > 0 && (
          <div>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1.5">
              Añadir del reparto
            </p>
            <div className="flex flex-col gap-1">
              {available.map(c => (
                <button
                  key={c.character_id}
                  className="flex items-center gap-2 text-sm text-stone-600 hover:text-cyan-700 hover:bg-cyan-50 rounded px-2 py-1 transition-colors text-left"
                  onClick={() => handleAddCharacter(c.character_id)}
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <Separator />

      {/* Delete */}
      <Button
        variant="destructive"
        size="sm"
        onClick={handleDelete}
        disabled={deleting}
        className="w-full"
      >
        <Trash2 className="w-3.5 h-3.5 mr-1.5" />
        {deleting ? 'Eliminando…' : 'Eliminar escena'}
      </Button>
    </div>
  )
}

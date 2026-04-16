import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useCallback, useRef } from 'react'
import {
  getStoryDetail,
  getWorldDetail,
  updateStory,
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
  StoryDetail,
  WorldDetail,
  NarratorConfig,
  StoryCharacter,
} from '@/services/api'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Check, X } from 'lucide-react'
import { StoryRoster } from '@/components/story-setup/StoryRoster'
import { RelationshipBoard } from '@/components/story-setup/RelationshipBoard'
import { StoryFactsPanel } from '@/components/story-setup/StoryFactsPanel'
import { NarratorDefaultPanel } from '@/components/story-setup/NarratorDefaultPanel'

// ── Inline editable field ─────────────────────────────────────────────────────

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

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StorySetupPage() {
  const { worldId, storyId } = useParams()
  const navigate = useNavigate()

  const [detail, setDetail] = useState<StoryDetail | null>(null)
  const [worldDetail, setWorldDetail] = useState<WorldDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // ── Load ──────────────────────────────────────────────────────────────────

  const load = useCallback(async () => {
    if (!storyId || !worldId) return
    try {
      const [sd, wd] = await Promise.all([
        getStoryDetail(Number(storyId)),
        getWorldDetail(Number(worldId)),
      ])
      setDetail(sd)
      setWorldDetail(wd)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar la historia.')
    } finally {
      setLoading(false)
    }
  }, [storyId, worldId])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    if (detail?.story?.title) {
      document.title = `${detail.story.title} — StoryTeller`
    }
  }, [detail?.story?.title])

  // ── Inline title / premise update ─────────────────────────────────────────

  const handleUpdateTitle = async (title: string) => {
    if (!storyId) return
    await updateStory(Number(storyId), { title })
    setDetail(prev => prev ? { ...prev, story: { ...prev.story, title } } : prev)
    toast.success('Título actualizado.')
  }

  const handleUpdatePremise = async (premise: string) => {
    if (!storyId) return
    await updateStory(Number(storyId), { premise })
    setDetail(prev => prev ? { ...prev, story: { ...prev.story, premise } } : prev)
    toast.success('Premisa actualizada.')
  }

  // ── Roster ────────────────────────────────────────────────────────────────

  const handleAddCharacter = async (characterId: number) => {
    if (!storyId) return
    await addStoryCharacter(Number(storyId), characterId)
    await load()
    toast.success('Personaje añadido al reparto.')
  }

  const handleRemoveCharacter = async (characterId: number) => {
    if (!storyId) return
    await removeStoryCharacter(Number(storyId), characterId)
    await load()
    toast.success('Personaje eliminado del reparto.')
  }

  // ── Relationships ─────────────────────────────────────────────────────────

  const handleCreateRelationship = async (data: {
    character_a_id: number
    character_b_id: number
    rel_type: string
    subtype: string
    description?: string
    directional: boolean
  }) => {
    if (!storyId) return
    await createRelationship(Number(storyId), data)
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

  // ── Facts ─────────────────────────────────────────────────────────────────

  const handleAddFact = async (content: string, knownBy: number[]) => {
    if (!storyId) return
    await createFact(Number(storyId), content, knownBy)
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

  // ── Narrator ──────────────────────────────────────────────────────────────

  const handleNarratorChange = async (config: NarratorConfig) => {
    if (!storyId || !detail) return
    setDetail(prev => prev ? { ...prev, story: { ...prev.story, narrator_default: config } } : prev)
    try {
      await updateStory(Number(storyId), { narrator_default: config })
    } catch {
      toast.error('Error al guardar la configuración del narrador.')
      await load()
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────

  const rosteredIds = new Set((detail?.characters ?? []).map((c: StoryCharacter) => c.character_id))
  const availableCharacters = (worldDetail?.characters ?? []).filter(c => !rosteredIds.has(c.id))

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <DetailSkeleton />
  if (error) return (
    <div className="flex justify-center items-center h-96">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  )
  if (!detail) return null

  const { story, characters, relationships, facts } = detail
  const narratorConfig: NarratorConfig = story.narrator_default ?? {
    pov: '',
    style: '',
    distance: '',
    reliability: '',
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* ── Toolbar ───────────────────────────────────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 border-b border-border/60 bg-background shrink-0"
        style={{ height: 44 }}
      >
        <button
          onClick={() => navigate(`/worlds/${worldId}`)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0 flex items-center gap-1"
        >
          ← Mundo
        </button>

        <span className="text-border/60 text-xs shrink-0">/</span>

        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ backgroundColor: '#06b6d4' }}
        />

        {/* Inline-editable title */}
        <span className="text-sm font-medium text-foreground min-w-0 flex-1 max-w-xs">
          <InlineEdit
            value={story.title}
            onSave={handleUpdateTitle}
            placeholder="Título de la historia"
            className="font-medium text-sm"
          />
        </span>
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden flex">
        <Tabs defaultValue="roster" className="flex-1 flex flex-col overflow-hidden">
          {/* Tab list */}
          <div className="px-6 pt-5 pb-0 shrink-0">
            {/* Premise (inline editable, below title) */}
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
        </Tabs>
      </div>
    </div>
  )
}

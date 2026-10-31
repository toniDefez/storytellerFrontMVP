import { ChevronRight, ChevronLeft } from 'lucide-react'
import { Separator } from '@/components/ui/separator'
import { StoryRoster } from '@/components/story-setup/StoryRoster'
import { RelationshipBoard } from '@/components/story-setup/RelationshipBoard'
import { StoryFactsPanel } from '@/components/story-setup/StoryFactsPanel'
import { NarratorDefaultPanel } from '@/components/story-setup/NarratorDefaultPanel'
import { SceneDetailPanel } from './SceneDetailPanel'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useIsMobile } from '@/hooks/useIsMobile'
import type {
  StoryCharacter,
  CharacterBrief,
  StoryRelationship,
  StoryFact,
  NarratorConfig,
} from '@/services/api'

export type PanelMode = 'inicio' | 'scene'

interface Props {
  open: boolean
  onClose: () => void

  // Mode
  selectedMode: PanelMode
  selectedSceneId?: number

  // Data
  storyTitle: string
  storyCharacters: StoryCharacter[]
  availableCharacters: CharacterBrief[]
  relationships: StoryRelationship[]
  facts: StoryFact[]
  narratorConfig: NarratorConfig

  // Callbacks – roster
  onAddCharacter: (characterId: number) => Promise<void>
  onRemoveCharacter: (characterId: number) => Promise<void>

  // Callbacks – relationships
  onCreateRelationship: (data: {
    character_a_id: number
    character_b_id: number
    rel_type: string
    subtype: string
    description?: string
    directional: boolean
  }) => Promise<void>
  onUpdateRelationship: (
    relId: number,
    data: { rel_type: string; subtype: string; description?: string; directional: boolean },
  ) => Promise<void>
  onDeleteRelationship: (relId: number) => Promise<void>

  // Callbacks – facts
  onAddFact: (content: string, knownBy: number[]) => Promise<void>
  onUpdateFact: (factId: number, content: string, knownBy: number[]) => Promise<void>
  onDeleteFact: (factId: number) => Promise<void>

  // Callbacks – narrator
  onNarratorChange: (config: NarratorConfig) => void

  // Callbacks – scene
  onSceneDelete: () => void
  onSceneTitleChange: () => void
  onSceneOpen?: () => void
}

export function StoryGraphPanel({
  open,
  onClose,
  selectedMode,
  selectedSceneId,
  storyTitle,
  storyCharacters,
  availableCharacters,
  relationships,
  facts,
  narratorConfig,
  onAddCharacter,
  onRemoveCharacter,
  onCreateRelationship,
  onUpdateRelationship,
  onDeleteRelationship,
  onAddFact,
  onUpdateFact,
  onDeleteFact,
  onNarratorChange,
  onSceneDelete,
  onSceneTitleChange,
  onSceneOpen,
}: Props) {
  const isScene = selectedMode === 'scene' && selectedSceneId != null
  const isMobile = useIsMobile()

  const panelSubtitle = isScene ? 'Detalle de escena' : 'Configuración inicial de la historia'

  const panelBody = isScene ? (
    <SceneDetailPanel
      key={selectedSceneId}
      sceneId={selectedSceneId!}
      storyCharacters={storyCharacters}
      onDelete={onSceneDelete}
      onTitleChange={onSceneTitleChange}
      onOpenWorkshop={onSceneOpen}
    />
  ) : (
    <>
      <StoryRoster
        storyCharacters={storyCharacters}
        availableCharacters={availableCharacters}
        onAdd={onAddCharacter}
        onRemove={onRemoveCharacter}
      />

      <Separator />

      <RelationshipBoard
        relationships={relationships}
        storyCharacters={storyCharacters}
        onCreateRelationship={onCreateRelationship}
        onUpdateRelationship={onUpdateRelationship}
        onDeleteRelationship={onDeleteRelationship}
      />

      <Separator />

      <StoryFactsPanel
        facts={facts}
        storyCharacters={storyCharacters}
        onAdd={onAddFact}
        onUpdate={onUpdateFact}
        onDelete={onDeleteFact}
      />

      <Separator />

      <NarratorDefaultPanel
        narratorConfig={narratorConfig}
        onChange={onNarratorChange}
      />

      {/* Bottom breathing room */}
      <div className="h-4 shrink-0" />
    </>
  )

  // Móvil: el mismo contenido, en una hoja inferior en vez del panel lateral.
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={o => { if (!o) onClose() }}>
        <SheetContent side="bottom" className="h-[88dvh] p-0 flex flex-col rounded-t-2xl">
          <SheetTitle className="sr-only">{panelSubtitle}</SheetTitle>
          <div className="shrink-0 px-5 pt-5 pb-3 border-b border-stone-100 pr-12">
            <h2 className="text-sm font-semibold text-foreground truncate" title={storyTitle}>{storyTitle}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{panelSubtitle}</p>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 flex flex-col gap-6 pb-[max(16px,env(safe-area-inset-bottom))]">
            {open && panelBody}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div
      className="relative flex shrink-0 bg-white border-l border-stone-200 overflow-hidden"
      style={{
        width: open ? 400 : 0,
        transition: 'width 200ms ease',
      }}
    >
      {/* Chevron toggle — floats on the left edge of the panel */}
      <button
        onClick={onClose}
        className="
          absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10
          flex items-center justify-center
          w-5 h-10 rounded-full bg-white border border-stone-200 shadow-sm
          text-stone-400 hover:text-stone-700 hover:border-stone-300
          transition-colors duration-150
        "
        aria-label={open ? 'Cerrar panel' : 'Abrir panel'}
        style={{ display: open ? 'flex' : 'none' }}
      >
        {open ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Panel content — only rendered when open to avoid layout work */}
      {open && (
        <div className="flex flex-col w-full h-full overflow-hidden">
          {/* Panel header */}
          <div className="shrink-0 px-5 pt-5 pb-3 border-b border-stone-100">
            <h2 className="text-sm font-semibold text-foreground truncate" title={storyTitle}>
              {storyTitle}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">{panelSubtitle}</p>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 min-h-0 overflow-y-auto px-5 py-5 flex flex-col gap-6">
            {panelBody}
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { StoryBrief, CharacterBrief } from '@/services/api'
import { StoryGraphCanvas } from '@/components/story-graph/StoryGraphCanvas'
import { StoryCatalog } from '@/components/story-catalog/StoryCatalog'

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  worldId: number
  stories: StoryBrief[]
  characters: CharacterBrief[]
  onStoryListChanged: () => void
}

// ── StoryPanel ────────────────────────────────────────────────────────────────

export function StoryPanel({ worldId, stories: initialStories, characters, onStoryListChanged }: Props) {
  const [stories, setStories] = useState<StoryBrief[]>(initialStories)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [sceneEntered, setSceneEntered] = useState(false)

  // Keep local list in sync when parent refreshes world detail
  useEffect(() => {
    setStories(initialStories)
  }, [initialStories])

  const handleSelect = (id: number) => {
    setSelectedId(id)
  }

  const handleBack = () => {
    setSelectedId(null)
    setSceneEntered(false)
  }

  const handleStoryCreated = (story: StoryBrief) => {
    setStories(prev => [...prev, story])
    onStoryListChanged()
  }

  const selectedStory = stories.find(s => s.id === selectedId)

  return (
    <div className="h-full w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {selectedId == null ? (
          /* ── Catalog view ─────────────────────────────────────── */
          <motion.div
            key="catalog"
            className="h-full w-full overflow-y-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <StoryCatalog
              worldId={worldId}
              stories={stories}
              onStorySelect={handleSelect}
              onStoryCreated={handleStoryCreated}
            />
          </motion.div>
        ) : (
          /* ── Workspace view ───────────────────────────────────── */
          <motion.div
            key={`workspace-${selectedId}`}
            className="h-full w-full relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            {/* Floating back button — hidden while inside scene workspace */}
            {!sceneEntered && (
              <button
                onClick={handleBack}
                className="absolute top-3 left-3 z-10
                           bg-white/90 border border-stone-200 rounded-lg shadow-sm
                           px-3 py-1.5 text-sm text-muted-foreground
                           hover:text-foreground
                           transition-colors"
                aria-label="Volver al catálogo"
              >
                ← Historias
              </button>
            )}

            {selectedStory && (
              <StoryGraphCanvas
                key={selectedId}
                storyBrief={selectedStory}
                worldCharacters={characters}
                onSceneEntered={setSceneEntered}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Globe, Loader2 } from 'lucide-react'
import { getWorldById } from '@/services/api'
import type { World } from '@/services/api'

interface WorldContextPanelProps {
  worldId: number
  /** If provided, skip fetching and use this data directly */
  world?: World | null
}

export function WorldContextPanel({ worldId, world: externalWorld }: WorldContextPanelProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(true)
  const [world, setWorld] = useState<World | null>(externalWorld ?? null)
  const [loading, setLoading] = useState(!externalWorld)

  useEffect(() => {
    if (externalWorld) {
      setWorld(externalWorld)
      setLoading(false)
      return
    }

    setLoading(true)
    getWorldById(worldId)
      .then(data => setWorld(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [worldId, externalWorld])

  if (loading) {
    return (
      <div className="rounded-xl border border-amber-100 bg-amber-50/30 px-5 py-4 mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          {t('common.loading')}
        </div>
      </div>
    )
  }

  if (!world) return null

  const hasPremise = !!world.premise
  const hasDescription = !!world.description

  return (
    <div className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50/50 to-orange-50/30 overflow-hidden mb-6">
      {/* Header (always visible) */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-3 w-full text-left px-5 py-3.5 group hover:bg-amber-50/50 transition-colors"
        aria-expanded={isExpanded}
        aria-controls="world-context-content"
      >
        <div className="w-7 h-7 rounded-lg bg-entity-character/10 flex items-center justify-center flex-shrink-0">
          <Globe className="w-3.5 h-3.5 text-entity-character" />
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-widest text-amber-700/70">
            {t('character.create.worldContextTitle')}
          </span>
          <span className="text-sm font-[var(--font-display)] text-foreground ml-2">
            {world.name}
          </span>
        </div>
        <motion.span
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      {/* Collapsible content */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            id="world-context-content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-4 pt-1 space-y-3">
              {/* Premise */}
              {hasPremise && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-600/60 mb-1">
                    Premisa
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed italic font-[var(--font-display)]">
                    {world.premise}
                  </p>
                </div>
              )}

              {/* Description */}
              {hasDescription && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {world.description}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

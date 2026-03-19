import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Globe, Loader2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getWorldDetail } from '@/services/api'
import type { WorldDetail } from '@/services/api'

interface WorldContextPanelProps {
  worldId: number
  /** If provided, skip fetching and use this data directly */
  worldDetail?: WorldDetail | null
}

/**
 * WorldContextPanel -- A collapsible panel showing the parent world's
 * key context for character derivation. Uses warm orange accents
 * (character entity color) with world-purple highlights for world data.
 *
 * Expanded by default on first render, then collapsible.
 */
export function WorldContextPanel({ worldId, worldDetail: externalData }: WorldContextPanelProps) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(true)
  const [detail, setDetail] = useState<WorldDetail | null>(externalData ?? null)
  const [loading, setLoading] = useState(!externalData)
  const [error, setError] = useState('')

  useEffect(() => {
    if (externalData) {
      setDetail(externalData)
      setLoading(false)
      return
    }

    setLoading(true)
    getWorldDetail(worldId)
      .then(data => setDetail(data))
      .catch(err => setError(err instanceof Error ? err.message : 'Error loading world'))
      .finally(() => setLoading(false))
  }, [worldId, externalData])

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

  if (error || !detail) {
    return null
  }

  const world = detail.world
  const hasFactions = world.factions && world.factions.length > 0
  const hasCoreAxis = !!world.core_axis
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
              {/* Core axis */}
              {hasCoreAxis && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-600/60 mb-1">
                    {t('world.create.coreAxisLabel')}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed italic font-[var(--font-display)]">
                    {world.core_axis}
                  </p>
                </div>
              )}

              {/* Description */}
              {hasDescription && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {world.description}
                </p>
              )}

              {/* Factions */}
              {hasFactions && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-600/60 mb-1.5">
                    {t('world.factionsLabel')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {world.factions.map((faction, idx) => (
                      <Badge
                        key={`${faction}-${idx}`}
                        variant="outline"
                        className="bg-purple-50 text-purple-700 border-purple-200 text-xs"
                      >
                        {faction}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Tensions */}
              {world.tensions && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-rose-600/60 mb-1">
                    {t('world.create.layerTensions')}
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {world.tensions}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

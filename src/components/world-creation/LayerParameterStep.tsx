import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Shuffle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { CategoryGroup } from './CategoryGroup'
import { WorldRichnessIndicator } from './WorldRichnessIndicator'
import type {
  PhysicalCategory,
  PhysicalSelections,
  WorldPreset,
} from '@/constants/physicalParameters'

interface LayerParameterStepProps {
  categories: PhysicalCategory[]
  presets: WorldPreset[]
  selections: PhysicalSelections
  onSelectionsChange: (selections: PhysicalSelections) => void
  onGenerate: () => void
  disabled?: boolean
  sectionTitle: string       // i18n key for category section title
  presetTitle: string        // i18n key for preset section title
  generateLabel: string      // i18n key for generate button
}

export function LayerParameterStep({
  categories,
  presets,
  selections,
  onSelectionsChange,
  onGenerate,
  disabled = false,
  sectionTitle,
  presetTitle,
  generateLabel,
}: LayerParameterStepProps) {
  const { t } = useTranslation()
  const [aiSuggested, setAiSuggested] = useState<Set<string>>(new Set())

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

  const [activePresetKey, setActivePresetKey] = useState<string | null>(null)
  const [hoveredPreset, setHoveredPreset] = useState<string | null>(null)

  const handlePresetClick = (preset: WorldPreset) => {
    if (activePresetKey === preset.key) {
      // Toggle off: clear only the keys this preset set
      const cleared: PhysicalSelections = { ...selections }
      for (const key of Object.keys(preset.selections)) {
        const cat = categories.find(c => c.key === key)
        cleared[key] = cat?.multiSelect ? [] : ''
      }
      setActivePresetKey(null)
      onSelectionsChange(cleared)
    } else {
      // Replace: start fresh with only this preset's selections
      const fresh: PhysicalSelections = {}
      for (const [key, val] of Object.entries(preset.selections)) {
        if (val !== undefined) fresh[key] = val
      }
      setActivePresetKey(preset.key)
      onSelectionsChange(fresh)
    }
  }

  const handleCategoryChange = (categoryKey: string, value: string | string[]) => {
    setActivePresetKey(null)
    onSelectionsChange({ ...selections, [categoryKey]: value })
  }

  const handleSurpriseMe = () => {
    setActivePresetKey(null)
    const newSelections = { ...selections }
    const newAiSuggested = new Set<string>()
    for (const cat of categories) {
      const currentVal = selections[cat.key]
      const isEmpty = cat.multiSelect
        ? !(currentVal as string[])?.length
        : !currentVal
      if (isEmpty) {
        const randomOpt = cat.options[Math.floor(Math.random() * cat.options.length)]
        newSelections[cat.key] = cat.multiSelect ? [randomOpt.value] : randomOpt.value
        newAiSuggested.add(randomOpt.value)
      }
    }
    setAiSuggested(newAiSuggested)
    onSelectionsChange(newSelections)
  }

  const selectedCount = useMemo(
    () =>
      categories.filter(cat => {
        const val = selections[cat.key]
        return cat.multiSelect ? (val as string[])?.length > 0 : !!val
      }).length,
    [categories, selections],
  )

  return (
    <div className="space-y-8">
      {/* Presets section */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t(presetTitle)}
        </p>
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          {presets.map(preset => {
            const active = activePresetKey === preset.key
            return (
              <motion.button
                key={preset.key}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePresetClick(preset)}
                onMouseEnter={() => setHoveredPreset(preset.key)}
                onMouseLeave={() => setHoveredPreset(null)}
                disabled={disabled}
                className={`
                  flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                  border text-left text-sm font-medium transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
                  ${active
                    ? 'border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary/30'
                    : 'border-border/60 bg-card hover:border-primary/40 text-foreground/80'
                  }
                `}
              >
                <span className="text-base" aria-hidden="true">{preset.icon}</span>
                <span className="whitespace-nowrap">{t(preset.nameKey)}</span>
              </motion.button>
            )
          })}
        </div>

        {/* Preset description */}
        <AnimatePresence>
          {(hoveredPreset || activePresetKey) && (
            <motion.div
              key={hoveredPreset ?? activePresetKey}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <p className="mt-2 text-xs text-muted-foreground/70 italic pl-1">
                {t(presets.find(p => p.key === (hoveredPreset ?? activePresetKey))?.descriptionKey ?? '')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Categories */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          {t(sectionTitle)}
        </p>
        <div className="space-y-1.5">
          {categories.map((cat, i) => (
            <CategoryGroup
              key={cat.key}
              category={cat}
              value={selections[cat.key] ?? (cat.multiSelect ? [] : '')}
              onChange={(val) => handleCategoryChange(cat.key, val)}
              resonantValues={new Set<string>()}
              aiPickedValues={aiSuggested}
              defaultExpanded={i === 0 || isDesktop}
            />
          ))}
        </div>
      </div>

      {/* Surprise me */}
      <div className="flex justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={handleSurpriseMe}
          disabled={disabled || selectedCount === categories.length}
          className="gap-2"
        >
          <Shuffle className="w-3.5 h-3.5" />
          {t('world.create.surpriseMe')}
        </Button>
      </div>

      {/* Richness indicator */}
      <div className="flex justify-center">
        <WorldRichnessIndicator
          selectedCount={selectedCount}
          totalCategories={categories.length}
        />
      </div>

      {/* Generate button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      >
        <Button
          size="lg"
          onClick={onGenerate}
          disabled={disabled}
          className="w-full gap-2 font-serif text-base"
        >
          <Sparkles className="w-4 h-4" />
          {t(generateLabel)}
        </Button>
      </motion.div>
    </div>
  )
}

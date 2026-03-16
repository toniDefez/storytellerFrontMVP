import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Shuffle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { CategoryGroup } from './CategoryGroup'
import { WorldRichnessIndicator } from './WorldRichnessIndicator'
import {
  PHYSICAL_CATEGORIES,
  WORLD_PRESETS,
  computeResonance,
  type PhysicalSelections,
  type WorldPreset,
} from '@/constants/physicalParameters'

interface PhysicalParameterStepProps {
  coreAxis: string
  selections: PhysicalSelections
  onSelectionsChange: (selections: PhysicalSelections) => void
  onDerive: () => void
  disabled?: boolean
}

export function PhysicalParameterStep({
  coreAxis,
  selections,
  onSelectionsChange,
  onDerive,
  disabled = false,
}: PhysicalParameterStepProps) {
  const { t } = useTranslation()
  const [aiSuggested, setAiSuggested] = useState<Set<string>>(new Set())

  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024

  const resonance = useMemo(() => computeResonance(coreAxis), [coreAxis])

  const getResonantForCategory = (categoryKey: string) => {
    const values = new Set<string>()
    for (const key of resonance) {
      const [cat, val] = key.split(':')
      if (cat === categoryKey) values.add(val)
    }
    return values
  }

  const handlePresetClick = (preset: WorldPreset) => {
    const merged: PhysicalSelections = { ...selections }
    for (const [key, val] of Object.entries(preset.selections)) {
      if (val !== undefined) merged[key] = val
    }
    onSelectionsChange(merged)
  }

  const handleCategoryChange = (categoryKey: string, value: string | string[]) => {
    onSelectionsChange({ ...selections, [categoryKey]: value })
  }

  const handleSurpriseMe = () => {
    const newSelections = { ...selections }
    const newAiSuggested = new Set<string>()
    for (const cat of PHYSICAL_CATEGORIES) {
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

  const selectedCount = PHYSICAL_CATEGORIES.filter(cat => {
    const val = selections[cat.key]
    return cat.multiSelect ? (val as string[])?.length > 0 : !!val
  }).length

  const isPresetActive = (preset: WorldPreset) => {
    return Object.entries(preset.selections).every(([key, presetVal]) => {
      const currentVal = selections[key]
      if (Array.isArray(presetVal)) {
        return Array.isArray(currentVal) &&
          presetVal.every(v => currentVal.includes(v))
      }
      return currentVal === presetVal
    })
  }

  const deriveLabel = selectedCount === 0
    ? t('world.create.deriveButtonEmpty')
    : t('world.create.deriveButtonFilled')

  return (
    <div className="space-y-8">
      {/* Core axis reminder */}
      <div className="sticky top-0 z-10 bg-muted/80 backdrop-blur-sm rounded-lg px-4 py-3 border border-border/50 lg:static">
        <p className="text-xs text-muted-foreground/70 font-medium uppercase tracking-widest mb-1">
          {t('world.create.coreAxisLabel')}
        </p>
        <p className="text-sm font-serif text-foreground/80 italic leading-relaxed line-clamp-2">
          {coreAxis}
        </p>
      </div>

      {/* Presets section */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
          {t('world.create.presetTitle')}
        </p>
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin">
          {WORLD_PRESETS.map(preset => {
            const active = isPresetActive(preset)
            return (
              <motion.button
                key={preset.key}
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handlePresetClick(preset)}
                disabled={disabled}
                className={`
                  flex-shrink-0 flex items-center gap-2 px-3.5 py-2.5 rounded-xl
                  border text-left text-sm font-medium transition-colors
                  disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer
                  ${active
                    ? 'border-primary bg-primary/10 text-primary shadow-sm'
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
      </div>

      {/* Physical categories */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
          {t('world.create.physicalTitle')}
        </p>
        <div className="space-y-1.5">
          {PHYSICAL_CATEGORIES.map((cat, i) => (
            <CategoryGroup
              key={cat.key}
              category={cat}
              value={selections[cat.key] ?? (cat.multiSelect ? [] : '')}
              onChange={(val) => handleCategoryChange(cat.key, val)}
              resonantValues={getResonantForCategory(cat.key)}
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
          disabled={disabled || selectedCount === PHYSICAL_CATEGORIES.length}
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
          totalCategories={PHYSICAL_CATEGORIES.length}
        />
      </div>

      {/* Derive button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30, delay: 0.1 }}
      >
        <Button
          size="lg"
          onClick={onDerive}
          disabled={disabled}
          className="w-full gap-2 font-serif text-base"
        >
          <Sparkles className="w-4 h-4" />
          {deriveLabel}
        </Button>
      </motion.div>
    </div>
  )
}

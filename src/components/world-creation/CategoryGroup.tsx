import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown } from 'lucide-react'
import { PillSelect, MultiPillSelect } from '@/components/PillSelect'
import type { PhysicalCategory } from '@/constants/physicalParameters'
import { useTranslation } from 'react-i18next'

interface CategoryGroupProps {
  category: PhysicalCategory
  value: string | string[]
  onChange: (value: string | string[]) => void
  resonantValues?: Set<string>
  aiPickedValues?: Set<string>
  defaultExpanded?: boolean
}

export function CategoryGroup({
  category,
  value,
  onChange,
  resonantValues,
  aiPickedValues,
  defaultExpanded = true,
}: CategoryGroupProps) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(defaultExpanded)

  const pillOptions = category.options.map(opt => ({
    value: opt.value,
    label: t(opt.labelKey),
    icon: opt.icon,
  }))

  const descriptions = Object.fromEntries(
    category.options.map(opt => [opt.value, t(opt.descriptionKey)])
  )

  const hasSelection = category.multiSelect
    ? (value as string[]).length > 0
    : !!value

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2.5 w-full text-left py-2 group"
      >
        <span className="text-base" aria-hidden="true">{category.icon}</span>
        <div className="flex-1 min-w-0">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {t(category.labelKey)}
          </span>
          {hasSelection && (
            <span className="ml-2 text-[10px] font-medium text-primary/60 bg-primary/8 px-2 py-0.5 rounded-full">
              {category.multiSelect
                ? `${(value as string[]).length} sel.`
                : '\u2713'}
            </span>
          )}
        </div>
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors lg:hidden"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.span>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <p className="text-xs text-muted-foreground/50 mb-3 leading-relaxed">
              {t(category.hintKey)}
            </p>

            {category.multiSelect ? (
              <MultiPillSelect
                options={pillOptions}
                value={Array.isArray(value) ? value : []}
                onChange={v => {
                  if (category.maxSelections && v.length > category.maxSelections) return
                  onChange(v)
                }}
                descriptions={descriptions}
              />
            ) : (
              <PillSelect
                options={pillOptions}
                value={typeof value === 'string' ? value : ''}
                onChange={v => onChange(v)}
                descriptions={descriptions}
                allowDeselect
                resonantValues={resonantValues}
                aiPickedValues={aiPickedValues}
              />
            )}

            {category.multiSelect && category.maxSelections && (
              <p className="text-[10px] text-muted-foreground/40 mt-2">
                Max {category.maxSelections}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

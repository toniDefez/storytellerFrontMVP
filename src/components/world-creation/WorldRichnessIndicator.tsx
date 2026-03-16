import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface WorldRichnessIndicatorProps {
  selectedCount: number
  totalCategories: number
}

export function WorldRichnessIndicator({ selectedCount }: WorldRichnessIndicatorProps) {
  const { t } = useTranslation()
  const DOTS = 5

  const messageKey = selectedCount === 0
    ? 'world.create.richness0'
    : selectedCount < 3
      ? 'world.create.richness1'
      : 'world.create.richness2'

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5">
        {Array.from({ length: DOTS }).map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: i < selectedCount ? 1 : 0.6,
              opacity: i < selectedCount ? 1 : 0.2,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 25, delay: i * 0.05 }}
            className={`w-2 h-2 rounded-full transition-colors duration-300 ${
              i < selectedCount ? 'bg-primary' : 'bg-muted-foreground/30'
            }`}
          />
        ))}
      </div>
      <span className="text-[10px] text-muted-foreground/60 font-medium">
        {t(messageKey)}
      </span>
    </div>
  )
}

// src/pages/settings/ModelSelector.tsx
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'

const MODELS = [
  { tag: 'llama3.2:3b',      labelKey: 'installation.modelFast',     ram: '4 GB',  dots: 1 },
  { tag: 'qwen2.5:7b',       labelKey: 'installation.modelBalanced', ram: '8 GB',  dots: 2 },
  { tag: 'mistral-nemo:12b', labelKey: 'installation.modelRich',     ram: '16 GB', dots: 3 },
] as const

export { MODELS }

interface ModelSelectorProps {
  value: string
  onChange: (model: string) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const { t } = useTranslation()

  return (
    <div>
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">
          {t('installation.modelSelectorTitle')}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t('installation.modelSelectorSubtitle')}
        </p>
      </div>

      <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
        {MODELS.map((model) => {
          const isSelected = value === model.tag
          const isRecommended = model.tag === 'qwen2.5:7b'

          return (
            <motion.button
              key={model.tag}
              type="button"
              onClick={() => onChange(model.tag)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={[
                'relative text-left rounded-lg border px-3 py-3 transition-colors cursor-pointer',
                isSelected
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/20 hover:border-primary/40',
              ].join(' ')}
            >
              {isRecommended && (
                <span className="absolute top-2 right-2 text-[10px] font-serif text-primary/60 leading-tight">
                  {t('installation.modelRecommended')}
                </span>
              )}

              <p className="font-mono text-sm font-medium text-foreground mb-1 pr-16">
                {model.tag}
              </p>

              <p className="text-xs text-muted-foreground mb-2">
                {t(model.labelKey)}
              </p>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {t('installation.modelRamBadge', { ram: model.ram })}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <span
                      key={i}
                      className={[
                        'w-2 h-2 rounded-full inline-block',
                        i < model.dots ? 'bg-primary' : 'bg-muted',
                      ].join(' ')}
                    />
                  ))}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

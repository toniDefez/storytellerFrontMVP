import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'

interface WorldCausalCascadeProps {
  environment?: string
  subsistence?: string
  organization?: string
  tensions?: string
  tone?: string
}

const LAYERS = [
  { key: 'environment' as const, icon: '🌍', color: '#22c55e', bg: '#f0fdf4', i18n: 'world.visualization.physicalLayer' },
  { key: 'subsistence' as const, icon: '🌿', color: '#f59e0b', bg: '#fffbeb', i18n: 'world.visualization.biologicalLayer' },
  { key: 'organization' as const, icon: '🏛', color: '#3b82f6', bg: '#eff6ff', i18n: 'world.visualization.societyLayer' },
  { key: 'tensions' as const, icon: '⚡', color: '#f43f5e', bg: '#fff1f2', i18n: 'world.visualization.tensionsLayer' },
] as const

export function WorldCausalCascade({ environment, subsistence, organization, tensions, tone }: WorldCausalCascadeProps) {
  const { t } = useTranslation()
  const values: Record<string, string | undefined> = { environment, subsistence, organization, tensions }
  const visibleLayers = LAYERS.filter(l => values[l.key])

  if (visibleLayers.length === 0) return null

  return (
    <div className="space-y-0">
      {visibleLayers.map((layer, i) => (
        <div key={layer.key}>
          {/* Arrow connector */}
          {i > 0 && (
            <div className="flex justify-center py-1">
              <svg width="20" height="20" viewBox="0 0 20 20">
                <line x1="10" y1="0" x2="10" y2="14" stroke={LAYERS[i - 1].color} strokeWidth="1.5" strokeOpacity="0.4" />
                <polygon points="6,12 10,18 14,12" fill={layer.color} opacity="0.5" />
              </svg>
            </div>
          )}

          {/* Layer card */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 160, damping: 16, delay: i * 0.1 }}
            className="rounded-md overflow-hidden"
            style={{ borderLeft: `3px solid ${layer.color}`, background: layer.bg }}
          >
            <div className="px-4 py-3">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-sm">{layer.icon}</span>
                <span
                  className="text-[10px] font-semibold uppercase tracking-[0.1em]"
                  style={{ color: layer.color }}
                >
                  {t(layer.i18n)}
                </span>
              </div>
              <p className="text-sm text-[#2a2826] leading-relaxed line-clamp-3 font-[var(--font-display)]">
                {values[layer.key]}
              </p>
            </div>
          </motion.div>
        </div>
      ))}

      {/* Tone footer */}
      {tone && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: visibleLayers.length * 0.1 + 0.2 }}
          className="pt-2 text-center"
        >
          <span className="text-[9px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
            {t('world.visualization.tone')}
          </span>
          <span className="text-xs text-muted-foreground italic ml-1.5">{tone}</span>
        </motion.div>
      )}
    </div>
  )
}

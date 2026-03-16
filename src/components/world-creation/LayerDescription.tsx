import type { WorldLayerType } from '@/services/api'
import { useTranslation } from 'react-i18next'

const descriptions: Record<WorldLayerType, { es: string; en: string }> = {
  physical: {
    es: 'Gravedad, terreno, clima, rios, recursos. Las condiciones fisicas fundamentales.',
    en: 'Gravity, terrain, climate, rivers, resources. The fundamental physical conditions.',
  },
  biological: {
    es: 'Ecosistemas, flora, fauna, cadenas alimentarias. La vida que emerge.',
    en: 'Ecosystems, flora, fauna, food chains. The life that emerges.',
  },
  society: {
    es: 'Asentamientos, economia, politica, cultura, conflictos.',
    en: 'Settlements, economy, politics, culture, conflicts.',
  },
  synthesis: {
    es: 'Nombre, tono narrativo, facciones. La identidad del mundo.',
    en: 'Name, narrative tone, factions. The world\'s identity.',
  },
}

export function LayerDescription({ layer }: { layer: WorldLayerType }) {
  const { i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'es'
  return (
    <p className="text-xs text-muted-foreground/60 leading-relaxed mt-0.5 mb-2">
      {descriptions[layer][lang]}
    </p>
  )
}

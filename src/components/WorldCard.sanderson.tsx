/**
 * WorldCard -- Rediseno Sanderson
 *
 * ============================================================
 * B) WORLDCARD ACTUALIZADA
 * ============================================================
 *
 * CAMBIOS CLAVE RESPECTO A LA VERSION ANTERIOR:
 *
 * 1. El eje central reemplaza la descripcion como texto principal.
 *    Se muestra en italica (Lora) como una cita literaria.
 *
 * 2. Los badges de era/clima/politica se reemplazan por los iconos
 *    de las 5 capas. Cada capa se muestra como un mini-dot de color
 *    si esta derivada. Si no, aparece gris.
 *
 * 3. El gradiente de la card ya NO se basa en "climate" (que ya no existe).
 *    En su lugar, se GENERA dinamicamente a partir del contenido del eje:
 *    - La IA extrae un "mood" del eje y asigna un gradiente
 *    - Fallback: gradiente purple default del brand
 *    - El gradiente se almacena como campo `gradientHint` en el mundo
 *
 * 4. En HOVER la card se expande ligeramente y muestra:
 *    - Preview de las capas como texto truncado
 *    - Las facciones principales
 *    - Un CTA sutil "Explorar mundo ->"
 *
 * LAYOUT DE LA CARD:
 *
 * +-------------------------------------------+
 * |  [Gradient header - 80px]                 |
 * |  Nombre del mundo (Lora, bold, white)     |
 * |  "En este mundo..." (Lora, italic, 70%)   |
 * +-------------------------------------------+
 * |                                           |
 * |  [Layer dots]  O O O O O                  |
 * |  entorno subsist org tens tono            |
 * |                                           |
 * |  [Hover expansion - AnimatePresence]      |
 * |  > Entorno: texto truncado...             |
 * |  > Tensiones: texto truncado...           |
 * |                                           |
 * |  Facciones: [Badge] [Badge]               |
 * |                                           |
 * +-------------------------------------------+
 *
 * ESPECIFICACIONES:
 *
 * Card container:
 * - rounded-2xl, bg-white, shadow-sm
 * - border: 1px solid gray-100
 * - cursor-pointer
 * - whileHover: y=-4, shadow: 0 12px 32px rgba(0,0,0,0.10)
 * - whileTap: scale 0.98
 * - spring: stiffness 300, damping 22
 *
 * Gradient header:
 * - bg-gradient-to-br con colores del gradientHint
 * - px-5 pt-5 pb-8 (mas padding bottom para la onda decorativa)
 * - Onda SVG en el bottom (clip-path o svg) para romper la linea recta
 * - Si no hay gradientHint: from-violet-500 to-purple-600 (brand default)
 *
 * Nombre:
 * - text-lg, font-bold, text-white, drop-shadow-sm
 * - font-display (Lora)
 * - line-clamp-1
 *
 * Eje central (en header):
 * - text-xs, text-white/65, italic
 * - font-display (Lora)
 * - line-clamp-2
 * - mt-1
 *
 * Layer dots (en body):
 * - 5 circulos de 8px, cada uno con el color de su capa
 * - Rellenos si la capa existe, outline si esta vacia
 * - gap-1.5 entre dots
 * - Debajo: labels de 8px font-size, text-muted-foreground/40, solo en hover
 *
 * Hover expansion:
 * - AnimatePresence, height: 0 -> auto
 * - Muestra 2 capas como preview (las mas "interesantes": tensiones y tono)
 * - Texto en text-xs, text-muted-foreground, line-clamp-1
 * - Prefijo con el icono de la capa
 *
 * Facciones:
 * - Solo si existen, en border-t border-gray-100 section
 * - Badge variant="outline", max 3, +N counter
 */

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { LAYER_META, type LayerKey } from './world-creation/DerivationLayer'

interface WorldCardSandersonProps {
  id: number
  name: string
  coreAxis: string
  environment?: string
  subsistence?: string
  organization?: string
  tensions?: string
  tone?: string
  factions?: string[]
  gradientHint?: string // e.g. 'from-slate-400 to-stone-600'
}

/**
 * Genera un gradiente basado en palabras clave del eje central.
 * Esto es un heuristico simple para cuando no hay gradientHint de la IA.
 */
function inferGradient(coreAxis: string): string {
  const axis = coreAxis.toLowerCase()

  // Patrones de palabras -> gradientes tematicos
  const patterns: [RegExp, string][] = [
    [/ceniza|volcán|volcan|fuego|lava|quema/, 'from-red-500 to-orange-600'],
    [/hielo|frio|nieve|glaciar|artico|congelad/, 'from-cyan-400 to-blue-600'],
    [/agua|oceano|mar|lluvia|inundac|rio/, 'from-blue-400 to-indigo-600'],
    [/bosque|selva|planta|verde|naturaleza/, 'from-emerald-400 to-teal-600'],
    [/desierto|arena|sol|sequ|arido/, 'from-amber-400 to-orange-600'],
    [/oscur|noche|sombra|tiniebla|negro/, 'from-slate-600 to-gray-800'],
    [/luz|brillo|estrella|cristal|diamante/, 'from-amber-300 to-yellow-500'],
    [/toxico|veneno|contamina|poluc/, 'from-lime-500 to-green-700'],
    [/guerra|batalla|destrucc|ruin/, 'from-rose-500 to-red-700'],
    [/magia|hechizo|encant|sobrenatural/, 'from-violet-500 to-purple-700'],
    [/tecnolog|maquin|robot|digital|cibern/, 'from-sky-400 to-cyan-600'],
    [/muerte|fin|apocali|extinct/, 'from-gray-500 to-slate-700'],
  ]

  for (const [pattern, gradient] of patterns) {
    if (pattern.test(axis)) return gradient
  }

  // Default: brand purple
  return 'from-violet-500 to-purple-600'
}

const LAYER_KEYS: LayerKey[] = ['environment', 'subsistence', 'organization', 'tensions', 'tone']

const WorldCardSanderson: React.FC<WorldCardSandersonProps> = ({
  id,
  name,
  coreAxis,
  environment,
  subsistence,
  organization,
  tensions,
  tone,
  factions = [],
  gradientHint,
}) => {
  const navigate = useNavigate()
  const [isHovered, setIsHovered] = useState(false)
  const gradient = gradientHint || inferGradient(coreAxis)

  const layerValues: Record<LayerKey, string | undefined> = {
    environment, subsistence, organization, tensions, tone,
  }

  // Para el hover expansion, mostramos tensiones y tono como preview
  const previewLayers: LayerKey[] = ['tensions', 'tone']

  return (
    <motion.div
      className="rounded-2xl bg-white shadow-sm border border-gray-100 cursor-pointer overflow-hidden"
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.10)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onClick={() => navigate(`/worlds/${id}`)}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {/* ─── Gradient Header ─── */}
      <div className={`bg-gradient-to-br ${gradient} px-5 pt-5 pb-7 relative`}>
        <h3 className="text-lg font-bold text-white leading-tight drop-shadow-sm font-[var(--font-display)] line-clamp-1">
          {name}
        </h3>
        {coreAxis && (
          <p className="text-xs text-white/65 mt-1 leading-relaxed line-clamp-2 font-[var(--font-display)] italic">
            "{coreAxis}"
          </p>
        )}
        {/* Onda decorativa inferior */}
        <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-b from-transparent to-white/8" />
      </div>

      {/* ─── Body ─── */}
      <div className="px-5 pt-3 pb-4">
        {/* Layer dots */}
        <div className="flex items-center gap-2 mb-3">
          {LAYER_KEYS.map(layer => {
            const meta = LAYER_META[layer]
            const hasValue = !!layerValues[layer]
            return (
              <div key={layer} className="flex flex-col items-center gap-1">
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    hasValue
                      ? meta.color.replace('text-', 'bg-')
                      : 'bg-muted-foreground/15'
                  }`}
                  title={meta.label}
                />
              </div>
            )
          })}
          {/* Label que aparece en hover */}
          <AnimatePresence>
            {isHovered && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                className="text-[9px] text-muted-foreground/50 ml-1"
              >
                {LAYER_KEYS.filter(l => layerValues[l]).length}/5 capas
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Hover expansion: preview de capas */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="space-y-1.5 mb-3">
                {previewLayers.map(layer => {
                  const value = layerValues[layer]
                  if (!value) return null
                  const meta = LAYER_META[layer]
                  return (
                    <div key={layer} className="flex items-start gap-2">
                      <span className="text-[10px] shrink-0 mt-0.5" aria-hidden="true">{meta.icon}</span>
                      <p className="text-[11px] text-muted-foreground line-clamp-1 leading-relaxed">
                        {value}
                      </p>
                    </div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Facciones */}
        {factions.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <div className="flex flex-wrap gap-1">
              {factions.slice(0, 3).map(f => (
                <Badge key={f} variant="outline" className="text-[10px]">{f}</Badge>
              ))}
              {factions.length > 3 && (
                <span className="text-[10px] text-gray-400 px-2 py-0.5">+{factions.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default WorldCardSanderson

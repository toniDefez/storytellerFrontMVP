import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

interface WorldCardProps {
  id: number
  name: string
  description?: string
  premise?: string
}

interface ClimateInfo {
  gradient: string
  label: string
}

function inferClimate(premise?: string, description?: string): ClimateInfo {
  const text = (premise || description || '').toLowerCase()
  if (/ceniza|volcan|fuego/.test(text))
    return { gradient: 'from-red-900 via-red-700 to-orange-700', label: 'Volcánico' }
  if (/hielo|nieve|glaciar/.test(text))
    return { gradient: 'from-slate-800 via-cyan-700 to-blue-800', label: 'Glacial' }
  if (/agua|oceano|lluvia/.test(text))
    return { gradient: 'from-blue-900 via-blue-700 to-indigo-800', label: 'Oceánico' }
  if (/bosque|selva|verde/.test(text))
    return { gradient: 'from-emerald-900 via-emerald-700 to-teal-800', label: 'Selvático' }
  if (/desierto|arena|sol|gusano/.test(text))
    return { gradient: 'from-amber-900 via-amber-600 to-orange-700', label: 'Desértico' }
  if (/oscuridad|sombra/.test(text))
    return { gradient: 'from-gray-950 via-slate-800 to-gray-900', label: 'Umbral' }
  if (/magia|hechizo/.test(text))
    return { gradient: 'from-violet-900 via-violet-700 to-purple-900', label: 'Arcano' }
  return { gradient: 'from-violet-950 via-purple-800 to-indigo-900', label: 'Etéreo' }
}

const WorldCard: React.FC<WorldCardProps> = ({ id, name, description, premise }) => {
  const navigate = useNavigate()
  const { gradient, label } = inferClimate(premise, description)
  const blurb = premise || description

  return (
    <motion.div
      className="rounded-[4px] cursor-pointer overflow-hidden flex h-[140px] shadow-ambient"
      whileHover="hovered"
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onClick={() => navigate(`/worlds/${id}`)}
      style={{ borderBottom: '1px solid hsl(35 12% 88%)' }}
    >
      {/* Left — gradient atmosphere panel */}
      <div className="w-52 shrink-0 relative overflow-hidden">
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
          variants={{
            hovered: { scale: 1.08, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
          }}
        />
        {/* Bottom vignette keeps label readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
        {/* Climate label */}
        <div className="absolute bottom-3 left-4 z-10">
          <span
            className="text-[8px] tracking-[0.3em] uppercase font-semibold text-white/50"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            {label}
          </span>
        </div>
      </div>

      {/* Right — warm info panel */}
      <div
        className="flex-1 flex flex-col justify-between px-6 py-4"
        style={{ background: 'hsl(40 12% 97%)' }}
      >
        <div>
          <h3
            className="text-[1.2rem] font-bold text-foreground leading-tight line-clamp-1 mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {name}
          </h3>
          {blurb && (
            <p
              className="text-sm italic text-muted-foreground leading-relaxed line-clamp-2"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {blurb}
            </p>
          )}
        </div>

        {/* "Explorar →" footer */}
        <div className="flex items-center justify-between mt-2">
          <span
            className="text-[9px] tracking-[0.25em] uppercase text-muted-foreground/50"
            style={{ fontFamily: 'var(--font-ui)' }}
          >
            Mundo
          </span>
          <motion.span
            className="text-xs font-medium"
            style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 38% 40%)' }}
            variants={{
              hovered: { x: 4, transition: { duration: 0.2 } },
            }}
          >
            Explorar →
          </motion.span>
        </div>
      </div>
    </motion.div>
  )
}

export default WorldCard

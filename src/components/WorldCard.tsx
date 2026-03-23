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
      className="rounded-[4px] cursor-pointer overflow-hidden relative group"
      style={{ aspectRatio: '16 / 10' }}
      whileHover="hovered"
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24 }}
      onClick={() => navigate(`/worlds/${id}`)}
    >
      {/* ── Gradient background — zooms on hover ── */}
      <motion.div
        className={`absolute inset-0 bg-gradient-to-br ${gradient}`}
        variants={{
          hovered: { scale: 1.07, transition: { duration: 0.55, ease: [0.25, 0.46, 0.45, 0.94] } },
        }}
      />

      {/* ── Permanent bottom vignette — keeps name readable ── */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent pointer-events-none" />

      {/* ── Top fade ── */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/25 to-transparent pointer-events-none" />

      {/* ── Climate label — top right ── */}
      <div className="absolute top-4 right-4 z-10">
        <span
          className="text-[9px] tracking-[0.32em] uppercase font-semibold text-white/40"
          style={{ fontFamily: 'var(--font-ui)' }}
        >
          {label}
        </span>
      </div>

      {/* ── Hover overlay — slides up with premise ── */}
      {blurb && (
        <motion.div
          className="absolute inset-x-0 bottom-0 px-5 pb-14 pt-16 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.5) 60%, transparent 100%)',
          }}
          variants={{
            hovered: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] } },
          }}
          initial={{ opacity: 0, y: 12 }}
        >
          <p
            className="text-white/80 text-sm leading-relaxed line-clamp-3"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {blurb}
          </p>
        </motion.div>
      )}

      {/* ── World name — always visible ── */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-4 z-10">
        <h3
          className="text-[1.5rem] font-bold text-white leading-tight line-clamp-1 break-all"
          style={{
            fontFamily: 'var(--font-display)',
            textShadow: '0 1px 16px rgba(0,0,0,0.6)',
          }}
        >
          {name}
        </h3>
      </div>
    </motion.div>
  )
}

export default WorldCard

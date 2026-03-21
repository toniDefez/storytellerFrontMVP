import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

interface WorldCardProps {
  id: number
  name: string
  description?: string
  premise?: string
}

const DEFAULT_HEADER = 'from-violet-500 to-purple-600'

function inferHeaderGradient(premise?: string, description?: string): string {
  const text = (premise || description || '').toLowerCase()
  if (/ceniza|volcan|fuego/.test(text)) return 'from-red-500 to-orange-500'
  if (/hielo|nieve|glaciar/.test(text)) return 'from-cyan-400 to-blue-500'
  if (/agua|oceano|lluvia/.test(text)) return 'from-blue-400 to-indigo-500'
  if (/bosque|selva|verde/.test(text)) return 'from-emerald-400 to-teal-500'
  if (/desierto|arena|sol|gusano/.test(text)) return 'from-amber-400 to-orange-500'
  if (/oscuridad|sombra/.test(text)) return 'from-slate-500 to-gray-700'
  if (/magia|hechizo/.test(text)) return 'from-violet-400 to-purple-500'
  return DEFAULT_HEADER
}

const WorldCard: React.FC<WorldCardProps> = ({ id, name, description, premise }) => {
  const navigate = useNavigate()
  const headerGradient = inferHeaderGradient(premise, description)

  return (
    <motion.div
      className="rounded-[4px] bg-card shadow-ambient cursor-pointer overflow-hidden"
      whileHover={{ y: -3, boxShadow: '0 0 0 1px rgba(27,28,26,0.05), 0 4px 12px rgba(27,28,26,0.08), 0 16px 40px rgba(27,28,26,0.06)' }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      onClick={() => navigate(`/worlds/${id}`)}
    >
      <div className={`bg-gradient-to-br ${headerGradient} px-5 pt-5 pb-7 relative`}>
        <h3 className="text-lg font-bold text-white leading-tight drop-shadow-sm font-[var(--font-display)]">{name}</h3>
        {premise && (
          <p className="text-xs text-white/70 italic mt-1.5 line-clamp-2 leading-relaxed font-[var(--font-display)]">
            "{premise}"
          </p>
        )}
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-b from-transparent to-white/10" />
      </div>

      <div className="px-5 pt-3 pb-5">
        {description && !premise && (
          <p className="text-xs italic font-display text-muted-foreground line-clamp-2 mb-3 leading-relaxed">{description}</p>
        )}
      </div>
    </motion.div>
  )
}

export default WorldCard

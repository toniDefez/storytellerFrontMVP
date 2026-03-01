import React from 'react'
import { useNavigate } from 'react-router-dom'

interface WorldCardProps {
  id: number
  name: string
  era: string
  climate: string
  politics: string
  culture: string
  factions: string[]
  description?: string
}

const CLIMATE_HEADER: Record<string, string> = {
  Ártico:      'from-cyan-400 to-blue-500',
  Tropical:    'from-emerald-400 to-teal-500',
  Desértico:   'from-amber-400 to-orange-500',
  Volcánico:   'from-red-500 to-rose-600',
  Oceánico:    'from-blue-400 to-indigo-500',
  Montañoso:   'from-slate-400 to-stone-500',
  Tóxico:      'from-lime-400 to-green-600',
  Templado:    'from-violet-400 to-purple-500',
}

const DEFAULT_HEADER = 'from-violet-500 to-purple-600'

const WorldCard: React.FC<WorldCardProps> = ({ id, name, era, climate, politics, culture, factions, description }) => {
  const navigate = useNavigate()
  const headerGradient = CLIMATE_HEADER[climate] ?? DEFAULT_HEADER

  return (
    <div
      className="group rounded-2xl bg-white shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
      onClick={() => navigate(`/worlds/${id}`)}
    >
      {/* Gradient header */}
      <div className={`bg-gradient-to-br ${headerGradient} px-5 pt-5 pb-7 relative`}>
        <h3 className="text-lg font-bold text-white leading-tight drop-shadow-sm">{name}</h3>
        <p className="text-xs text-white/70 mt-0.5">{era}</p>
        {/* Fade into card body */}
        <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-b from-transparent to-white/10" />
      </div>

      {/* Body */}
      <div className="px-5 pt-3 pb-5">
        {description && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{description}</p>
        )}

        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{climate}</span>
          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{politics}</span>
          <span className="text-[11px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{culture}</span>
        </div>

        {factions.length > 0 && (
          <div className="border-t border-gray-100 pt-3">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Facciones</p>
            <div className="flex flex-wrap gap-1">
              {factions.slice(0, 3).map(f => (
                <span key={f} className="text-[11px] text-violet-700 bg-violet-50 border border-violet-100 px-2 py-0.5 rounded-full">{f}</span>
              ))}
              {factions.length > 3 && (
                <span className="text-[11px] text-gray-400 px-2 py-0.5">+{factions.length - 3}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WorldCard

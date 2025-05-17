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

const WorldCard: React.FC<WorldCardProps> = ({ id, name, era, climate, politics, culture, factions, description }) => {
  const navigate = useNavigate()
  return (
    <div
      className="rounded-2xl bg-white/90 shadow-lg p-6 flex flex-col gap-2 border border-gray-200 hover:shadow-2xl transition cursor-pointer"
      onClick={() => navigate(`/worlds/${id}`)}
      title="Ver detalles del mundo"
    >
      <div className="flex items-center gap-3 mb-2">
        <svg className="h-7 w-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20M12 2a10 10 0 000 20" /></svg>
        <h3 className="text-xl font-bold text-gray-800">{name}</h3>
      </div>
      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
        <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{era}</span>
        <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{climate}</span>
        <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded">{politics}</span>
        <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">{culture}</span>
      </div>
      {description && (
        <div className="mt-2 text-gray-700 text-sm line-clamp-2">{description}</div>
      )}
      <div className="mt-2">
        <span className="font-semibold text-gray-700">Facciones:</span>
        <ul className="list-disc list-inside ml-2 text-gray-600">
          {factions.map(f => <li key={f}>{f}</li>)}
        </ul>
      </div>
    </div>
  )
}

export default WorldCard

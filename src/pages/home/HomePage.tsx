import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import WorldCard from '../../components/WorldCard'
import { getWorlds } from '../../services/api'
import type { World } from '../../services/api'

export default function HomePage() {
  const [worlds, setWorlds] = useState<World[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    getWorlds()
      .then(data => setWorlds(Array.isArray(data) ? data : []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center items-center h-96 text-sm text-gray-400">Cargando mundos...</div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-96 text-sm text-red-500">{error}</div>
  }

  if (worlds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <circle cx="12" cy="12" r="10" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Aún no tienes mundos</h2>
        <p className="text-sm text-gray-400 mb-8 text-center max-w-xs">Crea tu primer mundo y empieza a construir tu historia.</p>
        <button
          onClick={() => navigate('/worlds/create')}
          className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-violet-200 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear mi primer mundo
        </button>
      </div>
    )
  }

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mis mundos</h1>
          <p className="text-sm text-gray-400 mt-0.5">{worlds.length} {worlds.length === 1 ? 'mundo creado' : 'mundos creados'}</p>
        </div>
        <button
          onClick={() => navigate('/worlds/create')}
          className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl shadow-md shadow-violet-200 transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo mundo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {worlds.map(world => (
          <WorldCard
            key={world.id}
            id={world.id}
            name={world.name}
            era={world.era}
            climate={world.climate}
            politics={world.politics}
            culture={world.culture}
            factions={world.factions}
            description={world.description}
          />
        ))}
      </div>
    </div>
  )
}

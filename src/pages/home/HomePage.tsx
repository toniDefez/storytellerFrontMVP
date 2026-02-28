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
    return <div className="flex justify-center items-center h-96 text-lg text-gray-500">Cargando mundos...</div>
  }

  if (error) {
    return <div className="flex justify-center items-center h-96 text-lg text-red-500">{error}</div>
  }

  if (worlds.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 w-full">
        <img src="https://cdn-icons-png.flaticon.com/512/4076/4076549.png" alt="Empty" className="w-32 h-32 mb-6 opacity-60" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Aún no tienes mundos!</h2>
        <p className="text-gray-500 mb-6">Crea tu primer mundo y comienza a imaginar.</p>
        <button onClick={() => navigate('/worlds/create')} className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Crear mundo
        </button>
      </div>
    )
  }

  return (
    <>
      <h1 className="text-3xl font-bold mb-6">Panel de Control</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Card para crear mundo */}
        <div onClick={() => navigate('/worlds/create')} className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-2xl bg-white/70 shadow-md p-8 hover:shadow-xl cursor-pointer transition group">
          <svg className="h-12 w-12 text-purple-400 group-hover:text-purple-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          <span className="text-lg font-semibold text-purple-700 group-hover:text-purple-900">Crear nuevo mundo</span>
        </div>
        {/* Cards de mundos */}
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
    </>
  )
}

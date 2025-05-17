import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

interface World {
  id: number
  name: string
  era: string
  climate: string
  politics: string
  culture: string
  factions: string[]
}

export default function HomePage() {
  const [worlds, setWorlds] = useState<World[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${API_URL}/worlds`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setWorlds(Array.isArray(data) ? data : [])
        setLoading(false)
      })
      .catch(() => {
        setError('No se pudieron cargar los mundos.')
        setLoading(false)
      })
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
        <h2 className="text-2xl font-bold text-gray-700 mb-2">¡Aún no tienes mundos!</h2>
        <p className="text-gray-500 mb-6">Crea tu primer mundo y comienza a imaginar.</p>
        <button onClick={() => navigate('/worlds/create')} className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide flex items-center gap-2">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Crear mundo
        </button>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8 p-4 xl:p-10">
      {/* Card para crear mundo */}
      <div onClick={() => navigate('/world/create')} className="flex flex-col items-center justify-center border-2 border-dashed border-purple-300 rounded-2xl bg-white/70 shadow-md p-8 hover:shadow-xl cursor-pointer transition group">
        <svg className="h-12 w-12 text-purple-400 group-hover:text-purple-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
        <span className="text-lg font-semibold text-purple-700 group-hover:text-purple-900">Crear nuevo mundo</span>
      </div>
      {/* Cards de mundos */}
      {worlds.map(world => (
        <div key={world.id} className="rounded-2xl bg-white/90 shadow-lg p-6 flex flex-col gap-2 border border-gray-200 hover:shadow-2xl transition">
          <div className="flex items-center gap-3 mb-2">
            <svg className="h-7 w-7 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="2" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2 12h20M12 2a10 10 0 000 20" /></svg>
            <h3 className="text-xl font-bold text-gray-800">{world.name}</h3>
          </div>
          <div className="flex flex-wrap gap-2 text-sm text-gray-600">
            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">{world.era}</span>
            <span className="bg-green-100 text-green-700 px-2 py-1 rounded">{world.climate}</span>
            <span className="bg-pink-100 text-pink-700 px-2 py-1 rounded">{world.politics}</span>
            <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded">{world.culture}</span>
          </div>
          <div className="mt-2">
            <span className="font-semibold text-gray-700">Facciones:</span>
            <ul className="list-disc list-inside ml-2 text-gray-600">
              {world.factions.map(f => <li key={f}>{f}</li>)}
            </ul>
          </div>
        </div>
      ))}
    </div>
  )
}
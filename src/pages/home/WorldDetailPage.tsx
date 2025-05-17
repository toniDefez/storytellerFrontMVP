import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

interface World {
  id: number
  name: string
  era: string
  climate: string
  politics: string
  culture: string
  factions: string[]
  description: string
}

export default function WorldDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [world, setWorld] = useState<World | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`${API_URL}/world/get?id=${id}`, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    })
      .then(res => res.json())
      .then(data => {
        setWorld(data)
        setLoading(false)
      })
      .catch(() => {
        setError('No se pudo cargar el mundo.')
        setLoading(false)
      })
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que quieres borrar este mundo?')) return
    const token = localStorage.getItem('token')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/worlds/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        navigate('/worlds')
      } else {
        setError('No se pudo borrar el mundo.')
      }
    } catch {
      setError('No se pudo borrar el mundo.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-96 text-lg text-gray-500">Cargando mundo...</div>
  if (error) return <div className="flex justify-center items-center h-96 text-lg text-red-500">{error}</div>
  if (!world) return null

  return (
    <div className="max-w-3xl mx-auto bg-white/90 shadow-2xl rounded-2xl p-8 mt-8 border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-extrabold text-purple-800">{world.name}</h2>
        <div className="flex gap-2">
          <button onClick={() => navigate(`/worlds/${id}/edit`)} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Editar</button>
          <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Borrar</button>
        </div>
      </div>
      <div className="mb-4"><span className="font-semibold">Era:</span> {world.era}</div>
      <div className="mb-4"><span className="font-semibold">Clima:</span> {world.climate}</div>
      <div className="mb-4"><span className="font-semibold">Política:</span> {world.politics}</div>
      <div className="mb-4"><span className="font-semibold">Cultura:</span> {world.culture}</div>
      <div className="mb-4"><span className="font-semibold">Descripción:</span> {world.description}</div>
      <div className="mb-4"><span className="font-semibold">Facciones:</span>
        <ul className="list-disc list-inside ml-4">
          {world.factions.map(f => <li key={f}>{f}</li>)}
        </ul>
      </div>
      <hr className="my-8" />
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-purple-700">Personajes</h3>
          <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-semibold">+ Añadir personaje</button>
        </div>
        {/* Aquí iría la lista de personajes del mundo */}
        <div className="text-gray-500 italic">(Próximamente: listado de personajes)</div>
      </div>
      <div>
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xl font-bold text-purple-700">Escenas</h3>
          <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded font-semibold">+ Añadir escena</button>
        </div>
        {/* Aquí iría la lista de escenas del mundo */}
        <div className="text-gray-500 italic">(Próximamente: listado de escenas)</div>
      </div>
    </div>
  )
}

import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getWorldDetail, deleteWorld } from '../../services/api'
import type { WorldDetail, World } from '../../services/api'

export default function WorldDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<WorldDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const worldId = Number(id)
    if (!id || Number.isNaN(worldId)) {
      setError('ID de mundo inválido.')
      setLoading(false)
      return
    }

    getWorldDetail(worldId)
      .then(data => {
        if (!data || typeof data !== 'object') {
          throw new Error('No se encontró el mundo solicitado.')
        }

        // Current backend shape:
        // { id, name, era, climate, politics, culture, factions, summary, characters, scenes }
        const raw = data as unknown as Record<string, unknown>
        if (!raw.name) {
          throw new Error('No se encontró el mundo solicitado.')
        }

        const normalizedWorld: World = {
          id: Number(raw.id ?? worldId),
          name: String(raw.name ?? ''),
          era: String(raw.era ?? ''),
          climate: String(raw.climate ?? ''),
          politics: String(raw.politics ?? ''),
          culture: String(raw.culture ?? ''),
          factions: Array.isArray(raw.factions) ? (raw.factions as string[]) : [],
          description: String(raw.summary ?? ''),
        }

        setDetail({
          world: normalizedWorld,
          characters: Array.isArray(raw.characters) ? raw.characters : [],
          scenes: Array.isArray(raw.scenes) ? raw.scenes : [],
        })
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!window.confirm('¿Seguro que quieres borrar este mundo?')) return
    setLoading(true)
    try {
      await deleteWorld(Number(id))
      navigate('/worlds')
    } catch {
      setError('No se pudo borrar el mundo.')
      setLoading(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-96 text-lg text-gray-500">Cargando mundo...</div>
  if (error) return <div className="flex justify-center items-center h-96 text-lg text-red-500">{error}</div>
  if (!detail?.world) {
    return <div className="flex justify-center items-center h-96 text-lg text-red-500">No se encontró el mundo solicitado.</div>
  }

  const { world, characters, scenes } = detail

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-8">
      {/* World Info */}
      <div className="bg-white/90 shadow-2xl rounded-2xl p-8 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-purple-800">{world.name}</h2>
          <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-bold">Borrar</button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div><span className="font-semibold text-gray-700">Era:</span> {world.era}</div>
          <div><span className="font-semibold text-gray-700">Clima:</span> {world.climate}</div>
          <div><span className="font-semibold text-gray-700">Política:</span> {world.politics}</div>
          <div><span className="font-semibold text-gray-700">Cultura:</span> {world.culture}</div>
        </div>
        {world.description && (
          <div className="mb-4"><span className="font-semibold text-gray-700">Descripción:</span> {world.description}</div>
        )}
        {world.factions && world.factions.length > 0 && (
          <div>
            <span className="font-semibold text-gray-700">Facciones:</span>
            <div className="flex flex-wrap gap-2 mt-1">
              {world.factions.map(f => (
                <span key={f} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">{f}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Characters Section */}
      <div className="bg-white/90 shadow-xl rounded-2xl p-8 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-purple-700">Personajes ({characters?.length || 0})</h3>
          <Link
            to={`/worlds/${id}/characters/create`}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            + Crear personaje
          </Link>
        </div>
        {!characters || characters.length === 0 ? (
          <p className="text-gray-500 italic">Aún no hay personajes en este mundo.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {characters.map(c => (
              <Link
                key={c.id}
                to={`/worlds/${id}/characters/${c.id}`}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition block"
              >
                <h4 className="font-bold text-gray-800">{c.name}</h4>
                <p className="text-sm text-purple-600">{c.role}</p>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{c.personality}</p>
                {c.goals && c.goals.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {c.goals.slice(0, 2).map((g, i) => (
                      <span key={i} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-xs">{g}</span>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Scenes Section */}
      <div className="bg-white/90 shadow-xl rounded-2xl p-8 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-purple-700">Escenas ({scenes?.length || 0})</h3>
          <Link
            to={`/worlds/${id}/scenes/create`}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold text-sm"
          >
            + Crear escena
          </Link>
        </div>
        {!scenes || scenes.length === 0 ? (
          <p className="text-gray-500 italic">Aún no hay escenas en este mundo.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scenes.map(s => (
              <Link
                key={s.id}
                to={`/worlds/${id}/scenes/${s.id}`}
                className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition block"
              >
                <h4 className="font-bold text-gray-800">{s.title}</h4>
                <div className="flex flex-wrap gap-2 mt-1 text-sm">
                  <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded">{s.location}</span>
                  <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s.time}</span>
                  <span className="bg-pink-50 text-pink-700 px-2 py-0.5 rounded">{s.tone}</span>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{s.context}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

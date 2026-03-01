import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCharacterById } from '../../services/api'
import type { Character } from '../../services/api'

export default function CharacterDetailPage() {
  const { worldId, characterId } = useParams()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = Number(characterId)
    if (!characterId || Number.isNaN(id)) {
      setError('ID de personaje inválido.')
      setLoading(false)
      return
    }

    getCharacterById(id)
      .then(data => setCharacter(data))
      .catch(err => setError(err instanceof Error ? err.message : 'No se pudo cargar el personaje.'))
      .finally(() => setLoading(false))
  }, [characterId])

  if (loading) return <div className="flex justify-center items-center h-96 text-lg text-gray-500">Cargando personaje...</div>
  if (error) return <div className="flex justify-center items-center h-96 text-lg text-red-500">{error}</div>
  if (!character) return <div className="flex justify-center items-center h-96 text-lg text-red-500">No se encontró el personaje.</div>

  const personalityList = character.personality
    ? character.personality.split(',').map(item => item.trim()).filter(Boolean)
    : []
  const stateEntries = Object.entries(character.state || {})

  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-purple-800">{character.name}</h2>
        <Link
          to={worldId ? `/worlds/${worldId}` : '/worlds'}
          className="text-sm font-semibold text-purple-700 hover:text-purple-900"
        >
          Volver al mundo
        </Link>
      </div>

      <div className="bg-white/90 shadow-2xl rounded-2xl p-8 border border-gray-200 space-y-6">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-2">Rol</h3>
          <p className="text-gray-800">{character.role || 'Sin rol'}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-2">Personalidad</h3>
          {personalityList.length === 0 ? (
            <p className="text-gray-500 italic">No hay rasgos definidos.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {personalityList.map((trait, index) => (
                <span key={`${trait}-${index}`} className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">
                  {trait}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-2">Trasfondo</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{character.background || 'Sin trasfondo.'}</p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-2">Objetivos</h3>
          {!character.goals || character.goals.length === 0 ? (
            <p className="text-gray-500 italic">No hay objetivos definidos.</p>
          ) : (
            <ul className="list-disc pl-6 space-y-1 text-gray-700">
              {character.goals.map((goal, index) => (
                <li key={`${goal}-${index}`}>{goal}</li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-2">Estado</h3>
          {stateEntries.length === 0 ? (
            <p className="text-gray-500 italic">Sin estado registrado.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {stateEntries.map(([key, value]) => (
                <div key={key} className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm">
                  <span className="font-semibold text-gray-700">{key}:</span> <span className="text-gray-600">{value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getCharacterById } from '../../services/api'
import type { Character } from '../../services/api'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'

export default function CharacterDetailPage() {
  const { worldId, characterId } = useParams()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = Number(characterId)
    if (!characterId || Number.isNaN(id)) {
      setError('ID de personaje invalido.')
      setLoading(false)
      return
    }

    getCharacterById(id)
      .then(data => setCharacter(data))
      .catch(err => setError(err instanceof Error ? err.message : 'No se pudo cargar el personaje.'))
      .finally(() => setLoading(false))
  }, [characterId])

  if (loading) return <DetailSkeleton />
  if (error) return (
    <div className="flex justify-center items-center h-96">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  )
  if (!character) return (
    <div className="flex justify-center items-center h-96">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>No se encontro el personaje.</AlertDescription>
      </Alert>
    </div>
  )

  const personalityList = character.personality
    ? character.personality.split(',').map(item => item.trim()).filter(Boolean)
    : []
  const stateEntries = Object.entries(character.state || {})

  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-6">
      <PageBreadcrumb items={[{label: 'Mundos', href: '/worlds'}, {label: 'Mundo', href: '/worlds/' + worldId}, {label: character.name}]} />

      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-purple-800">{character.name}</h2>
        <Button variant="secondary" size="sm" asChild>
          <Link to={worldId ? `/worlds/${worldId}` : '/worlds'}>Volver al mundo</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
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
                  <Badge key={`${trait}-${index}`} variant="outline">{trait}</Badge>
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
        </CardContent>
      </Card>
    </div>
  )
}

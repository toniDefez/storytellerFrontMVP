import { useParams, useNavigate, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { getWorldDetail, deleteWorld } from '../../services/api'
import type { WorldDetail, World } from '../../services/api'
import ConfirmModal from '../../components/ConfirmModal'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'

export default function WorldDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<WorldDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  useEffect(() => {
    const worldId = Number(id)
    if (!id || Number.isNaN(worldId)) {
      setError('ID de mundo invalido.')
      setLoading(false)
      return
    }

    getWorldDetail(worldId)
      .then(data => {
        if (!data || typeof data !== 'object') {
          throw new Error('No se encontro el mundo solicitado.')
        }

        // Current backend shape:
        // { id, name, era, climate, politics, culture, factions, summary, characters, scenes }
        const raw = data as unknown as Record<string, unknown>
        if (!raw.name) {
          throw new Error('No se encontro el mundo solicitado.')
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
    setLoading(true)
    try {
      await deleteWorld(Number(id))
      navigate('/worlds')
    } catch {
      setError('No se pudo borrar el mundo.')
      setLoading(false)
    }
  }

  if (loading) return <DetailSkeleton />
  if (error) return (
    <div className="flex justify-center items-center h-96">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  )
  if (!detail?.world) {
    return (
      <div className="flex justify-center items-center h-96">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription>No se encontro el mundo solicitado.</AlertDescription>
        </Alert>
      </div>
    )
  }

  const { world, characters, scenes } = detail

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-8">
      <PageBreadcrumb items={[{label: 'Mundos', href: '/worlds'}, {label: world.name}]} />

      <ConfirmModal
        open={showConfirmDelete}
        title="Borrar este mundo?"
        message={`Esto eliminara "${world.name}" y todo su contenido de forma permanente. Esta accion no se puede deshacer.`}
        confirmText="Borrar mundo"
        cancelText="Cancelar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* World Info */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-extrabold text-purple-800">{world.name}</h2>
            <Button variant="destructive" size="sm" onClick={() => setShowConfirmDelete(true)}>Borrar</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><span className="font-semibold text-gray-700">Era:</span> {world.era}</div>
            <div><span className="font-semibold text-gray-700">Clima:</span> {world.climate}</div>
            <div><span className="font-semibold text-gray-700">Politica:</span> {world.politics}</div>
            <div><span className="font-semibold text-gray-700">Cultura:</span> {world.culture}</div>
          </div>
          {world.description && (
            <div className="mb-4"><span className="font-semibold text-gray-700">Descripcion:</span> {world.description}</div>
          )}
          {world.factions && world.factions.length > 0 && (
            <div>
              <span className="font-semibold text-gray-700">Facciones:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {world.factions.map(f => (
                  <Badge key={f} variant="outline">{f}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Characters Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-purple-700">Personajes ({characters?.length || 0})</h3>
            <Button variant="secondary" size="sm" asChild>
              <Link to={`/worlds/${id}/characters/create`}>+ Crear personaje</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!characters || characters.length === 0 ? (
            <p className="text-gray-500 italic">Aun no hay personajes en este mundo.</p>
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
                        <Badge key={i} variant="secondary">{g}</Badge>
                      ))}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Scenes Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-purple-700">Escenas ({scenes?.length || 0})</h3>
            <Button variant="secondary" size="sm" asChild>
              <Link to={`/worlds/${id}/scenes/create`}>+ Crear escena</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {!scenes || scenes.length === 0 ? (
            <p className="text-gray-500 italic">Aun no hay escenas en este mundo.</p>
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
                    <Badge variant="secondary">{s.location}</Badge>
                    <Badge variant="secondary">{s.time}</Badge>
                    <Badge variant="secondary">{s.tone}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{s.context}</p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

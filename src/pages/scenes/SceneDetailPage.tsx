import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  getSceneDetail,
  deleteScene,
  addCharacterToScene,
  generateEvents,
  getSceneNarrative,
  getWorldDetail,
} from '../../services/api'
import type { SceneDetail, Character, Event as StoryEvent } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'
import ConfirmModal from '../../components/ConfirmModal'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function SceneDetailPage() {
  const { worldId, sceneId } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState<SceneDetail | null>(null)
  const [worldCharacters, setWorldCharacters] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Add character
  const [showAddChar, setShowAddChar] = useState(false)
  const [selectedCharId, setSelectedCharId] = useState<number | null>(null)
  const [addingChar, setAddingChar] = useState(false)

  // Generate events
  const [eventDesc, setEventDesc] = useState('')
  const [numEvents, setNumEvents] = useState(1)
  const [generatingEvents, setGeneratingEvents] = useState(false)

  // Narrative
  const [narrative, setNarrative] = useState<string | null>(null)
  const [generatingNarrative, setGeneratingNarrative] = useState(false)

  const { hasInstallation, checked: installationChecked } = useInstallation()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  useEffect(() => {
    if (!sceneId || !worldId) return
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneId, worldId])

  function loadData() {
    setLoading(true)
    Promise.all([
      getSceneDetail(Number(sceneId)),
      getWorldDetail(Number(worldId)),
    ])
      .then(([sceneDetail, worldDetail]) => {
        setDetail(sceneDetail)
        setWorldCharacters(worldDetail.characters || [])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }

  const handleDelete = async () => {
    try {
      await deleteScene(Number(sceneId))
      navigate(`/worlds/${worldId}`)
    } catch {
      setError('No se pudo borrar la escena.')
    }
  }

  const handleAddCharacter = async () => {
    if (!selectedCharId) return
    setAddingChar(true)
    try {
      await addCharacterToScene(Number(sceneId), selectedCharId)
      setShowAddChar(false)
      setSelectedCharId(null)
      loadData()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo anadir el personaje.')
    } finally {
      setAddingChar(false)
    }
  }

  const handleGenerateEvents = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!detail) return
    setGeneratingEvents(true)
    setError('')
    try {
      const charIds = detail.characters?.map(c => c.id) || []
      const result = await generateEvents(Number(sceneId), charIds, eventDesc, numEvents)
      setDetail(prev => prev ? {
        ...prev,
        events: [...(prev.events || []), ...(result.events || [])],
      } : prev)
      setEventDesc('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudieron generar eventos.')
    } finally {
      setGeneratingEvents(false)
    }
  }

  const handleGenerateNarrative = async () => {
    setGeneratingNarrative(true)
    setError('')
    try {
      const result = await getSceneNarrative(Number(sceneId))
      setNarrative(result.text)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la narrativa.')
    } finally {
      setGeneratingNarrative(false)
    }
  }

  if (loading) return <div className="flex justify-center items-center h-96 text-lg text-gray-500">Cargando escena...</div>
  if (error && !detail) return (
    <div className="flex justify-center items-center h-96">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  )
  if (!detail) return null

  const { scene, characters, events } = detail
  const sceneCharacterIds = new Set(characters?.map(c => c.id) || [])
  const availableCharacters = worldCharacters.filter(c => !sceneCharacterIds.has(c.id))
  const sortedEvents = [...(events || [])].sort((a, b) => a.position - b.position)

  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-8">
      <ConfirmModal
        open={showConfirmDelete}
        title="Borrar esta escena?"
        message={`Esto eliminara "${scene.title}" y todos sus eventos de forma permanente. Esta accion no se puede deshacer.`}
        confirmText="Borrar escena"
        cancelText="Cancelar"
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Scene Info */}
      <div className="bg-white/90 shadow-2xl rounded-2xl p-8 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-extrabold text-purple-800">{scene.title}</h2>
          <Button variant="destructive" size="sm" onClick={() => setShowConfirmDelete(true)}>Borrar</Button>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm font-medium">{scene.location}</span>
          <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">{scene.time}</span>
          <span className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-medium">{scene.tone}</span>
        </div>
        <p className="text-gray-700">{scene.context}</p>
      </div>

      {/* Characters in Scene */}
      <div className="bg-white/90 shadow-xl rounded-2xl p-8 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-purple-700">Personajes en escena ({characters?.length || 0})</h3>
          {availableCharacters.length > 0 && (
            <Button variant="secondary" size="sm" onClick={() => setShowAddChar(!showAddChar)}>
              + Anadir personaje
            </Button>
          )}
        </div>

        {showAddChar && (
          <div className="mb-4 p-4 bg-gray-50 rounded-lg border flex gap-3 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar personaje</label>
              <select
                value={selectedCharId || ''}
                onChange={e => setSelectedCharId(Number(e.target.value))}
                className="w-full border rounded-lg px-3 py-2"
              >
                <option value="">-- Elegir --</option>
                {availableCharacters.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                ))}
              </select>
            </div>
            <Button variant="secondary" size="sm" onClick={handleAddCharacter} disabled={!selectedCharId || addingChar}>
              {addingChar ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Anadiendo...</> : 'Anadir'}
            </Button>
          </div>
        )}

        {!characters || characters.length === 0 ? (
          <p className="text-gray-500 italic">No hay personajes en esta escena.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {characters.map(c => (
              <div key={c.id} className="bg-purple-50 border border-purple-200 rounded-xl px-4 py-2">
                <span className="font-bold text-gray-800">{c.name}</span>
                <span className="text-purple-600 text-sm ml-2">({c.role})</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Events */}
      <div className="bg-white/90 shadow-xl rounded-2xl p-8 border border-gray-200">
        <h3 className="text-xl font-bold text-purple-700 mb-4">Eventos ({sortedEvents.length})</h3>

        {sortedEvents.length === 0 ? (
          <p className="text-gray-500 italic mb-6">No hay eventos en esta escena.</p>
        ) : (
          <div className="space-y-4 mb-6">
            {sortedEvents.map((ev: StoryEvent, idx: number) => (
              <div key={ev.id || idx} className="border-l-4 border-purple-400 pl-4 py-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">#{idx + 1}</span>
                  {ev.spot && <span className="bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded text-xs">{ev.spot}</span>}
                </div>
                <p className="text-gray-700">{ev.action}</p>
              </div>
            ))}
          </div>
        )}

        {/* Generate Events Form */}
        {installationChecked && !hasInstallation && <NoInstallationBanner />}
        <form onSubmit={handleGenerateEvents} className="p-4 bg-gray-50 rounded-lg border">
          <h4 className="font-semibold text-gray-700 mb-3">Generar eventos con IA</h4>
          <div className="mb-3">
            <textarea
              value={eventDesc}
              onChange={e => setEventDesc(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 min-h-[60px]"
              placeholder="Describe que deberia pasar..."
              required
            />
          </div>
          <div className="flex gap-3 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Numero de eventos</label>
              <input type="number" min={1} max={5} value={numEvents} onChange={e => setNumEvents(Number(e.target.value))} className="border rounded-lg px-3 py-2 w-20" />
            </div>
            <Button type="submit" size="lg" disabled={generatingEvents}>
              {generatingEvents ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando...</> : 'Generar eventos'}
            </Button>
          </div>
        </form>
      </div>

      {/* Narrative */}
      <div className="bg-white/90 shadow-xl rounded-2xl p-8 border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-purple-700">Narrativa</h3>
          <Button variant="secondary" size="sm" onClick={handleGenerateNarrative} disabled={generatingNarrative}>
            {generatingNarrative ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando narrativa...</> : 'Generar narrativa'}
          </Button>
        </div>
        {narrative ? (
          <div className="prose max-w-none bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border border-purple-200 whitespace-pre-wrap text-gray-800 leading-relaxed">
            {narrative}
          </div>
        ) : (
          <p className="text-gray-500 italic">Genera una narrativa para unir todos los eventos de esta escena en una historia coherente.</p>
        )}
      </div>
    </div>
  )
}

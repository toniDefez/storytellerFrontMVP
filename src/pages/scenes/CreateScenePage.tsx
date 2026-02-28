import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createScene, generateScene } from '../../services/api'
import type { Scene } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'

export default function CreateScenePage() {
  const { id: worldId } = useParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')

  // Manual fields
  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [time, setTime] = useState('')
  const [tone, setTone] = useState('')
  const [context, setContext] = useState('')
  const [description, setDescription] = useState('')

  // AI
  const [aiLoading, setAiLoading] = useState(false)
  const [aiScene, setAiScene] = useState<Scene | null>(null)

  // Common
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { hasInstallation, checked: installationChecked } = useInstallation()

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await createScene({
        title,
        location,
        time,
        tone,
        context,
        world_id: Number(worldId),
      })
      navigate(`/worlds/${worldId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la escena.')
    } finally {
      setLoading(false)
    }
  }

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAiLoading(true)
    setError('')
    setAiScene(null)
    try {
      const scene = await generateScene(Number(worldId), description)
      setAiScene(scene)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la escena.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAISave = async () => {
    if (!aiScene) return
    setLoading(true)
    setError('')
    try {
      await createScene({
        title: aiScene.title || 'Escena generada',
        location: aiScene.location || '',
        time: aiScene.time || '',
        tone: aiScene.tone || '',
        context: aiScene.context || '',
        world_id: Number(worldId),
      })
      navigate(`/worlds/${worldId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la escena.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-start min-h-[80vh] px-4 md:px-10">
      <div className="w-full max-w-xl mx-auto bg-white/90 shadow-2xl rounded-2xl px-10 pt-10 pb-8 border border-gray-200 backdrop-blur-md">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-purple-800 tracking-tight drop-shadow">Crear escena</h2>

        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setMode('manual')} type="button" className={`px-4 py-2 rounded-lg font-bold transition ${mode === 'manual' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}`}>Manual</button>
          <button onClick={() => setMode('ai')} type="button" className={`px-4 py-2 rounded-lg font-bold transition ${mode === 'ai' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}`}>Generar con IA</button>
        </div>

        {error && <p className="mb-4 text-red-600 text-sm text-center font-semibold">{error}</p>}

        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium">Título</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium">Ubicación</label>
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full border rounded-lg px-3 py-2" required placeholder="Ej: Taberna del puerto, Castillo..." />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium">Momento</label>
              <input type="text" value={time} onChange={e => setTime(e.target.value)} className="w-full border rounded-lg px-3 py-2" required placeholder="Ej: Medianoche, Amanecer..." />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium">Tono</label>
              <input type="text" value={tone} onChange={e => setTone(e.target.value)} className="w-full border rounded-lg px-3 py-2" required placeholder="Ej: Misterioso, Épico, Sombrío..." />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-1 font-medium">Contexto</label>
              <textarea value={context} onChange={e => setContext(e.target.value)} className="w-full border rounded-lg px-3 py-2 min-h-[80px]" required placeholder="Describe qué está pasando en esta escena..." />
            </div>
            <button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear escena'}
            </button>
          </form>
        )}

        {mode === 'ai' && (
          <div>
            {installationChecked && !hasInstallation && <NoInstallationBanner />}
            <form onSubmit={handleAIGenerate}>
              <div className="mb-6">
                <label className="block text-gray-700 mb-1 font-medium">Describe la escena que quieres crear</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 min-h-[80px]" placeholder="Ej: Una noche lluviosa en un callejón oscuro..." required />
              </div>
              <button type="submit" disabled={aiLoading} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60 mb-4">
                {aiLoading ? 'Generando...' : 'Generar escena con IA'}
              </button>
            </form>
            {aiScene && (
              <div className="mt-6 p-6 rounded-2xl bg-purple-50 border border-purple-200 shadow-inner">
                <h3 className="text-xl font-bold text-purple-700 mb-2">Escena generada</h3>
                <div className="mb-2"><span className="font-semibold">Título:</span> {aiScene.title}</div>
                <div className="mb-2"><span className="font-semibold">Ubicación:</span> {aiScene.location}</div>
                <div className="mb-2"><span className="font-semibold">Momento:</span> {aiScene.time}</div>
                <div className="mb-2"><span className="font-semibold">Tono:</span> {aiScene.tone}</div>
                <div className="mb-2"><span className="font-semibold">Contexto:</span> {aiScene.context}</div>
                <button onClick={handleAISave} disabled={loading} className="mt-4 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60">
                  {loading ? 'Guardando...' : 'Guardar escena'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

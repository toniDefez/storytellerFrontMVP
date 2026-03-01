import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createScene, generateScene } from '../../services/api'
import type { Scene } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'
import { PillSelect } from '../../components/PillSelect'

const TIME_OPTIONS = ['Amanecer', 'Mañana', 'Mediodía', 'Tarde', 'Anochecer', 'Noche', 'Medianoche']
const TONE_OPTIONS = ['Épico', 'Misterioso', 'Sombrío', 'Romántico', 'Tenso', 'Cómico', 'Trágico', 'Pacífico', 'Ominoso', 'Íntimo']

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-gray-700 mb-2 font-medium text-sm uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

export default function CreateScenePage() {
  const { id: worldId } = useParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [time, setTime] = useState('')
  const [tone, setTone] = useState('')
  const [context, setContext] = useState('')
  const [description, setDescription] = useState('')

  const [aiLoading, setAiLoading] = useState(false)
  const [aiScene, setAiScene] = useState<Scene | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { hasInstallation, checked: installationChecked } = useInstallation()

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!time || !tone) {
      setError('Por favor selecciona el momento del día y el tono de la escena.')
      return
    }
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
    <div className="flex justify-center items-start min-h-[80vh] px-4 md:px-10 py-8">
      <div className="w-full max-w-2xl mx-auto bg-white/90 shadow-2xl rounded-2xl px-10 pt-10 pb-8 border border-gray-200 backdrop-blur-md">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-purple-800 tracking-tight drop-shadow">Crear escena</h2>

        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setMode('manual')} type="button" className={`px-4 py-2 rounded-lg font-bold transition ${mode === 'manual' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}`}>Manual</button>
          <button onClick={() => setMode('ai')} type="button" className={`px-4 py-2 rounded-lg font-bold transition ${mode === 'ai' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}`}>Generar con IA</button>
        </div>

        {error && <p className="mb-4 text-red-600 text-sm text-center font-semibold">{error}</p>}

        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit}>
            <FieldGroup label="Título">
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full border rounded-lg px-3 py-2" required placeholder="El título de la escena..." />
            </FieldGroup>

            <FieldGroup label="Ubicación">
              <input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full border rounded-lg px-3 py-2" required placeholder="Ej: Taberna del puerto, Bosque encantado, Castillo..." />
            </FieldGroup>

            <div className="border-t border-gray-100 my-5" />

            <FieldGroup label="Momento del día">
              <PillSelect options={TIME_OPTIONS} value={time} onChange={setTime} />
            </FieldGroup>

            <FieldGroup label="Tono">
              <PillSelect options={TONE_OPTIONS} value={tone} onChange={setTone} />
            </FieldGroup>

            <div className="border-t border-gray-100 my-5" />

            <FieldGroup label="Contexto">
              <textarea value={context} onChange={e => setContext(e.target.value)} className="w-full border rounded-lg px-3 py-2 min-h-[80px]" required placeholder="Describe qué está pasando en esta escena..." />
            </FieldGroup>

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
                <h3 className="text-xl font-bold text-purple-700 mb-4">Escena generada</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-24 shrink-0">Título</span><span>{aiScene.title}</span></div>
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-24 shrink-0">Ubicación</span><span>{aiScene.location}</span></div>
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-24 shrink-0">Momento</span><span>{aiScene.time}</span></div>
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-24 shrink-0">Tono</span><span>{aiScene.tone}</span></div>
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-24 shrink-0">Contexto</span><span>{aiScene.context}</span></div>
                </div>
                <button onClick={handleAISave} disabled={loading} className="mt-5 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60">
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

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createScene, generateScene } from '../../services/api'
import type { Scene } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'
import { PillSelect } from '../../components/PillSelect'

const TIME_OPTIONS = ['Amanecer', 'Mañana', 'Mediodía', 'Tarde', 'Anochecer', 'Noche', 'Medianoche']
const TIME_DESC: Record<string, string> = {
  Amanecer: 'La primera luz rompe la oscuridad. El momento de las promesas y los nuevos comienzos.',
  Mañana: 'El día en plena actividad, el mundo despierto, el bullicio en marcha.',
  Mediodía: 'Sol en lo alto, calor y el momento de máxima claridad y exposición.',
  Tarde: 'Las sombras se alargan, el ritmo baja y las confidencias empiezan a emerger.',
  Anochecer: 'El crepúsculo tiñe el cielo. La frontera entre el día y la noche.',
  Noche: 'Oscuridad y misterio. La ciudad cambia de cara cuando caen las estrellas.',
  Medianoche: 'La hora más profunda. Secretos, rituales y lo que nadie debería ver.',
}

const TONE_OPTIONS = ['Épico', 'Misterioso', 'Sombrío', 'Romántico', 'Tenso', 'Cómico', 'Trágico', 'Pacífico', 'Ominoso', 'Íntimo']
const TONE_DESC: Record<string, string> = {
  Épico: 'Gestas legendarias, sacrificios heroicos y el peso del destino en cada acción.',
  Misterioso: 'Preguntas sin respuesta, sombras entre líneas y una tensión que no cesa.',
  Sombrío: 'La oscuridad tiene protagonismo. Pérdida, duda y una atmósfera opresiva.',
  Romántico: 'El corazón guía las acciones. Pasión, deseo y vínculos que trascienden.',
  Tenso: 'Cada palabra importa. El peligro acecha y cualquier error tiene consecuencias.',
  Cómico: 'La ligereza como arma. Humor, ironía y momentos que alivian la carga.',
  Trágico: 'El final ya está escrito. La belleza inevitable de lo que no tiene remedio.',
  Pacífico: 'Sin conflicto aparente. Espacio para el detalle, la contemplación y el respiro.',
  Ominoso: 'Algo malo se aproxima. Una amenaza latente que impregna cada momento.',
  Íntimo: 'A puerta cerrada, los personajes se revelan. Vulnerabilidad y conexión real.',
}

function SectionDivider({ label }: { label: string }) {
  return (
    <div className="relative my-6 flex items-center gap-3">
      <div className="flex-1 border-t border-gray-100" />
      <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.18em]">{label}</span>
      <div className="flex-1 border-t border-gray-100" />
    </div>
  )
}

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</label>
      {children}
    </div>
  )
}

const inputClass = 'w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-violet-300 focus:border-violet-400 transition'
const textareaClass = `${inputClass} min-h-[90px] resize-none`

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
      await createScene({ title, location, time, tone, context, world_id: Number(worldId) })
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
    <div className="flex justify-center items-start min-h-[80vh] bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 px-4 md:px-10 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative bg-white shadow-xl shadow-violet-100/60 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

          <div className="px-10 pt-8 pb-9">
            <h2 className="text-2xl font-bold mb-1 text-gray-800 tracking-tight">Crear escena</h2>
            <p className="text-sm text-gray-400 mb-7">Define el momento que impulsará la narrativa.</p>

            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8 w-fit">
              <button onClick={() => setMode('manual')} type="button" className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === 'manual' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Manual</button>
              <button onClick={() => setMode('ai')} type="button" className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === 'ai' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Generar con IA</button>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}

            {mode === 'manual' && (
              <form onSubmit={handleManualSubmit}>
                <FieldGroup label="Título">
                  <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} required placeholder="El título de la escena..." />
                </FieldGroup>

                <FieldGroup label="Ubicación">
                  <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputClass} required placeholder="Ej: Taberna del puerto, Bosque encantado, Castillo en ruinas..." />
                </FieldGroup>

                <SectionDivider label="Atmósfera" />

                <FieldGroup label="Momento del día">
                  <PillSelect options={TIME_OPTIONS} value={time} onChange={setTime} descriptions={TIME_DESC} />
                </FieldGroup>

                <FieldGroup label="Tono">
                  <PillSelect options={TONE_OPTIONS} value={tone} onChange={setTone} descriptions={TONE_DESC} />
                </FieldGroup>

                <SectionDivider label="Narrativa" />

                <FieldGroup label="Contexto">
                  <textarea value={context} onChange={e => setContext(e.target.value)} className={textareaClass} required placeholder="Describe qué está pasando en esta escena..." />
                </FieldGroup>

                <button type="submit" disabled={loading} className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 transition-all duration-200 text-sm tracking-wide disabled:opacity-50">
                  {loading ? 'Creando escena...' : 'Crear escena'}
                </button>
              </form>
            )}

            {mode === 'ai' && (
              <div>
                {installationChecked && !hasInstallation && <NoInstallationBanner />}
                <form onSubmit={handleAIGenerate}>
                  <FieldGroup label="Describe la escena que quieres crear">
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className={textareaClass} placeholder="Ej: Una noche lluviosa en un callejón oscuro donde dos viejos rivales se encuentran..." required />
                  </FieldGroup>
                  <button type="submit" disabled={aiLoading} className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 transition-all duration-200 text-sm tracking-wide disabled:opacity-50 mb-4">
                    {aiLoading ? 'Generando...' : 'Generar escena con IA'}
                  </button>
                </form>

                {aiScene && (
                  <div className="mt-2 rounded-xl border border-violet-200 overflow-hidden">
                    <div className="px-5 py-3 bg-violet-600">
                      <h3 className="text-sm font-bold text-white">{aiScene.title}</h3>
                      <p className="text-xs text-violet-200">{aiScene.location} · {aiScene.time}</p>
                    </div>
                    <div className="p-5 bg-violet-50 space-y-2">
                      {[
                        { label: 'Tono', value: aiScene.tone },
                        { label: 'Contexto', value: aiScene.context },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex gap-3 text-sm">
                          <span className="text-violet-400 font-semibold w-20 shrink-0">{label}</span>
                          <span className="text-gray-700">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-3 bg-white border-t border-violet-100">
                      <button onClick={handleAISave} disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50">
                        {loading ? 'Guardando...' : 'Guardar esta escena'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

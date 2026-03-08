import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getSceneById, updateScene } from '../../services/api'
import { useToast } from '../../components/Toast'
import { PillSelect } from '../../components/PillSelect'
import { inputClass, textareaClass } from '../../utils/styles'
import { SkeletonDetail } from '../../components/Skeleton'

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

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">{label}</label>
      {children}
    </div>
  )
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

export default function EditScenePage() {
  const { worldId, sceneId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [loadingData, setLoadingData] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [time, setTime] = useState('')
  const [tone, setTone] = useState('')
  const [context, setContext] = useState('')

  useEffect(() => {
    getSceneById(Number(sceneId))
      .then(scene => {
        setTitle(scene.title)
        setLocation(scene.location)
        setTime(scene.time)
        setTone(scene.tone)
        setContext(scene.context)
      })
      .catch(err => setError(err.message))
      .finally(() => setLoadingData(false))
  }, [sceneId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!time || !tone) {
      setError('Por favor selecciona el momento del día y el tono de la escena.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await updateScene(Number(sceneId), { title, location, time, tone, context })
      addToast('Escena actualizada correctamente.', 'success')
      navigate(-1)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar la escena.')
      setLoading(false)
    }
  }

  if (loadingData) return <SkeletonDetail />
  if (error && !title) return <div className="flex justify-center items-center h-96 text-lg text-red-500">{error}</div>

  // worldId is available for context but not needed in the form itself
  void worldId

  return (
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative bg-white shadow-xl shadow-violet-100/60 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
          <div className="px-10 pt-8 pb-9">
            <h2 className="text-2xl font-bold mb-1 text-gray-800 tracking-tight">Editar escena</h2>
            <p className="text-sm text-gray-400 mb-7">Modifica los detalles de la escena.</p>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <FieldGroup label="Título">
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} className={inputClass} required placeholder="Título de la escena..." />
              </FieldGroup>

              <FieldGroup label="Ubicación">
                <input type="text" value={location} onChange={e => setLocation(e.target.value)} className={inputClass} required placeholder="Ej: Taberna del puerto, Bosque encantado..." />
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

              <div className="flex gap-3">
                <button type="button" onClick={() => navigate(-1)} className="flex-1 py-3 px-6 border border-gray-200 text-gray-600 hover:bg-gray-50 font-semibold rounded-xl transition text-sm">
                  Cancelar
                </button>
                <button type="submit" disabled={loading} className="flex-1 py-3 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 transition-all duration-200 text-sm tracking-wide disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

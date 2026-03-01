import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCharacter, generateCharacter } from '../../services/api'
import type { Character } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'
import { PillSelect, MultiPillSelect } from '../../components/PillSelect'

const ROLE_OPTIONS = ['Guerrero', 'Mago', 'Pícaro', 'Explorador', 'Sanador', 'Mercader', 'Noble', 'Sacerdote', 'Villano', 'Artesano']
const PERSONALITY_OPTIONS = ['Valiente', 'Astuto', 'Compasivo', 'Arrogante', 'Misterioso', 'Leal', 'Vengativo', 'Ingenuo', 'Sabio', 'Impulsivo', 'Reservado', 'Temerario']

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline gap-2 mb-2">
        <label className="block text-gray-700 font-medium text-sm uppercase tracking-wide">{label}</label>
        {hint && <span className="text-xs text-gray-400">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

export default function CreateCharacterPage() {
  const { id: worldId } = useParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [personalityTags, setPersonalityTags] = useState<string[]>([])
  const [background, setBackground] = useState('')
  const [goals, setGoals] = useState<string[]>([''])
  const [description, setDescription] = useState('')

  const [aiLoading, setAiLoading] = useState(false)
  const [aiCharacter, setAiCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { hasInstallation, checked: installationChecked } = useInstallation()

  const handleGoalChange = (idx: number, value: string) => {
    setGoals(goals.map((g, i) => (i === idx ? value : g)))
  }
  const addGoal = () => setGoals([...goals, ''])
  const removeGoal = (idx: number) => setGoals(goals.filter((_, i) => i !== idx))

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      setError('Por favor selecciona un rol.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createCharacter({
        name,
        role,
        personality: personalityTags.join(', '),
        background,
        goals: goals.filter(g => g.trim()),
        world_id: Number(worldId),
        state: {},
      })
      navigate(`/worlds/${worldId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el personaje.')
    } finally {
      setLoading(false)
    }
  }

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAiLoading(true)
    setError('')
    setAiCharacter(null)
    try {
      const character = await generateCharacter(Number(worldId), description)
      setAiCharacter(character)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el personaje.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAISave = async () => {
    if (!aiCharacter) return
    setLoading(true)
    setError('')
    try {
      await createCharacter({
        name: aiCharacter.name || 'Personaje generado',
        role: aiCharacter.role || '',
        personality: aiCharacter.personality || '',
        background: aiCharacter.background || '',
        goals: aiCharacter.goals || [],
        world_id: Number(worldId),
        state: aiCharacter.state || {},
      })
      navigate(`/worlds/${worldId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el personaje.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-start min-h-[80vh] px-4 md:px-10 py-8">
      <div className="w-full max-w-2xl mx-auto bg-white/90 shadow-2xl rounded-2xl px-10 pt-10 pb-8 border border-gray-200 backdrop-blur-md">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-purple-800 tracking-tight drop-shadow">Crear personaje</h2>

        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setMode('manual')} type="button" className={`px-4 py-2 rounded-lg font-bold transition ${mode === 'manual' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}`}>Manual</button>
          <button onClick={() => setMode('ai')} type="button" className={`px-4 py-2 rounded-lg font-bold transition ${mode === 'ai' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}`}>Generar con IA</button>
        </div>

        {error && <p className="mb-4 text-red-600 text-sm text-center font-semibold">{error}</p>}

        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit}>
            <FieldGroup label="Nombre">
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" required placeholder="El nombre del personaje..." />
            </FieldGroup>

            <div className="border-t border-gray-100 my-5" />

            <FieldGroup label="Rol">
              <PillSelect options={ROLE_OPTIONS} value={role} onChange={setRole} />
            </FieldGroup>

            <FieldGroup label="Personalidad" hint="selecciona los rasgos que lo definen">
              <MultiPillSelect options={PERSONALITY_OPTIONS} value={personalityTags} onChange={setPersonalityTags} />
            </FieldGroup>

            <div className="border-t border-gray-100 my-5" />

            <FieldGroup label="Trasfondo">
              <textarea value={background} onChange={e => setBackground(e.target.value)} className="w-full border rounded-lg px-3 py-2 min-h-[80px]" required placeholder="Historia de vida, origen, eventos que lo marcaron..." />
            </FieldGroup>

            <div className="mb-6">
              <div className="flex items-baseline gap-2 mb-2">
                <label className="block text-gray-700 font-medium text-sm uppercase tracking-wide">Objetivos</label>
              </div>
              {goals.map((g, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" value={g} onChange={e => handleGoalChange(idx, e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder={`Objetivo #${idx + 1}`} />
                  {goals.length > 1 && (
                    <button type="button" onClick={() => removeGoal(idx)} className="text-red-400 hover:text-red-600 font-bold px-2 transition">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addGoal} className="text-purple-600 hover:underline text-sm mt-1">+ Añadir objetivo</button>
            </div>

            <button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear personaje'}
            </button>
          </form>
        )}

        {mode === 'ai' && (
          <div>
            {installationChecked && !hasInstallation && <NoInstallationBanner />}
            <form onSubmit={handleAIGenerate}>
              <div className="mb-6">
                <label className="block text-gray-700 mb-1 font-medium">Describe el personaje que quieres crear</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 min-h-[80px]" placeholder="Ej: Un guerrero noble con un pasado trágico..." required />
              </div>
              <button type="submit" disabled={aiLoading} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60 mb-4">
                {aiLoading ? 'Generando...' : 'Generar personaje con IA'}
              </button>
            </form>
            {aiCharacter && (
              <div className="mt-6 p-6 rounded-2xl bg-purple-50 border border-purple-200 shadow-inner">
                <h3 className="text-xl font-bold text-purple-700 mb-4">Personaje generado</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-28 shrink-0">Nombre</span><span>{aiCharacter.name}</span></div>
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-28 shrink-0">Rol</span><span>{aiCharacter.role}</span></div>
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-28 shrink-0">Personalidad</span><span>{aiCharacter.personality}</span></div>
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-28 shrink-0">Trasfondo</span><span>{aiCharacter.background}</span></div>
                  {aiCharacter.goals && aiCharacter.goals.length > 0 && (
                    <div className="flex gap-2">
                      <span className="font-semibold text-gray-500 w-28 shrink-0">Objetivos</span>
                      <span>{aiCharacter.goals.join(', ')}</span>
                    </div>
                  )}
                </div>
                <button onClick={handleAISave} disabled={loading} className="mt-5 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60">
                  {loading ? 'Guardando...' : 'Guardar personaje'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCharacter, generateCharacter } from '../../services/api'
import type { Character } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'

export default function CreateCharacterPage() {
  const { id: worldId } = useParams()
  const navigate = useNavigate()
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')

  // Manual fields
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [personality, setPersonality] = useState('')
  const [background, setBackground] = useState('')
  const [goals, setGoals] = useState<string[]>([''])
  const [description, setDescription] = useState('')

  // AI
  const [aiLoading, setAiLoading] = useState(false)
  const [aiCharacter, setAiCharacter] = useState<Character | null>(null)

  // Common
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
    setLoading(true)
    setError('')
    try {
      await createCharacter({
        name,
        role,
        personality,
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
    <div className="flex justify-center items-start min-h-[80vh] px-4 md:px-10">
      <div className="w-full max-w-xl mx-auto bg-white/90 shadow-2xl rounded-2xl px-10 pt-10 pb-8 border border-gray-200 backdrop-blur-md">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-purple-800 tracking-tight drop-shadow">Crear personaje</h2>

        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setMode('manual')} type="button" className={`px-4 py-2 rounded-lg font-bold transition ${mode === 'manual' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}`}>Manual</button>
          <button onClick={() => setMode('ai')} type="button" className={`px-4 py-2 rounded-lg font-bold transition ${mode === 'ai' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}`}>Generar con IA</button>
        </div>

        {error && <p className="mb-4 text-red-600 text-sm text-center font-semibold">{error}</p>}

        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium">Rol</label>
              <input type="text" value={role} onChange={e => setRole(e.target.value)} className="w-full border rounded-lg px-3 py-2" required placeholder="Ej: Guerrero, Mago, Ladrón..." />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium">Personalidad</label>
              <input type="text" value={personality} onChange={e => setPersonality(e.target.value)} className="w-full border rounded-lg px-3 py-2" required placeholder="Ej: Valiente, astuto, reservado..." />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium">Trasfondo</label>
              <textarea value={background} onChange={e => setBackground(e.target.value)} className="w-full border rounded-lg px-3 py-2 min-h-[80px]" required />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-1 font-medium">Objetivos</label>
              {goals.map((g, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" value={g} onChange={e => handleGoalChange(idx, e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder={`Objetivo #${idx + 1}`} />
                  {goals.length > 1 && (
                    <button type="button" onClick={() => removeGoal(idx)} className="text-red-500 font-bold px-2">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addGoal} className="text-blue-600 hover:underline text-sm mt-1">+ Añadir objetivo</button>
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
                <h3 className="text-xl font-bold text-purple-700 mb-2">Personaje generado</h3>
                <div className="mb-2"><span className="font-semibold">Nombre:</span> {aiCharacter.name}</div>
                <div className="mb-2"><span className="font-semibold">Rol:</span> {aiCharacter.role}</div>
                <div className="mb-2"><span className="font-semibold">Personalidad:</span> {aiCharacter.personality}</div>
                <div className="mb-2"><span className="font-semibold">Trasfondo:</span> {aiCharacter.background}</div>
                {aiCharacter.goals && aiCharacter.goals.length > 0 && (
                  <div className="mb-2">
                    <span className="font-semibold">Objetivos:</span>
                    <ul className="list-disc list-inside ml-4">
                      {aiCharacter.goals.map((g, i) => <li key={i}>{g}</li>)}
                    </ul>
                  </div>
                )}
                <button onClick={handleAISave} disabled={loading} className="mt-4 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60">
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

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWorld, generateWorld } from '../../services/api'
import type { World } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'
import { PillSelect } from '../../components/PillSelect'

const ERA_OPTIONS = ['Medieval', 'Antigua', 'Futurista', 'Moderna', 'Fantástica', 'Post-apocalíptica', 'Victoriana', 'Espacial']
const CLIMATE_OPTIONS = ['Templado', 'Ártico', 'Tropical', 'Desértico', 'Volcánico', 'Oceánico', 'Montañoso', 'Tóxico']
const POLITICS_OPTIONS = ['Monarquía', 'Imperio', 'República', 'Teocracia', 'Anarquía', 'Oligarquía', 'Tribu', 'Dictadura']

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <label className="block text-gray-700 mb-2 font-medium text-sm uppercase tracking-wide">{label}</label>
      {children}
    </div>
  )
}

export default function CreateWorldPage() {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  const [name, setName] = useState('')
  const [era, setEra] = useState('')
  const [climate, setClimate] = useState('')
  const [politics, setPolitics] = useState('')
  const [culture, setCulture] = useState('')
  const [factions, setFactions] = useState<string[]>([''])
  const [description, setDescription] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiWorld, setAiWorld] = useState<World | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { hasInstallation, checked: installationChecked } = useInstallation()

  const handleFactionChange = (idx: number, value: string) => {
    setFactions(factions.map((f, i) => (i === idx ? value : f)))
  }
  const addFaction = () => setFactions([...factions, ''])
  const removeFaction = (idx: number) => setFactions(factions.filter((_, i) => i !== idx))

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!era || !climate || !politics) {
      setError('Por favor selecciona era, clima y sistema político.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createWorld({ name, era, climate, politics, culture, factions: factions.filter(f => f.trim()), description })
      navigate('/worlds')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el mundo.')
    } finally {
      setLoading(false)
    }
  }

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAiLoading(true)
    setError('')
    setAiWorld(null)
    try {
      const world = await generateWorld(description)
      setAiWorld(world)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo generar el mundo.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAISubmit = async () => {
    if (!aiWorld) return
    setLoading(true)
    setError('')
    try {
      await createWorld({
        name: aiWorld.name,
        era: aiWorld.era,
        climate: aiWorld.climate,
        politics: aiWorld.politics,
        culture: aiWorld.culture,
        factions: aiWorld.factions || [],
        description: aiWorld.description || '',
      })
      navigate('/worlds')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo crear el mundo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center md:justify-start items-start min-h-[80vh] bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 px-4 md:px-10 py-8">
      <div className="w-full max-w-2xl mx-auto bg-white/90 shadow-2xl rounded-2xl px-10 pt-10 pb-8 border border-gray-200 backdrop-blur-md">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-purple-800 tracking-tight drop-shadow">Crear nuevo mundo</h2>

        <div className="flex justify-center gap-4 mb-8">
          <button onClick={() => setMode('manual')} type="button" className={`px-4 py-2 rounded-lg font-bold transition ${mode === 'manual' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}`}>Manual</button>
          <button onClick={() => setMode('ai')} type="button" className={`px-4 py-2 rounded-lg font-bold transition ${mode === 'ai' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-purple-100'}`}>Generar con IA</button>
        </div>

        {error && <p className="mb-4 text-red-600 text-sm text-center font-semibold">{error}</p>}

        {mode === 'manual' && (
          <form onSubmit={handleManualSubmit}>
            <FieldGroup label="Nombre">
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded-lg px-3 py-2" required placeholder="El nombre de tu mundo..." />
            </FieldGroup>

            <div className="border-t border-gray-100 my-5" />

            <FieldGroup label="Era">
              <PillSelect options={ERA_OPTIONS} value={era} onChange={setEra} />
            </FieldGroup>

            <FieldGroup label="Clima">
              <PillSelect options={CLIMATE_OPTIONS} value={climate} onChange={setClimate} />
            </FieldGroup>

            <FieldGroup label="Sistema político">
              <PillSelect options={POLITICS_OPTIONS} value={politics} onChange={setPolitics} />
            </FieldGroup>

            <div className="border-t border-gray-100 my-5" />

            <FieldGroup label="Cultura">
              <input type="text" value={culture} onChange={e => setCulture(e.target.value)} className="w-full border rounded-lg px-3 py-2" required placeholder="Ej: Guerrera y honorable, mercantil y cosmopolita..." />
            </FieldGroup>

            <FieldGroup label="Descripción">
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 min-h-[80px]" required placeholder="Describe brevemente tu mundo..." />
            </FieldGroup>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2 font-medium text-sm uppercase tracking-wide">Facciones</label>
              {factions.map((f, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" value={f} onChange={e => handleFactionChange(idx, e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder={`Facción #${idx + 1}`} />
                  {factions.length > 1 && (
                    <button type="button" onClick={() => removeFaction(idx)} className="text-red-400 hover:text-red-600 font-bold px-2 transition">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addFaction} className="text-purple-600 hover:underline text-sm mt-1">+ Añadir facción</button>
            </div>

            <button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear mundo'}
            </button>
          </form>
        )}

        {mode === 'ai' && (
          <div>
            {installationChecked && !hasInstallation && <NoInstallationBanner />}
            <form onSubmit={handleAIGenerate}>
              <div className="mb-6">
                <label className="block text-gray-700 mb-1 font-medium">Describe el mundo que quieres crear</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 min-h-[80px]" placeholder="Ej: Un mundo tonto, lleno de magia y humor..." required />
              </div>
              <button type="submit" disabled={aiLoading} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60 mb-4">
                {aiLoading ? 'Generando...' : 'Generar mundo con IA'}
              </button>
            </form>
            {aiWorld && (
              <div className="mt-6 p-6 rounded-2xl bg-purple-50 border border-purple-200 shadow-inner">
                <h3 className="text-xl font-bold text-purple-700 mb-4">Mundo generado</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-24 shrink-0">Nombre</span><span>{aiWorld.name}</span></div>
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-24 shrink-0">Era</span><span>{aiWorld.era}</span></div>
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-24 shrink-0">Clima</span><span>{aiWorld.climate}</span></div>
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-24 shrink-0">Política</span><span>{aiWorld.politics}</span></div>
                  <div className="flex gap-2"><span className="font-semibold text-gray-500 w-24 shrink-0">Cultura</span><span>{aiWorld.culture}</span></div>
                  {aiWorld.factions && aiWorld.factions.length > 0 && (
                    <div className="flex gap-2">
                      <span className="font-semibold text-gray-500 w-24 shrink-0">Facciones</span>
                      <span>{aiWorld.factions.join(', ')}</span>
                    </div>
                  )}
                </div>
                <button onClick={handleAISubmit} disabled={loading} className="mt-5 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60">
                  {loading ? 'Guardando...' : 'Guardar mundo'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

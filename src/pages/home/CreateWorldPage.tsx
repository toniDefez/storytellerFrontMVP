import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

interface World {
  name: string;
  era: string;
  climate: string;
  politics: string;
  culture: string;
  factions: string[];
  description: string;
}

export default function CreateWorldPage() {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual')
  // Manual fields
  const [name, setName] = useState('')
  const [era, setEra] = useState('')
  const [climate, setClimate] = useState('')
  const [politics, setPolitics] = useState('')
  const [culture, setCulture] = useState('')
  const [factions, setFactions] = useState<string[]>([''])
  const [description, setDescription] = useState('')
  // AI fields
  const [aiLoading, setAiLoading] = useState(false)
  const [aiWorld, setAiWorld] = useState<World | null>(null)
  // Common
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleFactionChange = (idx: number, value: string) => {
    setFactions(factions.map((f, i) => (i === idx ? value : f)))
  }
  const addFaction = () => setFactions([...factions, ''])
  const removeFaction = (idx: number) => setFactions(factions.filter((_, i) => i !== idx))

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/world`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, era, climate, politics, culture, factions: factions.filter(f => f.trim()), description }),
      })
      if (res.ok) {
        navigate('/worlds')
      } else {
        const data = await res.json()
        setError(data?.error || 'No se pudo crear el mundo.')
      }
    } catch {
      setError('No se pudo crear el mundo.')
    } finally {
      setLoading(false)
    }
  }

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAiLoading(true)
    setError('')
    setAiWorld(null)
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/world/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ description }),
      })
      if (res.ok) {
        const data = await res.json()
        setAiWorld(data)
      } else {
        const data = await res.json()
        setError(data?.error || 'No se pudo generar el mundo.')
      }
    } catch {
      setError('No se pudo generar el mundo.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAISubmit = async () => {
    if (!aiWorld) return
    setLoading(true)
    setError('')
    const token = localStorage.getItem('token')
    try {
      const res = await fetch(`${API_URL}/world`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(aiWorld),
      })
      if (res.ok) {
        navigate('/worlds')
      } else {
        const data = await res.json()
        setError(data?.error || 'No se pudo crear el mundo.')
      }
    } catch {
      setError('No se pudo crear el mundo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center md:justify-start items-center min-h-[80vh] bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 px-4 md:px-10">
      <div className="w-full max-w-xl mx-auto bg-white/90 shadow-2xl rounded-2xl px-10 pt-10 pb-8 border border-gray-200 backdrop-blur-md">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-purple-800 tracking-tight drop-shadow">Crear nuevo mundo</h2>
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
              <label className="block text-gray-700 mb-1 font-medium">Era</label>
              <input type="text" value={era} onChange={e => setEra(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium">Clima</label>
              <input type="text" value={climate} onChange={e => setClimate(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium">Política</label>
              <input type="text" value={politics} onChange={e => setPolitics(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium">Cultura</label>
              <input type="text" value={culture} onChange={e => setCulture(e.target.value)} className="w-full border rounded-lg px-3 py-2" required />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700 mb-1 font-medium">Descripción</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border rounded-lg px-3 py-2 min-h-[80px]" required />
            </div>
            <div className="mb-6">
              <label className="block text-gray-700 mb-1 font-medium">Facciones</label>
              {factions.map((f, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <input type="text" value={f} onChange={e => handleFactionChange(idx, e.target.value)} className="w-full border rounded-lg px-3 py-2" placeholder={`Facción #${idx + 1}`} />
                  {factions.length > 1 && (
                    <button type="button" onClick={() => removeFaction(idx)} className="text-red-500 font-bold px-2">✕</button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addFaction} className="text-blue-600 hover:underline text-sm mt-1">+ Añadir facción</button>
            </div>
            <button type="submit" disabled={loading} className="bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60">
              {loading ? 'Creando...' : 'Crear mundo'}
            </button>
          </form>
        )}
        {mode === 'ai' && (
          <div>
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
                <h3 className="text-xl font-bold text-purple-700 mb-2">Mundo generado</h3>
                <div className="mb-2"><span className="font-semibold">Nombre:</span> {aiWorld.name}</div>
                <div className="mb-2"><span className="font-semibold">Era:</span> {aiWorld.era}</div>
                <div className="mb-2"><span className="font-semibold">Clima:</span> {aiWorld.climate}</div>
                <div className="mb-2"><span className="font-semibold">Política:</span> {aiWorld.politics}</div>
                <div className="mb-2"><span className="font-semibold">Cultura:</span> {aiWorld.culture}</div>
                <div className="mb-2"><span className="font-semibold">Facciones:</span>
                  <ul className="list-disc list-inside ml-4">
                    {aiWorld.factions?.map((f: string) => <li key={f}>{f}</li>)}
                  </ul>
                </div>
                <button onClick={handleAISubmit} disabled={loading} className="mt-4 bg-gradient-to-r from-blue-500 to-pink-500 hover:from-blue-600 hover:to-pink-600 text-white font-bold py-2 px-6 rounded-lg shadow-lg transition-all duration-200 text-lg tracking-wide w-full disabled:opacity-60">
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

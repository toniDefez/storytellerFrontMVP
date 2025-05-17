import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export default function CreateWorldPage() {
  const [name, setName] = useState('')
  const [era, setEra] = useState('')
  const [climate, setClimate] = useState('')
  const [politics, setPolitics] = useState('')
  const [culture, setCulture] = useState('')
  const [factions, setFactions] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleFactionChange = (idx: number, value: string) => {
    setFactions(factions.map((f, i) => (i === idx ? value : f)))
  }

  const addFaction = () => setFactions([...factions, ''])
  const removeFaction = (idx: number) => setFactions(factions.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
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
        body: JSON.stringify({ name, era, climate, politics, culture, factions: factions.filter(f => f.trim()) }),
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
    <div className="flex justify-center items-center min-h-[80vh] bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100">
      <form onSubmit={handleSubmit} className="bg-white/90 shadow-2xl rounded-2xl px-10 pt-10 pb-8 w-full max-w-xl border border-gray-200 backdrop-blur-md">
        <h2 className="text-3xl font-extrabold mb-8 text-center text-purple-800 tracking-tight drop-shadow">Crear nuevo mundo</h2>
        {error && <p className="mb-4 text-red-600 text-sm text-center font-semibold">{error}</p>}
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
    </div>
  )
}

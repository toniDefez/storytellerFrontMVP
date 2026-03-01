import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWorld, generateWorld } from '../../services/api'
import type { World } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'
import { PillSelect } from '../../components/PillSelect'

const ERA_OPTIONS = ['Medieval', 'Antigua', 'Futurista', 'Moderna', 'Fantástica', 'Post-apocalíptica', 'Victoriana', 'Espacial']
const ERA_DESC: Record<string, string> = {
  Medieval: 'Caballeros, castillos y gremios. La era de la espada y la fe.',
  Antigua: 'Imperios de piedra, dioses caprichosos y civilizaciones en auge.',
  Futurista: 'Tecnología avanzada, corporaciones omnipotentes y mundos interconectados.',
  Moderna: 'El mundo tal y como lo conocemos, con sus luces y sombras.',
  Fantástica: 'Magia entretejida en la realidad, criaturas míticas y reinos imposibles.',
  'Post-apocalíptica': 'Las ruinas del ayer como escenario. Supervivencia y renacimiento.',
  Victoriana: 'Vapor, engranajes y una sociedad en plena efervescencia industrial.',
  Espacial: 'La inmensidad del cosmos como lienzo. Naves, alienígenas y lo desconocido.',
}

const CLIMATE_OPTIONS = ['Templado', 'Ártico', 'Tropical', 'Desértico', 'Volcánico', 'Oceánico', 'Montañoso', 'Tóxico']
const CLIMATE_DESC: Record<string, string> = {
  Templado: 'Cuatro estaciones bien definidas, lluvias moderadas y abundante vegetación.',
  Ártico: 'Hielo eterno, ventiscas demoledoras y noches que duran meses.',
  Tropical: 'Calor húmedo, selvas densas y vida desbordante en cada rincón.',
  Desértico: 'Arenas infinitas, sol implacable y oasis como tesoros preciados.',
  Volcánico: 'Tierra viva, erupciones constantes y paisajes de fuego y ceniza.',
  Oceánico: 'Dominado por el mar, con islas dispersas y tormentas legendarias.',
  Montañoso: 'Cimas nevadas, valles profundos y rutas de paso que marcan el destino.',
  Tóxico: 'Atmósfera venenosa, mutaciones y ecosistemas retorcidos por el caos.',
}

const POLITICS_OPTIONS = ['Monarquía', 'Imperio', 'República', 'Teocracia', 'Anarquía', 'Oligarquía', 'Tribu', 'Dictadura']
const POLITICS_DESC: Record<string, string> = {
  Monarquía: 'Un linaje gobierna por sangre. La corona es ley y la nobleza, su sombra eterna.',
  Imperio: 'Un poder central domina vastos territorios con mano de hierro y ejércitos leales.',
  República: 'Representantes elegidos deliberan el futuro de la nación en nombre del pueblo.',
  Teocracia: 'Los dioses gobiernan a través de sus sacerdotes. La fe es la constitución.',
  Anarquía: 'Sin autoridad central. Comunidades autónomas y pactos frágiles entre facciones.',
  Oligarquía: 'Un grupo selecto de familias o gremios controla el poder real desde las sombras.',
  Tribu: 'Clanes y linajes donde la tradición oral y los ancianos dictan el camino.',
  Dictadura: 'Un solo líder concentra todo el poder. Lealtad o destierro, no hay término medio.',
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
    <div className="flex justify-center items-start min-h-[80vh] bg-gradient-to-br from-slate-50 via-violet-50 to-purple-50 px-4 md:px-10 py-10">
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative bg-white shadow-xl shadow-violet-100/60 rounded-2xl border border-gray-100 overflow-hidden">
          {/* Accent bar */}
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

          <div className="px-10 pt-8 pb-9">
            <h2 className="text-2xl font-bold mb-1 text-gray-800 tracking-tight">Crear nuevo mundo</h2>
            <p className="text-sm text-gray-400 mb-7">Define el escenario donde tu historia tomará vida.</p>

            {/* Mode tabs */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8 w-fit">
              <button onClick={() => setMode('manual')} type="button" className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === 'manual' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Manual</button>
              <button onClick={() => setMode('ai')} type="button" className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === 'ai' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Generar con IA</button>
            </div>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}

            {mode === 'manual' && (
              <form onSubmit={handleManualSubmit}>
                <FieldGroup label="Nombre del mundo">
                  <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} required placeholder="Ej: Aethermoor, El Vacío Dorado..." />
                </FieldGroup>

                <SectionDivider label="Ambientación" />

                <FieldGroup label="Era">
                  <PillSelect options={ERA_OPTIONS} value={era} onChange={setEra} descriptions={ERA_DESC} />
                </FieldGroup>

                <FieldGroup label="Clima">
                  <PillSelect options={CLIMATE_OPTIONS} value={climate} onChange={setClimate} descriptions={CLIMATE_DESC} />
                </FieldGroup>

                <FieldGroup label="Sistema político">
                  <PillSelect options={POLITICS_OPTIONS} value={politics} onChange={setPolitics} descriptions={POLITICS_DESC} />
                </FieldGroup>

                <SectionDivider label="Identidad" />

                <FieldGroup label="Cultura">
                  <input type="text" value={culture} onChange={e => setCulture(e.target.value)} className={inputClass} required placeholder="Ej: Guerrera y honorable, mercantil y cosmopolita..." />
                </FieldGroup>

                <FieldGroup label="Descripción">
                  <textarea value={description} onChange={e => setDescription(e.target.value)} className={textareaClass} required placeholder="Describe brevemente la esencia de tu mundo..." />
                </FieldGroup>

                <div className="mb-7">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Facciones</label>
                  {factions.map((f, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <input type="text" value={f} onChange={e => handleFactionChange(idx, e.target.value)} className={inputClass} placeholder={`Facción #${idx + 1}`} />
                      {factions.length > 1 && (
                        <button type="button" onClick={() => removeFaction(idx)} className="text-gray-300 hover:text-red-400 font-bold px-2 transition text-lg">✕</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addFaction} className="text-violet-500 hover:text-violet-700 text-xs font-semibold mt-1 transition">+ Añadir facción</button>
                </div>

                <button type="submit" disabled={loading} className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 transition-all duration-200 text-sm tracking-wide disabled:opacity-50">
                  {loading ? 'Creando mundo...' : 'Crear mundo'}
                </button>
              </form>
            )}

            {mode === 'ai' && (
              <div>
                {installationChecked && !hasInstallation && <NoInstallationBanner />}
                <form onSubmit={handleAIGenerate}>
                  <FieldGroup label="Describe el mundo que quieres crear">
                    <textarea value={description} onChange={e => setDescription(e.target.value)} className={textareaClass} placeholder="Ej: Un mundo tóxico postapocalíptico donde las ciudades flotan sobre nubes de veneno..." required />
                  </FieldGroup>
                  <button type="submit" disabled={aiLoading} className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-violet-200 transition-all duration-200 text-sm tracking-wide disabled:opacity-50 mb-4">
                    {aiLoading ? 'Generando...' : 'Generar mundo con IA'}
                  </button>
                </form>

                {aiWorld && (
                  <div className="mt-2 rounded-xl border border-violet-200 overflow-hidden">
                    <div className="px-5 py-3 bg-violet-600">
                      <h3 className="text-sm font-bold text-white">{aiWorld.name}</h3>
                    </div>
                    <div className="p-5 bg-violet-50 space-y-2">
                      {[
                        { label: 'Era', value: aiWorld.era },
                        { label: 'Clima', value: aiWorld.climate },
                        { label: 'Política', value: aiWorld.politics },
                        { label: 'Cultura', value: aiWorld.culture },
                        ...(aiWorld.factions?.length ? [{ label: 'Facciones', value: aiWorld.factions.join(', ') }] : []),
                      ].map(({ label, value }) => (
                        <div key={label} className="flex gap-3 text-sm">
                          <span className="text-violet-400 font-semibold w-20 shrink-0">{label}</span>
                          <span className="text-gray-700">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-3 bg-white border-t border-violet-100">
                      <button onClick={handleAISubmit} disabled={loading} className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-bold rounded-xl text-sm shadow-md transition-all disabled:opacity-50">
                        {loading ? 'Guardando...' : 'Guardar este mundo'}
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

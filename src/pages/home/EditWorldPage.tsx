import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getWorldById, updateWorld } from '../../services/api'
import { useToast } from '../../components/Toast'
import { PillSelect } from '../../components/PillSelect'
import { inputClass, textareaClass } from '../../utils/styles'
import { SkeletonDetail } from '../../components/Skeleton'

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

export default function EditWorldPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [loadingData, setLoadingData] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [era, setEra] = useState('')
  const [climate, setClimate] = useState('')
  const [politics, setPolitics] = useState('')
  const [culture, setCulture] = useState('')
  const [description, setDescription] = useState('')
  const [factions, setFactions] = useState<string[]>([''])

  useEffect(() => {
    getWorldById(Number(id))
      .then(world => {
        setName(world.name)
        setEra(world.era)
        setClimate(world.climate)
        setPolitics(world.politics)
        setCulture(world.culture)
        setDescription(world.description)
        setFactions(world.factions.length ? world.factions : [''])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoadingData(false))
  }, [id])

  const handleFactionChange = (idx: number, value: string) => {
    setFactions(factions.map((f, i) => (i === idx ? value : f)))
  }
  const addFaction = () => setFactions([...factions, ''])
  const removeFaction = (idx: number) => setFactions(factions.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!era || !climate || !politics) {
      setError('Por favor selecciona era, clima y sistema político.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await updateWorld(Number(id), { name, era, climate, politics, culture, description, factions: factions.filter(f => f.trim()) })
      addToast('Mundo actualizado correctamente.', 'success')
      navigate(-1)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el mundo.')
      setLoading(false)
    }
  }

  if (loadingData) return <SkeletonDetail />
  if (error && !name) return <div className="flex justify-center items-center h-96 text-lg text-red-500">{error}</div>

  return (
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative bg-white shadow-xl shadow-violet-100/60 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
          <div className="px-10 pt-8 pb-9">
            <h2 className="text-2xl font-bold mb-1 text-gray-800 tracking-tight">Editar mundo</h2>
            <p className="text-sm text-gray-400 mb-7">Modifica los detalles de tu mundo.</p>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <FieldGroup label="Nombre del mundo">
                <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} required placeholder="Nombre del mundo..." />
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
                <input type="text" value={culture} onChange={e => setCulture(e.target.value)} className={inputClass} required placeholder="Ej: Guerrera y honorable..." />
              </FieldGroup>

              <FieldGroup label="Descripción">
                <textarea value={description} onChange={e => setDescription(e.target.value)} className={textareaClass} required placeholder="Describe brevemente tu mundo..." />
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

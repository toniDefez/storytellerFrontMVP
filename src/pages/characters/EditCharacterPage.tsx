import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getCharacterById, updateCharacter } from '../../services/api'
import { useToast } from '../../components/Toast'
import { PillSelect, MultiPillSelect } from '../../components/PillSelect'
import { inputClass, textareaClass } from '../../utils/styles'
import { SkeletonDetail } from '../../components/Skeleton'

const ROLE_OPTIONS = ['Guerrero', 'Mago', 'Pícaro', 'Explorador', 'Sanador', 'Mercader', 'Noble', 'Sacerdote', 'Villano', 'Artesano']
const ROLE_DESC: Record<string, string> = {
  Guerrero: 'Forjado en batalla, experto en armas y estrategia de combate.',
  Mago: 'Domina las artes arcanas, estudiando fuerzas más allá de lo mortal.',
  Pícaro: 'Sombras como aliadas, hábil en el engaño, el robo y el sigilo.',
  Explorador: 'Cartógrafo de lo desconocido, superviviente nato en tierras ignotas.',
  Sanador: 'Canaliza el poder de la vida, alivia el sufrimiento y combate la muerte.',
  Mercader: 'El oro mueve el mundo. Sabe cuándo comprar, vender... y traicionar.',
  Noble: 'Nacido entre privilegios, navega las intrigas de la corte como pez en el agua.',
  Sacerdote: 'Voz de su dios en el mundo mortal, árbitro de lo sagrado y lo profano.',
  Villano: 'Fuerzas oscuras lo impulsan. Sus motivos, aunque retorcidos, tienen lógica.',
  Artesano: 'Crea con sus manos lo que otros solo sueñan. Maestro de un oficio único.',
}

const PERSONALITY_OPTIONS = ['Valiente', 'Astuto', 'Compasivo', 'Arrogante', 'Misterioso', 'Leal', 'Vengativo', 'Ingenuo', 'Sabio', 'Impulsivo', 'Reservado', 'Temerario']
const PERSONALITY_DESC: Record<string, string> = {
  Valiente: 'Enfrenta el miedo de frente, a veces sin pensar en las consecuencias.',
  Astuto: 'Siempre tres pasos adelante. Ve ángulos donde otros solo ven muros.',
  Compasivo: 'El sufrimiento ajeno le afecta genuinamente. Actúa desde el corazón.',
  Arrogante: 'Convencido de su superioridad, lo que le abre puertas... y enemistades.',
  Misterioso: 'Guarda sus cartas. Su pasado, sus motivos, sus lealtades: todo en duda.',
  Leal: 'Hasta el final. Su palabra dada es un pacto de sangre que nunca rompe.',
  Vengativo: 'Las deudas se pagan. No olvida, no perdona, solo espera su momento.',
  Ingenuo: 'Ve el bien en todos. Una inocencia que puede ser su mayor fortaleza o ruina.',
  Sabio: 'Ha vivido lo suficiente para saber cuándo hablar y cuándo callar.',
  Impulsivo: 'Actúa antes de pensar. Su instinto es veloz, sus remordimientos, lentos.',
  Reservado: 'Pocas palabras, mucha observación. Lo que no dice pesa más que lo que dice.',
  Temerario: 'El riesgo le atrae. Vive más en el filo que en la comodidad.',
}

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline gap-2 mb-2">
        <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{label}</label>
        {hint && <span className="text-[10px] text-gray-300 italic">{hint}</span>}
      </div>
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

export default function EditCharacterPage() {
  const { characterId } = useParams()
  const navigate = useNavigate()
  const { addToast } = useToast()

  const [loadingData, setLoadingData] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [personalityTags, setPersonalityTags] = useState<string[]>([])
  const [background, setBackground] = useState('')
  const [goals, setGoals] = useState<string[]>([''])

  useEffect(() => {
    getCharacterById(Number(characterId))
      .then(char => {
        setName(char.name)
        setRole(char.role)
        setPersonalityTags(char.personality ? char.personality.split(',').map(s => s.trim()).filter(Boolean) : [])
        setBackground(char.background)
        setGoals(char.goals.length ? char.goals : [''])
      })
      .catch(err => setError(err.message))
      .finally(() => setLoadingData(false))
  }, [characterId])

  const handleGoalChange = (idx: number, value: string) => {
    setGoals(goals.map((g, i) => (i === idx ? value : g)))
  }
  const addGoal = () => setGoals([...goals, ''])
  const removeGoal = (idx: number) => setGoals(goals.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      setError('Por favor selecciona un rol.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await updateCharacter(Number(characterId), {
        name,
        role,
        personality: personalityTags.join(', '),
        background,
        goals: goals.filter(g => g.trim()),
      })
      addToast('Personaje actualizado correctamente.', 'success')
      navigate(-1)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo actualizar el personaje.')
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
            <h2 className="text-2xl font-bold mb-1 text-gray-800 tracking-tight">Editar personaje</h2>
            <p className="text-sm text-gray-400 mb-7">Modifica los detalles del personaje.</p>

            {error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <FieldGroup label="Nombre">
                <input type="text" value={name} onChange={e => setName(e.target.value)} className={inputClass} required placeholder="Nombre del personaje..." />
              </FieldGroup>

              <SectionDivider label="Identidad" />

              <FieldGroup label="Rol">
                <PillSelect options={ROLE_OPTIONS} value={role} onChange={setRole} descriptions={ROLE_DESC} />
              </FieldGroup>

              <FieldGroup label="Personalidad" hint="selecciona los rasgos que lo definen">
                <MultiPillSelect options={PERSONALITY_OPTIONS} value={personalityTags} onChange={setPersonalityTags} descriptions={PERSONALITY_DESC} />
              </FieldGroup>

              <SectionDivider label="Historia" />

              <FieldGroup label="Trasfondo">
                <textarea value={background} onChange={e => setBackground(e.target.value)} className={textareaClass} required placeholder="Historia de vida, origen, eventos que lo marcaron..." />
              </FieldGroup>

              <div className="mb-7">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Objetivos</label>
                {goals.map((g, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <input type="text" value={g} onChange={e => handleGoalChange(idx, e.target.value)} className={inputClass} placeholder={`Objetivo #${idx + 1}`} />
                    {goals.length > 1 && (
                      <button type="button" onClick={() => removeGoal(idx)} className="text-gray-300 hover:text-red-400 font-bold px-2 transition text-lg">✕</button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addGoal} className="text-violet-500 hover:text-violet-700 text-xs font-semibold mt-1 transition">+ Añadir objetivo</button>
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

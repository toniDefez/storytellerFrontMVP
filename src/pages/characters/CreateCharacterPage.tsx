import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createCharacter, generateCharacter } from '../../services/api'
import type { Character } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'
import { PillSelect, MultiPillSelect } from '../../components/PillSelect'
import { FieldGroup } from '@/components/form/FieldGroup'
import { SectionDivider } from '@/components/form/SectionDivider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

const ROLE_OPTIONS = ['Guerrero', 'Mago', 'Picaro', 'Explorador', 'Sanador', 'Mercader', 'Noble', 'Sacerdote', 'Villano', 'Artesano']
const ROLE_DESC: Record<string, string> = {
  Guerrero: 'Forjado en batalla, experto en armas y estrategia de combate.',
  Mago: 'Domina las artes arcanas, estudiando fuerzas mas alla de lo mortal.',
  Picaro: 'Sombras como aliadas, habil en el engano, el robo y el sigilo.',
  Explorador: 'Cartografo de lo desconocido, superviviente nato en tierras ignotas.',
  Sanador: 'Canaliza el poder de la vida, alivia el sufrimiento y combate la muerte.',
  Mercader: 'El oro mueve el mundo. Sabe cuando comprar, vender... y traicionar.',
  Noble: 'Nacido entre privilegios, navega las intrigas de la corte como pez en el agua.',
  Sacerdote: 'Voz de su dios en el mundo mortal, arbitro de lo sagrado y lo profano.',
  Villano: 'Fuerzas oscuras lo impulsan. Sus motivos, aunque retorcidos, tienen logica.',
  Artesano: 'Crea con sus manos lo que otros solo suenan. Maestro de un oficio unico.',
}

const PERSONALITY_OPTIONS = ['Valiente', 'Astuto', 'Compasivo', 'Arrogante', 'Misterioso', 'Leal', 'Vengativo', 'Ingenuo', 'Sabio', 'Impulsivo', 'Reservado', 'Temerario']
const PERSONALITY_DESC: Record<string, string> = {
  Valiente: 'Enfrenta el miedo de frente, a veces sin pensar en las consecuencias.',
  Astuto: 'Siempre tres pasos adelante. Ve angulos donde otros solo ven muros.',
  Compasivo: 'El sufrimiento ajeno le afecta genuinamente. Actua desde el corazon.',
  Arrogante: 'Convencido de su superioridad, lo que le abre puertas... y enemistades.',
  Misterioso: 'Guarda sus cartas. Su pasado, sus motivos, sus lealtades: todo en duda.',
  Leal: 'Hasta el final. Su palabra dada es un pacto de sangre que nunca rompe.',
  Vengativo: 'Las deudas se pagan. No olvida, no perdona, solo espera su momento.',
  Ingenuo: 'Ve el bien en todos. Una inocencia que puede ser su mayor fortaleza o ruina.',
  Sabio: 'Ha vivido lo suficiente para saber cuando hablar y cuando callar.',
  Impulsivo: 'Actua antes de pensar. Su instinto es veloz, sus remordimientos, lentos.',
  Reservado: 'Pocas palabras, mucha observacion. Lo que no dice pesa mas que lo que dice.',
  Temerario: 'El riesgo le atrae. Vive mas en el filo que en la comodidad.',
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
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative bg-white shadow-xl shadow-violet-100/60 rounded-2xl border border-gray-100 overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />

          <div className="px-10 pt-8 pb-9">
            <h2 className="text-2xl font-bold mb-1 text-gray-800 tracking-tight">Crear personaje</h2>
            <p className="text-sm text-gray-400 mb-7">Da vida a quien habitara tu mundo.</p>

            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-8 w-fit">
              <button onClick={() => setMode('manual')} type="button" className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === 'manual' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Manual</button>
              <button onClick={() => setMode('ai')} type="button" className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${mode === 'ai' ? 'bg-white text-violet-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Generar con IA</button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {mode === 'manual' && (
              <form onSubmit={handleManualSubmit}>
                <FieldGroup label="Nombre">
                  <Input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full" required placeholder="El nombre del personaje..." />
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
                  <Textarea value={background} onChange={e => setBackground(e.target.value)} className="min-h-[90px] resize-none" required placeholder="Historia de vida, origen, eventos que lo marcaron..." />
                </FieldGroup>

                <div className="mb-7">
                  <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Objetivos</label>
                  {goals.map((g, idx) => (
                    <div key={idx} className="flex gap-2 mb-2">
                      <Input type="text" value={g} onChange={e => handleGoalChange(idx, e.target.value)} className="w-full" placeholder={`Objetivo #${idx + 1}`} />
                      {goals.length > 1 && (
                        <button type="button" onClick={() => removeGoal(idx)} className="text-gray-300 hover:text-red-400 font-bold px-2 transition text-lg">✕</button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addGoal} className="text-violet-500 hover:text-violet-700 text-xs font-semibold mt-1 transition">+ Anadir objetivo</button>
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando personaje...</> : 'Crear personaje'}
                </Button>
              </form>
            )}

            {mode === 'ai' && (
              <div>
                {installationChecked && !hasInstallation && <NoInstallationBanner />}
                <form onSubmit={handleAIGenerate}>
                  <FieldGroup label="Describe el personaje que quieres crear">
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[90px] resize-none" placeholder="Ej: Un guerrero noble con un pasado tragico y una lealtad inquebrantable..." required />
                  </FieldGroup>
                  <Button type="submit" size="lg" className="w-full mb-4" disabled={aiLoading || !hasInstallation}>
                    {aiLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando...</> : 'Generar personaje con IA'}
                  </Button>
                </form>

                {aiCharacter && (
                  <div className="mt-2 rounded-xl border border-violet-200 overflow-hidden">
                    <div className="px-5 py-3 bg-violet-600">
                      <h3 className="text-sm font-bold text-white">{aiCharacter.name}</h3>
                      <p className="text-xs text-violet-200">{aiCharacter.role}</p>
                    </div>
                    <div className="p-5 bg-violet-50 space-y-2">
                      {[
                        { label: 'Personalidad', value: aiCharacter.personality },
                        { label: 'Trasfondo', value: aiCharacter.background },
                        ...(aiCharacter.goals?.length ? [{ label: 'Objetivos', value: aiCharacter.goals.join(', ') }] : []),
                      ].map(({ label, value }) => (
                        <div key={label} className="flex gap-3 text-sm">
                          <span className="text-violet-400 font-semibold w-24 shrink-0">{label}</span>
                          <span className="text-gray-700">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="px-5 py-3 bg-white border-t border-violet-100">
                      <Button size="lg" className="w-full" onClick={handleAISave} disabled={loading}>
                        {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar este personaje'}
                      </Button>
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

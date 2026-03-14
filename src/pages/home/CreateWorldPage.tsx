import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createWorld, generateWorld } from '../../services/api'
import type { World } from '../../services/api'
import { useInstallation } from '../../hooks/useInstallation'
import NoInstallationBanner from '../../components/NoInstallationBanner'
import { PillSelect } from '../../components/PillSelect'
import { FieldGroup } from '@/components/form/FieldGroup'
import { SectionDivider } from '@/components/form/SectionDivider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'

const ERA_OPTIONS = ['Medieval', 'Antigua', 'Futurista', 'Moderna', 'Fantastica', 'Post-apocaliptica', 'Victoriana', 'Espacial']
const ERA_DESC: Record<string, string> = {
  Medieval: 'Caballeros, castillos y gremios. La era de la espada y la fe.',
  Antigua: 'Imperios de piedra, dioses caprichosos y civilizaciones en auge.',
  Futurista: 'Tecnologia avanzada, corporaciones omnipotentes y mundos interconectados.',
  Moderna: 'El mundo tal y como lo conocemos, con sus luces y sombras.',
  Fantastica: 'Magia entretejida en la realidad, criaturas miticas y reinos imposibles.',
  'Post-apocaliptica': 'Las ruinas del ayer como escenario. Supervivencia y renacimiento.',
  Victoriana: 'Vapor, engranajes y una sociedad en plena efervescencia industrial.',
  Espacial: 'La inmensidad del cosmos como lienzo. Naves, alienigenas y lo desconocido.',
}

const CLIMATE_OPTIONS = ['Templado', 'Artico', 'Tropical', 'Desertico', 'Volcanico', 'Oceanico', 'Montanoso', 'Toxico']
const CLIMATE_DESC: Record<string, string> = {
  Templado: 'Cuatro estaciones bien definidas, lluvias moderadas y abundante vegetacion.',
  Artico: 'Hielo eterno, ventiscas demoledoras y noches que duran meses.',
  Tropical: 'Calor humedo, selvas densas y vida desbordante en cada rincon.',
  Desertico: 'Arenas infinitas, sol implacable y oasis como tesoros preciados.',
  Volcanico: 'Tierra viva, erupciones constantes y paisajes de fuego y ceniza.',
  Oceanico: 'Dominado por el mar, con islas dispersas y tormentas legendarias.',
  Montanoso: 'Cimas nevadas, valles profundos y rutas de paso que marcan el destino.',
  Toxico: 'Atmosfera venenosa, mutaciones y ecosistemas retorcidos por el caos.',
}

const POLITICS_OPTIONS = ['Monarquia', 'Imperio', 'Republica', 'Teocracia', 'Anarquia', 'Oligarquia', 'Tribu', 'Dictadura']
const POLITICS_DESC: Record<string, string> = {
  Monarquia: 'Un linaje gobierna por sangre. La corona es ley y la nobleza, su sombra eterna.',
  Imperio: 'Un poder central domina vastos territorios con mano de hierro y ejercitos leales.',
  Republica: 'Representantes elegidos deliberan el futuro de la nacion en nombre del pueblo.',
  Teocracia: 'Los dioses gobiernan a traves de sus sacerdotes. La fe es la constitucion.',
  Anarquia: 'Sin autoridad central. Comunidades autonomas y pactos fragiles entre facciones.',
  Oligarquia: 'Un grupo selecto de familias o gremios controla el poder real desde las sombras.',
  Tribu: 'Clanes y linajes donde la tradicion oral y los ancianos dictan el camino.',
  Dictadura: 'Un solo lider concentra todo el poder. Lealtad o destierro, no hay termino medio.',
}

export default function CreateWorldPage() {
  const [, setMode] = useState<'manual' | 'ai'>('manual')
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
      setError('Por favor selecciona era, clima y sistema politico.')
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
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-2xl mx-auto">
        <PageBreadcrumb items={[{label: 'Mundos', href: '/worlds'}, {label: 'Crear mundo'}]} />
        <Card className="overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
          <CardHeader>
            <CardTitle>Crear nuevo mundo</CardTitle>
            <CardDescription>Define el escenario donde tu historia tomara vida.</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="manual" onValueChange={v => setMode(v as 'manual' | 'ai')}>
              <TabsList className="mb-6">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="ai">Generar con IA</TabsTrigger>
              </TabsList>

              <TabsContent value="manual">
                <form onSubmit={handleManualSubmit}>
                  <FieldGroup label="Nombre del mundo">
                    <Input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full" required placeholder="Ej: Aethermoor, El Vacio Dorado..." />
                  </FieldGroup>

                  <SectionDivider label="Ambientacion" />

                  <FieldGroup label="Era">
                    <PillSelect options={ERA_OPTIONS} value={era} onChange={setEra} descriptions={ERA_DESC} />
                  </FieldGroup>

                  <FieldGroup label="Clima">
                    <PillSelect options={CLIMATE_OPTIONS} value={climate} onChange={setClimate} descriptions={CLIMATE_DESC} />
                  </FieldGroup>

                  <FieldGroup label="Sistema politico">
                    <PillSelect options={POLITICS_OPTIONS} value={politics} onChange={setPolitics} descriptions={POLITICS_DESC} />
                  </FieldGroup>

                  <SectionDivider label="Identidad" />

                  <FieldGroup label="Cultura">
                    <Input type="text" value={culture} onChange={e => setCulture(e.target.value)} className="w-full" required placeholder="Ej: Guerrera y honorable, mercantil y cosmopolita..." />
                  </FieldGroup>

                  <FieldGroup label="Descripcion">
                    <Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[90px] resize-none" required placeholder="Describe brevemente la esencia de tu mundo..." />
                  </FieldGroup>

                  <div className="mb-7">
                    <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Facciones</label>
                    {factions.map((f, idx) => (
                      <div key={idx} className="flex gap-2 mb-2">
                        <Input type="text" value={f} onChange={e => handleFactionChange(idx, e.target.value)} className="w-full" placeholder={`Faccion #${idx + 1}`} />
                        {factions.length > 1 && (
                          <button type="button" onClick={() => removeFaction(idx)} className="text-gray-300 hover:text-red-400 font-bold px-2 transition text-lg">✕</button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addFaction} className="text-violet-500 hover:text-violet-700 text-xs font-semibold mt-1 transition">+ Anadir faccion</button>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando mundo...</> : 'Crear mundo'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="ai">
                <div>
                  {installationChecked && !hasInstallation && <NoInstallationBanner />}
                  <form onSubmit={handleAIGenerate}>
                    <FieldGroup label="Describe el mundo que quieres crear">
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[90px] resize-none" placeholder="Ej: Un mundo toxico postapocaliptico donde las ciudades flotan sobre nubes de veneno..." required />
                    </FieldGroup>
                    <Button type="submit" size="lg" className="w-full mb-4" disabled={aiLoading || !hasInstallation}>
                      {aiLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando...</> : 'Generar mundo con IA'}
                    </Button>
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
                          { label: 'Politica', value: aiWorld.politics },
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
                        <Button size="lg" className="w-full" onClick={handleAISubmit} disabled={loading}>
                          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar este mundo'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

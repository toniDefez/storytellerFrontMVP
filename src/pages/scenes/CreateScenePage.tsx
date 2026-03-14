import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createScene, generateScene } from '../../services/api'
import type { Scene } from '../../services/api'
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

const TIME_OPTIONS = ['Amanecer', 'Manana', 'Mediodia', 'Tarde', 'Anochecer', 'Noche', 'Medianoche']
const TIME_DESC: Record<string, string> = {
  Amanecer: 'La primera luz rompe la oscuridad. El momento de las promesas y los nuevos comienzos.',
  Manana: 'El dia en plena actividad, el mundo despierto, el bullicio en marcha.',
  Mediodia: 'Sol en lo alto, calor y el momento de maxima claridad y exposicion.',
  Tarde: 'Las sombras se alargan, el ritmo baja y las confidencias empiezan a emerger.',
  Anochecer: 'El crepusculo tine el cielo. La frontera entre el dia y la noche.',
  Noche: 'Oscuridad y misterio. La ciudad cambia de cara cuando caen las estrellas.',
  Medianoche: 'La hora mas profunda. Secretos, rituales y lo que nadie deberia ver.',
}

const TONE_OPTIONS = ['Epico', 'Misterioso', 'Sombrio', 'Romantico', 'Tenso', 'Comico', 'Tragico', 'Pacifico', 'Ominoso', 'Intimo']
const TONE_DESC: Record<string, string> = {
  Epico: 'Gestas legendarias, sacrificios heroicos y el peso del destino en cada accion.',
  Misterioso: 'Preguntas sin respuesta, sombras entre lineas y una tension que no cesa.',
  Sombrio: 'La oscuridad tiene protagonismo. Perdida, duda y una atmosfera opresiva.',
  Romantico: 'El corazon guia las acciones. Pasion, deseo y vinculos que trascienden.',
  Tenso: 'Cada palabra importa. El peligro acecha y cualquier error tiene consecuencias.',
  Comico: 'La ligereza como arma. Humor, ironia y momentos que alivian la carga.',
  Tragico: 'El final ya esta escrito. La belleza inevitable de lo que no tiene remedio.',
  Pacifico: 'Sin conflicto aparente. Espacio para el detalle, la contemplacion y el respiro.',
  Ominoso: 'Algo malo se aproxima. Una amenaza latente que impregna cada momento.',
  Intimo: 'A puerta cerrada, los personajes se revelan. Vulnerabilidad y conexion real.',
}

export default function CreateScenePage() {
  const { id: worldId } = useParams()
  const navigate = useNavigate()
  const [, setMode] = useState<'manual' | 'ai'>('manual')

  const [title, setTitle] = useState('')
  const [location, setLocation] = useState('')
  const [time, setTime] = useState('')
  const [tone, setTone] = useState('')
  const [context, setContext] = useState('')
  const [description, setDescription] = useState('')

  const [aiLoading, setAiLoading] = useState(false)
  const [aiScene, setAiScene] = useState<Scene | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { hasInstallation, checked: installationChecked } = useInstallation()

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!time || !tone) {
      setError('Por favor selecciona el momento del dia y el tono de la escena.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await createScene({ title, location, time, tone, context, world_id: Number(worldId) })
      navigate(`/worlds/${worldId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la escena.')
    } finally {
      setLoading(false)
    }
  }

  const handleAIGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAiLoading(true)
    setError('')
    setAiScene(null)
    try {
      const scene = await generateScene(Number(worldId), description)
      setAiScene(scene)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo generar la escena.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAISave = async () => {
    if (!aiScene) return
    setLoading(true)
    setError('')
    try {
      await createScene({
        title: aiScene.title || 'Escena generada',
        location: aiScene.location || '',
        time: aiScene.time || '',
        tone: aiScene.tone || '',
        context: aiScene.context || '',
        world_id: Number(worldId),
      })
      navigate(`/worlds/${worldId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar la escena.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-2xl mx-auto">
        <PageBreadcrumb items={[{label: 'Mundos', href: '/worlds'}, {label: 'Mundo', href: '/worlds/' + worldId}, {label: 'Crear escena'}]} />
        <Card className="overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
          <CardHeader>
            <CardTitle>Crear escena</CardTitle>
            <CardDescription>Define el momento que impulsara la narrativa.</CardDescription>
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
                  <FieldGroup label="Titulo">
                    <Input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full" required placeholder="El titulo de la escena..." />
                  </FieldGroup>

                  <FieldGroup label="Ubicacion">
                    <Input type="text" value={location} onChange={e => setLocation(e.target.value)} className="w-full" required placeholder="Ej: Taberna del puerto, Bosque encantado, Castillo en ruinas..." />
                  </FieldGroup>

                  <SectionDivider label="Atmosfera" />

                  <FieldGroup label="Momento del dia">
                    <PillSelect options={TIME_OPTIONS} value={time} onChange={setTime} descriptions={TIME_DESC} />
                  </FieldGroup>

                  <FieldGroup label="Tono">
                    <PillSelect options={TONE_OPTIONS} value={tone} onChange={setTone} descriptions={TONE_DESC} />
                  </FieldGroup>

                  <SectionDivider label="Narrativa" />

                  <FieldGroup label="Contexto">
                    <Textarea value={context} onChange={e => setContext(e.target.value)} className="min-h-[90px] resize-none" required placeholder="Describe que esta pasando en esta escena..." />
                  </FieldGroup>

                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creando escena...</> : 'Crear escena'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="ai">
                <div>
                  {installationChecked && !hasInstallation && <NoInstallationBanner />}
                  <form onSubmit={handleAIGenerate}>
                    <FieldGroup label="Describe la escena que quieres crear">
                      <Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[90px] resize-none" placeholder="Ej: Una noche lluviosa en un callejon oscuro donde dos viejos rivales se encuentran..." required />
                    </FieldGroup>
                    <Button type="submit" size="lg" className="w-full mb-4" disabled={aiLoading || !hasInstallation}>
                      {aiLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando...</> : 'Generar escena con IA'}
                    </Button>
                  </form>

                  {aiScene && (
                    <div className="mt-2 rounded-xl border border-violet-200 overflow-hidden">
                      <div className="px-5 py-3 bg-violet-600">
                        <h3 className="text-sm font-bold text-white">{aiScene.title}</h3>
                        <p className="text-xs text-violet-200">{aiScene.location} · {aiScene.time}</p>
                      </div>
                      <div className="p-5 bg-violet-50 space-y-2">
                        {[
                          { label: 'Tono', value: aiScene.tone },
                          { label: 'Contexto', value: aiScene.context },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex gap-3 text-sm">
                            <span className="text-violet-400 font-semibold w-20 shrink-0">{label}</span>
                            <span className="text-gray-700">{value}</span>
                          </div>
                        ))}
                      </div>
                      <div className="px-5 py-3 bg-white border-t border-violet-100">
                        <Button size="lg" className="w-full" onClick={handleAISave} disabled={loading}>
                          {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</> : 'Guardar esta escena'}
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

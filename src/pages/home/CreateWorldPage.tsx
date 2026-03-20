import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, Sparkles, Globe, ArrowLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { WorldGraph } from '@/components/world-graph/WorldGraph'
import type { GraphData } from '@/components/world-graph/WorldGraph'
import {
  generateWorldGraph,
  expandGraphNode,
  graphChat,
  createWorldFromGraph,
  type WorldGraphData,
} from '@/services/api'
import type { Node, Edge } from '@xyflow/react'
import type { ConceptNodeData } from '@/components/world-graph/forceLayout'

type Step = 'phrase' | 'graph'

export default function CreateWorldPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [step, setStep] = useState<Step>('phrase')
  const [phrase, setPhrase] = useState('')
  const [graph, setGraph] = useState<GraphData | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = `Crear Mundo — StoryTeller`
  }, [i18n.language])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!phrase.trim()) return
    setGenerating(true)
    setError('')
    try {
      const data = await generateWorldGraph(phrase.trim())
      setGraph(data)
      setStep('graph')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando el grafo')
    } finally {
      setGenerating(false)
    }
  }

  const handleExpandNode = async (nodeId: string, nodeLabel: string) => {
    if (!graph) return graph!
    const current: WorldGraphData = { nodes: graph.nodes, edges: graph.edges }
    return expandGraphNode(nodeId, nodeLabel, current)
  }

  const handleChat = async (message: string, currentGraph: GraphData) => {
    const current: WorldGraphData = { nodes: currentGraph.nodes, edges: currentGraph.edges }
    return graphChat(message, current)
  }

  const handleSave = async (nodes: Node<ConceptNodeData>[], edges: Edge[]) => {
    setSaving(true)
    setError('')
    try {
      const graphData: WorldGraphData = {
        nodes: nodes.map(n => ({
          id: n.id,
          label: n.data.label,
          domain: n.data.domain,
          description: n.data.description,
        })),
        edges: edges.map(e => ({
          source: e.source,
          target: e.target,
          label: e.label as string | undefined,
        })),
      }
      const { id } = await createWorldFromGraph(graphData)
      navigate(`/worlds/${id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error guardando el mundo')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[80vh] py-4 px-4">
      <div className="w-full max-w-5xl mx-auto">
        <PageBreadcrumb items={[
          { label: t('nav.worlds'), href: '/worlds' },
          { label: t('world.create.title') },
        ]} />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 'phrase' && (
          <Card className="overflow-hidden max-w-2xl mx-auto">
            <CardHeader className="border-b border-border/50 bg-accent/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-[var(--font-display)]">{t('world.create.title')}</CardTitle>
                  <CardDescription>Una frase que la IA convierte en un grafo de conceptos interactivo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleGenerate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Describe tu mundo en una frase
                  </label>
                  <Textarea
                    value={phrase}
                    onChange={e => setPhrase(e.target.value)}
                    className="min-h-[90px] resize-none text-base"
                    placeholder="Ej: Un mundo árido donde el agua es sagrada y las facciones guerrean por los últimos oasis..."
                    required
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    La IA generará un grafo de conceptos (geografía, biología, sociedad) que puedes explorar y editar.
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {[
                    'Un archipiélago volcánico donde los espíritus del fuego gobiernan y los humanos son sus sacerdotes',
                    'Una megaciudad subterránea que huyó de la superficie hace siglos y olvidó cómo es el sol',
                    'Un mundo de islas flotantes donde la gravedad es caprichosa y los nómadas aéreos controlan el comercio',
                  ].map(example => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => setPhrase(example)}
                      className="text-left text-[11px] text-muted-foreground bg-accent/50 hover:bg-accent rounded-lg p-2.5 transition-colors leading-relaxed"
                    >
                      {example}
                    </button>
                  ))}
                </div>

                <Button type="submit" size="lg" className="w-full" disabled={generating || !phrase.trim()}>
                  {generating
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generando grafo...</>
                    : <><Sparkles className="mr-2 h-4 w-4" />Generar grafo conceptual</>
                  }
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'graph' && graph && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('phrase')}
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Cambiar frase
              </button>
              <p className="text-xs text-muted-foreground italic max-w-md text-right">
                "{phrase}"
              </p>
            </div>

            <div className="rounded-xl border border-border/50 p-1 bg-background shadow-sm">
              <div className="flex items-center gap-3 px-3 py-2 border-b border-border/40 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-[11px] text-muted-foreground">Físico</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span className="text-[11px] text-muted-foreground">Biológico</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  <span className="text-[11px] text-muted-foreground">Social</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-[11px] text-muted-foreground">Core</span>
                </div>
              </div>

              <WorldGraph
                initialGraph={graph}
                onSave={handleSave}
                onExpandNode={handleExpandNode}
                onChat={handleChat}
              />
            </div>

            {saving && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando mundo...
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

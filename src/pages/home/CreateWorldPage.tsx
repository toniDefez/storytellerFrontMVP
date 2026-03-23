import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, Globe, Server } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { TensionSelector } from '@/components/world-graph/TensionSelector'
import { PremiseBar } from '@/components/world-graph/PremiseBar'
import { CausalTreeCanvas } from '@/components/world-graph/CausalTreeCanvas'
import { GhostCandidates } from '@/components/world-graph/GhostCandidates'
import { useWorldGraph } from '@/hooks/useWorldGraph'
import { useInstallation } from '@/hooks/useInstallation'
import {
  createWorld,
  interpretTensions,
  generateRoot,
  suggestPremises,
  type TensionOption,
  type WorldNode,
} from '@/services/api'
import type { NodeFormInput } from '@/components/world-graph/NodeFormDialog'

type Step = 'premise' | 'tension' | 'canvas'

export default function CreateWorldPage() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { hasInstallation, loading: installLoading, checked } = useInstallation()
  const graph = useWorldGraph()

  const [step, setStep] = useState<Step>('premise')
  const [name, setName] = useState('')
  const [premise, setPremise] = useState('')
  const [worldId, setWorldId] = useState<number | null>(null)
  const [tensionOptions, setTensionOptions] = useState<TensionOption[]>([])
  const [loadingTensions, setLoadingTensions] = useState(false)
  const [loadingRoot, setLoadingRoot] = useState(false)
  const [isExpanding, setIsExpanding] = useState(false)
  const [pageError, setPageError] = useState('')
  const FALLBACK_PREMISES = [
    'Un archipiélago volcánico donde los espíritus del fuego gobiernan y los humanos son sus sacerdotes',
    'Una megaciudad subterránea que huyó de la superficie hace siglos y olvidó cómo es el sol',
  ]
  const [premiseSuggestions, setPremiseSuggestions] = useState<string[]>(FALLBACK_PREMISES)
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  useEffect(() => {
    document.title = `Crear Mundo — StoryTeller`
  }, [i18n.language])

  useEffect(() => {
    if (!hasInstallation || installLoading) return
    setLoadingSuggestions(true)
    suggestPremises()
      .then(r => {
        const premises = r.premises ?? []
        setPremiseSuggestions(premises.length > 0 ? premises : FALLBACK_PREMISES)
      })
      .catch(() => setPremiseSuggestions(FALLBACK_PREMISES))
      .finally(() => setLoadingSuggestions(false))
  }, [hasInstallation, installLoading])

  const handlePremiseSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !premise.trim()) return
    setPageError('')
    setLoadingTensions(true)
    try {
      const { id } = await createWorld(name.trim(), premise.trim(), '')
      setWorldId(id)
      if (hasInstallation) {
        const result = await interpretTensions(premise.trim())
        setTensionOptions(result.options ?? [])
      }
      setStep('tension')
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Error')
    } finally {
      setLoadingTensions(false)
    }
  }

  const handleTensionSelect = async (tension: TensionOption) => {
    if (!worldId) return
    setPageError('')
    setLoadingRoot(true)
    try {
      await generateRoot(worldId, tension.label)
      await graph.loadGraph(worldId)
      setStep('canvas')
    } catch (err) {
      setPageError(err instanceof Error ? err.message : 'Error generando raíz')
    } finally {
      setLoadingRoot(false)
    }
  }

  const handleSkipTension = () => {
    if (worldId) {
      graph.loadGraph(worldId)
      setStep('canvas')
    }
  }

  const handleAddNode = useCallback(async (input: NodeFormInput, parentNode: WorldNode | null) => {
    if (!worldId) return
    await graph.addNodeManually(worldId, {
      parentId: parentNode?.id,
      parentEdgeType: input.parentEdgeType,
      domain: input.domain,
      role: input.role,
      label: input.label,
      description: input.description,
      causalSummary: input.description,
    })
  }, [worldId, graph])

  const handleUpdateNode = useCallback(async (input: NodeFormInput, nodeId: number) => {
    if (!worldId) return
    await graph.updateNodeManually(worldId, nodeId, {
      label: input.label,
      domain: input.domain,
      role: input.role,
      description: input.description,
    })
  }, [worldId, graph])

  const handleExpand = async () => {
    if (!worldId || !graph.selectedNode) return
    setIsExpanding(true)
    try {
      await graph.expandNode(worldId, graph.selectedNode.id)
    } finally {
      setIsExpanding(false)
    }
  }

  const handleFinish = () => {
    if (worldId) navigate(`/worlds/${worldId}`)
  }

  if (installLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (checked && !hasInstallation && step === 'premise') {
    return (
      <div className="flex justify-center items-start min-h-[80vh] py-4">
        <div className="w-full max-w-xl mx-auto mt-16 px-4">
          <Card>
            <CardContent className="pt-8 pb-8 text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Server className="h-7 w-7 text-primary" />
                </div>
              </div>
              <h2 className="text-xl font-bold">{t('installation.guardTitle')}</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">{t('installation.guardDesc')}</p>
              <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
                <Button onClick={() => navigate('/settings?tab=installation')}>
                  {t('installation.guardGoSettings')}
                </Button>
                <Button variant="ghost" onClick={() => navigate('/worlds')}>
                  {t('installation.guardGoBack')}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Full-screen canvas mode — breaks out of MainLayout padding
  if (step === 'canvas') {
    return (
      <div className="-mx-6 md:-mx-8 -mt-6 md:-mt-8 flex flex-col" style={{ height: '100vh' }}>
        <div className="px-6 md:px-8 pt-4 shrink-0">
          <PageBreadcrumb items={[
            { label: t('nav.worlds'), href: '/worlds' },
            { label: t('world.create.title') },
          ]} />
          {(pageError || graph.error) && (
            <Alert variant="destructive" className="mb-2">
              <AlertDescription>{pageError || graph.error}</AlertDescription>
            </Alert>
          )}
        </div>
        <div className="flex-1 min-h-0 flex flex-col">
          <PremiseBar premise={premise} />
          <div className="flex-1 relative min-h-0">
            <CausalTreeCanvas
              nodes={graph.nodes}
              worldId={worldId}
              selectedNode={graph.selectedNode}
              onSelectNode={graph.selectNode}
              onAddNode={handleAddNode}
              onUpdateNode={handleUpdateNode}
              isExpanding={isExpanding}
              chatHistory={graph.chatHistory}
              chatLoading={graph.chatLoading}
              onSendMessage={(text) => graph.sendChatMessage(worldId!, text)}
              onExpand={handleExpand}
              onDeleteSubtree={() => graph.removeSubtree(worldId!, graph.selectedNode!.id)}
              onDeleteConfirmed={() => graph.deleteConfirmed(worldId!, graph.selectedNode!.id)}
            />
            {graph.ghostCandidates.length > 0 && graph.ghostParentId && (
              <GhostCandidates
                candidates={graph.ghostCandidates}
                parentLabel={graph.nodes.find(n => n.id === graph.ghostParentId)?.label ?? ''}
                onConfirm={c => graph.confirmCandidate(worldId!, graph.ghostParentId!, c)}
                onDismiss={graph.dismissGhosts}
              />
            )}
          </div>
        </div>
        <div className="shrink-0 px-6 md:px-8 py-3 flex justify-end border-t border-border/30 bg-background">
          <Button onClick={handleFinish} disabled={graph.nodes.length === 0}>
            Ir al mundo →
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[80vh] py-4 px-4">
      <div className="w-full max-w-5xl mx-auto">
        <PageBreadcrumb items={[
          { label: t('nav.worlds'), href: '/worlds' },
          { label: t('world.create.title') },
        ]} />

        {(pageError || graph.error) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{pageError || graph.error}</AlertDescription>
          </Alert>
        )}

        {step === 'premise' && (
          <Card className="overflow-hidden max-w-2xl mx-auto">
            <CardHeader className="border-b border-border/50 bg-accent/30">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="w-4.5 h-4.5 text-primary" />
                </div>
                <div>
                  <CardTitle className="font-[var(--font-display)]">{t('world.create.title')}</CardTitle>
                  <CardDescription>Una frase que define el corazón de tu mundo</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handlePremiseSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    Nombre del mundo
                  </label>
                  <Input
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Ej: Arrakis, La Tierra Media, Westeros..."
                    required
                    autoFocus
                    maxLength={100}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    La premisa de tu mundo
                  </label>
                  <Textarea
                    value={premise}
                    onChange={e => setPremise(e.target.value)}
                    className="min-h-[90px] resize-none text-base"
                    placeholder="Ej: Es un desierto y hay gusanos gigantes que producen una especia alucinógena..."
                    required
                  />
                </div>

                {loadingSuggestions ? (
                  <div className="flex items-center gap-2 pt-1 text-[11px] text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Generando ideas...
                  </div>
                ) : premiseSuggestions.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {premiseSuggestions.map(example => (
                      <button
                        key={example}
                        type="button"
                        onClick={() => setPremise(example)}
                        className="text-left text-[11px] text-muted-foreground bg-accent/50 hover:bg-accent rounded-lg p-2.5 transition-colors leading-relaxed"
                      >
                        {example}
                      </button>
                    ))}
                  </div>
                ) : null}

                <Button type="submit" size="lg" className="w-full" disabled={loadingTensions || !name.trim() || !premise.trim()}>
                  {loadingTensions
                    ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Analizando premisa...</>
                    : 'Continuar →'
                  }
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === 'tension' && (
          <div className="max-w-2xl mx-auto space-y-4">
            <PremiseBar premise={premise} />
            <TensionSelector
              options={tensionOptions}
              loading={loadingRoot}
              onSelect={handleTensionSelect}
            />
            <div className="text-center">
              <button
                onClick={handleSkipTension}
                className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
              >
                Saltar y empezar sin IA
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

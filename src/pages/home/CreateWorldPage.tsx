import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, Globe, Server, Wand2, Sparkles, Feather } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { TensionSelector } from '@/components/world-graph/TensionSelector'
import { PremiseBar } from '@/components/world-graph/PremiseBar'
import { CausalTreeCanvas } from '@/components/world-graph/CausalTreeCanvas'
import { GhostCandidates } from '@/components/world-graph/GhostCandidates'
import type { NodeFormInput } from '@/components/world-graph/NodeFormDialog'
import type { WorldNode } from '@/services/api'
import { useWorldGraph } from '@/hooks/useWorldGraph'
import { useInstallation } from '@/hooks/useInstallation'
import {
  createWorld,
  interpretTensions,
  generateRoot,
  refinePremise,
  suggestPremises,
  type TensionOption,
} from '@/services/api'

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
  const [refining, setRefining] = useState(false)
  const [suggesting, setSuggesting] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  useEffect(() => {
    document.title = `Crear Mundo — StoryTeller`
  }, [i18n.language])

  const handleSuggest = async () => {
    setSuggesting(true)
    setSuggestions([])
    try {
      const result = await suggestPremises()
      setSuggestions(result.premises ?? [])
    } catch {
      // silently fail
    } finally {
      setSuggesting(false)
    }
  }

  const handleRefine = async () => {
    if (!premise.trim()) return
    setRefining(true)
    try {
      const result = await refinePremise(premise.trim())
      if (result.premise) {
        setPremise(result.premise)
      }
    } catch {
      // silently fail — refinement is optional
    } finally {
      setRefining(false)
    }
  }

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
          <div className="flex flex-1 min-h-0">
            <div className="flex-1 relative min-w-0">
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
        </div>
        <div className="shrink-0 px-6 md:px-8 py-3 flex justify-end border-t border-border/30 bg-background">
          <Button onClick={handleFinish} disabled={graph.nodes.length === 0}>
            Ir al mundo →
          </Button>
        </div>
      </div>
    )
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

  return (
    <div className="flex flex-col min-h-[80vh] px-4">
      <div className="w-full max-w-5xl mx-auto">
        <PageBreadcrumb items={[
          { label: t('nav.worlds'), href: '/worlds' },
          { label: t('world.create.title') },
        ]} />

        {(pageError || graph.error) && (
          <Alert variant="destructive" className="mb-4 max-w-2xl mx-auto">
            <AlertDescription>{pageError || graph.error}</AlertDescription>
          </Alert>
        )}

        {step === 'premise' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="max-w-[640px] mx-auto pt-6 md:pt-12"
          >
            {/* ── Header: literary opening, not a card header ── */}
            <div className="text-center mb-10 md:mb-14">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-5"
                style={{ backgroundColor: 'hsl(260 35% 93%)', border: '1px solid hsl(260 30% 86%)' }}>
                <Feather className="w-5 h-5" style={{ color: 'hsl(260 38% 40%)' }} />
              </div>
              <h1
                className="text-[2rem] md:text-[2.5rem] leading-[1.15] font-light tracking-[-0.01em] text-foreground mb-3"
                style={{ fontFamily: 'var(--font-display)' }}
              >
                Todo mundo comienza<br />
                con una premisa
              </h1>
              <p
                className="text-[0.95rem] leading-relaxed max-w-sm mx-auto"
                style={{ color: 'hsl(30 6% 47%)', fontFamily: 'var(--font-body)' }}
              >
                Una frase que contiene la semilla de todo lo que vendrá.
              </p>
            </div>

            <form onSubmit={handlePremiseSubmit}>
              {/* ── Name: borderless serif input, feels like writing a title ── */}
              <div className="mb-8">
                <label
                  className="block text-[10px] tracking-[0.2em] uppercase mb-2.5"
                  style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 30% 58%)' }}
                >
                  Nombre del mundo
                </label>
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Arrakis, La Tierra Media, Westeros..."
                  required
                  autoFocus
                  maxLength={100}
                  className="w-full bg-transparent border-none outline-none text-[1.5rem] md:text-[1.75rem] font-light tracking-[-0.01em] text-foreground placeholder:text-muted-foreground/40 pb-3"
                  style={{
                    fontFamily: 'var(--font-display)',
                    borderBottom: '1px solid hsl(260 30% 86%)',
                  }}
                />
              </div>

              {/* ── Premise: manuscript writing surface ── */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <label
                    className="text-[10px] tracking-[0.2em] uppercase"
                    style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 30% 58%)' }}
                  >
                    La premisa
                  </label>
                  {premise.trim() ? (
                    <motion.button
                      type="button"
                      onClick={handleRefine}
                      disabled={refining}
                      className="flex items-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer"
                      style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 38% 40%)' }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {refining ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="italic" style={{ fontFamily: 'var(--font-display)', color: 'hsl(260 30% 58%)' }}>
                            enriqueciendo...
                          </span>
                        </>
                      ) : (
                        <>
                          <Wand2 className="h-3.5 w-3.5" />
                          <span>Enriquecer</span>
                        </>
                      )}
                    </motion.button>
                  ) : (
                    <motion.button
                      type="button"
                      onClick={handleSuggest}
                      disabled={suggesting}
                      className="flex items-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer"
                      style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 38% 40%)' }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {suggesting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span className="italic" style={{ fontFamily: 'var(--font-display)', color: 'hsl(260 30% 58%)' }}>
                            buscando inspiración...
                          </span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3.5 w-3.5" />
                          <span>Sugerir ideas</span>
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
                <textarea
                  value={premise}
                  onChange={e => setPremise(e.target.value)}
                  className="w-full resize-none outline-none text-[1.05rem] leading-[1.8] placeholder:text-muted-foreground/35 min-h-[160px]"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 300,
                    color: 'hsl(30 8% 20%)',
                    background: 'transparent',
                    borderBottom: '1px solid hsl(260 30% 86%)',
                    paddingBottom: '1rem',
                    /* Ruled-paper line pattern */
                    backgroundImage: 'repeating-linear-gradient(transparent, transparent 1.78rem, hsl(260 20% 90% / 0.4) 1.78rem, hsl(260 20% 90% / 0.4) calc(1.78rem + 1px))',
                    backgroundPosition: '0 0.15rem',
                  }}
                  placeholder="Un desierto donde gusanos gigantes producen una especia que expande la conciencia, y las grandes casas luchan por controlarla..."
                  required
                />
              </div>

              {/* ── Suggestions: whispered possibilities ── */}
              <AnimatePresence>
                {suggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.3 }}
                    className="mb-8"
                  >
                    <p
                      className="text-[10px] tracking-[0.15em] uppercase mb-3"
                      style={{ fontFamily: 'var(--font-ui)', color: 'hsl(260 30% 58%)' }}
                    >
                      Elige una, o deja que te inspire
                    </p>
                    <div className="flex flex-col gap-2">
                      {suggestions.map((s, i) => (
                        <motion.button
                          key={i}
                          type="button"
                          onClick={() => { setPremise(s); setSuggestions([]) }}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.08, duration: 0.3 }}
                          className="group text-left rounded-lg px-4 py-3 transition-all duration-200 cursor-pointer"
                          style={{
                            fontFamily: 'var(--font-display)',
                            fontStyle: 'italic',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            color: 'hsl(30 8% 35%)',
                            backgroundColor: 'hsl(260 25% 96%)',
                            border: '1px solid hsl(260 20% 90%)',
                          }}
                          whileHover={{
                            backgroundColor: 'hsl(260 30% 94%)',
                            borderColor: 'hsl(260 30% 82%)',
                            x: 4,
                          }}
                        >
                          <span className="block">{s}</span>
                          <span
                            className="block mt-1 text-[10px] tracking-[0.1em] uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                            style={{ fontFamily: 'var(--font-ui)', fontStyle: 'normal', color: 'hsl(260 38% 40%)' }}
                          >
                            Usar esta premisa
                          </span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── Submit: confident but warm ── */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-[0.9rem] tracking-[0.03em]"
                  style={{ fontFamily: 'var(--font-ui)' }}
                  disabled={loadingTensions || !name.trim() || !premise.trim()}
                >
                  {loadingTensions ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span className="italic" style={{ fontFamily: 'var(--font-display)' }}>
                        Analizando tu premisa...
                      </span>
                    </>
                  ) : (
                    'Continuar'
                  )}
                </Button>
                <p
                  className="text-center mt-3 text-[11px]"
                  style={{ color: 'hsl(30 6% 60%)' }}
                >
                  Después elegirás la tensión central de tu mundo
                </p>
              </div>
            </form>
          </motion.div>
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

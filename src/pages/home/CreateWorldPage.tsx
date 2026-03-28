import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, Globe, Sparkles, Wand2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { generateWorld, getJobStatus, suggestPremises, refinePremise } from '@/services/api'

const LOADING_MESSAGES = [
  'Interpretando la premisa...',
  'Generando el nodo raíz...',
  'Expandiendo el grafo causal...',
  'Sintetizando el mundo...',
]

const POLL_INTERVAL_MS = 2000
const POLL_TIMEOUT_MS = 90_000

export default function CreateWorldPage() {
  const navigate = useNavigate()
  const [premise, setPremise] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [messageIndex, setMessageIndex] = useState(0)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [suggesting, setSuggesting] = useState(false)
  const [refining, setRefining] = useState(false)
  const messageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollStartRef = useRef<number>(0)

  useEffect(() => {
    document.title = 'Crear Mundo — StoryTeller'
  }, [])

  useEffect(() => {
    if (loading) {
      setMessageIndex(0)
      messageIntervalRef.current = setInterval(() => {
        setMessageIndex(i => (i + 1) % LOADING_MESSAGES.length)
      }, 8000)
    } else {
      if (messageIntervalRef.current) {
        clearInterval(messageIntervalRef.current)
        messageIntervalRef.current = null
      }
    }
    return () => {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current)
    }
  }, [loading])

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
  }

  const startPolling = (jobId: string) => {
    pollStartRef.current = Date.now()

    pollIntervalRef.current = setInterval(async () => {
      if (Date.now() - pollStartRef.current > POLL_TIMEOUT_MS) {
        stopPolling()
        setError('La generación tardó demasiado. Inténtalo de nuevo.')
        setLoading(false)
        return
      }

      try {
        const job = await getJobStatus(jobId)
        if (job.status === 'done') {
          stopPolling()
          navigate(`/worlds/${job.world_id}`)
        } else if (job.status === 'error') {
          stopPolling()
          setError(job.error || 'Error generando el mundo')
          setLoading(false)
        }
        // 'pending' → keep polling
      } catch {
        // transient network error — keep polling
      }
    }, POLL_INTERVAL_MS)
  }

  const handleSuggest = async () => {
    setSuggesting(true)
    setSuggestions([])
    try {
      const result = await suggestPremises()
      setSuggestions(result.premises ?? [])
    } catch {
      // silently fail — suggestions are optional
    } finally {
      setSuggesting(false)
    }
  }

  const handleRefine = async () => {
    if (!premise.trim()) return
    setRefining(true)
    setSuggestions([])
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!premise.trim()) return
    setError('')
    setLoading(true)
    try {
      const { job_id } = await generateWorld(premise.trim())
      startPolling(job_id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error iniciando la generación')
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-[80vh] py-4 px-4">
      <div className="w-full max-w-5xl mx-auto">
        <PageBreadcrumb items={[
          { label: 'Mundos', href: '/worlds' },
          { label: 'Crear Mundo' },
        ]} />

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card className="overflow-hidden max-w-2xl mx-auto">
          <CardHeader className="border-b border-border/50 bg-accent/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-[var(--font-display)]">Crear Mundo</CardTitle>
                <CardDescription>Describe tu mundo y la IA generará el grafo causal completo</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex flex-col items-center gap-4 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground text-center transition-all duration-500">
                  {LOADING_MESSAGES[messageIndex]}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-foreground">
                      La premisa de tu mundo
                    </label>
                    {premise.trim() ? (
                      <button
                        type="button"
                        onClick={handleRefine}
                        disabled={refining}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      >
                        {refining
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Wand2 className="h-3 w-3" />
                        }
                        {refining ? 'Enriqueciendo...' : 'Enriquecer'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSuggest}
                        disabled={suggesting}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
                      >
                        {suggesting
                          ? <Loader2 className="h-3 w-3 animate-spin" />
                          : <Sparkles className="h-3 w-3" />
                        }
                        {suggesting ? 'Pensando...' : 'Sugerir ideas'}
                      </button>
                    )}
                  </div>
                  <Textarea
                    value={premise}
                    onChange={e => setPremise(e.target.value)}
                    className="min-h-[120px] resize-none text-base"
                    placeholder="Ej: Es un desierto y hay gusanos gigantes que producen una especia alucinógena que otorga vida eterna y visiones del futuro..."
                    required
                    autoFocus
                    disabled={loading}
                  />
                </div>
                {suggestions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">Elige una o úsala como inspiración:</p>
                    <div className="flex flex-col gap-1.5">
                      {suggestions.map((s, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setPremise(s)}
                          className="text-left text-sm px-3 py-2 rounded-md border border-border/60 bg-accent/30 hover:bg-accent hover:border-primary/30 transition-colors text-foreground/80"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  disabled={loading || !premise.trim()}
                >
                  Generar mundo →
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, Globe } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { generateWorld } from '@/services/api'

const LOADING_MESSAGES = [
  'Interpretando la premisa...',
  'Generando el nodo raíz...',
  'Expandiendo el grafo causal...',
  'Sintetizando el mundo...',
]

export default function CreateWorldPage() {
  const navigate = useNavigate()
  const [premise, setPremise] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [messageIndex, setMessageIndex] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    document.title = 'Crear Mundo — StoryTeller'
  }, [])

  useEffect(() => {
    if (loading) {
      setMessageIndex(0)
      intervalRef.current = setInterval(() => {
        setMessageIndex(i => (i + 1) % LOADING_MESSAGES.length)
      }, 8000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [loading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!premise.trim()) return
    setError('')
    setLoading(true)
    try {
      const result = await generateWorld(premise.trim())
      navigate(`/worlds/${result.world_id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando el mundo')
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
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    La premisa de tu mundo
                  </label>
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

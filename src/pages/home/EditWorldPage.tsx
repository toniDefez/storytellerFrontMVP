import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getWorldById, updateWorld } from '../../services/api'
import type { World } from '../../services/api'
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard'
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog'
import { FieldGroup } from '@/components/form/FieldGroup'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, Globe } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { toast } from 'sonner'

export default function EditWorldPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [premise, setPremise] = useState('')
  const [worldData, setWorldData] = useState<World | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [worldName, setWorldName] = useState('')

  const isDirty =
    worldData !== null && (
      name !== worldData.name ||
      description !== (worldData.description || '') ||
      premise !== (worldData.premise || '')
    )

  const { blocker } = useUnsavedChangesGuard(isDirty)

  useEffect(() => {
    document.title = `${t('pageTitle.editWorld')} — StoryTeller`
  }, [t, i18n.language])

  useEffect(() => {
    const worldId = Number(id)
    if (!id || Number.isNaN(worldId)) {
      setError(t('world.detail.invalidId'))
      setFetching(false)
      return
    }

    getWorldById(worldId)
      .then(data => {
        setName(data.name)
        setDescription(data.description || '')
        setPremise(data.premise || '')
        setWorldName(data.name)
        setWorldData(data)
      })
      .catch(err => setError(err instanceof Error ? err.message : t('world.detail.notFound')))
      .finally(() => setFetching(false))
  }, [id, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await updateWorld(Number(id), { name, description, premise })
      toast.success(t('world.edit.successTitle'), { description: t('world.edit.successDesc') })
      setWorldData(prev => prev ? { ...prev, name, description, premise } : prev)
      navigate(`/worlds/${id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('world.edit.error'))
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <DetailSkeleton />

  return (
    <>
    <div className="flex justify-center items-start min-h-[80vh] py-4">
      <div className="w-full max-w-2xl mx-auto">
        <PageBreadcrumb items={[
          { label: t('nav.worlds'), href: '/worlds' },
          { label: worldName || '...', href: `/worlds/${id}` },
          { label: t('common.edit') },
        ]} />
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border/50 bg-accent/30">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Globe className="w-4.5 h-4.5 text-primary" />
              </div>
              <div>
                <CardTitle className="font-[var(--font-display)]">{t('world.edit.title')}</CardTitle>
                <CardDescription>{t('world.edit.subtitle')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {error && (
              <Alert variant="destructive" className="mb-5">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <FieldGroup label={t('world.create.nameLabel')}>
                <Input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full" required placeholder={t('world.create.namePlaceholder')} />
              </FieldGroup>

              <FieldGroup label="Premisa">
                <Textarea value={premise} onChange={e => setPremise(e.target.value)} className="min-h-[80px] resize-none" placeholder="La idea central del mundo en una frase..." />
              </FieldGroup>

              <FieldGroup label={t('world.create.descriptionLabel')}>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[90px] resize-none" placeholder={t('world.create.descriptionPlaceholder')} />
              </FieldGroup>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('world.edit.submitting')}</> : t('world.edit.submitButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
    <UnsavedChangesDialog blocker={blocker} />
    </>
  )
}

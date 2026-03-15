import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getWorldById, updateWorld } from '../../services/api'
import type { World } from '../../services/api'
import { FieldGroup } from '@/components/form/FieldGroup'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, Globe, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { toast } from 'sonner'

const LAYER_META = [
  { key: 'environment' as const, label: 'layerEnvironment', color: 'emerald' },
  { key: 'subsistence' as const, label: 'layerSubsistence', color: 'amber' },
  { key: 'organization' as const, label: 'layerOrganization', color: 'blue' },
  { key: 'tensions' as const, label: 'layerTensions', color: 'rose' },
  { key: 'tone' as const, label: 'layerTone', color: 'violet' },
]

export default function EditWorldPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [name, setName] = useState('')
  const [factions, setFactions] = useState<string[]>([''])
  const [description, setDescription] = useState('')
  const [worldData, setWorldData] = useState<World | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [worldName, setWorldName] = useState('')

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
        setFactions(data.factions?.length ? data.factions : [''])
        setDescription(data.description || '')
        setWorldName(data.name)
        setWorldData(data)
      })
      .catch(err => setError(err instanceof Error ? err.message : t('world.detail.notFound')))
      .finally(() => setFetching(false))
  }, [id, t])

  const handleFactionChange = (idx: number, value: string) => {
    setFactions(factions.map((f, i) => (i === idx ? value : f)))
  }
  const addFaction = () => setFactions([...factions, ''])
  const removeFaction = (idx: number) => setFactions(factions.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await updateWorld(Number(id), { name, factions: factions.filter(f => f.trim()), description })
      toast.success(t('world.edit.successTitle'), { description: t('world.edit.successDesc') })
      navigate(`/worlds/${id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('world.edit.error'))
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <DetailSkeleton />

  return (
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

            {/* Sanderson layers (read-only context) */}
            {worldData?.core_axis && (
              <div className="mb-6 rounded-xl border border-border/50 bg-accent/20 p-4">
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">
                  {t('world.create.coreAxisLabel')}
                </p>
                <p className="text-sm text-foreground italic mb-4 leading-relaxed">
                  "{worldData.core_axis}"
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {LAYER_META.filter(l => worldData[l.key]).map(layer => (
                    <div key={layer.key} className={`rounded-lg bg-white/80 border border-gray-100 p-3 border-l-4 border-l-${layer.color}-500`}>
                      <h4 className={`text-[10px] font-semibold uppercase tracking-widest text-${layer.color}-600 mb-0.5`}>
                        {t(`world.create.${layer.label}`)}
                      </h4>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                        {worldData[layer.key]}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <FieldGroup label={t('world.create.nameLabel')}>
                <Input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full" required placeholder={t('world.create.namePlaceholder')} />
              </FieldGroup>

              <FieldGroup label={t('world.create.descriptionLabel')}>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} className="min-h-[90px] resize-none" required placeholder={t('world.create.descriptionPlaceholder')} />
              </FieldGroup>

              <div className="mb-7">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('world.create.factionsLabel')}</label>
                {factions.map((f, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input type="text" value={f} onChange={e => handleFactionChange(idx, e.target.value)} className="w-full" placeholder={t('world.create.factionPlaceholder', { index: idx + 1 })} />
                    {factions.length > 1 && (
                      <button type="button" onClick={() => removeFaction(idx)} className="text-muted-foreground/40 hover:text-destructive transition p-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addFaction} className="text-primary hover:text-primary/80 text-xs font-semibold mt-1 transition">{t('world.create.addFaction')}</button>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('world.edit.submitting')}</> : t('world.edit.submitButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getWorldById, updateWorld } from '../../services/api'
import { PillSelect } from '../../components/PillSelect'
import { FieldGroup } from '@/components/form/FieldGroup'
import { SectionDivider } from '@/components/form/SectionDivider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, Globe, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { toast } from 'sonner'

export default function EditWorldPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [name, setName] = useState('')
  const [era, setEra] = useState('')
  const [climate, setClimate] = useState('')
  const [politics, setPolitics] = useState('')
  const [culture, setCulture] = useState('')
  const [factions, setFactions] = useState<string[]>([''])
  const [description, setDescription] = useState('')
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
        setEra(data.era)
        setClimate(data.climate)
        setPolitics(data.politics)
        setCulture(data.culture)
        setFactions(data.factions?.length ? data.factions : [''])
        setDescription(data.description || '')
        setWorldName(data.name)
      })
      .catch(err => setError(err instanceof Error ? err.message : t('world.detail.notFound')))
      .finally(() => setFetching(false))
  }, [id, t])

  const eraOptions = [
    { value: 'Medieval', label: t('world.eras.medieval') },
    { value: 'Antigua', label: t('world.eras.ancient') },
    { value: 'Futurista', label: t('world.eras.futuristic') },
    { value: 'Moderna', label: t('world.eras.modern') },
    { value: 'Fantastica', label: t('world.eras.fantasy') },
    { value: 'Post-apocaliptica', label: t('world.eras.postApocalyptic') },
    { value: 'Victoriana', label: t('world.eras.victorian') },
    { value: 'Espacial', label: t('world.eras.space') },
  ]
  const eraDescriptions: Record<string, string> = {
    Medieval: t('world.eras.medievalDesc'),
    Antigua: t('world.eras.ancientDesc'),
    Futurista: t('world.eras.futuristicDesc'),
    Moderna: t('world.eras.modernDesc'),
    Fantastica: t('world.eras.fantasyDesc'),
    'Post-apocaliptica': t('world.eras.postApocalypticDesc'),
    Victoriana: t('world.eras.victorianDesc'),
    Espacial: t('world.eras.spaceDesc'),
  }

  const climateOptions = [
    { value: 'Templado', label: t('world.climates.temperate') },
    { value: 'Artico', label: t('world.climates.arctic') },
    { value: 'Tropical', label: t('world.climates.tropical') },
    { value: 'Desertico', label: t('world.climates.desert') },
    { value: 'Volcanico', label: t('world.climates.volcanic') },
    { value: 'Oceanico', label: t('world.climates.oceanic') },
    { value: 'Montanoso', label: t('world.climates.mountainous') },
    { value: 'Toxico', label: t('world.climates.toxic') },
  ]
  const climateDescriptions: Record<string, string> = {
    Templado: t('world.climates.temperateDesc'),
    Artico: t('world.climates.arcticDesc'),
    Tropical: t('world.climates.tropicalDesc'),
    Desertico: t('world.climates.desertDesc'),
    Volcanico: t('world.climates.volcanicDesc'),
    Oceanico: t('world.climates.oceanicDesc'),
    Montanoso: t('world.climates.mountainousDesc'),
    Toxico: t('world.climates.toxicDesc'),
  }

  const politicsOptions = [
    { value: 'Monarquia', label: t('world.politics.monarchy') },
    { value: 'Imperio', label: t('world.politics.empire') },
    { value: 'Republica', label: t('world.politics.republic') },
    { value: 'Teocracia', label: t('world.politics.theocracy') },
    { value: 'Anarquia', label: t('world.politics.anarchy') },
    { value: 'Oligarquia', label: t('world.politics.oligarchy') },
    { value: 'Tribu', label: t('world.politics.tribe') },
    { value: 'Dictadura', label: t('world.politics.dictatorship') },
  ]
  const politicsDescriptions: Record<string, string> = {
    Monarquia: t('world.politics.monarchyDesc'),
    Imperio: t('world.politics.empireDesc'),
    Republica: t('world.politics.republicDesc'),
    Teocracia: t('world.politics.theocracyDesc'),
    Anarquia: t('world.politics.anarchyDesc'),
    Oligarquia: t('world.politics.oligarchyDesc'),
    Tribu: t('world.politics.tribeDesc'),
    Dictadura: t('world.politics.dictatorshipDesc'),
  }

  const handleFactionChange = (idx: number, value: string) => {
    setFactions(factions.map((f, i) => (i === idx ? value : f)))
  }
  const addFaction = () => setFactions([...factions, ''])
  const removeFaction = (idx: number) => setFactions(factions.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!era || !climate || !politics) {
      setError(t('world.create.validationError'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await updateWorld(Number(id), { name, era, climate, politics, culture, factions: factions.filter(f => f.trim()), description })
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

            <form onSubmit={handleSubmit}>
              <FieldGroup label={t('world.create.nameLabel')}>
                <Input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full" required placeholder={t('world.create.namePlaceholder')} />
              </FieldGroup>

              <SectionDivider label={t('world.create.settingSection')} />

              <FieldGroup label={t('world.create.eraLabel')}>
                <PillSelect options={eraOptions} value={era} onChange={setEra} descriptions={eraDescriptions} />
              </FieldGroup>

              <FieldGroup label={t('world.create.climateLabel')}>
                <PillSelect options={climateOptions} value={climate} onChange={setClimate} descriptions={climateDescriptions} />
              </FieldGroup>

              <FieldGroup label={t('world.create.politicsLabel')}>
                <PillSelect options={politicsOptions} value={politics} onChange={setPolitics} descriptions={politicsDescriptions} />
              </FieldGroup>

              <SectionDivider label={t('world.create.identitySection')} />

              <FieldGroup label={t('world.create.cultureLabel')}>
                <Input type="text" value={culture} onChange={e => setCulture(e.target.value)} className="w-full" required placeholder={t('world.create.culturePlaceholder')} />
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

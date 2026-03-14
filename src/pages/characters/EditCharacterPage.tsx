import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCharacterById, updateCharacter } from '../../services/api'
import { PillSelect, MultiPillSelect } from '../../components/PillSelect'
import { FieldGroup } from '@/components/form/FieldGroup'
import { SectionDivider } from '@/components/form/SectionDivider'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Loader2, User, X } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { toast } from 'sonner'

const ROLE_VALUES = ['Guerrero', 'Mago', 'Picaro', 'Explorador', 'Sanador', 'Mercader', 'Noble', 'Sacerdote', 'Villano', 'Artesano'] as const
const PERSONALITY_VALUES = ['Valiente', 'Astuto', 'Compasivo', 'Arrogante', 'Misterioso', 'Leal', 'Vengativo', 'Ingenuo', 'Sabio', 'Impulsivo', 'Reservado', 'Temerario'] as const

export default function EditCharacterPage() {
  const { worldId, characterId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()

  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [personalityTags, setPersonalityTags] = useState<string[]>([])
  const [background, setBackground] = useState('')
  const [goals, setGoals] = useState<string[]>([''])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [charName, setCharName] = useState('')
  const [originalState, setOriginalState] = useState<Record<string, string>>({})
  const [originalWorldId, setOriginalWorldId] = useState<number>(0)

  useEffect(() => {
    document.title = `${t('pageTitle.editCharacter')} — StoryTeller`
  }, [t, i18n.language])

  useEffect(() => {
    const id = Number(characterId)
    if (!characterId || Number.isNaN(id)) {
      setError(t('character.detail.invalidId'))
      setFetching(false)
      return
    }

    getCharacterById(id)
      .then(data => {
        setName(data.name)
        setRole(data.role)
        setPersonalityTags(data.personality ? data.personality.split(',').map(s => s.trim()).filter(Boolean) : [])
        setBackground(data.background)
        setGoals(data.goals?.length ? data.goals : [''])
        setCharName(data.name)
        setOriginalState(data.state || {})
        setOriginalWorldId(data.world_id)
      })
      .catch(err => setError(err instanceof Error ? err.message : t('character.detail.notFound')))
      .finally(() => setFetching(false))
  }, [characterId, t])

  const roleOptions = ROLE_VALUES.map(v => ({ value: v, label: t(`character.roles.${v}`) }))
  const roleDesc: Record<string, string> = Object.fromEntries(
    ROLE_VALUES.map(v => [v, t(`character.roles.${v}Desc`)])
  )

  const personalityOptions = PERSONALITY_VALUES.map(v => ({ value: v, label: t(`character.personalities.${v}`) }))
  const personalityDesc: Record<string, string> = Object.fromEntries(
    PERSONALITY_VALUES.map(v => [v, t(`character.personalities.${v}Desc`)])
  )

  const handleGoalChange = (idx: number, value: string) => {
    setGoals(goals.map((g, i) => (i === idx ? value : g)))
  }
  const addGoal = () => setGoals([...goals, ''])
  const removeGoal = (idx: number) => setGoals(goals.filter((_, i) => i !== idx))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!role) {
      setError(t('character.create.validationError'))
      return
    }
    setLoading(true)
    setError('')
    try {
      await updateCharacter(Number(characterId), {
        name,
        role,
        personality: personalityTags.join(', '),
        background,
        goals: goals.filter(g => g.trim()),
        world_id: originalWorldId || Number(worldId),
        state: originalState,
      })
      toast.success(t('character.edit.successTitle'), { description: t('character.edit.successDesc') })
      navigate(`/worlds/${worldId}/characters/${characterId}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t('character.edit.error'))
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
          { label: 'Mundo', href: `/worlds/${worldId}` },
          { label: charName || '...', href: `/worlds/${worldId}/characters/${characterId}` },
          { label: t('common.edit') },
        ]} />
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-amber-100 bg-entity-character-light/50">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-entity-character/10 flex items-center justify-center">
                <User className="w-4.5 h-4.5 text-entity-character" />
              </div>
              <div>
                <CardTitle className="font-[var(--font-display)]">{t('character.edit.title')}</CardTitle>
                <CardDescription>{t('character.edit.subtitle')}</CardDescription>
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
              <FieldGroup label={t('character.create.nameLabel')}>
                <Input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full" required placeholder={t('character.create.namePlaceholder')} />
              </FieldGroup>

              <SectionDivider label={t('character.create.identitySection')} />

              <FieldGroup label={t('character.create.roleLabel')}>
                <PillSelect options={roleOptions} value={role} onChange={setRole} descriptions={roleDesc} />
              </FieldGroup>

              <FieldGroup label={t('character.create.personalityLabel')} hint={t('character.create.personalityHint')}>
                <MultiPillSelect options={personalityOptions} value={personalityTags} onChange={setPersonalityTags} descriptions={personalityDesc} />
              </FieldGroup>

              <SectionDivider label={t('character.create.historySection')} />

              <FieldGroup label={t('character.create.backgroundLabel')}>
                <Textarea value={background} onChange={e => setBackground(e.target.value)} className="min-h-[90px] resize-none" required placeholder={t('character.create.backgroundPlaceholder')} />
              </FieldGroup>

              <div className="mb-7">
                <label className="block text-[11px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">{t('character.create.goalsLabel')}</label>
                {goals.map((g, idx) => (
                  <div key={idx} className="flex gap-2 mb-2">
                    <Input type="text" value={g} onChange={e => handleGoalChange(idx, e.target.value)} className="w-full" placeholder={t('character.create.goalPlaceholder', { index: idx + 1 })} />
                    {goals.length > 1 && (
                      <button type="button" onClick={() => removeGoal(idx)} className="text-muted-foreground/40 hover:text-destructive transition p-1">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addGoal} className="text-entity-character hover:text-entity-character-muted text-xs font-semibold mt-1 transition">{t('character.create.addGoal')}</button>
              </div>

              <Button type="submit" size="lg" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{t('character.edit.submitting')}</> : t('character.edit.submitButton')}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

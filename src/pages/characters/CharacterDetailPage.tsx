import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCharacterById } from '../../services/api'
import type { Character } from '../../services/api'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'

export default function CharacterDetailPage() {
  const { worldId, characterId } = useParams()
  const { t } = useTranslation()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const id = Number(characterId)
    if (!characterId || Number.isNaN(id)) {
      setError(t('character.detail.invalidId'))
      setLoading(false)
      return
    }

    getCharacterById(id)
      .then(data => setCharacter(data))
      .catch(err => setError(err instanceof Error ? err.message : t('character.detail.loadError')))
      .finally(() => setLoading(false))
  }, [characterId, t])

  if (loading) return <DetailSkeleton />
  if (error) return (
    <div className="flex justify-center items-center h-96">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  )
  if (!character) return (
    <div className="flex justify-center items-center h-96">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{t('character.detail.notFound')}</AlertDescription>
      </Alert>
    </div>
  )

  const personalityList = character.personality
    ? character.personality.split(',').map(item => item.trim()).filter(Boolean)
    : []
  const stateEntries = Object.entries(character.state || {})

  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-6">
      <PageBreadcrumb items={[{label: t('nav.worlds'), href: '/worlds'}, {label: 'Mundo', href: '/worlds/' + worldId}, {label: character.name}]} />

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="font-[var(--font-display)] text-3xl font-bold text-slate-800">
              {character.name}
            </h2>
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-200">
              {character.role || t('character.detail.noRole')}
            </Badge>
          </div>
          <Button variant="secondary" size="sm" asChild>
            <Link to={worldId ? `/worlds/${worldId}` : '/worlds'}>{t('character.detail.backButton')}</Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="space-y-6 pt-6">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-2">{t('character.detail.personalitySection')}</h3>
            {personalityList.length === 0 ? (
              <p className="text-slate-500 italic">{t('character.detail.noPersonality')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {personalityList.map((trait, index) => (
                  <Badge
                    key={`${trait}-${index}`}
                    variant="outline"
                    className="bg-amber-50 text-amber-700 border-amber-200"
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-2">{t('character.detail.backgroundSection')}</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{character.background || t('character.detail.noBackground')}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-2">{t('character.detail.goalsSection')}</h3>
            {!character.goals || character.goals.length === 0 ? (
              <p className="text-slate-500 italic">{t('character.detail.noGoals')}</p>
            ) : (
              <ul className="space-y-1 text-gray-700">
                {character.goals.map((goal, index) => (
                  <li key={`${goal}-${index}`} className="border-l-2 border-amber-300 pl-3">
                    {goal}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-2">{t('character.detail.stateSection')}</h3>
            {stateEntries.length === 0 ? (
              <p className="text-slate-500 italic">{t('character.detail.noState')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stateEntries.map(([key, value]) => (
                  <div key={key} className="bg-amber-50/50 border border-amber-100 rounded-lg px-3 py-2 text-sm">
                    <span className="font-semibold text-gray-700">{key}:</span> <span className="text-gray-600">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

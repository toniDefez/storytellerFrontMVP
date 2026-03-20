import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { getCharacterById, deleteCharacter } from '../../services/api'
import type { Character } from '../../services/api'
import ConfirmModal from '../../components/ConfirmModal'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'
import { Pencil, Trash2 } from 'lucide-react'

export default function CharacterDetailPage() {
  const { worldId, characterId } = useParams()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  useEffect(() => {
    document.title = `${t('pageTitle.characterDetail', { name: character?.name ?? '' })} — StoryTeller`
  }, [t, i18n.language, character?.name])

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

  const handleDelete = async () => {
    setLoading(true)
    try {
      await deleteCharacter(Number(characterId))
      navigate(`/worlds/${worldId}`)
    } catch {
      setError(t('character.detail.deleteError'))
      setLoading(false)
    }
  }

  const personalityList = character.personality
    ? character.personality.split(',').map(item => item.trim()).filter(Boolean)
    : []
  const stateEntries = Object.entries(character.state || {})

  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-6">
      <PageBreadcrumb items={[{label: t('nav.worlds'), href: '/worlds'}, {label: 'Mundo', href: '/worlds/' + worldId}, {label: character.name}]} />

      <ConfirmModal
        open={showConfirmDelete}
        title={t('character.detail.deleteTitle')}
        message={t('character.detail.deleteMessage', { name: character.name })}
        confirmText={t('character.detail.deleteConfirm')}
        cancelText={t('common.cancel')}
        danger
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />

      {/* Premise as hero quote */}
      {character.premise && (
        <div className="bg-gradient-to-r from-amber-50/80 to-orange-50/60 border-l-4 border-amber-400 rounded-r-xl px-5 py-4 mb-6">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-600/60 mb-1">
            {t('character.detail.premiseSection')}
          </p>
          <p className="text-base text-foreground/80 italic font-[var(--font-display)] leading-relaxed">
            &ldquo;{character.premise}&rdquo;
          </p>
        </div>
      )}

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="font-display text-3xl font-normal text-[#7a2d18] tracking-[-0.02em]">
              {character.name}
            </h2>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui uppercase tracking-[0.06em] bg-[rgba(158,61,34,0.1)] text-[#9e3d22]">
              {character.role || t('character.detail.noRole')}
            </span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to={`/worlds/${worldId}/characters/${characterId}/edit`}>
                <Pencil className="h-4 w-4 mr-1.5" />
                {t('character.detail.editButton')}
              </Link>
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setShowConfirmDelete(true)}>
              <Trash2 className="h-4 w-4 mr-1.5" />
              {t('character.detail.deleteButton')}
            </Button>
            <Button variant="secondary" size="sm" asChild>
              <Link to={worldId ? `/worlds/${worldId}` : '/worlds'}>{t('character.detail.backButton')}</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-[#f7ece6] shadow-ambient rounded-[4px] px-6 py-6">
        <div className="space-y-6">
          <div>
            <h3 className="font-ui text-[10px] font-medium uppercase tracking-[0.1em] text-[#9a8880] mb-2">{t('character.detail.personalitySection')}</h3>
            {personalityList.length === 0 ? (
              <p className="text-slate-500 italic">{t('character.detail.noPersonality')}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {personalityList.map((trait, index) => (
                  <span
                    key={`${trait}-${index}`}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui bg-[rgba(158,61,34,0.1)] text-[#9e3d22]"
                  >
                    {trait}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* New derivation fields — only shown when present */}
          {character.social_position && (
            <div>
              <h3 className="font-ui text-[10px] font-medium uppercase tracking-[0.1em] text-[#9a8880] mb-2">{t('character.detail.socialPositionSection')}</h3>
              <p className="font-display text-sm text-[#2a2826] whitespace-pre-wrap">{character.social_position}</p>
            </div>
          )}

          {character.internal_contradiction && (
            <div>
              <h3 className="font-ui text-[10px] font-medium uppercase tracking-[0.1em] text-[#9a8880] mb-2">{t('character.detail.internalContradictionSection')}</h3>
              <p className="font-display text-sm text-[#2a2826] whitespace-pre-wrap">{character.internal_contradiction}</p>
            </div>
          )}

          {character.relation_to_collective_lie && (
            <div>
              <h3 className="font-ui text-[10px] font-medium uppercase tracking-[0.1em] text-[#9a8880] mb-2">{t('character.detail.relationToCollectiveLieSection')}</h3>
              <p className="font-display text-sm text-[#2a2826] whitespace-pre-wrap">{character.relation_to_collective_lie}</p>
            </div>
          )}

          {character.personal_fear && (
            <div>
              <h3 className="font-ui text-[10px] font-medium uppercase tracking-[0.1em] text-[#9a8880] mb-2">{t('character.detail.personalFearSection')}</h3>
              <p className="font-display text-sm text-[#2a2826] whitespace-pre-wrap">{character.personal_fear}</p>
            </div>
          )}

          {character.faction_affiliation && (
            <div>
              <h3 className="font-ui text-[10px] font-medium uppercase tracking-[0.1em] text-[#9a8880] mb-2">{t('character.detail.factionAffiliationSection')}</h3>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-ui bg-[hsl(260_35%_93%)] text-[#5a3e8a]">
                {character.faction_affiliation}
              </span>
            </div>
          )}

          <div>
            <h3 className="font-ui text-[10px] font-medium uppercase tracking-[0.1em] text-[#9a8880] mb-2">{t('character.detail.backgroundSection')}</h3>
            {character.background ? (
              <p className="prose-drop-cap-character prose-literary overflow-hidden whitespace-pre-wrap">{character.background}</p>
            ) : (
              <p className="font-display text-sm text-[#2a2826] italic">{t('character.detail.noBackground')}</p>
            )}
          </div>

          <div>
            <h3 className="font-ui text-[10px] font-medium uppercase tracking-[0.1em] text-[#9a8880] mb-2">{t('character.detail.goalsSection')}</h3>
            {!character.goals || character.goals.length === 0 ? (
              <p className="text-slate-500 italic">{t('character.detail.noGoals')}</p>
            ) : (
              <ul className="space-y-1 text-gray-700">
                {character.goals.map((goal, index) => (
                  <li key={`${goal}-${index}`} className="border-l-2 border-[#c4622d]/40 pl-3 font-display text-sm text-[#2a2826]">
                    {goal}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h3 className="font-ui text-[10px] font-medium uppercase tracking-[0.1em] text-[#9a8880] mb-2">{t('character.detail.stateSection')}</h3>
            {stateEntries.length === 0 ? (
              <p className="text-slate-500 italic">{t('character.detail.noState')}</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {stateEntries.map(([key, value]) => (
                  <div key={key} className="bg-[rgba(27,28,26,0.04)] rounded-[4px] px-3 py-2">
                    <span className="font-ui text-[10px] uppercase tracking-[0.1em] text-[#9a8880]">{key}:</span>
                    <span className="font-display text-sm text-[#2a2826] ml-1">{value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

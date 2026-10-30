import { useParams, Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, MapPin, Clock, Music, Users, Clapperboard } from 'lucide-react'
import { getWorldById } from '../../services/api'
import type { World, Character } from '../../services/api'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DetailSkeleton } from '@/components/skeletons/DetailSkeleton'

const DEFAULT_GRADIENT = 'from-violet-500 to-purple-700'

// The bible used to print role / faction / personality / background / goals.
// Those fields left the Character type when the psychological-graph redesign
// landed, and the page kept referencing them — 13 TS errors that broke
// `npm run build` for months. These are what a character actually carries now.
const VOICE_REGISTER_FIELDS = [
  { key: 'emotional_rhythm', label: 'Ritmo emocional' },
  { key: 'social_posture', label: 'Postura social' },
  { key: 'cognitive_tempo', label: 'Tempo cognitivo' },
  { key: 'expressive_style', label: 'Estilo expresivo' },
] as const

function inferGradient(world: World): string {
  const text = (world.premise || world.description || '').toLowerCase()
  if (/ceniza|volcan|fuego/.test(text)) return 'from-red-500 to-orange-600'
  if (/hielo|nieve|glaciar/.test(text)) return 'from-cyan-400 to-blue-600'
  if (/agua|oceano|lluvia/.test(text)) return 'from-blue-400 to-indigo-600'
  if (/bosque|selva|verde/.test(text)) return 'from-emerald-400 to-teal-600'
  if (/desierto|arena|sol/.test(text)) return 'from-amber-400 to-orange-600'
  if (/oscuridad|sombra/.test(text)) return 'from-slate-600 to-gray-800'
  if (/magia|hechizo/.test(text)) return 'from-violet-500 to-purple-700'
  return DEFAULT_GRADIENT
}

interface SceneData {
  id: number
  title: string
  location?: string
  time?: string
  tone?: string
  context?: string
}

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 30 } },
}

export default function WorldBiblePage() {
  const { t, i18n } = useTranslation()
  const { id } = useParams()
  const [world, setWorld] = useState<World | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [scenes, setScenes] = useState<SceneData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    document.title = `${world?.name ?? ''} — ${t('bible.viewBible')} — StoryTeller`
  }, [t, i18n.language, world?.name])

  useEffect(() => {
    const worldId = Number(id)
    if (!id || Number.isNaN(worldId)) {
      setError(t('world.detail.invalidId'))
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        const data = await getWorldById(worldId)
        if (!data || typeof data !== 'object') {
          throw new Error(t('world.detail.notFound'))
        }

        if (!data.name) {
          throw new Error(t('world.detail.notFound'))
        }

        setWorld(data)

        // getWorldById may return extra fields from the backend
        const raw = data as unknown as Record<string, unknown>
        setCharacters(Array.isArray(raw.characters) ? raw.characters as Character[] : [])

        const rawScenes: SceneData[] = Array.isArray(raw.scenes) ? raw.scenes as SceneData[] : []

        setScenes(rawScenes)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id, t])

  if (loading) return <DetailSkeleton />
  if (error) return (
    <div className="flex justify-center items-center h-96">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    </div>
  )
  if (!world) return (
    <div className="flex justify-center items-center h-96">
      <Alert variant="destructive" className="max-w-md">
        <AlertDescription>{t('world.detail.notFound')}</AlertDescription>
      </Alert>
    </div>
  )

  const gradient = inferGradient(world)

  return (
    <article className="max-w-3xl mx-auto pb-20 mt-8 px-4">
      {/* Back link */}
      <motion.div
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Button variant="ghost" size="sm" className="mb-6 text-muted-foreground" asChild>
          <Link to={`/worlds/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {t('bible.backToWorld')}
          </Link>
        </Button>
      </motion.div>

      {/* ── Hero Section ── */}
      <motion.header
        className="rounded-2xl overflow-hidden shadow-lg mb-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      >
        <div className={`bg-gradient-to-br ${gradient} px-10 py-16 text-center relative`}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10">
            <h1 className="text-3xl sm:text-5xl font-bold text-white font-[var(--font-display)] leading-tight tracking-tight">
              {world.name}
            </h1>
            {world.premise && (
              <p className="mt-4 text-white/80 text-lg italic font-[var(--font-display)] max-w-xl mx-auto leading-relaxed">
                "{world.premise}"
              </p>
            )}
          </div>
        </div>
      </motion.header>

      {/* ── Overview Section ── */}
      {world.description && (
        <motion.section
          className="mb-14"
          variants={sectionVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-40px' }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
        >
          <SectionHeading>{t('bible.overviewSection')}</SectionHeading>
          <p className="text-foreground/90 text-lg leading-relaxed font-[var(--font-display)]">
            {world.description}
          </p>
        </motion.section>
      )}

      {/* ── Characters Section ── */}
      <motion.section
        className="mb-14"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        <SectionHeading icon={<Users className="h-5 w-5 text-entity-character" />}>
          {t('bible.charactersSection')}
        </SectionHeading>

        {characters.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-10">
            <p className="text-muted-foreground italic font-[var(--font-display)]">
              {t('bible.noCharacters')}
            </p>
            <Button variant="ghost" size="sm" className="mt-3 text-entity-character" asChild>
              <Link to={`/worlds/${id}`}>
                {t('bible.backToWorld')} →
              </Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {characters.map(character => (
              <motion.div
                key={character.id}
                variants={itemVariants}
                className="rounded-xl bg-white border border-gray-100 p-6 border-l-4 border-l-entity-character shadow-sm"
              >
                {character.premise && (
                  <p className="text-sm italic text-muted-foreground mb-3 font-[var(--font-display)]">
                    "{character.premise}"
                  </p>
                )}
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="text-xl font-bold text-foreground font-[var(--font-display)]">
                    {character.name}
                  </h3>
                </div>

                {character.speech_pattern && (
                  <p className="text-foreground/75 leading-relaxed mb-3 font-[var(--font-display)] text-sm">
                    {character.speech_pattern}
                  </p>
                )}

                {character.voice_register && (
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-sm text-foreground/70 font-[var(--font-display)]">
                    {VOICE_REGISTER_FIELDS.map(({ key, label }) => {
                      const value = character.voice_register?.[key]
                      if (!value) return null
                      return (
                        <div key={key} className="flex gap-1.5">
                          <dt className="text-muted-foreground shrink-0">{label}:</dt>
                          <dd>{value}</dd>
                        </div>
                      )
                    })}
                  </dl>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ── Chronicle Section ── */}
      <motion.section
        className="mb-14"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-40px' }}
      >
        <SectionHeading icon={<Clapperboard className="h-5 w-5 text-entity-scene" />}>
          {t('bible.chronicleSection')}
        </SectionHeading>

        {scenes.length === 0 ? (
          <motion.div variants={itemVariants} className="text-center py-10">
            <p className="text-muted-foreground italic font-[var(--font-display)]">
              {t('bible.noScenes')}
            </p>
            <Button variant="ghost" size="sm" className="mt-3 text-entity-scene" asChild>
              <Link to={`/worlds/${id}`}>
                {t('bible.backToWorld')} →
              </Link>
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {scenes
              .sort((a, b) => a.id - b.id)
              .map((scene, index) => (
              <motion.div
                key={scene.id}
                variants={itemVariants}
                className="rounded-xl bg-white border border-gray-100 p-6 border-l-4 border-l-entity-scene shadow-sm"
              >
                <h3 className="text-xl font-bold text-foreground font-[var(--font-display)] mb-2">
                  {index + 1}. {scene.title}
                </h3>

                {/* Scene metadata */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {scene.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-gray-50 rounded-full px-3 py-1">
                      <MapPin className="h-3 w-3" />
                      {scene.location}
                    </span>
                  )}
                  {scene.time && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-gray-50 rounded-full px-3 py-1">
                      <Clock className="h-3 w-3" />
                      {scene.time}
                    </span>
                  )}
                  {scene.tone && (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-gray-50 rounded-full px-3 py-1">
                      <Music className="h-3 w-3" />
                      {scene.tone}
                    </span>
                  )}
                </div>

                {scene.context && (
                  <p className="text-foreground/80 leading-relaxed font-[var(--font-display)]">
                    {scene.context}
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.section>

      {/* ── Footer ── */}
      <motion.footer
        className="pt-10 border-t border-gray-200 text-center space-y-4"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <BookOpen className="h-4 w-4" />
          <span className="font-[var(--font-display)] italic">{t('bible.createdWith')}</span>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/worlds/${id}`}>
            <ArrowLeft className="h-4 w-4 mr-1.5" />
            {t('bible.backToWorld')}
          </Link>
        </Button>
      </motion.footer>
    </article>
  )
}

/* ── Reusable section heading ── */
function SectionHeading({ children, icon }: { children: React.ReactNode; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-5">
      {icon}
      <h2 className="text-2xl font-bold text-foreground font-[var(--font-display)] tracking-tight">
        {children}
      </h2>
      <div className="flex-1 h-px bg-gray-200 ml-3" />
    </div>
  )
}

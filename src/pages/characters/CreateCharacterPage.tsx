import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2, Server, Wand2, User } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PageBreadcrumb } from '@/components/PageBreadcrumb'
import { useInstallation } from '@/hooks/useInstallation'
import {
  generateCharacter,
  getCharacterProfiles,
  refineCharacterPremise,
  createCharacterFromProfile,
} from '@/services/api'
import type { ProfileTemplateBrief } from '@/services/api'

const LOADING_MESSAGES = [
  'Analizando la premisa...',
  'Derivando el perfil psicológico...',
  'Seleccionando nodos del catálogo...',
  'Componiendo la identidad...',
]

/* ── Profile template picker (inline, mirrors SeedTemplatePicker) ── */

const TAG_ICONS: Record<string, string> = {
  warrior: '⚔️',
  mage: '🔮',
  rogue: '🗡️',
  healer: '💚',
  leader: '👑',
  scholar: '📜',
  rebel: '🔥',
  default: '🎭',
}

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.06,
      duration: 0.35,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
    },
  }),
}

function CharacterProfilePicker({
  selected,
  onSelect,
}: {
  selected: ProfileTemplateBrief | null
  onSelect: (p: ProfileTemplateBrief | null) => void
}) {
  const [profiles, setProfiles] = useState<ProfileTemplateBrief[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCharacterProfiles()
      .then(p => setProfiles(p ?? []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (profiles.length === 0) return null

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        <label
          className="text-[10px] tracking-[0.2em] uppercase"
          style={{ fontFamily: 'var(--font-ui)', color: 'hsl(24 60% 50%)' }}
        >
          Empieza desde un perfil
        </label>
        {selected && (
          <button
            onClick={() => onSelect(null)}
            className="text-[10px] underline underline-offset-2"
            style={{ fontFamily: 'var(--font-ui)', color: 'hsl(24 80% 40%)' }}
          >
            Desde cero
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {profiles.map((profile, i) => {
          const isSelected = selected?.id === profile.id
          const firstTag = profile.tags?.[0] ?? 'default'
          const icon = TAG_ICONS[firstTag] ?? TAG_ICONS.default
          return (
            <motion.button
              key={profile.id}
              type="button"
              onClick={() => onSelect(isSelected ? null : profile)}
              custom={i}
              initial="hidden"
              animate="show"
              variants={cardVariants}
              className={`text-left rounded-xl border p-3.5 transition-all duration-200 cursor-pointer
                ${isSelected
                  ? 'border-[hsl(24_80%_45%)] bg-[hsl(24_80%_96%)] shadow-[0_0_0_2px_hsl(24_80%_45%/0.15)]'
                  : 'border-border/60 bg-background hover:border-[hsl(24_60%_65%)]'}`}
            >
              <div className="flex items-start gap-2.5">
                <span className="text-lg leading-none mt-0.5">{icon}</span>
                <div className="min-w-0">
                  <div
                    className="font-medium text-xs text-foreground leading-tight mb-1"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    {profile.title}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                    {profile.description}
                  </p>
                  {profile.node_count > 0 && (
                    <span className="text-[10px] text-muted-foreground/60 mt-1 inline-block">
                      {profile.node_count} nodos
                    </span>
                  )}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

/* ── Main page ── */

export default function CreateCharacterPage() {
  const { id } = useParams<{ id: string }>()
  const worldId = Number(id)
  const navigate = useNavigate()
  const { hasInstallation, loading: installLoading, checked } = useInstallation()

  const [premise, setPremise] = useState('')
  const [selectedProfile, setSelectedProfile] = useState<ProfileTemplateBrief | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [messageIndex, setMessageIndex] = useState(0)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [refining, setRefining] = useState(false)

  const messageIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    document.title = 'Crear Personaje — StoryTeller'
  }, [])

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  useEffect(() => {
    if (textareaRef.current) autoResize(textareaRef.current)
  }, [premise])

  // Rotate loading messages
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

  const handleRefine = async () => {
    if (!premise.trim()) return
    setRefining(true)
    try {
      const result = await refineCharacterPremise(premise.trim())
      if (result.premise) {
        setPremise(result.premise)
      }
    } catch {
      // silently fail
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
      if (selectedProfile) {
        const { character_id } = await createCharacterFromProfile(worldId, selectedProfile.id, premise.trim())
        navigate(`/worlds/${worldId}/characters/${character_id}`)
      } else {
        const character = await generateCharacter(worldId, premise.trim())
        navigate(`/worlds/${worldId}/characters/${character.id}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error generando el personaje')
      setLoading(false)
    }
  }

  if (installLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (checked && !hasInstallation) {
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
              <h2 className="text-xl font-bold">Generador no conectado</h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Para generar personajes con IA necesitas vincular tu generador local.
              </p>
              <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
                <Button onClick={() => navigate('/settings?tab=installation')}>
                  Ir a configuración
                </Button>
                <Button variant="ghost" onClick={() => navigate(`/worlds/${worldId}`)}>
                  Volver al mundo
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[80vh] px-4 w-full">
      <div className="w-full">
        <PageBreadcrumb items={[
          { label: 'Mundos', href: '/worlds' },
          { label: 'Mundo', href: `/worlds/${worldId}` },
          { label: 'Crear personaje' },
        ]} />

        {error && (
          <Alert variant="destructive" className="mb-4 max-w-[640px] mx-auto">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="max-w-[640px] mx-auto pt-6 md:pt-12"
        >
          {/* -- Header -- */}
          <div className="text-center mb-10 md:mb-14">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-5"
              style={{ backgroundColor: 'hsl(24 80% 93%)', border: '1px solid hsl(24 60% 86%)' }}
            >
              <User className="w-5 h-5" style={{ color: 'hsl(24 80% 40%)' }} />
            </div>
            <h1
              className="text-[2rem] md:text-[2.5rem] leading-[1.15] font-light tracking-[-0.01em] text-foreground mb-3"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Todo personaje comienza<br />
              con una premisa
            </h1>
            <p
              className="text-[0.95rem] leading-relaxed max-w-sm mx-auto"
              style={{ color: 'hsl(30 6% 47%)', fontFamily: 'var(--font-body)' }}
            >
              Una frase que contiene la semilla de quién será.
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center gap-4 py-16">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(24 80% 45%)' }} />
              <p
                className="text-sm text-center transition-all duration-500"
                style={{ color: 'hsl(30 6% 47%)', fontFamily: 'var(--font-display)', fontStyle: 'italic' }}
              >
                {LOADING_MESSAGES[messageIndex]}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* -- Profile template picker -- */}
              <CharacterProfilePicker selected={selectedProfile} onSelect={setSelectedProfile} />

              {/* -- Premise textarea -- */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2.5">
                  <label
                    className="text-[10px] tracking-[0.2em] uppercase"
                    style={{ fontFamily: 'var(--font-ui)', color: 'hsl(24 60% 50%)' }}
                  >
                    La premisa del personaje
                  </label>
                  {premise.trim() && (
                    <motion.button
                      type="button"
                      onClick={handleRefine}
                      disabled={refining}
                      className="flex items-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer"
                      style={{ fontFamily: 'var(--font-ui)', color: 'hsl(24 80% 40%)' }}
                      whileHover={{ x: 2 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {refining ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span
                            className="italic"
                            style={{ fontFamily: 'var(--font-display)', color: 'hsl(24 60% 50%)' }}
                          >
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
                  )}
                </div>
                <textarea
                  ref={textareaRef}
                  value={premise}
                  onChange={e => {
                    setPremise(e.target.value)
                    autoResize(e.target)
                  }}
                  className="w-full resize-none outline-none text-[1.05rem] leading-[1.75] placeholder:text-muted-foreground/35"
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontWeight: 300,
                    color: 'hsl(30 8% 20%)',
                    background: 'transparent',
                    borderBottom: '1px solid hsl(24 60% 86%)',
                    paddingBottom: '0.75rem',
                    overflow: 'hidden',
                  }}
                  rows={2}
                  placeholder="Un excavador que descubrió que todo lo que le enseñaron sobre el Acuífero era mentira..."
                  required
                />
              </div>

              {/* -- Submit -- */}
              <div className="pt-2">
                <Button
                  type="submit"
                  size="lg"
                  className="w-full h-12 text-[0.9rem] tracking-[0.03em]"
                  style={{ fontFamily: 'var(--font-ui)' }}
                  disabled={loading || !premise.trim()}
                >
                  {selectedProfile
                    ? `Crear desde "${selectedProfile.title}"`
                    : 'Generar personaje'}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  )
}

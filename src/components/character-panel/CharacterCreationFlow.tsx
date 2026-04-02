import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { generateCharacter } from '@/services/api'
import type { Character } from '@/services/api'
import { AIGeneratingIndicator } from '@/components/world-creation/AIGeneratingIndicator'
import { useInstallation } from '@/hooks/useInstallation'
import NoInstallationBanner from '@/components/NoInstallationBanner'

const PREMISE_EXAMPLES = [
  'Una excavadora que descubrio que el Acuifero es un mito...',
  'Un herrero cuya tecnica secreta le cuesta la salud...',
  'Una narradora oral que inventa pasados para quienes pagan...',
  'Un guardia del muro que dejo pasar a los invasores...',
  'Una botanica que cultiva una planta prohibida en el sotano...',
]

type Phase = 'premise' | 'generating' | 'result'

interface Props {
  worldId: number
  onCharacterCreated: (character: Character) => void
}

export function CharacterCreationFlow({ worldId, onCharacterCreated }: Props) {
  const { hasInstallation } = useInstallation()
  const [phase, setPhase] = useState<Phase>('premise')
  const [premise, setPremise] = useState('')
  const [error, setError] = useState('')
  const [character, setCharacter] = useState<Character | null>(null)
  const [placeholderIdx, setPlaceholderIdx] = useState(0)

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIdx(i => (i + 1) % PREMISE_EXAMPLES.length)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  const handleDerive = async () => {
    if (!premise.trim()) return
    setPhase('generating')
    setError('')
    try {
      const c = await generateCharacter(worldId, premise.trim())
      setCharacter(c)
      setPhase('result')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar')
      setPhase('premise')
    }
  }

  const handleAccept = () => {
    if (character) {
      onCharacterCreated(character)
    }
  }

  const handleReset = () => {
    setCharacter(null)
    setPhase('premise')
  }

  return (
    <div className="h-full overflow-y-auto">
      <AnimatePresence mode="wait">
        {phase === 'premise' && (
          <motion.div
            key="premise"
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="flex flex-col items-center justify-center min-h-full px-8 py-10 max-w-xl mx-auto"
          >
            <p className="text-[11px] font-semibold uppercase tracking-widest text-[hsl(17_63%_37%/0.6)] mb-8">
              Derivar personaje
            </p>

            {!hasInstallation && <NoInstallationBanner />}

            <textarea
              value={premise}
              onChange={e => setPremise(e.target.value)}
              placeholder={PREMISE_EXAMPLES[placeholderIdx]}
              rows={4}
              className="w-full border-2 border-dashed border-[hsl(17_63%_37%/0.25)] rounded-xl
                         px-4 py-3 text-sm font-display italic text-foreground/80
                         placeholder:text-foreground/20 resize-none
                         focus:outline-none focus:border-[hsl(17_63%_37%/0.5)]
                         bg-transparent"
            />

            <div className="flex items-center justify-between w-full mt-2 mb-6">
              <span className="text-[10px] text-muted-foreground/40">{premise.length}/500</span>
            </div>

            {error && (
              <p className="text-sm text-red-500 mb-4">{error}</p>
            )}

            <button
              onClick={handleDerive}
              disabled={!premise.trim() || !hasInstallation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                         bg-gradient-to-r from-amber-600 to-orange-500 text-white font-medium text-sm
                         disabled:opacity-40 disabled:cursor-not-allowed
                         hover:shadow-lg hover:shadow-amber-500/20 hover:-translate-y-0.5
                         transition-all duration-200"
            >
              <Sparkles className="w-4 h-4" />
              Derivar personaje
            </button>
          </motion.div>
        )}

        {phase === 'generating' && (
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center min-h-full"
          >
            <AIGeneratingIndicator />
          </motion.div>
        )}

        {phase === 'result' && character && (
          <motion.div
            key="result"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="px-8 py-6 max-w-2xl mx-auto"
          >
            <CharacterResultPreview
              character={character}
              onAccept={handleAccept}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* Minimal result preview — expanded by CharacterDetailView in Task 6 */
function CharacterResultPreview({
  character,
  onAccept,
  onReset,
}: {
  character: Character
  onAccept: () => void
  onReset: () => void
}) {
  const sections = [
    { key: 'identity', label: 'IDENTIDAD', color: 'amber', delay: 0 },
    { key: 'temperament', label: 'TEMPERAMENTO', color: 'rose', delay: 0.15 },
    { key: 'history', label: 'HISTORIA', color: 'blue', delay: 0.3 },
    { key: 'will', label: 'VOLUNTAD', color: 'emerald', delay: 0.45 },
    { key: 'values', label: 'VALORES', color: 'purple', delay: 0.6 },
  ]

  return (
    <div className="space-y-6">
      {/* Name + Role header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        className="bg-gradient-to-br from-amber-50/80 to-orange-50/40 rounded-xl px-6 py-5"
      >
        <h2 className="font-display text-2xl text-[#7a2d18] tracking-tight">{character.name}</h2>
        {character.role && (
          <span className="inline-flex mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-[rgba(158,61,34,0.08)] text-[#9e3d22]">
            {character.role}
          </span>
        )}
        {character.premise && (
          <p className="mt-3 border-l-2 border-amber-400/60 pl-3 font-display text-sm italic text-foreground/60">
            &ldquo;{character.premise}&rdquo;
          </p>
        )}
      </motion.div>

      {/* Staggered sections */}
      {sections.map(s => (
        <motion.div
          key={s.key}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22, delay: s.delay }}
        >
          <SectionBlock sectionKey={s.key} label={s.label} color={s.color} character={character} />
        </motion.div>
      ))}

      {/* Action bar */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex gap-3 pt-4 border-t border-border/40"
      >
        <button
          onClick={onAccept}
          className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-500
                     text-white font-medium text-sm hover:shadow-lg hover:shadow-amber-500/20
                     transition-all duration-200"
        >
          Guardar personaje
        </button>
        <button
          onClick={onReset}
          className="px-4 py-3 rounded-xl border border-border/40 text-sm text-muted-foreground
                     hover:bg-muted/30 transition-colors"
        >
          Volver a premisa
        </button>
      </motion.div>
    </div>
  )
}

function SectionBlock({
  sectionKey,
  label,
  color,
  character,
}: {
  sectionKey: string
  label: string
  color: string
  character: Character
}) {
  const colorMap: Record<string, string> = {
    amber: 'border-amber-500/40 text-amber-700',
    rose: 'border-rose-500/40 text-rose-700',
    blue: 'border-blue-500/40 text-blue-700',
    emerald: 'border-emerald-500/40 text-emerald-700',
    purple: 'border-purple-500/40 text-purple-700',
  }

  return (
    <div className={`border-l-2 ${colorMap[color]?.split(' ')[0] || ''} pl-4`}>
      <p className={`text-[10px] font-bold uppercase tracking-[0.12em] mb-3 ${colorMap[color]?.split(' ')[1] || ''}`}>
        {label}
      </p>
      <div className="space-y-2 text-sm text-foreground/80">
        {sectionKey === 'identity' && (
          <>
            {character.social_position && <p><strong className="text-foreground/60">Posicion social:</strong> {character.social_position}</p>}
            {character.faction_affiliation && <p><strong className="text-foreground/60">Faccion:</strong> {character.faction_affiliation}</p>}
          </>
        )}
        {sectionKey === 'temperament' && (
          <>
            {character.personality && <p><strong className="text-foreground/60">Personalidad:</strong> {character.personality}</p>}
            {character.contradiction_declared && (
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="bg-blue-50/50 rounded-lg p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400/70 mb-1">Declara</p>
                  <p className="text-xs">{character.contradiction_declared}</p>
                </div>
                <div className="bg-rose-50/50 rounded-lg p-3">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-rose-400/70 mb-1">Opera</p>
                  <p className="text-xs">{character.contradiction_operative}</p>
                </div>
              </div>
            )}
            {character.consciousness_state && (
              <p><strong className="text-foreground/60">Estado:</strong> {character.consciousness_state}</p>
            )}
          </>
        )}
        {sectionKey === 'history' && (
          <>
            {character.background && <p className="leading-relaxed">{character.background}</p>}
            {character.personal_fear && (
              <p className="mt-2 bg-rose-50/40 border border-rose-100/50 rounded-lg px-3 py-2 text-xs">
                <strong className="text-rose-500/70">Miedo:</strong> {character.personal_fear}
              </p>
            )}
          </>
        )}
        {sectionKey === 'will' && (
          <>
            {character.structured_goals && character.structured_goals.length > 0 ? (
              <ul className="space-y-1.5">
                {character.structured_goals.map((g, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                      g.category === 'world_tension' ? 'bg-purple-500' :
                      g.category === 'subversive' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    <span className="text-xs">{g.text}</span>
                  </li>
                ))}
              </ul>
            ) : character.goals && character.goals.length > 0 ? (
              <ul className="space-y-1">
                {character.goals.map((g, i) => (
                  <li key={i} className="text-xs">- {g}</li>
                ))}
              </ul>
            ) : null}
          </>
        )}
        {sectionKey === 'values' && (
          <>
            <p className="text-xs text-muted-foreground/50 italic">
              {character.values && character.values.length > 0
                ? character.values.map(v => v.name).join(' \u00b7 ')
                : 'Sin grafo de valores'}
            </p>
            {/* ValueGraph component will be wired here in Task 7 */}
          </>
        )}
      </div>
    </div>
  )
}

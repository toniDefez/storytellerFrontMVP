import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trash2 } from 'lucide-react'
import { getCharacterById, deleteCharacter } from '@/services/api'
import type { Character } from '@/services/api'
import { ConsciousnessStateDot } from './ConsciousnessStateDot'

interface Props {
  characterId: number
  onDeleted: () => void
}

export function CharacterDetailView({ characterId, onDeleted }: Props) {
  const [character, setCharacter] = useState<Character | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)

  // Load character on mount or when ID changes
  useEffect(() => {
    setLoading(true)
    setError('')
    getCharacterById(characterId)
      .then(c => { setCharacter(c); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [characterId])

  if (loading) {
    return <div className="flex items-center justify-center h-full text-muted-foreground/40">Cargando...</div>
  }
  if (error || !character) {
    return <div className="flex items-center justify-center h-full text-red-400">{error || 'No encontrado'}</div>
  }

  const handleDelete = async () => {
    try {
      await deleteCharacter(characterId)
      onDeleted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

  const tierDots = character.faction_power_tier === 0 ? '●●●' : character.faction_power_tier === 1 ? '●●○' : '●○○'

  return (
    <div className="h-full overflow-y-auto px-8 py-6">
      <motion.div
        key={characterId}
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="max-w-2xl mx-auto space-y-6"
      >
        {/* Hero header */}
        <div className="bg-gradient-to-br from-amber-50/80 to-orange-50/40 rounded-xl px-6 py-5">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl text-[#7a2d18] tracking-tight">{character.name}</h2>
              {character.role && (
                <span className="inline-flex mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wide bg-[rgba(158,61,34,0.08)] text-[#9e3d22]">
                  {character.role}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="p-2 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {character.faction_affiliation && (
            <p className="text-xs text-muted-foreground/70 mt-2">
              {character.faction_affiliation} · <span className="tracking-wider">{tierDots}</span>
            </p>
          )}

          {character.premise && (
            <p className="mt-3 border-l-2 border-amber-400/60 pl-3 font-display text-sm italic text-foreground/60">
              &ldquo;{character.premise}&rdquo;
            </p>
          )}
        </div>

        {/* Identity */}
        <Section label="IDENTIDAD" color="amber">
          {character.social_position && <Field label="Posicion social" value={character.social_position} />}
          {character.consciousness_state && (
            <div className="flex items-center gap-2">
              <ConsciousnessStateDot state={character.consciousness_state} />
              <span className="text-sm capitalize">{character.consciousness_state}</span>
            </div>
          )}
          {character.relation_to_collective_lie && <Field label="Relacion con la mentira" value={character.relation_to_collective_lie} />}
        </Section>

        {/* Temperament */}
        <Section label="TEMPERAMENTO" color="rose">
          {character.personality && <Field label="Personalidad" value={character.personality} />}
          {(character.contradiction_declared || character.contradiction_operative) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-blue-50/50 rounded-lg p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-blue-400/70 mb-1">Declara</p>
                <p className="text-xs text-foreground/80">{character.contradiction_declared}</p>
              </div>
              <div className="bg-rose-50/50 rounded-lg p-3">
                <p className="text-[9px] font-bold uppercase tracking-widest text-rose-400/70 mb-1">Opera</p>
                <p className="text-xs text-foreground/80">{character.contradiction_operative}</p>
              </div>
            </div>
          )}
        </Section>

        {/* History */}
        <Section label="HISTORIA" color="blue">
          {character.background && <p className="text-sm leading-relaxed text-foreground/80">{character.background}</p>}
          {character.personal_fear && (
            <div className="bg-rose-50/40 border border-rose-100/50 rounded-lg px-3 py-2 mt-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-rose-400/70">Miedo: </span>
              <span className="text-xs text-foreground/80">{character.personal_fear}</span>
            </div>
          )}
        </Section>

        {/* Will */}
        <Section label="VOLUNTAD" color="emerald">
          {character.structured_goals && character.structured_goals.length > 0 ? (
            <ul className="space-y-1.5">
              {character.structured_goals.map((g, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${
                    g.category === 'world_tension' ? 'bg-purple-500' :
                    g.category === 'subversive' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  <span className="text-sm text-foreground/80">{g.text}</span>
                </li>
              ))}
            </ul>
          ) : character.goals?.length > 0 ? (
            <ul className="space-y-1">
              {character.goals.map((g, i) => <li key={i} className="text-sm text-foreground/80">- {g}</li>)}
            </ul>
          ) : null}
        </Section>

        {/* Values */}
        <Section label="GRAFO DE VALORES" color="purple">
          {character.values && character.values.length > 0 ? (
            <div className="space-y-2">
              {character.values.map((v, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`w-3 h-3 rounded-full ${v.value_type === 'nuclear' ? 'bg-amber-500' : 'bg-stone-300 border border-stone-400 border-dashed'}`} />
                  <span className="text-sm font-medium">{v.name}</span>
                  <span className="text-xs text-muted-foreground/50">{v.description}</span>
                  <span className="ml-auto text-[10px] text-muted-foreground/40">{(v.weight * 100).toFixed(0)}%</span>
                </div>
              ))}
              {character.value_relations && character.value_relations.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border/30 space-y-1">
                  {character.value_relations.map((r, i) => (
                    <p key={i} className="text-xs text-muted-foreground/60">
                      <span className="font-medium">{r.source_value}</span>
                      {' '}
                      <span className={
                        r.relation_type === 'tensions' ? 'text-red-400' :
                        r.relation_type === 'reinforces' ? 'text-emerald-400' : 'text-indigo-400'
                      }>
                        {r.relation_type === 'tensions' ? 'tensiona con' :
                         r.relation_type === 'reinforces' ? 'refuerza' : 'depende de'}
                      </span>
                      {' '}
                      <span className="font-medium">{r.target_value}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground/50 italic">Sin grafo de valores</p>
          )}
          {/* ValueGraph SVG will be added in Task 7 */}
        </Section>

        {/* Delete confirmation */}
        {showConfirmDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
            <div className="bg-background rounded-xl p-6 max-w-sm shadow-xl">
              <p className="text-sm font-medium mb-4">Eliminar a {character.name}?</p>
              <div className="flex gap-3">
                <button onClick={handleDelete} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg text-sm">Eliminar</button>
                <button onClick={() => setShowConfirmDelete(false)} className="flex-1 px-4 py-2 border rounded-lg text-sm">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}

function Section({ label, color, children }: { label: string; color: string; children: React.ReactNode }) {
  const borderColor = {
    amber: 'border-amber-500/40', rose: 'border-rose-500/40',
    blue: 'border-blue-500/40', emerald: 'border-emerald-500/40', purple: 'border-purple-500/40',
  }[color] || 'border-border'
  const textColor = {
    amber: 'text-amber-700', rose: 'text-rose-700',
    blue: 'text-blue-700', emerald: 'text-emerald-700', purple: 'text-purple-700',
  }[color] || 'text-foreground'

  return (
    <div className={`border-l-2 ${borderColor} pl-4`}>
      <p className={`text-[10px] font-bold uppercase tracking-[0.12em] mb-3 ${textColor}`}>{label}</p>
      <div className="space-y-3">{children}</div>
    </div>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-0.5">{label}</p>
      <p className="text-sm text-foreground/80 leading-relaxed">{value}</p>
    </div>
  )
}

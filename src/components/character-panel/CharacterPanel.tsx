import { useState, useEffect } from 'react'
import { getCharacterById, createCharacter, generateCharacterNodes, deleteCharacter, refineCharacterPremise, applyCharacterProfile } from '@/services/api'
import type { Character, CharacterBrief } from '@/services/api'
import { CharacterSidebar } from './CharacterSidebar'
import { CharacterGraphPage } from '@/components/character-graph/CharacterGraphPage'
import { AIGeneratingIndicator } from '@/components/world-creation/AIGeneratingIndicator'
import { CharacterProfilePicker } from './CharacterProfilePicker'
import { Users, Sparkles, Wand2, Loader2 } from 'lucide-react'

interface Props {
  worldId: number
  worldPremise: string
  characterBriefs: CharacterBrief[]
  onCharacterListChanged: () => void
}

type Mode = 'empty' | 'new' | 'viewing'

export function CharacterPanel({ worldId, worldPremise, characterBriefs, onCharacterListChanged }: Props) {
  const [mode, setMode] = useState<Mode>('empty')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [premise, setPremise] = useState('')
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [selectedProfileId, setSelectedProfileId] = useState<number | null>(null)
  const [refining, setRefining] = useState(false)

  useEffect(() => {
    if (characterBriefs.length === 0) {
      setCharacters([])
      return
    }
    Promise.all(characterBriefs.map(b => getCharacterById(b.id)))
      .then(setCharacters)
      .catch(() => {})
  }, [characterBriefs])

  const handleSelect = (id: number) => {
    setSelectedId(id)
    setMode('viewing')
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteCharacter(id)
      setCharacters(prev => prev.filter(c => c.id !== id))
      if (selectedId === id) {
        setSelectedId(null)
        setMode('empty')
      }
      onCharacterListChanged()
    } catch (err) {
      console.error('Failed to delete character:', err)
    }
  }

  const handleNewCharacter = () => {
    setSelectedId(null)
    setPremise('')
    setError('')
    setSelectedProfileId(null)
    setMode('new')
  }

  const handleRefine = async () => {
    if (!premise.trim()) return
    setRefining(true)
    try {
      const result = await refineCharacterPremise(premise.trim())
      setPremise(result.premise)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al refinar')
    } finally {
      setRefining(false)
    }
  }

  const handleDerive = async () => {
    if (!premise.trim()) return
    setGenerating(true)
    setError('')
    try {
      const result = await createCharacter({
        name: premise.trim().slice(0, 50),
        role: '',
        personality: '',
        background: '',
        goals: [],
        world_id: worldId,
        premise: premise.trim(),
      })

      // Exclusive: profile defines psychology OR premise-driven generation — not both
      if (selectedProfileId) {
        await applyCharacterProfile(result.id, selectedProfileId)
      } else {
        await generateCharacterNodes(result.id, premise.trim())
      }

      const newChar = await getCharacterById(result.id)
      setCharacters(prev => [...prev, newChar])
      setSelectedId(result.id)
      setMode('viewing')
      onCharacterListChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al generar')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="grid grid-cols-[320px_1fr] h-full min-h-0">
      <CharacterSidebar
        worldPremise={worldPremise}
        characters={characters}
        selectedId={selectedId}
        onSelect={handleSelect}
        onNewCharacter={handleNewCharacter}
        onDelete={handleDelete}
      />

      <div className="h-full overflow-hidden">
        {mode === 'empty' && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Users className="w-12 h-12 text-muted-foreground/15 mb-3" />
            <p className="font-display text-lg italic text-foreground/15">Selecciona un personaje</p>
          </div>
        )}

        {mode === 'new' && !generating && (
          <div className="flex flex-col items-center justify-center h-full px-8 max-w-xl mx-auto gap-6">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600/60">
              Nuevo personaje
            </p>

            {/* Premise + enrich */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-[10px] tracking-[0.2em] uppercase"
                  style={{ fontFamily: 'var(--font-ui)', color: 'hsl(24 60% 45%)' }}
                >
                  {selectedProfileId ? 'Contexto del personaje' : 'La premisa del personaje'}
                </label>
                {!selectedProfileId && premise.trim().length > 10 && (
                  <button
                    onClick={handleRefine}
                    disabled={refining}
                    className="flex items-center gap-1.5 text-xs disabled:opacity-50 cursor-pointer"
                    style={{ fontFamily: 'var(--font-ui)', color: 'hsl(24 60% 40%)' }}
                  >
                    {refining ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span className="italic" style={{ fontFamily: 'var(--font-display)', color: 'hsl(24 40% 50%)' }}>
                          enriqueciendo...
                        </span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="h-3.5 w-3.5" />
                        <span>Enriquecer</span>
                      </>
                    )}
                  </button>
                )}
              </div>
              <textarea
                value={premise}
                onChange={e => setPremise(e.target.value)}
                placeholder="Una excavadora que descubrio que el Acuifero es un mito..."
                rows={3}
                className="w-full border-2 border-dashed border-amber-400/25 rounded-xl px-4 py-3
                           text-sm font-display italic text-foreground/80
                           placeholder:text-foreground/20 resize-none
                           focus:outline-none focus:border-amber-400/50 bg-transparent"
              />
            </div>

            {/* Profile picker */}
            <div className="w-full">
              <CharacterProfilePicker
                selectedId={selectedProfileId}
                onSelect={setSelectedProfileId}
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleDerive}
              disabled={!premise.trim()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
                         bg-gradient-to-r from-amber-600 to-orange-500 text-white font-medium text-sm
                         disabled:opacity-40 hover:shadow-lg hover:shadow-amber-500/20
                         transition-all duration-200"
            >
              <Sparkles className="w-4 h-4" />
              Derivar personaje
            </button>
          </div>
        )}

        {mode === 'new' && generating && (
          <div className="flex items-center justify-center h-full">
            <AIGeneratingIndicator />
          </div>
        )}

        {mode === 'viewing' && selectedId && (
          <CharacterGraphPage key={selectedId} characterId={selectedId} worldId={worldId} onDelete={() => handleDelete(selectedId!)} />
        )}
      </div>
    </div>
  )
}

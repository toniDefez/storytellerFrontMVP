import { useState, useEffect } from 'react'
import { getCharacterById, createCharacter, generateCharacterNodes, deleteCharacter } from '@/services/api'
import type { Character, CharacterBrief } from '@/services/api'
import { CharacterSidebar } from './CharacterSidebar'
import { CharacterGraphPage } from '@/components/character-graph/CharacterGraphPage'
import { AIGeneratingIndicator } from '@/components/world-creation/AIGeneratingIndicator'
import { Users, Sparkles } from 'lucide-react'

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
    setMode('new')
  }

  const handleDerive = async () => {
    if (!premise.trim()) return
    setGenerating(true)
    setError('')
    try {
      // 1. Create minimal character in DB
      const result = await createCharacter({
        name: premise.trim().slice(0, 50),
        role: '',
        personality: '',
        background: '',
        goals: [],
        world_id: worldId,
        state: {},
        premise: premise.trim(),
      })

      // 2. Generate nodes for this character
      await generateCharacterNodes(result.id, premise.trim())

      // 3. Load and show
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
          <div className="flex flex-col items-center justify-center h-full px-8 max-w-xl mx-auto">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-600/60 mb-6">
              Nuevo personaje
            </p>
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
            {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
            <button
              onClick={handleDerive}
              disabled={!premise.trim()}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl
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

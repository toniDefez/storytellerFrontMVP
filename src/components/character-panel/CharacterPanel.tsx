import { useState, useEffect } from 'react'
import { getCharacterById, createCharacter } from '@/services/api'
import type { Character, CharacterBrief } from '@/services/api'
import { CharacterSidebar } from './CharacterSidebar'
import { CharacterGraphPage } from '@/components/character-graph/CharacterGraphPage'
import { Users } from 'lucide-react'

interface Props {
  worldId: number
  worldPremise: string
  characterBriefs: CharacterBrief[]
  onCharacterListChanged: () => void
}

export function CharacterPanel({ worldId, worldPremise, characterBriefs, onCharacterListChanged }: Props) {
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])

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
  }

  const handleNewCharacter = async () => {
    try {
      // Create a minimal character in DB, then open its graph
      const result = await createCharacter({
        name: `Personaje ${characters.length + 1}`,
        role: '',
        personality: '',
        background: '',
        goals: [],
        world_id: worldId,
        state: {},
      })
      const newChar = await getCharacterById(result.id)
      setCharacters(prev => [...prev, newChar])
      setSelectedId(result.id)
      onCharacterListChanged()
    } catch (err) {
      console.error('Failed to create character:', err)
    }
  }

  return (
    <div className="grid grid-cols-[320px_1fr] h-full">
      <CharacterSidebar
        worldPremise={worldPremise}
        characters={characters}
        selectedId={selectedId}
        onSelect={handleSelect}
        onNewCharacter={handleNewCharacter}
      />

      <div className="h-full">
        {selectedId ? (
          <CharacterGraphPage characterId={selectedId} worldId={worldId} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Users className="w-12 h-12 text-muted-foreground/15 mb-3" />
            <p className="font-display text-lg italic text-foreground/15">Selecciona un personaje</p>
          </div>
        )}
      </div>
    </div>
  )
}

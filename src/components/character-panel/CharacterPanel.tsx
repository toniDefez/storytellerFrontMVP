import { useState, useEffect } from 'react'
import { getCharacterById } from '@/services/api'
import type { Character, CharacterBrief } from '@/services/api'
import { CharacterSidebar } from './CharacterSidebar'
import { CharacterCreationFlow } from './CharacterCreationFlow'
import { CharacterDetailView } from './CharacterDetailView'
import { Users } from 'lucide-react'

type Mode = 'empty' | 'creating' | 'viewing'

interface Props {
  worldId: number
  worldPremise: string
  characterBriefs: CharacterBrief[]
  onCharacterListChanged: () => void
}

export function CharacterPanel({ worldId, worldPremise, characterBriefs, onCharacterListChanged }: Props) {
  const [mode, setMode] = useState<Mode>('empty')
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
    setMode('viewing')
  }

  const handleNewCharacter = () => {
    setSelectedId(null)
    setMode('creating')
  }

  const handleCharacterCreated = (character: Character) => {
    setCharacters(prev => [...prev, character])
    setSelectedId(character.id)
    setMode('viewing')
    onCharacterListChanged()
  }

  const handleDeleted = () => {
    setCharacters(prev => prev.filter(c => c.id !== selectedId))
    setSelectedId(null)
    setMode('empty')
    onCharacterListChanged()
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
        {mode === 'empty' && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Users className="w-12 h-12 text-muted-foreground/15 mb-3" />
            <p className="font-display text-lg italic text-foreground/15">Selecciona un personaje</p>
          </div>
        )}
        {mode === 'creating' && (
          <CharacterCreationFlow
            worldId={worldId}
            onCharacterCreated={handleCharacterCreated}
          />
        )}
        {mode === 'viewing' && selectedId && (
          <CharacterDetailView
            characterId={selectedId}
            onDeleted={handleDeleted}
          />
        )}
      </div>
    </div>
  )
}

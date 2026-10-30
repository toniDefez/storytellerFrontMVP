import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { getCharacterById, createCharacter, generateCharacterNodes, deleteCharacter, refineCharacterPremise } from '@/services/api'
import type { Character, CharacterBrief } from '@/services/api'
import { CharacterSidebar } from './CharacterSidebar'
import { CharacterGraphPage } from '@/components/character-graph/CharacterGraphPage'
import { AIGeneratingIndicator } from '@/components/world-creation/AIGeneratingIndicator'
import { CharacterProfilePicker } from './CharacterProfilePicker'
import { Users, Sparkles, Wand2, Loader2, ChevronLeft } from 'lucide-react'
import { notifyError } from '@/lib/notifyError'
import { describeError } from '@/services/telemetry'
import { useGenerationProgress } from '@/hooks/useGenerationProgress'

const UNNAMED = 'Personaje sin nombre'

// Nombre neutro cuando no se da ninguno. El backend no admite dos personajes
// con el mismo nombre en un mundo: el segundo sería «Personaje sin nombre 2».
// Antes se usaban los 50 primeros caracteres de la premisa.
function placeholderName(taken: string[]): string {
  const names = new Set(taken)
  if (!names.has(UNNAMED)) return UNNAMED
  let n = 2
  while (names.has(`${UNNAMED} ${n}`)) n++
  return `${UNNAMED} ${n}`
}

interface Props {
  worldId: number
  worldPremise: string
  characterBriefs: CharacterBrief[]
  onCharacterListChanged: () => void
}

type Mode = 'empty' | 'new' | 'viewing'

export function CharacterPanel({ worldId, worldPremise, characterBriefs, onCharacterListChanged }: Props) {
  const { t } = useTranslation()
  const { progress, start: startProgress, stop: stopProgress } = useGenerationProgress()
  const [mode, setMode] = useState<Mode>('empty')
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [name, setName] = useState('')
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
      .catch(notifyError('No se pudieron cargar los personajes'))
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
      notifyError('No se pudo eliminar el personaje')(err)
    }
  }

  const handleNewCharacter = () => {
    setSelectedId(null)
    setName('')
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
    // Se crea en dos pasos: si falla el segundo, el personaje ya existe.
    let createdId: number | null = null
    try {
      const taken = [...characterBriefs.map(b => b.name), ...characters.map(c => c.name)]
      const result = await createCharacter({
        name: name.trim() || placeholderName(taken),
        world_id: worldId,
        premise: premise.trim(),
      })
      createdId = result.id

      // The archetype is a seed the derivation reinterprets for this premise,
      // not a replacement for it: both shape the character.
      const requestId = startProgress()
      try {
        await generateCharacterNodes(result.id, premise.trim(), selectedProfileId ?? undefined, requestId)
      } catch (err) {
        // Los nodos son los que fallan, no la creación: el personaje existe.
        toast.error(`El personaje se ha creado, pero no se pudieron generar sus nodos (${describeError(err, 'error desconocido')}). Puedes reintentarlo desde su ficha.`)
        throw err
      } finally {
        stopProgress()
      }

      const newChar = await getCharacterById(result.id)
      setCharacters(prev => [...prev, newChar])
      setSelectedId(result.id)
      setMode('viewing')
      onCharacterListChanged()
    } catch (err) {
      if (createdId !== null) {
        // Antes el personaje a medias no aparecía en la lista y reintentar
        // con el mismo nombre daba 409. Ahora se abre: su vista vacía
        // permite volver a generar los nodos con la misma premisa.
        onCharacterListChanged()
        setSelectedId(createdId)
        setMode('viewing')
        return
      }
      const message = err instanceof Error ? err.message : ''
      // El backend responde 409 si el nombre ya existe en el mundo: los nombres
      // identifican al personaje en el chat y en las escenas.
      const duplicate = message.match(/already exists in this world: "(.+)"/)
      setError(duplicate
        ? `Ya hay un personaje llamado «${duplicate[1]}» en este mundo. Elige otro nombre.`
        : message || 'Error al generar')
    } finally {
      setGenerating(false)
    }
  }

  return (
    // Móvil: lista o ficha, nunca las dos; «← Personajes» devuelve a la lista.
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] h-full min-h-0">
      <div className={`h-full min-h-0 ${mode === 'empty' ? '' : 'hidden md:block'}`}>
        <CharacterSidebar
          worldPremise={worldPremise}
          characters={characters}
          selectedId={selectedId}
          onSelect={handleSelect}
          onNewCharacter={handleNewCharacter}
          onDelete={handleDelete}
        />
      </div>

      <div className={`h-full overflow-hidden flex flex-col ${mode === 'empty' ? 'hidden md:flex' : ''}`}>
        {mode !== 'empty' && (
          <div className="md:hidden shrink-0 border-b border-border/40 px-2 py-1">
            <button
              type="button"
              onClick={() => { setMode('empty'); setSelectedId(null) }}
              className="flex items-center gap-1.5 min-h-10 px-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4" />
              Personajes
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-hidden">
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

            {/* Name — optional */}
            <div className="w-full">
              <label
                className="block text-[10px] tracking-[0.2em] uppercase mb-2"
                style={{ fontFamily: 'var(--font-ui)', color: 'hsl(24 60% 45%)' }}
              >
                Nombre <span style={{ color: 'hsl(30 6% 65%)', textTransform: 'none', letterSpacing: 0 }}>— opcional</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ej. Mira, El Viejo, Comandante Vera..."
                className="w-full border-b border-amber-400/30 bg-transparent px-0 py-2
                           text-sm font-display text-foreground/80
                           placeholder:text-foreground/20
                           focus:outline-none focus:border-amber-400/60"
              />
            </div>

            {/* Premise + enrich */}
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <label
                  className="text-[10px] tracking-[0.2em] uppercase"
                  style={{ fontFamily: 'var(--font-ui)', color: 'hsl(24 60% 45%)' }}
                >
                  La premisa del personaje
                </label>
                {premise.trim().length > 10 && (
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
                placeholder="Una excavadora que descubrió que el Acuífero es un mito..."
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
              {t('character.create.deriveButton')}
            </button>
          </div>
        )}

        {mode === 'new' && generating && (
          <div className="flex items-center justify-center h-full">
            <AIGeneratingIndicator label="Creando el personaje…" detail={progress} accent="character" />
          </div>
        )}

        {mode === 'viewing' && selectedId && (
          <CharacterGraphPage key={selectedId} characterId={selectedId} worldId={worldId} onDelete={() => handleDelete(selectedId!)} />
        )}
        </div>
      </div>
    </div>
  )
}

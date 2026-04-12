import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronDown, ChevronUp, Mic } from 'lucide-react'
import { getVoiceOptions, getVoiceSelections, saveVoiceSelections, type VoiceOption } from '@/services/api'

/* ── Dimension metadata ──────────────────────────────────── */

const DIMENSION_CONFIG: Record<string, { title: string; multi?: boolean; max?: number }> = {
  caudal:         { title: '¿Cuánto habla?' },
  tono_emocional: { title: '¿Cómo se siente hablar con él?' },
  registro:       { title: '¿Cómo es su registro?' },
  sabor:          { title: '¿Qué lo hace especial?', multi: true, max: 2 },
}

const DIMENSION_ORDER = ['caudal', 'tono_emocional', 'registro', 'sabor']

/* ── Pill selector (single and multi) ───────────────────── */

function PillSelector({ options, selectedIds, onToggle }: {
  options: VoiceOption[]
  selectedIds: Set<number>
  onToggle: (id: number) => void
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt.id}
          onClick={() => onToggle(opt.id)}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 flex flex-col items-start
            ${selectedIds.has(opt.id)
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800'
            }`}
        >
          <span>{opt.label}</span>
          <span className={`text-[9px] ${selectedIds.has(opt.id) ? 'text-amber-100' : 'text-stone-400'}`}>
            {opt.description}
          </span>
        </button>
      ))}
    </div>
  )
}

/* ── Main component ──────────────────────────────────────── */

interface Props {
  characterId: number
  expanded?: boolean
}

export function VoiceRegisterEditor({ characterId, expanded: initialExpanded }: Props) {
  const [expanded, setExpanded] = useState(initialExpanded ?? false)
  const [catalog, setCatalog] = useState<VoiceOption[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  const [loaded, setLoaded] = useState(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load catalog + selections on mount
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [options, selections] = await Promise.all([
          getVoiceOptions(),
          getVoiceSelections(characterId),
        ])
        if (cancelled) return
        setCatalog(options ?? [])
        setSelectedIds(new Set((selections ?? []).map(s => s.id)))
        setLoaded(true)
      } catch (err) {
        console.error('Failed to load voice options:', err)
      }
    }
    load()
    return () => { cancelled = true }
  }, [characterId])

  const persist = useCallback((ids: Set<number>) => {
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      try {
        await saveVoiceSelections(characterId, [...ids])
      } catch (err) {
        console.error('Failed to save voice selections:', err)
      }
    }, 400)
  }, [characterId])

  const handleToggle = useCallback((dimension: string, optionId: number, multi: boolean, max: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      const dimOptions = catalog.filter(o => o.dimension === dimension)
      const dimIds = new Set(dimOptions.map(o => o.id))
      const currentDimSelected = [...prev].filter(id => dimIds.has(id))

      if (multi) {
        if (next.has(optionId)) {
          next.delete(optionId)
        } else if (currentDimSelected.length < max) {
          next.add(optionId)
        } else {
          // Replace oldest
          next.delete(currentDimSelected[currentDimSelected.length - 1])
          next.add(optionId)
        }
      } else {
        // Single select
        for (const id of currentDimSelected) next.delete(id)
        if (!prev.has(optionId)) next.add(optionId)
      }

      return next
    })
  }, [catalog])

  // Persist after selectedIds settles (avoids calling persist inside setState)
  useEffect(() => {
    if (!loaded) return
    persist(selectedIds)
  }, [selectedIds, loaded, persist])

  // Group catalog by dimension
  const grouped = DIMENSION_ORDER.map(dim => ({
    dimension: dim,
    config: DIMENSION_CONFIG[dim] || { title: dim },
    options: catalog.filter(o => o.dimension === dim),
  })).filter(g => g.options.length > 0)

  // Build summary from selected options
  const summaryParts = [...selectedIds]
    .map(id => catalog.find(o => o.id === id))
    .filter(Boolean)
    .map(o => o!.label)

  return (
    <div className="border border-border/40 rounded-lg bg-background/80 backdrop-blur-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <Mic className="w-4 h-4 text-amber-500" />
        <span className="text-[11px] font-bold uppercase tracking-widest text-amber-600">Voz</span>
        <span className="flex-1 text-[11px] text-foreground/60 truncate ml-2">
          {summaryParts.length > 0 ? summaryParts.join(' · ') : 'Define cómo habla el personaje'}
        </span>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-foreground/40" />
          : <ChevronDown className="w-4 h-4 text-foreground/40" />
        }
      </button>

      {expanded && loaded && (
        <div className="px-3 pb-3 space-y-4 border-t border-border/30 pt-3">
          {grouped.map(({ dimension, config, options }) => (
            <div key={dimension}>
              <p className="text-[11px] font-bold text-foreground/70 mb-2">
                {config.title}
                {config.multi && (
                  <span className="font-normal text-foreground/40"> (elige hasta {config.max})</span>
                )}
              </p>
              <PillSelector
                options={options}
                selectedIds={selectedIds}
                onToggle={(id) => handleToggle(dimension, id, !!config.multi, config.max ?? 1)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

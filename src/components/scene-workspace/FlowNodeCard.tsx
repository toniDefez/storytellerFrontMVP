import { useState, useEffect, useRef } from 'react'
import { X, FileText } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { EmotionalPicker } from './EmotionalPicker'
import type {
  FlowNode,
  FlowNodeType,
  SceneCharacter,
  ActionConfig,
  EmotionalConfig,
  ConversationConfig,
  PerceptionConfig,
  MarkingEventConfig,
  DeviceConfig,
} from '@/services/api'
import { updateFlowNode } from '@/services/api'

/* ── Type color stripe ─────────────────────────────────────────── */

const TYPE_COLOR: Record<FlowNodeType, string> = {
  action: 'bg-red-500',
  emotional: 'bg-pink-500',
  conversation: 'bg-blue-500',
  perception: 'bg-violet-500',
  marking_event: 'bg-amber-500',
  device: 'bg-cyan-500',
}

const TYPE_LABEL: Record<FlowNodeType, string> = {
  action: 'Acción',
  emotional: 'Emocional',
  conversation: 'Conversación',
  perception: 'Percepción',
  marking_event: 'Evento Marcante',
  device: 'Dispositivo',
}

/* ── Intensity button group ────────────────────────────────────── */

interface IntensityGroupProps {
  options: { value: string; label: string }[]
  selected: string
  onChange: (v: string) => void
  activeClass: string
}

function IntensityGroup({ options, selected, onChange, activeClass }: IntensityGroupProps) {
  return (
    <div className="flex gap-1">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`px-2 py-0.5 rounded text-xs border transition-colors ${
            selected === opt.value
              ? `${activeClass} border-transparent`
              : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

/* ── Character dropdown ────────────────────────────────────────── */

interface CharSelectProps {
  characters: SceneCharacter[]
  value: number | undefined
  onChange: (id: number | undefined) => void
}

function CharSelect({ characters, value, onChange }: CharSelectProps) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value ? Number(e.target.value) : undefined)}
      className="w-full text-xs rounded border border-stone-200 px-2 py-1 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-300"
    >
      <option value="">— Personaje —</option>
      {characters.map(c => (
        <option key={c.character_id} value={c.character_id}>
          {c.name ?? `#${c.character_id}`}
        </option>
      ))}
    </select>
  )
}

/* ── Props ─────────────────────────────────────────────────────── */

interface Props {
  node: FlowNode
  sceneCharacters: SceneCharacter[]
  onUpdate: (id: number, nodeType: FlowNodeType, config: Record<string, unknown>) => void
  onDelete: (id: number) => void
}

/* ── Main component ─────────────────────────────────────────────── */

export function FlowNodeCard({ node, sceneCharacters, onUpdate, onDelete }: Props) {
  const [config, setConfig] = useState<Record<string, unknown>>(node.config ?? {})
  const [showNote, setShowNote] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync if node changes externally
  useEffect(() => {
    setConfig(node.config ?? {})
  }, [node.id]) // eslint-disable-line react-hooks/exhaustive-deps

  function applyChange(patch: Record<string, unknown>) {
    const next = { ...config, ...patch }
    setConfig(next)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      updateFlowNode(node.id, node.node_type, next)
        .then(() => onUpdate(node.id, node.node_type, next))
        .catch(() => {/* silent – optimistic UI */})
    }, 500)
  }

  const colorStripe = TYPE_COLOR[node.node_type]

  return (
    <div className="bg-white border border-stone-200 rounded-lg shadow-sm overflow-hidden flex">
      {/* Color stripe */}
      <div className={`w-1 shrink-0 ${colorStripe}`} />

      {/* Content */}
      <div className="flex-1 min-w-0 p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-stone-400 mb-2">
          {TYPE_LABEL[node.node_type]}
        </p>
        {node.node_type === 'action' && (
          <ActionContent
            config={config as Partial<ActionConfig>}
            onChange={applyChange}
            showNote={showNote}
            onToggleNote={() => setShowNote(v => !v)}
          />
        )}
        {node.node_type === 'emotional' && (
          <EmotionalContent
            config={config as Partial<EmotionalConfig>}
            characters={sceneCharacters}
            onChange={applyChange}
          />
        )}
        {node.node_type === 'conversation' && (
          <ConversationContent
            config={config as Partial<ConversationConfig>}
            onChange={applyChange}
          />
        )}
        {node.node_type === 'perception' && (
          <PerceptionContent
            config={config as Partial<PerceptionConfig>}
            characters={sceneCharacters}
            onChange={applyChange}
          />
        )}
        {node.node_type === 'marking_event' && (
          <MarkingEventContent
            config={config as Partial<MarkingEventConfig>}
            characters={sceneCharacters}
            onChange={applyChange}
          />
        )}
        {node.node_type === 'device' && (
          <DeviceContent
            config={config as Partial<DeviceConfig>}
            onChange={applyChange}
          />
        )}
      </div>

      {/* Delete button */}
      <button
        onClick={() => onDelete(node.id)}
        className="self-start mt-2 mr-2 text-stone-300 hover:text-rose-500 transition-colors"
        aria-label="Eliminar nodo"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

/* ── Action ─────────────────────────────────────────────────────── */

const ACTION_TYPES = [
  { value: 'confront', label: 'Confrontar' },
  { value: 'pursue', label: 'Perseguir' },
  { value: 'negotiate', label: 'Negociar' },
  { value: 'discover', label: 'Descubrir' },
  { value: 'flee', label: 'Huir' },
  { value: 'sacrifice', label: 'Sacrificar' },
]

const ACTION_INTENSITIES = [
  { value: 'subtle', label: 'Sutil' },
  { value: 'moderate', label: 'Moderada' },
  { value: 'explosive', label: 'Explosiva' },
]

function ActionContent({
  config,
  onChange,
  showNote,
  onToggleNote,
}: {
  config: Partial<ActionConfig>
  onChange: (p: Record<string, unknown>) => void
  showNote: boolean
  onToggleNote: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <select
        value={config.action_type ?? ''}
        onChange={e => onChange({ action_type: e.target.value })}
        className="w-full text-xs rounded border border-stone-200 px-2 py-1 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-300"
      >
        <option value="">— Tipo de acción —</option>
        {ACTION_TYPES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <IntensityGroup
        options={ACTION_INTENSITIES}
        selected={config.intensity ?? ''}
        onChange={v => onChange({ intensity: v })}
        activeClass="bg-red-100 text-red-700 font-medium"
      />
      <button
        onClick={onToggleNote}
        className="flex items-center gap-1 text-[10px] text-stone-400 hover:text-stone-600 transition-colors w-fit"
      >
        <FileText className="w-3 h-3" />
        {showNote ? 'Ocultar nota' : 'Nota de director'}
      </button>
      {showNote && (
        <Textarea
          value={(config.director_note ?? '') as string}
          onChange={e => onChange({ director_note: e.target.value })}
          placeholder="Nota interna…"
          rows={2}
          className="text-xs resize-none"
        />
      )}
    </div>
  )
}

/* ── Emotional ──────────────────────────────────────────────────── */

const EMOTIONAL_INTENSITIES = [
  { value: 'contained', label: 'Contenida' },
  { value: 'open', label: 'Abierta' },
  { value: 'explosive', label: 'Explosiva' },
]

function EmotionalContent({
  config,
  characters,
  onChange,
}: {
  config: Partial<EmotionalConfig>
  characters: SceneCharacter[]
  onChange: (p: Record<string, unknown>) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <EmotionalPicker
        selected={(config.emotion ?? '') as string}
        onChange={v => onChange({ emotion: v })}
      />
      <CharSelect
        characters={characters}
        value={config.character_id as number | undefined}
        onChange={id => onChange({ character_id: id })}
      />
      <IntensityGroup
        options={EMOTIONAL_INTENSITIES}
        selected={config.intensity ?? ''}
        onChange={v => onChange({ intensity: v })}
        activeClass="bg-pink-100 text-pink-700 font-medium"
      />
    </div>
  )
}

/* ── Conversation ───────────────────────────────────────────────── */

const CONV_TYPES = [
  { value: 'dialogue', label: 'Diálogo' },
  { value: 'interrogation', label: 'Interrogatorio' },
  { value: 'confession', label: 'Confesión' },
  { value: 'debate', label: 'Debate' },
]

function ConversationContent({
  config,
  onChange,
}: {
  config: Partial<ConversationConfig>
  onChange: (p: Record<string, unknown>) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <select
        value={config.conv_type ?? ''}
        onChange={e => onChange({ conv_type: e.target.value })}
        className="w-full text-xs rounded border border-stone-200 px-2 py-1 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-300"
      >
        <option value="">— Tipo —</option>
        {CONV_TYPES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <Input
        value={(config.tone ?? '') as string}
        onChange={e => onChange({ tone: e.target.value })}
        placeholder="Tono (ej: tenso, casual)"
        className="h-7 text-xs"
      />
      <Input
        value={(config.topic ?? '') as string}
        onChange={e => onChange({ topic: e.target.value })}
        placeholder="Tema (ej: el cruce del puente)"
        className="h-7 text-xs"
      />
    </div>
  )
}

/* ── Perception ─────────────────────────────────────────────────── */

function PerceptionContent({
  config,
  characters,
  onChange,
}: {
  config: Partial<PerceptionConfig>
  characters: SceneCharacter[]
  onChange: (p: Record<string, unknown>) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <CharSelect
        characters={characters}
        value={config.character_id as number | undefined}
        onChange={id => onChange({ character_id: id })}
      />
      <Input
        value={(config.description ?? '') as string}
        onChange={e => onChange({ description: e.target.value })}
        placeholder="Qué observa…"
        className="h-7 text-xs"
      />
    </div>
  )
}

/* ── MarkingEvent ───────────────────────────────────────────────── */

function MarkingEventContent({
  config,
  characters,
  onChange,
}: {
  config: Partial<MarkingEventConfig>
  characters: SceneCharacter[]
  onChange: (p: Record<string, unknown>) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <CharSelect
        characters={characters}
        value={config.character_id as number | undefined}
        onChange={id => onChange({ character_id: id })}
      />
      <Input
        value={(config.description ?? '') as string}
        onChange={e => onChange({ description: e.target.value })}
        placeholder="Qué ocurre (ej: pierde el brazo izquierdo)"
        className="h-7 text-xs"
      />
    </div>
  )
}

/* ── Device ─────────────────────────────────────────────────────── */

const DEVICE_TYPES = [
  { value: 'dramatic_irony', label: 'Ironía dramática' },
  { value: 'reversal', label: 'Reversal' },
  { value: 'cliffhanger', label: 'Cliffhanger' },
  { value: 'reveal', label: 'Revelación' },
  { value: 'ticking_clock', label: 'Reloj' },
  { value: 'betrayal', label: 'Traición' },
  { value: 'recognition', label: 'Reconocimiento' },
]

function DeviceContent({
  config,
  onChange,
}: {
  config: Partial<DeviceConfig>
  onChange: (p: Record<string, unknown>) => void
}) {
  return (
    <select
      value={config.device_type ?? ''}
      onChange={e => onChange({ device_type: e.target.value })}
      className="w-full text-xs rounded border border-stone-200 px-2 py-1 bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-stone-300"
    >
      <option value="">— Dispositivo —</option>
      {DEVICE_TYPES.map(t => (
        <option key={t.value} value={t.value}>{t.label}</option>
      ))}
    </select>
  )
}

import { useState } from 'react'
import { ChevronDown, ChevronUp, Mic } from 'lucide-react'
import type { VoiceRegister } from '@/services/api'

/* ── Predefined options for each temperament dimension ──────── */

const RHYTHM_OPTIONS = [
  { value: 'Explosivo — estalla rápido, se calma rápido', label: 'Explosivo' },
  { value: 'Contenido — procesa internamente, rara vez muestra', label: 'Contenido' },
  { value: 'Volátil — cambia sin aviso, impredecible', label: 'Volátil' },
  { value: 'Plano — emoción mínima visible, monotono', label: 'Plano' },
  { value: 'Lento — las emociones llegan tarde pero duran', label: 'Lento' },
  { value: 'Intenso — todo lo siente al máximo, sin filtro', label: 'Intenso' },
]

const POSTURE_OPTIONS = [
  { value: 'Hacia otros — busca conexión, se acerca', label: 'Hacia otros' },
  { value: 'Hacia dentro — se retira, prefiere observar', label: 'Hacia dentro' },
  { value: 'Dominante — toma el espacio, lidera', label: 'Dominante' },
  { value: 'Deferente — cede, sigue, evita conflicto', label: 'Deferente' },
  { value: 'Observador — al margen, atento, interviene poco', label: 'Observador' },
  { value: 'Provocador — busca reacción, desafía', label: 'Provocador' },
]

const TEMPO_OPTIONS = [
  { value: 'Impulsivo — decide al instante, se arrepiente después', label: 'Impulsivo' },
  { value: 'Deliberado — piensa antes de actuar, metódico', label: 'Deliberado' },
  { value: 'Analítico — desmonta todo, necesita entender antes', label: 'Analítico' },
  { value: 'Intuitivo — sigue corazonadas, no sabe explicar por qué', label: 'Intuitivo' },
  { value: 'Errático — a veces rápido, a veces paralizado', label: 'Errático' },
  { value: 'Calculador — planifica 3 pasos adelante', label: 'Calculador' },
]

const STYLE_OPTIONS = [
  { value: 'Cortante — frases cortas, directas, sin adornos', label: 'Cortante' },
  { value: 'Verborrágico — habla mucho, llena silencios', label: 'Verborrágico' },
  { value: 'Silencios largos — dice más callando que hablando', label: 'Silencios' },
  { value: 'Humor seco — ironía como escudo', label: 'Humor seco' },
  { value: 'Formal — vocabulario cuidado, distancia verbal', label: 'Formal' },
  { value: 'Poético — metáforas, lenguaje evocador', label: 'Poético' },
  { value: 'Brusco — sin filtro, dice lo que piensa', label: 'Brusco' },
  { value: 'Evasivo — nunca responde directo, rodeos', label: 'Evasivo' },
]

interface PillGroupProps {
  label: string
  options: { value: string; label: string }[]
  selected: string
  onChange: (value: string) => void
}

function PillGroup({ label, options, selected, onChange }: PillGroupProps) {
  const isSelected = (optLabel: string) =>
    selected.toLowerCase().includes(optLabel.toLowerCase().split(' ')[0])

  return (
    <div className="space-y-1.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/50">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map(opt => (
          <button
            key={opt.label}
            onClick={() => onChange(opt.value)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all duration-150
              ${isSelected(opt.label)
                ? 'bg-amber-500 text-white shadow-sm'
                : 'bg-muted/40 text-foreground/60 hover:bg-muted/70 hover:text-foreground/80'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Main component ────────────────────────────────────────── */

interface Props {
  voiceRegister: VoiceRegister
  onChange: (vr: VoiceRegister) => void
}

export function VoiceRegisterEditor({ voiceRegister, onChange }: Props) {
  const [expanded, setExpanded] = useState(false)

  const hasValues = voiceRegister.emotional_rhythm || voiceRegister.social_posture ||
                    voiceRegister.cognitive_tempo || voiceRegister.expressive_style

  const summaryParts = [
    voiceRegister.emotional_rhythm,
    voiceRegister.social_posture,
    voiceRegister.cognitive_tempo,
    voiceRegister.expressive_style,
  ].filter(Boolean).map(s => s.split('—')[0].trim())

  return (
    <div className="border border-border/40 rounded-lg bg-background/80 backdrop-blur-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
      >
        <Mic className="w-3.5 h-3.5 text-amber-500" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Voz</span>
        <span className="flex-1 text-[11px] text-foreground/50 truncate ml-2">
          {hasValues ? summaryParts.join(' · ') : 'Sin definir — elige el temperamento'}
        </span>
        {expanded
          ? <ChevronUp className="w-3.5 h-3.5 text-foreground/30" />
          : <ChevronDown className="w-3.5 h-3.5 text-foreground/30" />
        }
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/30 pt-3">
          <PillGroup
            label="Ritmo emocional"
            options={RHYTHM_OPTIONS}
            selected={voiceRegister.emotional_rhythm}
            onChange={v => onChange({ ...voiceRegister, emotional_rhythm: v })}
          />
          <PillGroup
            label="Postura social"
            options={POSTURE_OPTIONS}
            selected={voiceRegister.social_posture}
            onChange={v => onChange({ ...voiceRegister, social_posture: v })}
          />
          <PillGroup
            label="Tempo cognitivo"
            options={TEMPO_OPTIONS}
            selected={voiceRegister.cognitive_tempo}
            onChange={v => onChange({ ...voiceRegister, cognitive_tempo: v })}
          />
          <PillGroup
            label="Estilo expresivo"
            options={STYLE_OPTIONS}
            selected={voiceRegister.expressive_style}
            onChange={v => onChange({ ...voiceRegister, expressive_style: v })}
          />
        </div>
      )}
    </div>
  )
}

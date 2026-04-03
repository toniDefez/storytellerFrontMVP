import { useState } from 'react'
import { ChevronDown, ChevronUp, Mic } from 'lucide-react'
import type { VoiceRegister } from '@/services/api'

/* ── Voice options ──────────────────────────────────────────── */

const CAUDAL_OPTIONS = [
  { value: 'Telegráfico — habla en fragmentos, cada palabra cuesta', label: 'Telegráfico', desc: 'Cada palabra cuesta' },
  { value: 'Medido — dice lo justo, ni más ni menos, preciso', label: 'Medido', desc: 'Lo justo, ni más ni menos' },
  { value: 'Fluido — habla con naturalidad, frases completas, ritmo cómodo', label: 'Fluido', desc: 'Natural, cómodo' },
  { value: 'Desbordante — no puede parar, monólogos, tangentes, se pierde', label: 'Desbordante', desc: 'No puede parar' },
]

const TEMPERATURA_OPTIONS = [
  { value: 'Gélido — nada le toca, clínico, distante, sin emoción visible', label: 'Gélido', desc: 'Nada le toca' },
  { value: 'Templado — calidez controlada, educado, revela poco', label: 'Templado', desc: 'Calidez controlada' },
  { value: 'Cálido — abierto, presente, emocionalmente disponible', label: 'Cálido', desc: 'Abierto y presente' },
  { value: 'Incandescente — todo quema, pasión o rabia en cada frase', label: 'Incandescente', desc: 'Todo quema' },
]

const SABOR_OPTIONS = [
  { value: 'Humor — deflecta con ironía y sarcasmo', label: 'Humor', desc: 'Ironía como escudo' },
  { value: 'Evasivo — nunca responde a la pregunta real', label: 'Evasivo', desc: 'Nunca responde directo' },
  { value: 'Formal — habla como si hubiera audiencia', label: 'Formal', desc: 'Registro alto' },
  { value: 'Brusco — sin colchón, dice lo duro sin preparar', label: 'Brusco', desc: 'Dice lo duro' },
  { value: 'Poético — usa imágenes, metáforas, ritmo', label: 'Poético', desc: 'Metáforas y ritmo' },
  { value: 'Errático — salta entre ideas, se contradice', label: 'Errático', desc: 'Salta y se pierde' },
]

/* ── Pill selector ─────────────────────────────────────────── */

function PillSelector({ options, selected, onChange }: {
  options: { value: string; label: string; desc: string }[]
  selected: string
  onChange: (value: string) => void
}) {
  const isActive = (opt: { value: string; label: string }) =>
    selected.toLowerCase().startsWith(opt.label.toLowerCase())

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt.label}
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 flex flex-col items-start
            ${isActive(opt)
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800'
            }`}
        >
          <span>{opt.label}</span>
          <span className={`text-[9px] ${isActive(opt) ? 'text-amber-100' : 'text-stone-400'}`}>
            {opt.desc}
          </span>
        </button>
      ))}
    </div>
  )
}

function SaborSelector({ options, selected1, selected2, onChange1, onChange2 }: {
  options: { value: string; label: string; desc: string }[]
  selected1: string
  selected2: string
  onChange1: (value: string) => void
  onChange2: (value: string) => void
}) {
  const isActive = (opt: { label: string }) =>
    selected1.toLowerCase().startsWith(opt.label.toLowerCase()) ||
    selected2.toLowerCase().startsWith(opt.label.toLowerCase())

  const handleClick = (opt: { value: string; label: string }) => {
    const matchesSel1 = selected1.toLowerCase().startsWith(opt.label.toLowerCase())
    const matchesSel2 = selected2.toLowerCase().startsWith(opt.label.toLowerCase())

    if (matchesSel1) {
      onChange1('') // deselect
    } else if (matchesSel2) {
      onChange2('') // deselect
    } else if (!selected1) {
      onChange1(opt.value) // fill slot 1
    } else if (!selected2) {
      onChange2(opt.value) // fill slot 2
    } else {
      onChange2(opt.value) // replace slot 2
    }
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map(opt => (
        <button
          key={opt.label}
          onClick={() => handleClick(opt)}
          className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all duration-150 flex flex-col items-start
            ${isActive(opt)
              ? 'bg-amber-500 text-white shadow-sm'
              : 'bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-800'
            }`}
        >
          <span>{opt.label}</span>
          <span className={`text-[9px] ${isActive(opt) ? 'text-amber-100' : 'text-stone-400'}`}>
            {opt.desc}
          </span>
        </button>
      ))}
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

  // Map fields: emotional_rhythm=caudal, social_posture=temperatura, cognitive_tempo=sabor1, expressive_style=sabor2
  const caudal = voiceRegister.emotional_rhythm
  const temperatura = voiceRegister.social_posture
  const sabor1 = voiceRegister.cognitive_tempo
  const sabor2 = voiceRegister.expressive_style

  const summaryParts = [caudal, temperatura, sabor1, sabor2]
    .filter(Boolean)
    .map(s => s.split('—')[0].trim())

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

      {expanded && (
        <div className="px-3 pb-3 space-y-4 border-t border-border/30 pt-3">
          {/* Caudal verbal */}
          <div>
            <p className="text-[11px] font-bold text-foreground/70 mb-2">
              ¿Cuánto habla?
            </p>
            <PillSelector
              options={CAUDAL_OPTIONS}
              selected={caudal}
              onChange={v => onChange({ ...voiceRegister, emotional_rhythm: v })}
            />
          </div>

          {/* Temperatura */}
          <div>
            <p className="text-[11px] font-bold text-foreground/70 mb-2">
              ¿Cómo se siente hablar con él?
            </p>
            <PillSelector
              options={TEMPERATURA_OPTIONS}
              selected={temperatura}
              onChange={v => onChange({ ...voiceRegister, social_posture: v })}
            />
          </div>

          {/* Sabores */}
          <div>
            <p className="text-[11px] font-bold text-foreground/70 mb-1">
              ¿Qué lo hace especial? <span className="font-normal text-foreground/40">(elige hasta 2)</span>
            </p>
            <SaborSelector
              options={SABOR_OPTIONS}
              selected1={sabor1}
              selected2={sabor2}
              onChange1={v => onChange({ ...voiceRegister, cognitive_tempo: v })}
              onChange2={v => onChange({ ...voiceRegister, expressive_style: v })}
            />
          </div>
        </div>
      )}
    </div>
  )
}

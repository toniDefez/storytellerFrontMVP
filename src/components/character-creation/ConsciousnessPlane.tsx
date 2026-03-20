import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { ConsciousnessState } from '@/services/api'

type LieState = ConsciousnessState

interface PlanePosition { x: number; y: number }
interface ZoneConfig {
  key: LieState
  label: string
  description: string
  pos: PlanePosition         // normalised position on the 2D plane
  color: string              // tailwind text color
  bgColor: string            // dot background
}

// Consciousness (x: 0=low → 1=high)  ×  Agency (y: 0=low → 1=high)
const ZONES: ZoneConfig[] = [
  {
    key: 'dormido',
    label: 'Dormido',
    description: 'No cuestiona el orden. Vive dentro de la mentira sin saberlo.',
    pos: { x: 0.12, y: 0.15 },
    color: 'text-slate-500',
    bgColor: '#94a3b8',
  },
  {
    key: 'inquieto',
    label: 'Inquieto',
    description: 'Siente que algo falla, pero no puede nombrarlo todavía.',
    pos: { x: 0.42, y: 0.38 },
    color: 'text-amber-600',
    bgColor: '#d97706',
  },
  {
    key: 'despierto',
    label: 'Despierto',
    description: 'Ve la mentira con claridad, pero la agencia aún busca forma.',
    pos: { x: 0.75, y: 0.62 },
    color: 'text-orange-600',
    bgColor: '#ea580c',
  },
  {
    key: 'explotador',
    label: 'Explotador',
    description: 'Usa la mentira a su favor. Tomó el camino del poder, no del cambio.',
    pos: { x: 0.82, y: 0.22 },
    color: 'text-red-600',
    bgColor: '#dc2626',
  },
  {
    key: 'subversivo',
    label: 'Subversivo',
    description: 'Actúa contra el sistema con conciencia plena. El orden lo teme.',
    pos: { x: 0.85, y: 0.88 },
    color: 'text-rose-700',
    bgColor: '#be123c',
  },
]

function normaliseState(raw: string | undefined): LieState {
  if (!raw) return 'dormido'
  const t = raw.toLowerCase()
  for (const z of ZONES) {
    if (t.includes(z.key)) return z.key
  }
  return 'dormido'
}

const W = 280
const H = 200
const PAD = { l: 36, r: 12, t: 10, b: 32 }
const plotW = W - PAD.l - PAD.r
const plotH = H - PAD.t - PAD.b

function toSVG(pos: PlanePosition) {
  return {
    x: PAD.l + pos.x * plotW,
    y: PAD.t + (1 - pos.y) * plotH,
  }
}

interface ConsciousnessPlaneProps {
  consciousnessState?: ConsciousnessState
  state?: string
}

export function ConsciousnessPlane({ consciousnessState, state }: ConsciousnessPlaneProps) {
  const active = useMemo(
    () => consciousnessState ?? normaliseState(state),
    [consciousnessState, state],
  )
  const activeZone = ZONES.find(z => z.key === active)!
  const activeSVG = toSVG(activeZone.pos)

  return (
    <div className="mb-4">
      <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60 mb-2">
        Relación con la mentira colectiva
      </p>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ overflow: 'visible' }}
        aria-label="Plano de consciencia y agencia"
      >
        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map(t => (
          <g key={t}>
            <line
              x1={PAD.l + t * plotW} y1={PAD.t}
              x2={PAD.l + t * plotW} y2={PAD.t + plotH}
              stroke="#e5e7eb" strokeWidth={1}
            />
            <line
              x1={PAD.l} y1={PAD.t + (1 - t) * plotH}
              x2={PAD.l + plotW} y2={PAD.t + (1 - t) * plotH}
              stroke="#e5e7eb" strokeWidth={1}
            />
          </g>
        ))}

        {/* Axes */}
        <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + plotH}
          stroke="#d1d5db" strokeWidth={1.5} />
        <line x1={PAD.l} y1={PAD.t + plotH} x2={PAD.l + plotW} y2={PAD.t + plotH}
          stroke="#d1d5db" strokeWidth={1.5} />

        {/* Axis labels */}
        <text x={PAD.l + plotW / 2} y={H - 4}
          textAnchor="middle" fontSize={8} fill="#9ca3af"
          fontFamily="'Source Sans 3', sans-serif" letterSpacing="0.08em">
          CONSCIENCIA →
        </text>
        <text
          x={10} y={PAD.t + plotH / 2}
          textAnchor="middle" fontSize={8} fill="#9ca3af"
          fontFamily="'Source Sans 3', sans-serif" letterSpacing="0.08em"
          transform={`rotate(-90, 10, ${PAD.t + plotH / 2})`}
        >
          AGENCIA →
        </text>

        {/* Zone markers (inactive) */}
        {ZONES.map(zone => {
          const p = toSVG(zone.pos)
          const isActive = zone.key === active
          return (
            <g key={zone.key}>
              {!isActive && (
                <>
                  <circle cx={p.x} cy={p.y} r={5}
                    fill={zone.bgColor} opacity={0.18} />
                  <text x={p.x} y={p.y - 9}
                    textAnchor="middle" fontSize={7.5}
                    fill={zone.bgColor} opacity={0.45}
                    fontFamily="'Source Sans 3', sans-serif"
                    fontWeight="600" letterSpacing="0.04em"
                  >
                    {zone.label}
                  </text>
                </>
              )}
            </g>
          )
        })}

        {/* "Explotador" branch arrow — visual cue that it's a divergent path */}
        <path
          d={`M ${toSVG({ x: 0.45, y: 0.4 }).x} ${toSVG({ x: 0.45, y: 0.4 }).y}
              Q ${toSVG({ x: 0.65, y: 0.25 }).x} ${toSVG({ x: 0.65, y: 0.25 }).y}
                ${toSVG({ x: 0.82, y: 0.22 }).x} ${toSVG({ x: 0.82, y: 0.22 }).y}`}
          fill="none" stroke="#dc2626" strokeWidth={1}
          strokeOpacity={0.2} strokeDasharray="4 3"
        />

        {/* Active zone pulse ring */}
        <motion.circle
          cx={activeSVG.x} cy={activeSVG.y} r={16}
          fill={activeZone.bgColor}
          opacity={0.12}
          initial={{ scale: 0.5 }}
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          style={{ transformOrigin: `${activeSVG.x}px ${activeSVG.y}px` }}
        />

        {/* Active dot */}
        <motion.g
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.3 }}
          style={{ transformOrigin: `${activeSVG.x}px ${activeSVG.y}px` }}
        >
          <circle cx={activeSVG.x} cy={activeSVG.y} r={9}
            fill={activeZone.bgColor} stroke="white" strokeWidth={2} />
          <text x={activeSVG.x} y={activeSVG.y + 1}
            textAnchor="middle" dominantBaseline="middle"
            fontSize={7} fill="white" fontWeight="900"
            fontFamily="sans-serif">
            ★
          </text>
          <text x={activeSVG.x} y={activeSVG.y - 14}
            textAnchor="middle" fontSize={8.5}
            fill={activeZone.bgColor} fontWeight="700"
            fontFamily="'Source Sans 3', sans-serif" letterSpacing="0.05em"
          >
            {activeZone.label}
          </text>
        </motion.g>
      </svg>

      {/* Description */}
      <motion.p
        key={active}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.5 }}
        className="text-center text-[12px] italic text-muted-foreground font-[var(--font-display)] leading-relaxed px-4 mt-1"
      >
        "{activeZone.description}"
      </motion.p>
    </div>
  )
}

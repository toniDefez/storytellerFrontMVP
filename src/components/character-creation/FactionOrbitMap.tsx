import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { FactionPowerTier } from '@/services/api'

interface FactionOrbitMapProps {
  factions: string[]
  factionAffiliation: string | undefined
  socialPosition: string | undefined
  role: string | undefined
  /** Structured tier from generator — preferred over text inference */
  factionPowerTier?: FactionPowerTier
}

const CX = 150
const CY = 128
const RINGS = [48, 86, 120] as const
const NODE_R = 24

/** Infer power level 0=elite 1=middle 2=marginal from text */
function inferRank(text: string): 0 | 1 | 2 {
  const t = text.toLowerCase()
  if (/consejo|casa\s|noble|lord|rey|real|señor|alta\s|elite|orden\s|poder\s|imperial|magistr/i.test(t)) return 0
  if (/sin[- ]|proscrit|marginal|excluido|periferia|errante|bandid|ileg/i.test(t)) return 2
  return 1
}

function toRad(deg: number) { return (deg * Math.PI) / 180 }

interface NodeData {
  name: string
  rank: 0 | 1 | 2
  angle: number   // radians
  x: number
  y: number
  isPlayer: boolean
}

function buildNodes(factions: string[], affiliation: string, socialPosition: string, explicitTier?: FactionPowerTier): NodeData[] {
  if (factions.length === 0) return []

  // Assign angles evenly around the circle, starting from top (-90°)
  const angleStep = (2 * Math.PI) / factions.length
  const startAngle = toRad(-90)

  const playerRank: 0 | 1 | 2 = explicitTier ?? inferRank(affiliation || socialPosition || '')

  return factions.map((name, i) => {
    const rank = inferRank(name)
    const r = RINGS[rank]
    const angle = startAngle + i * angleStep
    const isPlayer = name.toLowerCase().includes((affiliation || '').toLowerCase().slice(0, 5)) ||
                     (affiliation || '').toLowerCase().includes(name.toLowerCase().slice(0, 5))

    // If player faction not found by name match, mark the one with matching rank
    return {
      name,
      rank: isPlayer ? rank : rank,
      angle,
      x: CX + r * Math.cos(angle),
      y: CY + r * Math.sin(angle),
      isPlayer,
    }
  }).map((node, i, arr) => {
    // If no player found, pick the one closest to player's rank
    const anyPlayer = arr.some(n => n.isPlayer)
    if (!anyPlayer && i === arr.findIndex(n => n.rank === playerRank)) {
      return { ...node, isPlayer: true }
    }
    return node
  })
}

/** Split a long faction name into max 2 lines for SVG text */
function splitLabel(name: string): [string, string | null] {
  const words = name.split(/\s+/)
  if (words.length <= 2) return [words.join(' '), null]
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

const ringColors = [
  { stroke: '#a855f7', fill: '#f3e8ff', text: '#7e22ce' },   // elite — purple
  { stroke: '#d97706', fill: '#fef3c7', text: '#92400e' },   // middle — amber
  { stroke: '#dc2626', fill: '#fee2e2', text: '#991b1b' },   // marginal — rose
]

const ringLabels = ['élite', 'clase media', 'margen']

export function FactionOrbitMap({ factions, factionAffiliation, socialPosition, role, factionPowerTier }: FactionOrbitMapProps) {
  const nodes = useMemo(
    () => buildNodes(factions, factionAffiliation ?? '', socialPosition ?? '', factionPowerTier),
    [factions, factionAffiliation, socialPosition, factionPowerTier],
  )

  const playerNode = nodes.find(n => n.isPlayer)

  return (
    <div className="mb-4">
      {/* SVG map */}
      <div className="flex justify-center">
        <svg
          viewBox="-28 -18 356 300"
          className="w-full max-w-[300px]"
          style={{ overflow: 'visible' }}
          aria-label="Mapa de poder del mundo"
        >
          {/* Rings */}
          {RINGS.map((r, i) => (
            <motion.circle
              key={r}
              cx={CX} cy={CY} r={r}
              fill="none"
              stroke={ringColors[i].stroke}
              strokeWidth={1}
              strokeOpacity={0.3 - i * 0.05}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14, delay: i * 0.12 }}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
            />
          ))}

          {/* Ring level labels (small, near each ring on the right) */}
          {RINGS.map((r, i) => (
            <text
              key={`lbl-${i}`}
              x={CX + r + 4}
              y={CY + 4}
              fontSize={6.5}
              fill={ringColors[i].text}
              opacity={0.5}
              fontStyle="italic"
              fontFamily="'Source Sans 3', sans-serif"
            >
              {ringLabels[i]}
            </text>
          ))}

          {/* Center dot */}
          <circle cx={CX} cy={CY} r={3} fill={ringColors[0].stroke} opacity={0.3} />

          {/* Dominance lines between nodes of different ranks */}
          {nodes.map((a, i) =>
            nodes.slice(i + 1).map((b, j) => {
              if (Math.abs(a.rank - b.rank) !== 1) return null
              const high = a.rank < b.rank ? a : b
              const low  = a.rank < b.rank ? b : a
              return (
                <line
                  key={`line-${i}-${j}`}
                  x1={high.x} y1={high.y}
                  x2={low.x}  y2={low.y}
                  stroke={ringColors[high.rank].stroke}
                  strokeWidth={1}
                  strokeOpacity={0.18}
                  strokeDasharray="3 3"
                />
              )
            })
          )}

          {/* Faction nodes */}
          {nodes.map((node, i) => {
            const color = ringColors[node.rank]
            const [line1, line2] = splitLabel(node.name)
            return (
              <motion.g
                key={node.name}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.2 + i * 0.1 }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              >
                <circle
                  cx={node.x} cy={node.y} r={NODE_R}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={node.isPlayer ? 2 : 1.5}
                  strokeOpacity={node.isPlayer ? 0.8 : 0.5}
                  strokeDasharray={node.rank === 2 ? '4 2' : undefined}
                />
                <text
                  x={node.x}
                  y={node.y - (line2 ? 5 : 0)}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={7}
                  fontWeight="700"
                  fill={color.text}
                  fontFamily="'Source Sans 3', sans-serif"
                  letterSpacing="0.04em"
                  style={{ textTransform: 'uppercase' }}
                >
                  {line1}
                </text>
                {line2 && (
                  <text
                    x={node.x} y={node.y + 7}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={7}
                    fontWeight="700"
                    fill={color.text}
                    fontFamily="'Source Sans 3', sans-serif"
                    letterSpacing="0.04em"
                    style={{ textTransform: 'uppercase' }}
                  >
                    {line2}
                  </text>
                )}
              </motion.g>
            )
          })}

          {/* Player marker */}
          {playerNode && (
            <motion.g
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 14, delay: 0.7 }}
              style={{ transformOrigin: `${playerNode.x}px ${playerNode.y}px` }}
            >
              {/* Halo */}
              <circle
                cx={playerNode.x} cy={playerNode.y} r={NODE_R + 8}
                fill="none"
                stroke="#d97706"
                strokeWidth={1.5}
                strokeOpacity={0.35}
                strokeDasharray="4 3"
              />
              {/* Dot */}
              <circle
                cx={playerNode.x} cy={playerNode.y} r={8}
                fill="#d97706"
                stroke="white"
                strokeWidth={2}
              />
              {/* Chevron icon */}
              <text
                x={playerNode.x} y={playerNode.y + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize={9}
                fill="white"
                fontWeight="900"
                fontFamily="sans-serif"
              >
                ★
              </text>
            </motion.g>
          )}
        </svg>
      </div>

      {/* Role pill */}
      {role && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.2 }}
          className="mx-auto max-w-[300px] mt-1"
        >
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-amber-600/60">Rol</span>
            <span className="text-[13px] font-[var(--font-display)] text-foreground">{role}</span>
          </div>
        </motion.div>
      )}
    </div>
  )
}

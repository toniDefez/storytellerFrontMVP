import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useTranslation } from 'react-i18next'
import type { StructuredFaction, FactionRelation, FactionPowerTier } from '@/services/api'

interface WorldFactionGraphProps {
  factions?: string[]
  structuredFactions?: StructuredFaction[]
  factionRelations?: FactionRelation[]
}

const CX = 160
const CY = 140
const RINGS = [50, 90, 125] as const
const NODE_R = 26

const ringColors = [
  { stroke: '#a855f7', fill: '#f3e8ff', text: '#7e22ce' },  // elite
  { stroke: '#d97706', fill: '#fef3c7', text: '#92400e' },  // middle
  { stroke: '#dc2626', fill: '#fee2e2', text: '#991b1b' },  // marginal
]

const POWER_ICONS: Record<string, string> = {
  military: '⚔️', economic: '⚙️', ritual: '🔮',
  land: '🌱', labor: '⚒️', information: '👁',
}

const WOUND_COLORS: Record<string, { fill: string; letter: string }> = {
  caused: { fill: '#f43f5e', letter: 'C' },
  benefits: { fill: '#f59e0b', letter: 'B' },
  suffers: { fill: '#8b5cf6', letter: 'S' },
  ignores: { fill: '#9ca3af', letter: 'I' },
}

const EDGE_STYLES: Record<string, { stroke: string; dash: string }> = {
  dependency: { stroke: '#d97706', dash: '5 3' },
  conflict: { stroke: '#f43f5e', dash: '4 4' },
  instrumentalization: { stroke: '#8b5cf6', dash: '6 2 2 2' },
}

function inferRank(text: string): FactionPowerTier {
  const t = text.toLowerCase()
  if (/consejo|casa\s|noble|lord|rey|real|señor|alta\s|elite|orden\s|poder\s|imperial|magistr/i.test(t)) return 0
  if (/sin[- ]|proscrit|marginal|excluido|periferia|errante|bandid|ileg/i.test(t)) return 2
  return 1
}

function toRad(deg: number) { return (deg * Math.PI) / 180 }

function splitLabel(name: string): [string, string | null] {
  const words = name.split(/\s+/)
  if (words.length <= 2) return [words.join(' '), null]
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

interface NodeData {
  name: string
  rank: FactionPowerTier
  angle: number
  x: number
  y: number
  powerBasis?: string
  woundRelation?: string
  internalPressure?: string
}

function buildNodes(
  factions: string[],
  structuredFactions?: StructuredFaction[],
): NodeData[] {
  if (factions.length === 0 && (!structuredFactions || structuredFactions.length === 0)) return []

  // Use structured data if available
  if (structuredFactions && structuredFactions.length > 0) {
    const angleStep = (2 * Math.PI) / structuredFactions.length
    const startAngle = toRad(-90)
    return structuredFactions.map((sf, i) => {
      const rank = ([0, 1, 2] as const).includes(sf.tier) ? sf.tier : 1
      const r = RINGS[rank]
      const angle = startAngle + i * angleStep
      return {
        name: sf.name,
        rank,
        angle,
        x: CX + r * Math.cos(angle),
        y: CY + r * Math.sin(angle),
        powerBasis: sf.power_basis,
        woundRelation: sf.world_wound_relation,
        internalPressure: sf.internal_pressure,
      }
    })
  }

  // Fallback: infer from faction names
  const angleStep = (2 * Math.PI) / factions.length
  const startAngle = toRad(-90)
  return factions.map((name, i) => {
    const rank = inferRank(name)
    const r = RINGS[rank]
    const angle = startAngle + i * angleStep
    return {
      name, rank, angle,
      x: CX + r * Math.cos(angle),
      y: CY + r * Math.sin(angle),
    }
  })
}

export function WorldFactionGraph({ factions = [], structuredFactions, factionRelations }: WorldFactionGraphProps) {
  const { t } = useTranslation()
  const nodes = useMemo(
    () => buildNodes(factions, structuredFactions),
    [factions, structuredFactions],
  )

  const hasStructured = !!(structuredFactions && structuredFactions.length > 0)

  if (nodes.length === 0) return null

  const ringLabels = [
    t('world.visualization.elite'),
    t('world.visualization.middle'),
    t('world.visualization.marginal'),
  ]

  // Build edges from factionRelations
  const edges = useMemo(() => {
    if (!factionRelations || !hasStructured) return []
    return factionRelations.map(rel => {
      const src = nodes.find(n => n.name === rel.source)
      const tgt = nodes.find(n => n.name === rel.target)
      if (!src || !tgt) return null
      return { ...rel, srcX: src.x, srcY: src.y, tgtX: tgt.x, tgtY: tgt.y }
    }).filter(Boolean) as (FactionRelation & { srcX: number; srcY: number; tgtX: number; tgtY: number })[]
  }, [factionRelations, nodes, hasStructured])

  return (
    <div>
      <div className="flex justify-center">
        <svg
          viewBox="-30 -20 380 340"
          className="w-full max-w-[380px]"
          style={{ overflow: 'visible' }}
          aria-label={t('world.visualization.factionMap')}
        >
          {/* Arrow marker definitions */}
          <defs>
            <marker id="arrow-dep" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0,0 8,3 0,6" fill="#d97706" opacity="0.6" />
            </marker>
            <marker id="arrow-inst" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0,0 8,3 0,6" fill="#8b5cf6" opacity="0.6" />
            </marker>
          </defs>

          {/* Rings */}
          {RINGS.map((r, i) => (
            <motion.circle
              key={r}
              cx={CX} cy={CY} r={r}
              fill="none"
              stroke={ringColors[i].stroke}
              strokeWidth={1}
              strokeOpacity={0.25 - i * 0.05}
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 120, damping: 14, delay: i * 0.1 }}
              style={{ transformOrigin: `${CX}px ${CY}px` }}
            />
          ))}

          {/* Ring labels */}
          {RINGS.map((r, i) => (
            <text
              key={`rl-${i}`}
              x={CX + r + 4} y={CY + 4}
              fontSize={7} fill={ringColors[i].text} opacity={0.5}
              fontStyle="italic" fontFamily="'Source Sans 3', sans-serif"
            >
              {ringLabels[i]}
            </text>
          ))}

          <circle cx={CX} cy={CY} r={3} fill={ringColors[0].stroke} opacity={0.25} />

          {/* Edges */}
          {edges.map((edge, i) => {
            const style = EDGE_STYLES[edge.type] ?? EDGE_STYLES.conflict
            const hasArrow = edge.type === 'dependency' || edge.type === 'instrumentalization'
            const markerId = edge.type === 'dependency' ? 'arrow-dep' : 'arrow-inst'
            // Shorten line so arrow doesn't overlap node
            const dx = edge.tgtX - edge.srcX
            const dy = edge.tgtY - edge.srcY
            const dist = Math.sqrt(dx * dx + dy * dy)
            const shortenSrc = NODE_R + 2
            const shortenTgt = NODE_R + (hasArrow ? 10 : 2)
            const x1 = edge.srcX + (dx / dist) * shortenSrc
            const y1 = edge.srcY + (dy / dist) * shortenSrc
            const x2 = edge.tgtX - (dx / dist) * shortenTgt
            const y2 = edge.tgtY - (dy / dist) * shortenTgt

            return (
              <motion.line
                key={`edge-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={style.stroke}
                strokeWidth={1.5}
                strokeOpacity={0.4}
                strokeDasharray={style.dash}
                markerEnd={hasArrow ? `url(#${markerId})` : undefined}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
              />
            )
          })}

          {/* Faction nodes */}
          {nodes.map((node, i) => {
            const color = ringColors[node.rank]
            const [line1, line2] = splitLabel(node.name)
            const wound = node.woundRelation ? WOUND_COLORS[node.woundRelation] : null
            const icon = node.powerBasis ? POWER_ICONS[node.powerBasis] : null

            return (
              <motion.g
                key={node.name}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 + i * 0.08 }}
                style={{ transformOrigin: `${node.x}px ${node.y}px` }}
              >
                <circle
                  cx={node.x} cy={node.y} r={NODE_R}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={1.5}
                  strokeDasharray={node.rank === 2 ? '4 2' : undefined}
                />
                {/* Name */}
                <text
                  x={node.x} y={node.y - (icon ? 6 : (line2 ? 4 : 0))}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={6.5} fontWeight="700" fill={color.text}
                  fontFamily="'Source Sans 3', sans-serif"
                  letterSpacing="0.04em"
                  style={{ textTransform: 'uppercase' }}
                >
                  {line1}
                </text>
                {line2 && (
                  <text
                    x={node.x} y={node.y + (icon ? 1 : 6)}
                    textAnchor="middle" dominantBaseline="middle"
                    fontSize={6.5} fontWeight="700" fill={color.text}
                    fontFamily="'Source Sans 3', sans-serif"
                    letterSpacing="0.04em"
                    style={{ textTransform: 'uppercase' }}
                  >
                    {line2}
                  </text>
                )}
                {/* Power basis icon */}
                {icon && (
                  <text
                    x={node.x} y={node.y + (line2 ? 12 : 10)}
                    textAnchor="middle" fontSize={10}
                  >
                    {icon}
                  </text>
                )}
                {/* Wound relation badge */}
                {wound && (
                  <g>
                    <circle
                      cx={node.x + NODE_R - 4} cy={node.y - NODE_R + 4}
                      r={6} fill={wound.fill}
                    />
                    <text
                      x={node.x + NODE_R - 4} y={node.y - NODE_R + 7}
                      textAnchor="middle" fontSize={7} fill="white" fontWeight="700"
                      fontFamily="sans-serif"
                    >
                      {wound.letter}
                    </text>
                  </g>
                )}
              </motion.g>
            )
          })}

          {/* Legend — only when structured data is available */}
          {hasStructured && (
            <g transform="translate(-20, 290)">
              {/* Wound legend */}
              {Object.entries(WOUND_COLORS).map(([key, val], i) => (
                <g key={key} transform={`translate(${i * 58}, 0)`}>
                  <circle cx={5} cy={5} r={4} fill={val.fill} />
                  <text x={13} y={8} fontSize={7} fill="#6b7280" fontFamily="'Source Sans 3', sans-serif">
                    {t(`world.visualization.${key}`)}
                  </text>
                </g>
              ))}
              {/* Edge legend */}
              {Object.entries(EDGE_STYLES).map(([key, val], i) => (
                <g key={key} transform={`translate(${i * 100}, 16)`}>
                  <line x1={0} y1={5} x2={20} y2={5} stroke={val.stroke} strokeWidth={1.5} strokeDasharray={val.dash} />
                  <text x={24} y={8} fontSize={7} fill="#6b7280" fontFamily="'Source Sans 3', sans-serif">
                    {t(`world.visualization.${key}`)}
                  </text>
                </g>
              ))}
            </g>
          )}
        </svg>
      </div>
    </div>
  )
}

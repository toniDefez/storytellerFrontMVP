import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { CharacterValue, CharacterValueRelation } from '@/services/api'

interface Props {
  values: CharacterValue[]
  relations: CharacterValueRelation[]
}

const CX = 200
const CY = 140
const INNER_R = 70
const OUTER_R = 120

function toRad(deg: number) { return (deg * Math.PI) / 180 }

/** Split a long name into max 2 lines */
function splitLabel(name: string): [string, string | null] {
  const words = name.split(/\s+/)
  if (words.length <= 2) return [words.join(' '), null]
  const mid = Math.ceil(words.length / 2)
  return [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]
}

const edgeStyles: Record<string, { stroke: string; dash?: string; width: number; opacity: number }> = {
  reinforces: { stroke: '#10b981', width: 1.5, opacity: 0.5 },
  tensions:   { stroke: '#ef4444', width: 1.5, opacity: 0.45, dash: '6 3' },
  depends:    { stroke: '#6366f1', width: 1, opacity: 0.35 },
}

export function ValueGraph({ values, relations }: Props) {
  const nuclear = useMemo(() => values.filter(v => v.value_type === 'nuclear'), [values])
  const peripheral = useMemo(() => values.filter(v => v.value_type === 'peripheral'), [values])

  const nodeMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number; value: CharacterValue }>()
    const startAngle = toRad(-90)

    const place = (list: CharacterValue[], radius: number) => {
      const step = list.length > 0 ? (2 * Math.PI) / list.length : 0
      list.forEach((v, i) => {
        const angle = startAngle + i * step
        map.set(v.name, {
          x: CX + radius * Math.cos(angle),
          y: CY + radius * Math.sin(angle),
          value: v,
        })
      })
    }

    place(nuclear, INNER_R)
    place(peripheral, OUTER_R)
    return map
  }, [nuclear, peripheral])

  const allNodes = useMemo(() => Array.from(nodeMap.entries()), [nodeMap])
  const totalNodes = allNodes.length
  const edgeDelay = 0.15 + totalNodes * 0.12 + 0.1

  if (values.length === 0) return null

  return (
    <div className="flex justify-center mb-3">
      <svg
        viewBox="0 0 400 280"
        className="w-full max-w-[420px]"
        style={{ overflow: 'visible' }}
        aria-label="Grafo de valores del personaje"
      >
        {/* Arrow marker for depends edges */}
        <defs>
          <marker id="vg-arrow" viewBox="0 0 10 7" refX="10" refY="3.5"
            markerWidth="8" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#6366f1" opacity={0.5} />
          </marker>
        </defs>

        {/* Orbit rings (decorative) */}
        <circle cx={CX} cy={CY} r={INNER_R} fill="none" stroke="#d97706" strokeWidth={0.5} strokeOpacity={0.15} />
        <circle cx={CX} cy={CY} r={OUTER_R} fill="none" stroke="#a8a29e" strokeWidth={0.5} strokeOpacity={0.12} />

        {/* Edges */}
        {relations.map((rel, i) => {
          const src = nodeMap.get(rel.source_value)
          const tgt = nodeMap.get(rel.target_value)
          if (!src || !tgt) return null
          const style = edgeStyles[rel.relation_type] || edgeStyles.depends
          return (
            <motion.line
              key={`edge-${i}`}
              x1={src.x} y1={src.y} x2={tgt.x} y2={tgt.y}
              stroke={style.stroke}
              strokeWidth={style.width}
              strokeOpacity={style.opacity}
              strokeDasharray={style.dash}
              markerEnd={rel.relation_type === 'depends' ? 'url(#vg-arrow)' : undefined}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: edgeDelay + i * 0.08 }}
            />
          )
        })}

        {/* Nodes */}
        {allNodes.map(([name, node], i) => {
          const v = node.value
          const isNuclear = v.value_type === 'nuclear'
          const r = isNuclear ? 24 + v.weight * 12 : 18 + v.weight * 8
          const [line1, line2] = splitLabel(name)
          const fontSize = isNuclear ? 8 : 7

          return (
            <motion.g
              key={name}
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.15 + i * 0.12 }}
              style={{ transformOrigin: `${node.x}px ${node.y}px` }}
            >
              <circle
                cx={node.x} cy={node.y} r={r}
                fill={isNuclear ? '#fef3c7' : '#f5f5f4'}
                stroke={isNuclear ? '#d97706' : '#a8a29e'}
                strokeWidth={isNuclear ? 2.5 : 1.5}
                strokeDasharray={isNuclear ? undefined : '4 2'}
              />
              <title>{v.description} ({(v.weight * 100).toFixed(0)}%)</title>
              <text
                x={node.x} y={node.y - (line2 ? 4 : 0)}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={fontSize} fontWeight="700"
                fill={isNuclear ? '#92400e' : '#57534e'}
                fontFamily="'Source Sans 3', sans-serif"
                letterSpacing="0.04em"
                style={{ textTransform: 'uppercase' }}
              >
                {line1}
              </text>
              {line2 && (
                <text
                  x={node.x} y={node.y + fontSize}
                  textAnchor="middle" dominantBaseline="middle"
                  fontSize={fontSize} fontWeight="700"
                  fill={isNuclear ? '#92400e' : '#57534e'}
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
      </svg>
    </div>
  )
}

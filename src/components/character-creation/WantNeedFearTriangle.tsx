import { motion } from 'framer-motion'
import type { StructuredGoal } from '@/services/api'

interface WantNeedFearTriangleProps {
  /** Structured goals with category — preferred */
  structuredGoals?: StructuredGoal[]
  /** Legacy plain goals fallback */
  goals?: string[]
  personalFear: string | undefined
  internalContradiction: string | undefined
  tensions: string | undefined
}

// Icon heuristic for each goal
function goalIcon(text: string): string {
  const t = text.toLowerCase()
  if (/proteger|defender|salvar|cuidar|custodiar/i.test(t)) return '🛡'
  if (/exponer|destruir|derrocar|revelar|acabar|desafiar|luchar|combatir/i.test(t)) return '⚔'
  if (/hermano|padre|madre|familia|hijo|amor|amistad/i.test(t)) return '♥'
  if (/descubrir|encontrar|buscar|investigar|entender|conocer/i.test(t)) return '🔍'
  if (/sobrevivir|escapar|huir|resistir/i.test(t)) return '🌿'
  return '◈'
}

import type { GoalCategory } from '@/services/api'

function goalCategory(text: string, tensions: string): GoalCategory {
  const t = text.toLowerCase()
  if (/exponer|destruir|derrocar|revelar sistema|acabar con|subvertir/i.test(t)) return 'subversive'
  if (tensions && tensions.toLowerCase().split(/\s+/).filter(w => w.length > 4).some(w => t.includes(w))) return 'world_tension'
  return 'personal'
}

const CATEGORY_STYLES: Record<GoalCategory, string> = {
  world_tension: 'bg-purple-50 text-purple-700 border-purple-200',
  subversive:    'bg-rose-50 text-rose-700 border-rose-200',
  personal:      'bg-slate-50 text-slate-500 border-slate-200',
}
const CATEGORY_LABELS: Record<GoalCategory, string> = {
  world_tension: 'Tensión del mundo',
  subversive:    'Subversivo',
  personal:      'Personal',
}

// Triangle SVG vertices (equilateral-ish, in a 280×200 viewBox)
const VERTS = {
  want: { x: 140, y: 18 },    // top — goals (conscious, visible)
  fear: { x: 28,  y: 182 },   // bottom-left — fear (the blocker)
  need: { x: 252, y: 182 },   // bottom-right — contradiction/need (invisible to character)
}

export function WantNeedFearTriangle({
  structuredGoals,
  goals,
  personalFear,
  internalContradiction,
  tensions,
}: WantNeedFearTriangleProps) {
  const t = tensions ?? ''
  // Normalise: prefer structuredGoals, fall back to plain goals with heuristic categorisation
  const resolvedGoals: StructuredGoal[] = structuredGoals && structuredGoals.length > 0
    ? structuredGoals
    : (goals ?? []).map(g => ({ text: g, category: goalCategory(g, t) }))

  return (
    <div className="mb-4 space-y-4">

      {/* Triangle SVG */}
      <div className="flex justify-center">
        <svg viewBox="0 0 280 210" className="w-full max-w-[280px]" style={{ overflow: 'visible' }}>
          <defs>
            <linearGradient id="tri-fill" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%"   stopColor="#d97706" stopOpacity="0.06" />
              <stop offset="50%"  stopColor="#f43f5e" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.06" />
            </linearGradient>
          </defs>

          {/* Triangle fill */}
          <motion.polygon
            points={`${VERTS.want.x},${VERTS.want.y} ${VERTS.fear.x},${VERTS.fear.y} ${VERTS.need.x},${VERTS.need.y}`}
            fill="url(#tri-fill)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          />

          {/* Edges */}
          {([
            ['want', 'fear', '#d97706', '0.3'],
            ['want', 'need', '#8b5cf6', '0.2'],
            ['fear', 'need', '#f43f5e', '0.25'],
          ] as const).map(([a, b, stroke, opacity]) => (
            <motion.line
              key={`${a}-${b}`}
              x1={VERTS[a].x} y1={VERTS[a].y}
              x2={VERTS[b].x} y2={VERTS[b].y}
              stroke={stroke}
              strokeWidth={1.5}
              strokeOpacity={parseFloat(opacity)}
              strokeDasharray="5 3"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            />
          ))}

          {/* WANT vertex — top, amber, visible */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 250, damping: 16, delay: 0.1 }}
            style={{ transformOrigin: `${VERTS.want.x}px ${VERTS.want.y}px` }}
          >
            <circle cx={VERTS.want.x} cy={VERTS.want.y} r={12}
              fill="#fef3c7" stroke="#d97706" strokeWidth={2} />
            <text x={VERTS.want.x} y={VERTS.want.y + 1}
              textAnchor="middle" dominantBaseline="middle" fontSize={11}>🎯</text>
            <text x={VERTS.want.x} y={VERTS.want.y - 20}
              textAnchor="middle" fontSize={7.5} fontWeight="700"
              fill="#92400e" letterSpacing="0.08em"
              fontFamily="'Source Sans 3', sans-serif"
              style={{ textTransform: 'uppercase' }}>
              Quiere
            </text>
          </motion.g>

          {/* FEAR vertex — bottom-left, rose */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 250, damping: 16, delay: 0.25 }}
            style={{ transformOrigin: `${VERTS.fear.x}px ${VERTS.fear.y}px` }}
          >
            <circle cx={VERTS.fear.x} cy={VERTS.fear.y} r={12}
              fill="#fff1f2" stroke="#f43f5e" strokeWidth={2} />
            <text x={VERTS.fear.x} y={VERTS.fear.y + 1}
              textAnchor="middle" dominantBaseline="middle" fontSize={11}>◈</text>
            <text x={VERTS.fear.x} y={VERTS.fear.y + 22}
              textAnchor="middle" fontSize={7.5} fontWeight="700"
              fill="#9f1239" letterSpacing="0.08em"
              fontFamily="'Source Sans 3', sans-serif"
              style={{ textTransform: 'uppercase' }}>
              Teme
            </text>
          </motion.g>

          {/* NEED vertex — bottom-right, purple/muted (invisible to character) */}
          <motion.g
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 250, damping: 16, delay: 0.4 }}
            style={{ transformOrigin: `${VERTS.need.x}px ${VERTS.need.y}px` }}
          >
            <circle cx={VERTS.need.x} cy={VERTS.need.y} r={12}
              fill="#f5f3ff" stroke="#8b5cf6" strokeWidth={1.5}
              strokeDasharray="3 2" />
            <text x={VERTS.need.x} y={VERTS.need.y + 1}
              textAnchor="middle" dominantBaseline="middle" fontSize={11}>⚡</text>
            <text x={VERTS.need.x} y={VERTS.need.y + 22}
              textAnchor="middle" fontSize={7.5} fontWeight="700"
              fill="#6d28d9" opacity={0.6} letterSpacing="0.08em"
              fontFamily="'Source Sans 3', sans-serif"
              style={{ textTransform: 'uppercase' }}>
              Necesita
            </text>
          </motion.g>

          {/* Vertex text snippets — short excerpts */}
          {personalFear && (
            <foreignObject x={VERTS.fear.x - 70} y={VERTS.fear.y + 32} width={100} height={50}>
              <p style={{
                fontSize: 9, color: '#9f1239', fontStyle: 'italic',
                fontFamily: 'Georgia, serif', lineHeight: 1.4, textAlign: 'center',
              }}>
                {personalFear.slice(0, 55)}{personalFear.length > 55 ? '…' : ''}
              </p>
            </foreignObject>
          )}
          {internalContradiction && (
            <foreignObject x={VERTS.need.x - 70} y={VERTS.need.y + 32} width={100} height={50}>
              <p style={{
                fontSize: 9, color: '#6d28d9', fontStyle: 'italic', opacity: 0.7,
                fontFamily: 'Georgia, serif', lineHeight: 1.4, textAlign: 'center',
              }}>
                {internalContradiction.slice(0, 55)}{internalContradiction.length > 55 ? '…' : ''}
              </p>
            </foreignObject>
          )}
        </svg>
      </div>

      {/* Goals list */}
      {resolvedGoals.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-2">
            Objetivos conscientes (lo que quiere)
          </p>
          {resolvedGoals.map((g, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.1, duration: 0.25 }}
              className="flex items-start gap-2.5 px-3 py-2 rounded-lg bg-muted/40 border border-border/50"
            >
              <span className="text-sm flex-shrink-0 mt-0.5">{goalIcon(g.text)}</span>
              <span className="text-[13px] text-foreground flex-1 leading-snug">{g.text}</span>
              <span className={`flex-shrink-0 self-center text-[8px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${CATEGORY_STYLES[g.category]}`}>
                {CATEGORY_LABELS[g.category]}
              </span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

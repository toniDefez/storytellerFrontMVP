import { motion } from 'framer-motion'
import { ChevronRight, Sparkles } from 'lucide-react'
import type { CharacterNode, CharacterNodeDomain } from '@/services/api'

/* ── Pipeline stage metadata ───────────────────────────────────── */

interface StageMeta {
  domain: CharacterNodeDomain
  label: string
  subtitle: string
  emoji: string
  bg: string
  border: string
  text: string
  accent: string
}

const PIPELINE_STAGES: StageMeta[] = [
  {
    domain: 'fear',
    label: 'MIEDO',
    subtitle: 'Lo que cree del mundo',
    emoji: '◆',
    bg: '#fef2f2',
    border: '#dc2626',
    text: '#991b1b',
    accent: '#dc262620',
  },
  {
    domain: 'drive',
    label: 'NECESIDAD',
    subtitle: 'Lo que persigue',
    emoji: '▶',
    bg: '#ecfdf5',
    border: '#059669',
    text: '#065f46',
    accent: '#05966920',
  },
  {
    domain: 'mask',
    label: 'ARMADURA',
    subtitle: 'Cómo se protege',
    emoji: '◎',
    bg: '#f8fafc',
    border: '#64748b',
    text: '#334155',
    accent: '#64748b20',
  },
  {
    domain: 'tension',
    label: 'SEÑAL',
    subtitle: 'Cómo lo ven los demás',
    emoji: '◇',
    bg: '#fffbeb',
    border: '#d97706',
    text: '#92400e',
    accent: '#d9770620',
  },
  {
    domain: 'bond',
    label: 'QUIEBRE',
    subtitle: 'Lo que lo rompe',
    emoji: '✦',
    bg: '#faf5ff',
    border: '#9333ea',
    text: '#6b21a8',
    accent: '#9333ea20',
  },
]

/* ── Arrow connector between stages ────────────────────────────── */

function Arrow() {
  return (
    <div className="flex items-center px-1 shrink-0">
      <ChevronRight className="w-5 h-5 text-muted-foreground/25" />
    </div>
  )
}

/* ── Single pipeline stage card ────────────────────────────────── */

interface StageCardProps {
  meta: StageMeta
  node?: CharacterNode
  selected: boolean
  onClick: () => void
  index: number
}

function StageCard({ meta, node, selected, onClick, index }: StageCardProps) {
  const isEmpty = !node

  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25, delay: index * 0.08 }}
      onClick={onClick}
      className="flex-1 min-w-[180px] max-w-[260px] rounded-xl text-left transition-all duration-200 overflow-hidden"
      style={{
        background: meta.bg,
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: selected ? meta.border : `${meta.border}40`,
        boxShadow: selected
          ? `0 0 0 3px ${meta.border}25, 0 4px 16px ${meta.border}15`
          : '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {/* Stage header */}
      <div
        className="px-3 py-1.5 border-b flex items-center gap-1.5"
        style={{ borderColor: `${meta.border}20`, background: meta.accent }}
      >
        <span
          className="text-[9px] font-bold uppercase tracking-[0.15em]"
          style={{ color: meta.border }}
        >
          {meta.emoji} {meta.label}
        </span>
        <span className="text-[8px] opacity-40 ml-auto" style={{ color: meta.text }}>
          {meta.subtitle}
        </span>
      </div>

      {/* Content */}
      <div className="px-3 py-3 min-h-[72px] flex flex-col justify-center">
        {isEmpty ? (
          <div className="flex flex-col items-center gap-1 py-2">
            <Sparkles className="w-3.5 h-3.5 opacity-20" style={{ color: meta.border }} />
            <span className="text-[10px] opacity-30" style={{ color: meta.text }}>
              Click para definir
            </span>
          </div>
        ) : (
          <>
            <p className="text-xs font-semibold leading-tight" style={{ color: meta.text }}>
              {node.label}
            </p>
            <p className="text-[10px] mt-1.5 leading-snug opacity-60 line-clamp-3" style={{ color: meta.text }}>
              {node.description}
            </p>
          </>
        )}
      </div>
    </motion.button>
  )
}

/* ── Pipeline canvas ───────────────────────────────────────────── */

interface Props {
  nodes: CharacterNode[]
  selectedNodeId: number | null
  onSelectNode: (id: number | null) => void
  onSelectStage: (domain: CharacterNodeDomain) => void
}

export function CharacterGraphCanvas({ nodes, selectedNodeId, onSelectNode, onSelectStage }: Props) {
  // Map nodes by domain for quick lookup
  const nodeByDomain = new Map<string, CharacterNode>()
  for (const n of nodes) {
    nodeByDomain.set(n.domain, n)
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8 bg-[hsl(40_20%_97%)]">
      {/* Pipeline label */}
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground/30 mb-6">
        Flujo de decisión
      </p>

      {/* Pipeline stages */}
      <div className="flex items-stretch gap-0 w-full max-w-[1200px]">
        {PIPELINE_STAGES.map((stage, i) => {
          const node = nodeByDomain.get(stage.domain)
          return (
            <div key={stage.domain} className="contents">
              {i > 0 && <Arrow />}
              <StageCard
                meta={stage}
                node={node}
                selected={node ? node.id === selectedNodeId : false}
                onClick={() => {
                  if (node) {
                    onSelectNode(node.id === selectedNodeId ? null : node.id)
                  } else {
                    onSelectStage(stage.domain)
                  }
                }}
                index={i}
              />
            </div>
          )
        })}
      </div>

      {/* Flow description */}
      <p className="text-[9px] text-muted-foreground/25 mt-6 text-center max-w-lg">
        Algo pasa → el miedo filtra cómo lo interpreta → la necesidad reacciona → la armadura se activa → la señal es lo que sale → a no ser que el quiebre se dispare
      </p>
    </div>
  )
}

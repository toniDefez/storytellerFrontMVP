import { motion } from 'framer-motion'
import { ChevronRight, Sparkles, Pencil } from 'lucide-react'
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
    <div className="flex items-center px-1 shrink-0 self-start mt-12">
      <ChevronRight className="w-5 h-5 text-foreground/20" />
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
      className="group flex-1 min-w-[180px] max-w-[280px] rounded-xl text-left transition-all duration-200 overflow-hidden
                 hover:scale-[1.02] hover:shadow-md cursor-pointer"
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
        className="px-3 py-2 border-b flex items-center gap-1.5"
        style={{ borderColor: `${meta.border}20`, background: meta.accent }}
      >
        <span
          className="text-[10px] font-bold uppercase tracking-[0.12em]"
          style={{ color: meta.border }}
        >
          {meta.emoji} {meta.label}
        </span>
        {!isEmpty && (
          <Pencil
            className="w-3 h-3 ml-auto opacity-0 group-hover:opacity-60 transition-opacity"
            style={{ color: meta.border }}
          />
        )}
      </div>

      {/* Content */}
      <div className="px-3 py-3 min-h-[80px] flex flex-col justify-center">
        {isEmpty ? (
          <div className="flex flex-col items-center gap-2 py-2">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center border-2 border-dashed"
              style={{ borderColor: `${meta.border}30` }}
            >
              <Sparkles className="w-4 h-4" style={{ color: `${meta.border}40` }} />
            </div>
            <span className="text-[11px] font-medium" style={{ color: `${meta.text}60` }}>
              Click para definir
            </span>
          </div>
        ) : (
          <>
            <p className="text-[13px] font-semibold leading-tight" style={{ color: meta.text }}>
              {node.label}
            </p>
            <p className="text-[11px] mt-1.5 leading-snug opacity-70 line-clamp-3" style={{ color: meta.text }}>
              {node.description}
            </p>
            <span
              className="text-[9px] mt-2 opacity-0 group-hover:opacity-50 transition-opacity"
              style={{ color: meta.text }}
            >
              Click para editar
            </span>
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
  const nodeByDomain = new Map<string, CharacterNode>()
  for (const n of nodes) {
    nodeByDomain.set(n.domain, n)
  }

  return (
    <div className="h-full flex flex-col items-center justify-center px-6 py-8 bg-[hsl(40_20%_97%)]">
      {/* Pipeline label */}
      <p className="text-[11px] font-bold uppercase tracking-[0.15em] text-foreground/30 mb-6">
        Flujo de decisión
      </p>

      {/* Pipeline stages */}
      <div className="flex items-start gap-0 w-full max-w-[1200px]">
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
      <p className="text-[10px] text-foreground/25 mt-8 text-center max-w-lg leading-relaxed">
        Algo pasa → el <strong className="text-red-400">miedo</strong> filtra cómo lo interpreta → la <strong className="text-emerald-500">necesidad</strong> reacciona → la <strong className="text-slate-400">armadura</strong> se activa → a no ser que el <strong className="text-purple-400">quiebre</strong> se dispare
      </p>
    </div>
  )
}

import { motion } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import type { StoryBrief } from '@/services/api'

interface Props {
  story: StoryBrief
  index: number
  onClick: () => void
}

function statusBadge(status: string) {
  switch (status) {
    case 'active':
      return (
        <Badge className="text-[10px] px-1.5 py-0 font-medium bg-emerald-500/10 text-emerald-700 border-emerald-500/20 hover:bg-emerald-500/10">
          activa
        </Badge>
      )
    case 'archived':
      return (
        <Badge className="text-[10px] px-1.5 py-0 font-medium bg-slate-500/10 text-slate-500 border-slate-500/20 hover:bg-slate-500/10">
          archivada
        </Badge>
      )
    default:
      return (
        <Badge className="text-[10px] px-1.5 py-0 font-medium bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/10">
          borrador
        </Badge>
      )
  }
}

function gradientForStatus(status: string) {
  switch (status) {
    case 'active':
      return 'from-cyan-900 to-cyan-800'
    case 'archived':
      return 'from-slate-700 to-slate-600 saturate-0'
    default:
      // draft — 70% opacity
      return 'from-cyan-900/70 to-cyan-800/70'
  }
}

export function StoryCatalogCard({ story, index, onClick }: Props) {
  const chapterNum = String(index + 1).padStart(2, '0')

  return (
    <motion.button
      onClick={onClick}
      className="w-full text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#06b6d4]/60 rounded-sm"
      whileHover={{ y: -4, boxShadow: '0 12px 32px rgba(0,0,0,0.15)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <div
        className="aspect-[3/4] rounded-sm overflow-hidden flex flex-col shadow-md"
        style={{ borderBottom: '1px solid hsl(35 12% 88%)' }}
      >
        {/* Top 60%: gradient header */}
        <div
          className={`relative flex-[3] bg-gradient-to-br ${gradientForStatus(story.status)} overflow-hidden`}
        >
          {/* Diagonal line texture */}
          <svg
            className="absolute inset-0 w-full h-full opacity-[0.07] pointer-events-none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <pattern id={`lines-${story.id}`} x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <line x1="0" y1="0" x2="0" y2="12" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill={`url(#lines-${story.id})`} />
          </svg>

          {/* Active story: left cyan accent bar */}
          {story.status === 'active' && (
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-cyan-400/60" />
          )}

          {/* Chapter number watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
            <span className="font-display text-[5rem] italic text-white/10 leading-none">
              {chapterNum}
            </span>
          </div>
        </div>

        {/* Bottom 40%: content */}
        <div className="flex-[2] bg-stone-50 px-4 pt-3 pb-3 flex flex-col justify-between min-h-0">
          <div className="min-h-0">
            <p className="text-base font-bold text-foreground leading-snug line-clamp-2 mb-1">
              {story.title}
            </p>
          </div>

          {/* Status badge at bottom */}
          <div className="flex items-center justify-between mt-auto pt-1">
            {statusBadge(story.status)}
            <span className="text-[9px] tracking-[0.2em] uppercase text-muted-foreground/40" style={{ fontFamily: 'var(--font-ui)' }}>
              Historia
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  )
}

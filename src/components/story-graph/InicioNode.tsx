import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { BookOpen, CheckCircle2, Circle } from 'lucide-react'

export interface InicioNodeData extends Record<string, unknown> {
  storyTitle: string
  isConfigured: boolean
  onOpen: () => void
}

export function InicioNode({ data }: NodeProps<Node<InicioNodeData>>) {
  const { storyTitle, isConfigured } = data

  return (
    <>
      <div
        className="
          flex flex-col items-center gap-2 px-6 py-5 cursor-pointer select-none
          bg-cyan-50 border-2 border-cyan-400 rounded-2xl shadow-md
          hover:border-cyan-500 hover:shadow-lg hover:bg-cyan-100/70
          transition-all duration-150
        "
        style={{ minWidth: 180, maxWidth: 240 }}
        onClick={() => data.onOpen()}
      >
        {/* Icon row */}
        <div className="flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-cyan-600" strokeWidth={1.5} />
          <span
            className="text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-700"
          >
            INICIO
          </span>
        </div>

        {/* Story title */}
        <p
          className="text-sm font-semibold text-cyan-900 text-center leading-snug"
          style={{
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {storyTitle}
        </p>

        {/* Status indicator */}
        <div className="flex items-center gap-1.5 mt-0.5">
          {isConfigured ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-[10px] text-emerald-600 font-medium">Reparto configurado</span>
            </>
          ) : (
            <>
              <Circle className="w-3.5 h-3.5 text-cyan-300" />
              <span className="text-[10px] text-cyan-400 font-medium">Sin reparto aún</span>
            </>
          )}
        </div>
      </div>

      {/* Handles — all 4 sides, visible */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!w-2 !h-2 !rounded-full !bg-cyan-400 !border-2 !border-cyan-500 !shadow-sm"
        style={{ bottom: -5 }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        className="!w-2 !h-2 !rounded-full !bg-cyan-400 !border-2 !border-cyan-500 !shadow-sm"
        style={{ top: -5 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!w-2 !h-2 !rounded-full !bg-cyan-400 !border-2 !border-cyan-500 !shadow-sm"
        style={{ right: -5 }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        className="!w-2 !h-2 !rounded-full !bg-cyan-400 !border-2 !border-cyan-500 !shadow-sm"
        style={{ left: -5 }}
      />
    </>
  )
}

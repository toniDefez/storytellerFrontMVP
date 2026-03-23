import { memo, useCallback } from 'react'
import { Handle, Position, useReactFlow } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import { Plus } from 'lucide-react'
import { DOMAIN_COLOR, DOMAIN_LABEL, ROLE_LABEL } from './treeLayout'
import type { NodeDomain, NodeRole } from '@/services/api'
import { useGraphActions } from './GraphActionsContext'

export interface TreeNodeData extends Record<string, unknown> {
  label: string
  domain: NodeDomain
  role: NodeRole
  description: string
  causal_summary: string
  isSelected?: boolean
  isRoot?: boolean
  showCtxHint?: boolean
}

export const TreeNode = memo(function TreeNode({
  data, id, positionAbsoluteX, positionAbsoluteY,
}: NodeProps<Node<TreeNodeData>>) {
  const color = DOMAIN_COLOR[data.domain] ?? '#a855f7'
  const { flowToScreenPosition } = useReactFlow()
  const actions = useGraphActions()

  const handlePlusClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    // Anchor to the right edge of the node at its top
    const screen = flowToScreenPosition({
      x: positionAbsoluteX + 190,
      y: positionAbsoluteY,
    })
    actions.onPlusClick(id, screen)
  }, [id, positionAbsoluteX, positionAbsoluteY, flowToScreenPosition, actions])

  return (
    <div className="flex flex-col items-center">
      {/* Node card */}
      <div
        className={`
          w-[180px] rounded-[4px] border bg-card shadow-sm transition-all
          ${data.isSelected ? 'shadow-md' : 'hover:shadow-md'}
        `}
        style={{
          borderColor: color + '60',
          ...(data.isSelected ? { outline: `2px solid ${color}`, outlineOffset: '1px' } : {}),
        }}
      >
        <div className="h-[3px] w-full rounded-t-[4px]" style={{ backgroundColor: color }} />
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[9px] font-semibold uppercase tracking-wide text-white"
              style={{ backgroundColor: color }}
            >
              {DOMAIN_LABEL[data.domain] ?? data.domain}
            </span>
            {data.role !== 'state' && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-[2px] text-[9px] font-medium uppercase tracking-wide bg-muted text-muted-foreground">
                {ROLE_LABEL[data.role] ?? data.role}
              </span>
            )}
          </div>
          <p
            className="text-sm font-semibold text-foreground leading-tight line-clamp-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {data.label}
          </p>
        </div>
      </div>

      {/* "+" button — only when selected */}
      {data.isSelected && (
        <div className="flex flex-col items-center mt-1.5">
          <button
            onClick={handlePlusClick}
            className="w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm hover:scale-110 transition-transform focus:outline-none"
            style={{ backgroundColor: color }}
            aria-label="Añadir nodo hijo"
          >
            <Plus className="w-3 h-3" />
          </button>
          {data.showCtxHint && (
            <span className="mt-1 text-[8px] text-muted-foreground bg-background border border-border/50 rounded px-1.5 py-0.5 whitespace-nowrap pointer-events-none">
              clic derecho para más
            </span>
          )}
        </div>
      )}

      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
})

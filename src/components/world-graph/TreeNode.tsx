import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import type { Node, NodeProps } from '@xyflow/react'
import { DOMAIN_COLOR, DOMAIN_LABEL, ROLE_LABEL } from './treeLayout'
import type { NodeDomain, NodeRole } from '@/services/api'

export interface TreeNodeData extends Record<string, unknown> {
  label: string
  domain: NodeDomain
  role: NodeRole
  description: string
  causal_summary: string
  isSelected?: boolean
  isRoot?: boolean
}

export const TreeNode = memo(function TreeNode({ data }: NodeProps<Node<TreeNodeData>>) {
  const color = DOMAIN_COLOR[data.domain] ?? '#a855f7'
  const domainLabel = DOMAIN_LABEL[data.domain] ?? data.domain
  const roleLabel = ROLE_LABEL[data.role] ?? data.role

  return (
    <div
      className={`
        relative w-[180px] rounded-lg border bg-card shadow-sm transition-all
        ${data.isSelected ? 'ring-2 ring-primary shadow-md' : 'hover:shadow-md'}
      `}
      style={{ borderColor: color + '60' }}
    >
      {/* Top accent bar */}
      <div
        className="h-1 w-full rounded-t-lg"
        style={{ backgroundColor: color }}
      />

      {/* Content */}
      <div className="px-3 py-2.5">
        {/* Domain + role badges */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <span
            className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wide text-white"
            style={{ backgroundColor: color }}
          >
            {domainLabel}
          </span>
          {data.role !== 'state' && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium uppercase tracking-wide bg-muted text-muted-foreground">
              {roleLabel}
            </span>
          )}
        </div>

        {/* Label */}
        <p className="text-sm font-semibold text-foreground leading-tight line-clamp-2">
          {data.label}
        </p>
      </div>

      {/* React Flow handles */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
})

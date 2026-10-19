import React, { memo } from 'react'
import { Handle, Position, NodeToolbar, type NodeProps } from '@xyflow/react'
import type { LocationNodeType, NarrativeFunction } from '@/services/api'
import { useZoomLevel } from '@/hooks/useZoomLevel'
import { Pencil, Trash2 } from 'lucide-react'
import { useLocationGraphContext } from './LocationGraphContext'
import { narrativeFnLabel } from './locationLabels'

const NODE_ICONS: Record<LocationNodeType, string> = {
  settlement: '🏘',
  wilderness: '🌲',
  ruin: '🏚',
  landmark: '⛰',
  passage: '🚪',
  structure: '🏛',
}

const NARRATIVE_FN_COLORS: Record<NarrativeFunction, { bg: string; text: string; dot: string }> = {
  conflict:   { bg: 'bg-red-500/10',    text: 'text-red-700',    dot: 'bg-red-500' },
  origin:     { bg: 'bg-amber-500/10',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  threshold:  { bg: 'bg-violet-500/10', text: 'text-violet-700', dot: 'bg-violet-500' },
  atmosphere: { bg: 'bg-sky-500/10',    text: 'text-sky-700',    dot: 'bg-sky-500' },
}

// Hex colors used as inline style for the left border of compact nodes.
// Inline (not Tailwind classes) because we interpolate into style={{ borderLeft: ... }}.
const NARRATIVE_FN_BORDER: Record<NarrativeFunction, string> = {
  conflict:   '#ef4444',
  origin:     '#f59e0b',
  threshold:  '#8b5cf6',
  atmosphere: '#0ea5e9',
}

export interface LocationNodeData {
  name: string
  node_type: LocationNodeType
  description: string
  narrative_function?: NarrativeFunction
  source_hint?: string
  isSelected?: boolean
  depth?: number
  childCount?: number
  /**
   * Hex color of the civic node's faction, if assigned. Overrides the
   * narrative-function-derived border in compact zoom and the teal selection
   * accent at full zoom.
   */
  factionColor?: string | null
}

const HANDLE_STYLE = {
  width: 7, height: 7,
  background: '#14b8a6',
  border: '2px solid white',
  borderRadius: '50%',
}

const CHILD_HANDLE_STYLE = {
  width: 6, height: 6,
  background: '#d97706',
  border: '2px solid white',
  borderRadius: '50%',
}

export const LocationNode = memo(function LocationNode({ id, data }: NodeProps) {
  const d = data as unknown as LocationNodeData
  const { onEditNode, onDeleteNode } = useLocationGraphContext()
  const nodeId = Number(id)
  const depth = d.depth ?? 0
  const isChild = depth > 0

  const fn = d.narrative_function ? NARRATIVE_FN_COLORS[d.narrative_function] : null
  const handleStyle = isChild ? CHILD_HANDLE_STYLE : HANDLE_STYLE

  const zoomLevel = useZoomLevel()

  const toolbar = (
    <NodeToolbar isVisible={d.isSelected} position={Position.Top} offset={8}>
      <div
        role="toolbar"
        aria-label="Acciones de localización"
        className="flex gap-0.5 bg-background border border-border/60 rounded-lg shadow-sm p-0.5"
      >
        <button
          type="button"
          onClick={() => onEditNode(nodeId)}
          aria-label="Editar localización"
          title="Editar"
          className="p-1.5 rounded hover:bg-accent transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDeleteNode(nodeId)}
          aria-label="Eliminar localización"
          title="Eliminar"
          className="p-1.5 rounded hover:bg-destructive/10 text-destructive transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </NodeToolbar>
  )

  if (zoomLevel === 'compact') {
    const borderColor = d.narrative_function
      ? NARRATIVE_FN_BORDER[d.narrative_function]
      : '#94a3b8' // slate-400 fallback

    return (
      <>
        {toolbar}
        <div
          className={`
          relative rounded-md border bg-background shadow-sm
          w-[130px] transition-all duration-150
          ${d.isSelected
            ? 'border-[#14b8a6] shadow-[0_0_0_2px_#14b8a620]'
            : 'border-border/60 hover:border-[#14b8a6]/50'}
        `}
          style={{ borderLeft: `3px solid ${borderColor}` }}
          title={d.source_hint || d.name}
        >
          <Handle type="source" position={Position.Top}    id="t"  style={handleStyle} />
          <Handle type="source" position={Position.Right}  id="r"  style={handleStyle} />
          <Handle type="source" position={Position.Bottom} id="b"  style={handleStyle} />
          <Handle type="source" position={Position.Left}   id="l"  style={handleStyle} />
          <Handle type="target" position={Position.Top}    id="tt" style={handleStyle} />
          <Handle type="target" position={Position.Right}  id="tr" style={handleStyle} />
          <Handle type="target" position={Position.Bottom} id="tb" style={handleStyle} />
          <Handle type="target" position={Position.Left}   id="tl" style={handleStyle} />

          <div className="px-2 py-1 flex items-center gap-1.5">
            <span className="text-xs leading-none">{NODE_ICONS[d.node_type]}</span>
            <span className="text-[11px] font-medium text-foreground truncate">{d.name}</span>
          </div>
        </div>
      </>
    )
  }

  if (isChild) {
    // ── Child node: compact, left amber accent, warm tinted bg ──────────────
    return (
      <>
        {toolbar}
        <div
          className={`
          relative rounded-lg border bg-amber-50/60 dark:bg-amber-950/20
          min-w-[100px] max-w-[136px] transition-all duration-150
          ${d.isSelected
            ? 'border-amber-400 shadow-[0_0_0_2px_#d9770620]'
            : 'border-amber-200/80 hover:border-amber-400/60'}
        `}
          title={d.source_hint || undefined}
          style={{ borderLeft: '3px solid #d97706' }}
        >
          <Handle type="source" position={Position.Top}    id="t"  style={handleStyle} />
          <Handle type="source" position={Position.Right}  id="r"  style={handleStyle} />
          <Handle type="source" position={Position.Bottom} id="b"  style={handleStyle} />
          <Handle type="source" position={Position.Left}   id="l"  style={handleStyle} />
          <Handle type="target" position={Position.Top}    id="tt" style={handleStyle} />
          <Handle type="target" position={Position.Right}  id="tr" style={handleStyle} />
          <Handle type="target" position={Position.Bottom} id="tb" style={handleStyle} />
          <Handle type="target" position={Position.Left}   id="tl" style={handleStyle} />

          <div className="px-2 py-1.5 space-y-0.5">
            <div className="flex items-center gap-1">
              <span className="text-[11px] leading-none opacity-80">{NODE_ICONS[d.node_type]}</span>
              <div className="font-medium text-[10px] text-foreground/80 leading-tight truncate">{d.name}</div>
            </div>
            {fn && (
              <div className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${fn.dot}`} />
                <span className={`text-[9px] font-medium ${fn.text} opacity-80`}>{narrativeFnLabel(d.narrative_function)}</span>
              </div>
            )}
          </div>

          {/* Depth indicator */}
          <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center">
            <span className="text-[7px] font-bold text-white leading-none">{depth}</span>
          </div>
        </div>
      </>
    )
  }

  // ── Root node (depth 0): full treatment ─────────────────────────────────
  return (
    <>
      {toolbar}
      <div
        className={`
        rounded-xl border bg-background shadow-sm min-w-[120px] max-w-[160px]
        transition-all duration-150
        ${d.isSelected
          ? 'border-[#14b8a6] shadow-[0_0_0_2px_#14b8a620]'
          : 'border-border/60 hover:border-[#14b8a6]/50'}
      `}
        title={d.source_hint || undefined}
        style={{
          // Drive border + selection ring via CSS vars so we can tint by faction
          // without spawning a Tailwind class per color.
          ['--lg-faction-color' as string]: d.factionColor ?? '#14b8a6',
          ['--lg-faction-tint' as string]: d.factionColor
            ? `${d.factionColor}20`
            : '#14b8a620',
          borderColor: d.isSelected
            ? (d.factionColor ?? '#14b8a6')
            : undefined,
        } as React.CSSProperties}
      >
        <Handle type="source" position={Position.Top}    id="t"  style={handleStyle} />
        <Handle type="source" position={Position.Right}  id="r"  style={handleStyle} />
        <Handle type="source" position={Position.Bottom} id="b"  style={handleStyle} />
        <Handle type="source" position={Position.Left}   id="l"  style={handleStyle} />
        <Handle type="target" position={Position.Top}    id="tt" style={handleStyle} />
        <Handle type="target" position={Position.Right}  id="tr" style={handleStyle} />
        <Handle type="target" position={Position.Bottom} id="tb" style={handleStyle} />
        <Handle type="target" position={Position.Left}   id="tl" style={handleStyle} />

        {/* Barra teal superior */}
        <div className="h-[3px] rounded-t-xl bg-[#14b8a6]" />

        <div className="px-2.5 py-2 space-y-1">
          <div className="flex items-center gap-1.5">
            <span className="text-base leading-none">{NODE_ICONS[d.node_type]}</span>
            <div className="font-medium text-xs text-foreground leading-tight truncate">{d.name}</div>
          </div>

          {fn && (
            <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium ${fn.bg} ${fn.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${fn.dot}`} />
              {narrativeFnLabel(d.narrative_function)}
            </span>
          )}

          {/* Indicador de hijos */}
          {d.childCount != null && d.childCount > 0 && (
            <div className="flex items-center gap-0.5 pt-0.5">
              <span className="text-[9px] text-muted-foreground">
                ⊂ {d.childCount} {d.childCount === 1 ? 'lugar interior' : 'lugares interiores'}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
})

import { useState } from 'react'
import { X, Trash2, Maximize2, Loader2, AlertTriangle } from 'lucide-react'
import type { WorldNode } from '@/services/api'
import { DOMAIN_COLOR, DOMAIN_LABEL, ROLE_LABEL, EDGE_LABEL } from './treeLayout'
import { Button } from '@/components/ui/button'

interface NodeDetailPanelProps {
  node: WorldNode
  worldId: number
  isExpanding: boolean
  onClose: () => void
  onExpand: () => void
  onDeleteSubtree: () => Promise<{ count: number; labels: string[] }>
  onDeleteConfirmed: () => Promise<void>
}

export function NodeDetailPanel({
  node, isExpanding,
  onClose, onExpand, onDeleteSubtree, onDeleteConfirmed,
}: NodeDetailPanelProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [subtreePreview, setSubtreePreview] = useState<{ count: number; labels: string[] } | null>(null)
  const [deleting, setDeleting] = useState(false)

  const color = DOMAIN_COLOR[node.domain] ?? '#a855f7'
  const isRoot = !node.parent_id

  const handleDeleteClick = async () => {
    const preview = await onDeleteSubtree()
    setSubtreePreview(preview)
    setShowDeleteConfirm(true)
  }

  const handleDeleteConfirm = async () => {
    setDeleting(true)
    try {
      await onDeleteConfirmed()
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {DOMAIN_LABEL[node.domain] ?? node.domain}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 px-4 py-3 space-y-4 overflow-y-auto">
          {/* Label */}
          <div>
            <p className="text-base font-semibold text-foreground leading-snug">{node.label}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                {ROLE_LABEL[node.role] ?? node.role}
              </span>
              {node.parent_edge_type && (
                <span className="text-[10px] text-muted-foreground italic">
                  ↳ {EDGE_LABEL[node.parent_edge_type] ?? node.parent_edge_type}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {node.content?.description && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Descripción
              </p>
              <p className="text-sm text-foreground leading-relaxed">{node.content.description}</p>
            </div>
          )}

          {/* Causal summary */}
          {node.content?.causal_summary && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                Por qué existe
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed italic">
                {node.content.causal_summary}
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-4 py-3 border-t border-border space-y-2 shrink-0">
          {!isRoot && (
            <button
              onClick={onExpand}
              disabled={isExpanding}
              className="w-full flex items-center justify-center gap-2 text-xs font-medium border border-border rounded-lg py-2 hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExpanding
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Expandiendo...</>
                : <><Maximize2 className="w-3.5 h-3.5" /> Expandir nodo</>
              }
            </button>
          )}

          {isRoot && (
            <button
              onClick={onExpand}
              disabled={isExpanding}
              className="w-full flex items-center justify-center gap-2 text-xs font-medium border border-border rounded-lg py-2 hover:bg-accent/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isExpanding
                ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Expandiendo...</>
                : <><Maximize2 className="w-3.5 h-3.5" /> Derivar primer nivel</>
              }
            </button>
          )}

          <button
            onClick={handleDeleteClick}
            className="w-full flex items-center justify-center gap-2 text-xs font-medium border border-red-200 text-red-500 rounded-lg py-2 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {isRoot ? 'Eliminar árbol completo' : 'Eliminar nodo y descendientes'}
          </button>
        </div>
      </div>

      {/* Inline delete confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 z-10 bg-card flex flex-col items-center justify-center p-6 gap-4">
          <AlertTriangle className="w-8 h-8 text-red-500" />
          <p className="text-sm font-semibold text-center text-foreground">
            {isRoot ? 'Eliminar árbol completo' : 'Eliminar subárbol'}
          </p>
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            {subtreePreview
              ? `Se eliminarán ${subtreePreview.count} nodo(s): ${subtreePreview.labels.slice(0, 3).join(', ')}${subtreePreview.count > 3 ? '...' : ''}.`
              : '¿Eliminar este nodo y todos sus descendientes?'}
          </p>
          <div className="flex gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="flex-1"
              disabled={deleting}
              onClick={handleDeleteConfirm}
            >
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Eliminar'}
            </Button>
          </div>
        </div>
      )}
    </>
  )
}

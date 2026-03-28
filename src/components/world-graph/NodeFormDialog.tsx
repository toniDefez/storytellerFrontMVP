import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Sparkles, Loader2, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { WorldNode, NodeDomain, NodeRole, EdgeType, CandidateNode } from '@/services/api'
import { expandNodeCandidates } from '@/services/api'
import { DOMAIN_COLOR, DOMAIN_LABEL, ROLE_LABEL, EDGE_LABEL } from './treeLayout'

export interface NodeFormInput {
  label: string
  domain: NodeDomain
  role: NodeRole
  parentEdgeType?: EdgeType
  description: string
}

interface NodeFormDialogProps {
  mode: 'create' | 'edit'
  worldId: number
  parentNode: WorldNode | null
  editingNode?: WorldNode
  editingNodeHasChildren?: boolean
  anchorPosition: { x: number; y: number }
  onConfirm: (input: NodeFormInput) => Promise<void>
  onClose: () => void
}

const DOMAINS: NodeDomain[] = ['core', 'physical', 'biological', 'social', 'symbolic', 'technic']
const ROLES: NodeRole[] = ['state', 'event', 'rupture']
const EDGE_TYPES: EdgeType[] = ['produces', 'requires', 'enables', 'undermines', 'gives_rise_to']

export function NodeFormDialog({
  mode, worldId, parentNode, editingNode, editingNodeHasChildren,
  anchorPosition, onConfirm, onClose,
}: NodeFormDialogProps) {
  const structureLocked = mode === 'edit' && (editingNodeHasChildren || editingNode?.domain === 'core')
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)

  const [label, setLabel] = useState(editingNode?.label ?? '')
  const [domain, setDomain] = useState<NodeDomain>(
    editingNode?.domain ?? parentNode?.domain ?? 'core'
  )
  const [role, setRole] = useState<NodeRole>(editingNode?.role ?? 'state')
  const [edgeType, setEdgeType] = useState<EdgeType>(
    editingNode?.parent_edge_type ?? 'produces'
  )
  const [description, setDescription] = useState(editingNode?.content?.description ?? '')
  const [submitting, setSubmitting] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [candidates, setCandidates] = useState<CandidateNode[]>([])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Positioning: prefer right of anchor, flip left if near edge
  const dialogW = 264
  const dialogH = 360
  const left = anchorPosition.x + dialogW + 16 > window.innerWidth - 8
    ? anchorPosition.x - dialogW - 16
    : anchorPosition.x + 16
  const top = Math.min(anchorPosition.y, window.innerHeight - dialogH - 16)

  const handleAIFill = async () => {
    if (!parentNode) return
    setAiLoading(true)
    try {
      const result = await expandNodeCandidates(worldId, parentNode.id)
      setCandidates(result.candidates ?? [])
    } catch {
      // best-effort
    } finally {
      setAiLoading(false)
    }
  }

  const applyCandidate = (c: CandidateNode) => {
    setLabel(c.label)
    setDomain(c.domain)
    setRole(c.role)
    setEdgeType(c.parent_edge_type)
    setDescription(c.description)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!label.trim()) return
    setSubmitting(true)
    try {
      await onConfirm({
        label: label.trim(),
        domain,
        role,
        parentEdgeType: parentNode ? edgeType : undefined,
        description: description.trim(),
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  const isCreate = mode === 'create'

  return (
    <div
      ref={dialogRef}
      style={{ position: 'fixed', left, top, zIndex: 50, width: dialogW }}
      className="bg-card border border-border rounded-xl shadow-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/30">
        <p className="text-[10px] font-semibold text-muted-foreground truncate max-w-[210px]">
          {isCreate
            ? parentNode
              ? `${t('graph.newChildOf')}: ${parentNode.label}`
              : t('graph.createRoot')
            : `${t('graph.editing')}: ${editingNode?.label}`
          }
        </p>
        <button
          onClick={onClose}
          className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground ml-2 shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="px-3 py-3 space-y-2.5">
        {/* Label + Edge type side-by-side */}
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <label className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
              {t('graph.nodeName')}
            </label>
            <Input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="Label..."
              className="h-7 text-xs"
              autoFocus
              required
            />
          </div>
          {parentNode && (
            <div style={{ width: 96 }} className="shrink-0">
              <label className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
                {t('graph.relation')}
              </label>
              <select
                value={edgeType}
                onChange={e => setEdgeType(e.target.value as EdgeType)}
                className="h-7 w-full text-[10px] border border-input rounded-md px-1.5 bg-background text-foreground"
              >
                {EDGE_TYPES.map(et => (
                  <option key={et} value={et}>{EDGE_LABEL[et] ?? et}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Domain */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1.5">
            {t('graph.domain')}
            {structureLocked && <Lock className="w-2.5 h-2.5" />}
          </label>
          <div className="flex flex-wrap gap-1">
            {DOMAINS.map(d => (
              <button
                key={d}
                type="button"
                onClick={() => !structureLocked && setDomain(d)}
                disabled={structureLocked}
                className="text-[9px] px-2 py-0.5 rounded-full border transition-all font-medium disabled:cursor-not-allowed disabled:opacity-60"
                style={domain === d
                  ? { background: DOMAIN_COLOR[d], borderColor: DOMAIN_COLOR[d], color: 'white' }
                  : { borderColor: (DOMAIN_COLOR[d] ?? '#a855f7') + '60', color: DOMAIN_COLOR[d] ?? '#a855f7' }
                }
              >
                {DOMAIN_LABEL[d] ?? d}
              </button>
            ))}
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground flex items-center gap-1 mb-1.5">
            {t('graph.role')}
            {structureLocked && <Lock className="w-2.5 h-2.5" />}
          </label>
          <div className="flex gap-1">
            {ROLES.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => !structureLocked && setRole(r)}
                disabled={structureLocked}
                className={`text-[9px] px-2.5 py-0.5 rounded-full border transition-all disabled:cursor-not-allowed ${
                  role === r
                    ? 'bg-foreground text-background border-foreground'
                    : 'border-border text-muted-foreground hover:border-foreground/40'
                }`}
              >
                {ROLE_LABEL[r] ?? r}
              </button>
            ))}
          </div>
          {structureLocked && (
            <p className="text-[9px] text-muted-foreground mt-1.5 leading-relaxed">
              Este nodo tiene hijos derivados de su contexto. Cambiar el dominio o rol rompería su coherencia narrativa.
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground block mb-1">
            {t('graph.description')}{' '}
            <span className="font-normal normal-case">{t('graph.optional')}</span>
          </label>
          <Textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Qué es, qué implica..."
            className="min-h-[48px] text-xs resize-none"
            rows={2}
          />
        </div>

        {/* AI candidates (inline, after filling) */}
        {candidates.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-muted-foreground">
                {t('graph.aiSuggestions')}
              </p>
              <button
                type="button"
                onClick={() => setCandidates([])}
                className="text-[9px] text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('graph.clearSuggestion')}
              </button>
            </div>
            {candidates.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => applyCandidate(c)}
                className="w-full text-left p-2 rounded-lg border border-dashed text-[10px] hover:bg-accent/50 transition-colors"
                style={{ borderColor: (DOMAIN_COLOR[c.domain] ?? '#a855f7') + '60' }}
              >
                <span className="font-semibold text-foreground">{c.label}</span>
                <span className="text-muted-foreground ml-1.5">
                  — {DOMAIN_LABEL[c.domain] ?? c.domain}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          <Button
            type="submit"
            size="sm"
            className="flex-1 h-7 text-xs"
            disabled={submitting || !label.trim()}
          >
            {submitting
              ? <Loader2 className="w-3 h-3 animate-spin" />
              : isCreate ? t('graph.createNode') : t('graph.saveChanges')
            }
          </Button>
          {parentNode && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={handleAIFill}
              disabled={aiLoading}
            >
              {aiLoading
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <><Sparkles className="w-3 h-3 mr-1" />{t('graph.fillWithAI')}</>
              }
            </Button>
          )}
        </div>
      </form>
    </div>
  )
}

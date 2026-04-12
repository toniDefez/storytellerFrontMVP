import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, Check, X } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { CharacterNodeDomain, CatalogNode, ContextualCharacterNode } from '@/services/api'
import { getCatalog, getContextualNodes, createContextualNode, updateContextualNode, deleteContextualNode } from '@/services/api'

/* ── Container metadata (mirrors canvas) ─────────────────────── */

const DOMAIN_META: Record<CharacterNodeDomain, { label: string; subtitle: string; color: string }> = {
  origin:  { label: 'Creencias',  subtitle: '¿Que da por hecho?',  color: '#6366F1' },
  fear:    { label: 'Miedos',     subtitle: '¿Que evita?',         color: '#EF4444' },
  drive:   { label: 'Deseos',     subtitle: '¿Que persigue?',      color: '#F59E0B' },
  bond:    { label: 'Grietas',    subtitle: '¿Donde se rompe?',    color: '#8B5CF6' },
  mask:    { label: 'Mascaras',   subtitle: '¿Que muestra?',       color: '#10B981' },
}

function getSalienceDotSize(salience: number): string {
  if (salience >= 7) return 'w-2.5 h-2.5'
  if (salience >= 4) return 'w-1.5 h-1.5'
  return 'w-1 h-1'
}

/* ── Catalog item ─────────────────────────────────────────────── */

interface CatalogItemProps {
  label: string
  description: string
  salience: number
  color: string
  onClick: () => void
}

function CatalogItem({ label, description, salience, color, onClick }: CatalogItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-2.5 rounded-lg border border-transparent
                 hover:border-border/40 hover:bg-white/60 transition-all duration-150 group"
    >
      <div className="flex items-center gap-2">
        <div
          className={`rounded-full shrink-0 ${getSalienceDotSize(salience)}`}
          style={{ background: color }}
        />
        <span className="text-[12px] font-semibold text-stone-800 truncate">{label}</span>
      </div>
      {description && (
        <p className="text-[10px] mt-0.5 leading-snug text-muted-foreground line-clamp-1 ml-[18px]">
          {description}
        </p>
      )}
    </button>
  )
}

/* ── Main component ───────────────────────────────────────────── */

interface Props {
  open: boolean
  domain: CharacterNodeDomain | null
  worldId: number
  onClose: () => void
  onAddFromCatalog: (catalogNodeId: number) => Promise<void>
  onAddFromContextual: (contextualNodeId: number) => Promise<void>
}

export function CatalogDrawer({ open, domain, worldId, onClose, onAddFromCatalog, onAddFromContextual }: Props) {
  const [catalogNodes, setCatalogNodes] = useState<CatalogNode[]>([])
  const [contextualNodes, setContextualNodes] = useState<ContextualCharacterNode[]>([])
  const [loading, setLoading] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newDescription, setNewDescription] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editDescription, setEditDescription] = useState('')

  useEffect(() => {
    if (!open || !domain) return
    setLoading(true)
    Promise.all([
      getCatalog(domain).catch(() => [] as CatalogNode[]),
      getContextualNodes(worldId, domain).catch(() => [] as ContextualCharacterNode[]),
    ]).then(([catalog, contextual]) => {
      setCatalogNodes(catalog)
      setContextualNodes(contextual)
    }).finally(() => setLoading(false))
  }, [open, domain, worldId])

  if (!domain) return null

  const meta = DOMAIN_META[domain] || { label: domain, subtitle: '', color: '#999' }

  const handleAddFromCatalog = async (id: number) => {
    await onAddFromCatalog(id)
    onClose()
  }

  const handleAddFromContextual = async (id: number) => {
    await onAddFromContextual(id)
    onClose()
  }

  const handleCreateContextual = async () => {
    if (!newLabel.trim() || !domain) return
    setCreating(true)
    try {
      const created = await createContextualNode({
        world_id: worldId,
        domain,
        label: newLabel.trim(),
        description: newDescription.trim(),
        salience: 5,
      })
      setContextualNodes(prev => [...prev, created])
      setNewLabel('')
      setNewDescription('')
    } catch (err) {
      console.error('Error creating contextual node:', err)
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteContextual = async (id: number) => {
    try {
      await deleteContextualNode(id)
      setContextualNodes(prev => prev.filter(n => n.id !== id))
    } catch (err) {
      console.error('Error deleting contextual node:', err)
    }
  }

  const handleStartEdit = (node: ContextualCharacterNode) => {
    setEditingId(node.id)
    setEditLabel(node.label)
    setEditDescription(node.description || '')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditLabel('')
    setEditDescription('')
  }

  const handleSaveEdit = async (node: ContextualCharacterNode) => {
    if (!editLabel.trim()) return
    try {
      await updateContextualNode({
        id: node.id,
        label: editLabel.trim(),
        description: editDescription.trim(),
        salience: node.salience,
      })
      setContextualNodes(prev =>
        prev.map(n =>
          n.id === node.id
            ? { ...n, label: editLabel.trim(), description: editDescription.trim() }
            : n
        )
      )
      handleCancelEdit()
    } catch (err) {
      console.error('Error updating contextual node:', err)
    }
  }

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent side="right" className="w-[340px] sm:max-w-[340px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            <span style={{ color: meta.color }}>{meta.label}</span>
          </SheetTitle>
          <SheetDescription>{meta.subtitle}</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="px-4 space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse space-y-1">
                <div className="h-3 rounded bg-stone-200/60 w-3/4" />
                <div className="h-2 rounded bg-stone-200/40 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 pb-4 space-y-5">
            {/* Internal catalog */}
            {catalogNodes.length > 0 && (
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50 mb-2">
                  Internal
                </p>
                <div className="space-y-0.5">
                  {catalogNodes.map(node => (
                    <CatalogItem
                      key={`catalog-${node.id}`}
                      label={node.label}
                      description={node.description}
                      salience={node.salience}
                      color={meta.color}
                      onClick={() => handleAddFromCatalog(node.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Contextual catalog */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50 mb-2">
                Contextual
              </p>
              {contextualNodes.length > 0 ? (
                <div className="space-y-0.5">
                  {contextualNodes.map(node =>
                    editingId === node.id ? (
                      <div
                        key={`contextual-${node.id}`}
                        className="px-3 py-2.5 rounded-lg border border-border/40 bg-white/60 space-y-2"
                      >
                        <input
                          type="text"
                          value={editLabel}
                          onChange={e => setEditLabel(e.target.value)}
                          className="w-full text-xs bg-transparent border border-border/30 rounded-lg px-3 py-1.5
                                     focus:border-amber-400/60 focus:outline-none
                                     placeholder:text-muted-foreground/30"
                          onKeyDown={e => { if (e.key === 'Enter') handleSaveEdit(node) }}
                          autoFocus
                        />
                        <textarea
                          value={editDescription}
                          onChange={e => setEditDescription(e.target.value)}
                          rows={2}
                          placeholder="Descripcion (opcional)..."
                          className="w-full text-xs bg-transparent border border-border/30 rounded-lg px-3 py-1.5
                                     focus:border-amber-400/60 focus:outline-none resize-none
                                     placeholder:text-muted-foreground/30"
                        />
                        <div className="flex gap-1.5 justify-end">
                          <button
                            onClick={handleCancelEdit}
                            className="p-1 rounded hover:bg-stone-100 transition-colors"
                          >
                            <X className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleSaveEdit(node)}
                            disabled={!editLabel.trim()}
                            className="p-1 rounded hover:bg-stone-100 transition-colors disabled:opacity-40"
                          >
                            <Check className="w-3 h-3" style={{ color: meta.color }} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={`contextual-${node.id}`}
                        className="relative group"
                      >
                        <CatalogItem
                          label={node.label}
                          description={node.description}
                          salience={node.salience}
                          color={meta.color}
                          onClick={() => handleAddFromContextual(node.id)}
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1
                                        opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={e => { e.stopPropagation(); handleStartEdit(node) }}
                            className="p-1 rounded hover:bg-stone-200/60 transition-colors"
                          >
                            <Pencil className="w-3 h-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={e => { e.stopPropagation(); handleDeleteContextual(node.id) }}
                            className="p-1 rounded hover:bg-red-100/60 transition-colors"
                          >
                            <Trash2 className="w-3 h-3 text-muted-foreground" />
                          </button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-muted-foreground/40 py-2">
                  Sin nodos contextuales para este mundo.
                </p>
              )}
            </div>

            {/* Create contextual node */}
            <div className="pt-2 border-t border-border/30">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50 mb-2">
                Crear nodo contextual
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLabel}
                  onChange={e => setNewLabel(e.target.value)}
                  placeholder="Nombre del nodo..."
                  className="flex-1 text-xs bg-transparent border border-border/30 rounded-lg px-3 py-2
                             focus:border-amber-400/60 focus:outline-none
                             placeholder:text-muted-foreground/30"
                  onKeyDown={e => { if (e.key === 'Enter') handleCreateContextual() }}
                />
                <button
                  onClick={handleCreateContextual}
                  disabled={!newLabel.trim() || creating}
                  className="px-2.5 py-2 rounded-lg text-white text-xs font-medium
                             disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
                  style={{ background: meta.color }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
              {newLabel.trim() && (
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  rows={2}
                  placeholder="Descripcion (opcional)..."
                  className="w-full mt-2 text-xs bg-transparent border border-border/30 rounded-lg px-3 py-2
                             focus:border-amber-400/60 focus:outline-none resize-none
                             placeholder:text-muted-foreground/30"
                />
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { CharacterNodeDomain, CatalogNode, WorldCatalogNode } from '@/services/api'
import { getCatalog, getWorldCatalog, createWorldCatalogNode } from '@/services/api'

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
  onAddFromWorldCatalog: (worldCatalogNodeId: number) => Promise<void>
}

export function CatalogDrawer({ open, domain, worldId, onClose, onAddFromCatalog, onAddFromWorldCatalog }: Props) {
  const [catalogNodes, setCatalogNodes] = useState<CatalogNode[]>([])
  const [worldNodes, setWorldNodes] = useState<WorldCatalogNode[]>([])
  const [loading, setLoading] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!open || !domain) return
    setLoading(true)
    Promise.all([
      getCatalog(domain).catch(() => [] as CatalogNode[]),
      getWorldCatalog(worldId, domain).catch(() => [] as WorldCatalogNode[]),
    ]).then(([catalog, world]) => {
      setCatalogNodes(catalog)
      setWorldNodes(world)
    }).finally(() => setLoading(false))
  }, [open, domain, worldId])

  if (!domain) return null

  const meta = DOMAIN_META[domain] || { label: domain, subtitle: '', color: '#999' }

  const handleAddFromCatalog = async (id: number) => {
    await onAddFromCatalog(id)
    onClose()
  }

  const handleAddFromWorld = async (id: number) => {
    await onAddFromWorldCatalog(id)
    onClose()
  }

  const handleCreateContextual = async () => {
    if (!newLabel.trim() || !domain) return
    setCreating(true)
    try {
      const created = await createWorldCatalogNode({
        world_id: worldId,
        domain,
        label: newLabel.trim(),
        description: '',
        salience: 5,
      })
      setWorldNodes(prev => [...prev, created])
      setNewLabel('')
    } catch (err) {
      console.error('Error creating world catalog node:', err)
    } finally {
      setCreating(false)
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

            {/* World / contextual catalog */}
            <div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50 mb-2">
                Contextual
              </p>
              {worldNodes.length > 0 ? (
                <div className="space-y-0.5">
                  {worldNodes.map(node => (
                    <CatalogItem
                      key={`world-${node.id}`}
                      label={node.label}
                      description={node.description}
                      salience={node.salience}
                      color={meta.color}
                      onClick={() => handleAddFromWorld(node.id)}
                    />
                  ))}
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
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

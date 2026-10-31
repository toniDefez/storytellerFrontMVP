import { useMemo } from 'react'
import type { WorldNode } from '@/services/api'
import { DOMAIN_COLOR, DOMAIN_LABEL, EDGE_LABEL, ROLE_LABEL } from './treeLayout'

// El árbol causal del mundo en el móvil (2026-10-31): nada de lienzo. Los
// nodos como entradas de un índice, en orden de profundidad y con sangría por
// nivel, unidos por un hilo vertical; el dominio es una marca de tinta, no un
// borde. Tocar selecciona (y abre la hoja con el detalle y el chat); desde la
// entrada seleccionada se edita o se le añade un hijo.

interface Props {
  nodes: WorldNode[]
  selectedId?: number
  canCreate: boolean
  onSelect: (node: WorldNode | null) => void
  onEdit: (node: WorldNode) => void
  onAddChild: (node: WorldNode) => void
  onCreateRoot: () => void
  onDeleteWorld?: () => void
}

function DeleteWorldLink({ onClick }: { onClick?: () => void }) {
  if (!onClick) return null
  return (
    <div className="mt-10 pt-4 border-t border-border/60 px-3">
      <button type="button" onClick={onClick} className="min-h-11 text-sm text-muted-foreground underline underline-offset-4 decoration-border">
        Borrar este mundo…
      </button>
    </div>
  )
}

function depthFirst(nodes: WorldNode[]): { node: WorldNode; depth: number }[] {
  const children = new Map<number | undefined, WorldNode[]>()
  for (const n of nodes) {
    const key = n.parent_id ?? undefined
    if (!children.has(key)) children.set(key, [])
    children.get(key)!.push(n)
  }
  const out: { node: WorldNode; depth: number }[] = []
  const seen = new Set<number>()
  const walk = (parent: number | undefined, depth: number) => {
    for (const n of children.get(parent) ?? []) {
      if (seen.has(n.id)) continue
      seen.add(n.id)
      out.push({ node: n, depth })
      walk(n.id, depth + 1)
    }
  }
  walk(undefined, 0)
  // Nodos cuyo padre no está (datos a medias): al final, sin sangría.
  for (const n of nodes) if (!seen.has(n.id)) out.push({ node: n, depth: 0 })
  return out
}

export function WorldNodeList({ nodes, selectedId, canCreate, onSelect, onEdit, onAddChild, onCreateRoot, onDeleteWorld }: Props) {
  const rows = useMemo(() => depthFirst(nodes), [nodes])

  if (nodes.length === 0) {
    return (
      <div className="flex h-full flex-col bg-background">
        <div className="flex flex-1 items-center justify-center p-8 text-center">
          <div className="space-y-2">
            <p className="font-display text-xl italic text-foreground/60">El mundo aún no tiene raíz</p>
            <p className="text-sm text-muted-foreground">La raíz es la premisa de la que cuelga todo lo demás. Pídesela al chat o escríbela tú.</p>
            {canCreate && (
              <button type="button" onClick={onCreateRoot} className="min-h-11 px-4 text-sm text-primary underline underline-offset-4">
                Escribir la raíz
              </button>
            )}
          </div>
        </div>
        <div className="pb-28"><DeleteWorldLink onClick={onDeleteWorld} /></div>
      </div>
    )
  }

  return (
    <ol className="h-full overflow-y-auto bg-background px-2 py-3 pb-28">
      {rows.map(({ node, depth }) => {
        const color = DOMAIN_COLOR[node.domain] ?? '#a855f7'
        const selected = node.id === selectedId
        const indent = Math.min(depth, 4) * 16
        return (
          <li key={node.id} className="relative" style={{ paddingLeft: indent }}>
            {/* El hilo baja por la izquierda de cada nivel. */}
            <span aria-hidden className="absolute top-0 bottom-0 border-l border-dotted border-border" style={{ left: indent + 13 }} />
            <span aria-hidden className="absolute top-[21px] size-[9px] rounded-full" style={{ left: indent + 9, background: color }} />
            <button
              type="button"
              onClick={() => onSelect(selected ? null : node)}
              className={`w-full text-left pl-9 pr-3 py-3 ${selected ? 'bg-accent/70' : 'active:bg-accent/50'}`}
            >
              <span className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground" style={{ fontFamily: 'var(--font-ui)' }}>
                <span style={{ color }}>{DOMAIN_LABEL[node.domain] ?? node.domain}</span>
                {' · '}{ROLE_LABEL[node.role] ?? node.role}
                {node.parent_edge_type && <>{' · '}{EDGE_LABEL[node.parent_edge_type] ?? node.parent_edge_type}</>}
              </span>
              <span className="block font-display text-[1.1rem] leading-snug text-foreground">{node.label}</span>
              {node.content?.description && (
                <span className="block mt-0.5 text-xs text-muted-foreground line-clamp-2">{node.content.description}</span>
              )}
            </button>
            {selected && (
              <div className="flex pl-9 pb-2 gap-5 text-sm">
                <button type="button" onClick={() => onEdit(node)} className="min-h-11 text-primary underline underline-offset-4">Editar</button>
                <button type="button" onClick={() => onAddChild(node)} className="min-h-11 text-primary underline underline-offset-4">Añadir un hijo</button>
              </div>
            )}
          </li>
        )
      })}
      <li><DeleteWorldLink onClick={onDeleteWorld} /></li>
    </ol>
  )
}

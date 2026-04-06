import { useEffect, useRef } from 'react'
import { BookOpen, RefreshCw, Eye, Trash2 } from 'lucide-react'

interface MenuPosition {
  x: number
  y: number
}

/* ── Container context menu ──────────────────────────────── */

interface ContainerMenuProps extends MenuPosition {
  domainLabel: string
  hasNodes: boolean
  isStale: boolean
  onOpenCatalog: () => void
  onRegenerate: () => void
  onClose: () => void
}

export function ContainerContextMenu({
  x, y, domainLabel, hasNodes, isStale, onOpenCatalog, onRegenerate, onClose,
}: ContainerMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onMouse)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onMouse)
    }
  }, [onClose])

  const menuW = 220
  const menuH = hasNodes ? 88 : 48
  const left = Math.min(x, window.innerWidth - menuW - 8)
  const top = Math.min(y, window.innerHeight - menuH - 8)

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left, top, zIndex: 100, width: menuW }}
      className="bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1"
    >
      <button
        onClick={() => { onOpenCatalog(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-left"
      >
        <BookOpen className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        Abrir catalogo de {domainLabel.toLowerCase()}
      </button>
      {hasNodes && (
        <>
          <div className="h-px bg-border/50 my-1" />
          <button
            onClick={() => { onRegenerate(); onClose() }}
            disabled={!isStale}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-left
                       disabled:opacity-40 disabled:cursor-default"
          >
            <RefreshCw className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            {isStale ? 'Regenerar sintesis' : 'Sintesis actualizada'}
          </button>
        </>
      )}
    </div>
  )
}

/* ── Orbital node context menu ───────────────────────────── */

interface OrbitalMenuProps extends MenuPosition {
  nodeLabel: string
  onViewDetail: () => void
  onRemove: () => void
  onClose: () => void
}

export function OrbitalContextMenu({
  x, y, nodeLabel, onViewDetail, onRemove, onClose,
}: OrbitalMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    const onMouse = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onMouse)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onMouse)
    }
  }, [onClose])

  const menuW = 200
  const menuH = 88
  const left = Math.min(x, window.innerWidth - menuW - 8)
  const top = Math.min(y, window.innerHeight - menuH - 8)

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left, top, zIndex: 100, width: menuW }}
      className="bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1"
    >
      <button
        onClick={() => { onViewDetail(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-left"
      >
        <Eye className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        Ver detalle
      </button>
      <div className="h-px bg-border/50 my-1" />
      <button
        onClick={() => { onRemove(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-destructive/10 transition-colors text-left text-destructive"
      >
        <Trash2 className="w-3.5 h-3.5 shrink-0" />
        Quitar del personaje
      </button>
    </div>
  )
}

import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'

interface NodeContextMenuProps {
  x: number
  y: number
  onEdit: () => void
  onAddChild: () => void
  onExpandAI: () => void
  onDeleteSubtree: () => void
  onClose: () => void
}

export function NodeContextMenu({
  x, y, onEdit, onAddChild, onExpandAI, onDeleteSubtree, onClose,
}: NodeContextMenuProps) {
  const { t } = useTranslation()
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
  const menuH = 148
  const left = Math.min(x, window.innerWidth - menuW - 8)
  const top = Math.min(y, window.innerHeight - menuH - 8)

  return (
    <div
      ref={ref}
      style={{ position: 'fixed', left, top, zIndex: 100, width: menuW }}
      className="bg-card border border-border rounded-lg shadow-xl overflow-hidden py-1"
    >
      <button
        onClick={() => { onEdit(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-left"
      >
        <Pencil className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {t('graph.editNode')}
      </button>
      <button
        onClick={() => { onAddChild(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-left"
      >
        <Plus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        {t('graph.addChildManual')}
      </button>
      <button
        onClick={() => { onExpandAI(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-accent/50 transition-colors text-left text-primary"
      >
        <Sparkles className="w-3.5 h-3.5 shrink-0" />
        {t('graph.expandAI')}
      </button>
      <div className="h-px bg-border/50 my-1" />
      <button
        onClick={() => { onDeleteSubtree(); onClose() }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-destructive/10 transition-colors text-left text-destructive"
      >
        <Trash2 className="w-3.5 h-3.5 shrink-0" />
        {t('graph.deleteSubtree')}
      </button>
    </div>
  )
}

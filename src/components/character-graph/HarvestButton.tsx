import { Plus } from 'lucide-react'

interface Props {
  onClick: () => void
}

export function HarvestButton({ onClick }: Props) {
  return (
    <button
      onClick={onClick}
      title="Cosechar como nodo"
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded
                 text-amber-500/60 hover:text-amber-600 hover:bg-amber-50"
    >
      <Plus className="w-3.5 h-3.5" />
    </button>
  )
}

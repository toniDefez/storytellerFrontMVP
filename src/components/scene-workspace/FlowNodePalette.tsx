import { Zap, Heart, MessageCircle, Eye, AlertTriangle, Sparkles } from 'lucide-react'
import type { FlowNodeType } from '@/services/api'

interface PaletteItem {
  type: FlowNodeType
  icon: React.ElementType
  iconColor: string
  hoverBg: string
  hoverBorder: string
  label: string
  subtitle: string
}

const PALETTE_ITEMS: PaletteItem[] = [
  {
    type: 'action',
    icon: Zap,
    iconColor: 'text-red-500',
    hoverBg: 'hover:bg-red-50',
    hoverBorder: 'hover:border-red-300',
    label: 'Acción',
    subtitle: 'Qué ocurre',
  },
  {
    type: 'emotional',
    icon: Heart,
    iconColor: 'text-pink-500',
    hoverBg: 'hover:bg-pink-50',
    hoverBorder: 'hover:border-pink-300',
    label: 'Emocional',
    subtitle: 'Cómo se siente',
  },
  {
    type: 'conversation',
    icon: MessageCircle,
    iconColor: 'text-blue-500',
    hoverBg: 'hover:bg-blue-50',
    hoverBorder: 'hover:border-blue-300',
    label: 'Conversación',
    subtitle: 'Qué se dice',
  },
  {
    type: 'perception',
    icon: Eye,
    iconColor: 'text-violet-500',
    hoverBg: 'hover:bg-violet-50',
    hoverBorder: 'hover:border-violet-300',
    label: 'Percepción',
    subtitle: 'Qué se observa',
  },
  {
    type: 'marking_event',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
    hoverBg: 'hover:bg-amber-50',
    hoverBorder: 'hover:border-amber-300',
    label: 'Evento Marcante',
    subtitle: 'Lo que deja huella',
  },
  {
    type: 'device',
    icon: Sparkles,
    iconColor: 'text-cyan-500',
    hoverBg: 'hover:bg-cyan-50',
    hoverBorder: 'hover:border-cyan-300',
    label: 'Dispositivo',
    subtitle: 'Recurso narrativo',
  },
]

interface Props {
  onAddNode: (nodeType: FlowNodeType) => void
}

export function FlowNodePalette({ onAddNode }: Props) {
  return (
    <div className="w-[180px] shrink-0 flex flex-col gap-2 py-4 px-3 border-l border-stone-200 bg-white overflow-y-auto">
      <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-1">
        Paleta
      </p>
      {PALETTE_ITEMS.map(item => {
        const Icon = item.icon
        return (
          <button
            key={item.type}
            onClick={() => onAddNode(item.type)}
            className={`p-3 rounded-lg border border-dashed border-stone-200 cursor-pointer text-left transition-colors ${item.hoverBg} ${item.hoverBorder}`}
          >
            <div className="flex items-center gap-2 mb-0.5">
              <Icon className={`w-4 h-4 shrink-0 ${item.iconColor}`} />
              <span className="text-xs font-semibold text-stone-700">{item.label}</span>
            </div>
            <p className="text-[10px] text-stone-400 ml-6">{item.subtitle}</p>
          </button>
        )
      })}
    </div>
  )
}

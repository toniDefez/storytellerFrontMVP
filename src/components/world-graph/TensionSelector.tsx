import { Loader2 } from 'lucide-react'
import type { TensionOption } from '@/services/api'

interface TensionSelectorProps {
  options: TensionOption[]
  loading: boolean
  onSelect: (tension: TensionOption) => void
}

export function TensionSelector({ options, loading, onSelect }: TensionSelectorProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Interpretando la premisa...</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-display font-medium text-foreground">
          ¿Qué tensión define este mundo?
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Elige una dirección. El árbol crecerá a partir de ella.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 max-w-xl mx-auto">
        {options.map(option => (
          <button
            key={option.id}
            onClick={() => onSelect(option)}
            className="text-left p-4 rounded-xl border border-border hover:border-primary/50 hover:bg-accent/50 transition-all group"
          >
            <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
              {option.label}
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {option.description}
            </p>
          </button>
        ))}
      </div>
    </div>
  )
}

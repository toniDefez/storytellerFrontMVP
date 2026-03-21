// Stub component — will be replaced with full implementation later

export type ExtendedChipStatus = 'idle' | 'ready' | 'pending' | 'accepted' | 'rejected' | 'editing'

interface DerivationLayerProps {
  layerKey: string
  layerMeta: { icon: string; label: string; labelEn: string; color: string }
  suggestion: string | null | undefined
  cascadeDelay?: number
  isRevealed?: boolean
  onReveal?: () => void
  onSuggestionAccept?: (key: string) => void
  onSuggestionReject?: (key: string) => void
  onSuggestionEdit?: (key: string, value: string) => void
  chipStatus?: ExtendedChipStatus
}

export function DerivationLayer({
  layerMeta,
  suggestion,
  onSuggestionAccept,
  onSuggestionReject,
  onSuggestionEdit,
  chipStatus,
  layerKey,
}: DerivationLayerProps) {
  if (!suggestion) return null

  return (
    <div className="rounded-xl border border-border/50 p-4 space-y-2">
      <div className="flex items-center gap-2">
        <span>{layerMeta.icon}</span>
        <span className={`text-xs font-semibold uppercase tracking-widest ${layerMeta.color}`}>
          {layerMeta.label}
        </span>
        {chipStatus === 'accepted' && (
          <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold">Aceptado</span>
        )}
        {chipStatus === 'rejected' && (
          <span className="ml-auto text-[10px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-semibold">Rechazado</span>
        )}
      </div>
      <p className="text-sm text-foreground/80 leading-relaxed font-[var(--font-display)] italic">
        {suggestion}
      </p>
      {chipStatus === 'pending' && (
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={() => onSuggestionAccept?.(layerKey)}
            className="text-xs px-3 py-1 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-colors font-semibold"
          >
            Aceptar
          </button>
          <button
            type="button"
            onClick={() => onSuggestionReject?.(layerKey)}
            className="text-xs px-3 py-1 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 transition-colors font-semibold"
          >
            Rechazar
          </button>
          <button
            type="button"
            onClick={() => onSuggestionEdit?.(layerKey, suggestion)}
            className="text-xs px-3 py-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
          >
            Editar
          </button>
        </div>
      )}
    </div>
  )
}

interface PremiseBarProps {
  premise: string
}

export function PremiseBar({ premise }: PremiseBarProps) {
  if (!premise) return null
  return (
    <div className="px-4 py-2.5 bg-accent/40 border-b border-border/50 flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground shrink-0">
        Premisa
      </span>
      <p className="text-sm text-foreground font-display italic truncate">
        "{premise}"
      </p>
    </div>
  )
}

import { Label } from '@/components/ui/label'

interface FieldGroupProps {
  label: string
  htmlFor?: string
  hint?: string
  children: React.ReactNode
}

export function FieldGroup({ label, htmlFor, hint, children }: FieldGroupProps) {
  return (
    <div className="mb-5">
      <div className="flex items-baseline gap-2 mb-2">
        <Label htmlFor={htmlFor} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
          {label}
        </Label>
        {hint && <span className="text-[10px] text-muted-foreground/60 italic">{hint}</span>}
      </div>
      {children}
    </div>
  )
}

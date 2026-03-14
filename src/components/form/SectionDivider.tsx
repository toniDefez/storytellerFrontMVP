import { Separator } from '@/components/ui/separator'

export function SectionDivider({ label }: { label: string }) {
  return (
    <div className="relative my-6 flex items-center gap-3">
      <Separator className="flex-1" />
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.18em]">{label}</span>
      <Separator className="flex-1" />
    </div>
  )
}

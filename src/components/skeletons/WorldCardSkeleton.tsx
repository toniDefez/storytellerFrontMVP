import { Skeleton } from '@/components/ui/skeleton'

export function WorldCardSkeleton() {
  return (
    <div className="rounded-2xl bg-card border border-border overflow-hidden">
      <Skeleton className="h-[120px] w-full rounded-none" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden animate-pulse">
      <div className="h-20 bg-gradient-to-br from-gray-200 to-gray-300" />
      <div className="px-5 pt-3 pb-5 space-y-3">
        <div className="h-3 bg-gray-200 rounded-full w-3/4" />
        <div className="flex gap-1.5">
          <div className="h-4 bg-gray-100 rounded-full w-16" />
          <div className="h-4 bg-gray-100 rounded-full w-16" />
          <div className="h-4 bg-gray-100 rounded-full w-16" />
        </div>
        <div className="border-t border-gray-100 pt-3 space-y-1">
          <div className="h-3 bg-gray-100 rounded-full w-20" />
          <div className="flex gap-1">
            <div className="h-4 bg-gray-100 rounded-full w-14" />
            <div className="h-4 bg-gray-100 rounded-full w-14" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonDetail() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 mt-8 animate-pulse">
      <div className="bg-white/90 shadow-2xl rounded-2xl p-8 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 rounded-xl w-48" />
          <div className="h-9 bg-gray-200 rounded-lg w-20" />
        </div>
        <div className="grid grid-cols-2 gap-4 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-4 bg-gray-100 rounded-full w-full" />
          ))}
        </div>
        <div className="space-y-2 mt-4">
          <div className="h-3 bg-gray-100 rounded-full w-full" />
          <div className="h-3 bg-gray-100 rounded-full w-5/6" />
          <div className="h-3 bg-gray-100 rounded-full w-4/6" />
        </div>
      </div>
      <div className="bg-white/90 shadow-xl rounded-2xl p-8 border border-gray-200">
        <div className="h-6 bg-gray-200 rounded-xl w-40 mb-4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-xl p-4 space-y-2">
              <div className="h-4 bg-gray-200 rounded-full w-32" />
              <div className="h-3 bg-gray-100 rounded-full w-24" />
              <div className="h-3 bg-gray-100 rounded-full w-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

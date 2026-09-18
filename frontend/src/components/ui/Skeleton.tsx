export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`block rounded-md bg-line-soft [animation:tm-shimmer_1.4s_ease-in-out_infinite] ${className}`}
    />
  )
}

/** Placeholder rows for the task list while the first page loads. */
export function SkeletonRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-2" role="status" aria-label="Loading tasks">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-4 rounded-card border border-line bg-surface px-4 py-4"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-[45%]" />
            <Skeleton className="h-3 w-[70%]" />
          </div>
          <Skeleton className="h-6 w-20 rounded-lg" />
          <Skeleton className="h-6 w-24 rounded-lg" />
        </div>
      ))}
    </div>
  )
}

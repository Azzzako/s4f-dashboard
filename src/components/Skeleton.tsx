// Pulse-animated placeholders that match the shape of the data being loaded.
// Avoids the jarring "empty → 100 items" jump on slow connections.

function pulse(className = '') {
  return `animate-pulse rounded bg-zinc-200 dark:bg-zinc-800 ${className}`
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-3">
        <div className={pulse('size-7 rounded-full')} />
        <div className="flex-1 space-y-1.5">
          <div className={pulse('h-4 w-1/3')} />
          <div className={pulse('h-3 w-1/5')} />
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className={pulse(i === lines - 1 ? 'h-3 w-2/3' : 'h-3 w-full')} />
        ))}
      </div>
    </div>
  )
}

export function GridCardSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} lines={2} />
      ))}
    </div>
  )
}

export function PhotoGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={pulse('aspect-square w-full rounded-xl')} />
      ))}
    </div>
  )
}

export function TableRowSkeleton({ rows = 6, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <div key={i} className={pulse('h-3 w-2/3')} />
          ))}
        </div>
      </div>
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid gap-3 p-4" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className={pulse('h-3 w-full')} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
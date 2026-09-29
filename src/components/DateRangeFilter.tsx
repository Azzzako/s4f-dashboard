interface Props {
  from: string
  to: string
  onChange: (range: { from: string; to: string }) => void
}

// Simple YYYY-MM-DD range filter. Empty inputs mean "no bound".
// Both inputs share the same change handler.
export function DateRangeFilter({ from, to, onChange }: Props) {
  return (
    <div className="flex items-center gap-1 text-sm">
      <input
        type="date"
        value={from}
        max={to || undefined}
        onChange={(e) => onChange({ from: e.target.value, to })}
        aria-label="Desde"
        className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
      />
      <span className="text-zinc-400">–</span>
      <input
        type="date"
        value={to}
        min={from || undefined}
        onChange={(e) => onChange({ from, to: e.target.value })}
        aria-label="Hasta"
        className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {(from || to) && (
        <button
          onClick={() => onChange({ from: '', to: '' })}
          className="ml-1 text-xs text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          aria-label="Limpiar fechas"
        >
          ×
        </button>
      )}
    </div>
  )
}
import { Loader2, X } from 'lucide-react'
import type { ReactNode } from 'react'

interface Props {
  count: number
  busy?: boolean
  onClear: () => void
  children: ReactNode
}

// Sticky action bar that appears at the bottom of the viewport when one or
// more items are selected. Provides a clear-selection control and a slot
// for the actual action buttons (approve / reject / etc).
export function BulkBar({ count, busy, onClear, children }: Props) {
  if (count === 0) return null
  return (
    <div
      role="region"
      aria-label="Acciones en lote"
      className="fixed inset-x-0 bottom-0 z-30 mx-auto flex max-w-3xl items-center gap-3 rounded-t-xl border border-b-0 border-zinc-300 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
    >
      <span className="text-sm font-medium tabular-nums">{count} seleccionados</span>
      {busy && <Loader2 className="size-4 animate-spin text-zinc-400" />}
      <div className="ml-auto flex flex-wrap gap-2">{children}</div>
      <button
        onClick={onClear}
        aria-label="Limpiar selección"
        className="grid size-7 place-items-center rounded-md text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <X className="size-4" />
      </button>
    </div>
  )
}
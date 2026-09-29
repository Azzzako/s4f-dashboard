import { Search, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  /** Debounce ms; 0 means sync. */
  debounce?: number
}

// Controlled-with-debounce search field. Keeps typing snappy by updating
// internal state immediately and the parent's value after the debounce.
export function SearchInput({ value, onChange, placeholder = 'Buscar…', debounce = 300 }: Props) {
  const [inner, setInner] = useState(value)

  useEffect(() => {
    setInner(value)
  }, [value])

  useEffect(() => {
    if (debounce <= 0) return
    const id = setTimeout(() => {
      if (inner !== value) onChange(inner)
    }, debounce)
    return () => clearTimeout(id)
  }, [inner, debounce, onChange, value])

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="search"
        value={inner}
        onChange={(e) => {
          const v = e.target.value
          if (debounce <= 0) onChange(v)
          else setInner(v)
        }}
        placeholder={placeholder}
        className="w-full rounded-lg border border-zinc-300 bg-white py-1.5 pr-8 pl-8 text-sm placeholder:text-zinc-400 focus:border-brand-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900"
      />
      {inner && (
        <button
          onClick={() => {
            setInner('')
            onChange('')
          }}
          aria-label="Limpiar búsqueda"
          className="absolute top-1/2 right-2 grid size-5 -translate-y-1/2 place-items-center rounded text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  )
}
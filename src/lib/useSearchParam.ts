import { useCallback } from 'react'
import { useSearchParams } from 'react-router'

// Bidirectional binding between a URL query param and component state.
// Keeps a single source of truth (the URL) so deep links and the back
// button behave naturally.
//
// For empty-string fallbacks (free-text filters), pass an explicit list of
// allowed values that includes `''` so the setter accepts "" again.
export function useSearchParam<T extends string>(
  key: string,
  fallback: T,
  allowed?: readonly T[],
): [T, (v: T) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get(key) ?? fallback
  const value = ((allowed ? allowed.includes(raw as T) : true) ? raw : fallback) as T

  const update = useCallback(
    (next: T) => {
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev)
          if (next === fallback) out.delete(key)
          else out.set(key, next)
          return out
        },
        { replace: true },
      )
    },
    [fallback, key, setParams],
  )

  return [value, update]
}
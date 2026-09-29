import { useCallback, useState } from 'react'

// Simple offset-based pagination. Call `loadMore` to extend the list;
// `reset` when filters change so the page doesn't show stale rows.
export function usePagination(initial = 25) {
  const [limit] = useState(initial)
  const [offset, setOffset] = useState(0)

  const loadMore = useCallback(() => setOffset((o) => o + limit), [limit])
  const reset = useCallback(() => setOffset(0), [])

  return { offset, limit, loadMore, reset }
}
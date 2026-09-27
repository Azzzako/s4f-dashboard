import { useQuery } from '@tanstack/react-query'
import { fetchPendingCounts } from './api'

export function usePendingCounts() {
  return useQuery({ queryKey: ['pending-counts'], queryFn: fetchPendingCounts, refetchInterval: 30_000 })
}

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface Options {
  /** Query key prefixes to invalidate. Defaults to refreshing everything
   *  (preserves the original behavior). Pass an empty array to skip. */
  invalidate?: string[]
}

// Wraps a moderation RPC: toast on success/error and refresh the lists
// plus the sidebar counters so the queue reflects the change at once.
export function useModeration<TArgs>(fn: (args: TArgs) => Promise<void>, success: string, options: Options = {}) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(success)
      const keys = options.invalidate ?? ['spots', 'ratings', 'photos', 'reports', 'audit', 'pending-counts']
      keys.forEach((k) => qc.invalidateQueries({ queryKey: [k] }))
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

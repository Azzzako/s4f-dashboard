import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

// Wraps a moderation RPC: toast on success/error and refresh every list
// plus the sidebar counters so the queue reflects the change at once.
export function useModeration<TArgs>(fn: (args: TArgs) => Promise<void>, success: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      toast.success(success)
      qc.invalidateQueries()
    },
    onError: (e: Error) => toast.error(e.message),
  })
}

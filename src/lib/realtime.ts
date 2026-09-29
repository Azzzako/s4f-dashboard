import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'

type Subscription = {
  table: string
  /** Query key prefix to invalidate. Anything that starts with this is refreshed. */
  invalidate: string[]
}

// One subscription per table. Any insert/update/delete by any admin (or by
// triggers on the app) invalidates the matching queries so the UI updates
// without a manual refresh.
const SUBSCRIPTIONS: Subscription[] = [
  { table: 'spots', invalidate: ['spots', 'pending-counts'] },
  { table: 'spot_ratings', invalidate: ['ratings', 'pending-counts'] },
  { table: 'spot_photos', invalidate: ['photos', 'pending-counts'] },
  { table: 'spot_reports', invalidate: ['reports', 'pending-counts'] },
  { table: 'admin_audit_log', invalidate: ['audit'] },
]

export function useRealtime() {
  const qc = useQueryClient()
  useEffect(() => {
    const channels = SUBSCRIPTIONS.map(({ table, invalidate }) =>
      supabase
        .channel(`${table}-changes`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          () => {
            invalidate.forEach((key) => qc.invalidateQueries({ queryKey: [key] }))
          },
        )
        .subscribe(),
    )
    return () => {
      channels.forEach((c) => supabase.removeChannel(c))
    }
  }, [qc])
}
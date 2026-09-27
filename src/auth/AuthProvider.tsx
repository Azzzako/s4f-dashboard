import type { Session } from '@supabase/supabase-js'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { AuthContext, type AuthState } from './context'

// The UI gate mirrors public.is_admin(): profiles.role = 'admin'.
// It is only UX; RLS and the admin_* RPCs are the real gate.
async function loadAdminUsername(session: Session): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('username, role')
    .eq('id', session.user.id)
    .maybeSingle()
  if (error || !data || data.role !== 'admin') return null
  return data.username as string
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: 'loading' })

  const resolve = useCallback(async (session: Session | null) => {
    if (!session) {
      setState({ status: 'signed_out' })
      return
    }
    const username = await loadAdminUsername(session)
    if (!username) {
      await supabase.auth.signOut()
      setState({ status: 'signed_out' })
      return
    }
    setState({ status: 'admin', session, username })
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => resolve(data.session))
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') setState({ status: 'signed_out' })
      if (event === 'TOKEN_REFRESHED' && session) {
        setState((prev) => (prev.status === 'admin' ? { ...prev, session } : prev))
      }
    })
    return () => data.subscription.unsubscribe()
  }, [resolve])

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new Error('Credenciales inválidas.')
    const username = await loadAdminUsername(data.session)
    if (!username) {
      await supabase.auth.signOut()
      throw new Error('Esta cuenta no tiene permisos de administrador.')
    }
    setState({ status: 'admin', session: data.session, username })
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setState({ status: 'signed_out' })
  }, [])

  return <AuthContext.Provider value={{ state, signIn, signOut }}>{children}</AuthContext.Provider>
}

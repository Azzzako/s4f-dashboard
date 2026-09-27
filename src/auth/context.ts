import type { Session } from '@supabase/supabase-js'
import { createContext } from 'react'

export type AuthState =
  | { status: 'loading' }
  | { status: 'signed_out' }
  | { status: 'admin'; session: Session; username: string }

export interface AuthContextValue {
  state: AuthState
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)

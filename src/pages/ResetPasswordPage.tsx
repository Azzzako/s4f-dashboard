import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

// Reached via the link Supabase emails during password recovery.
// Supabase client parses the hash and fires PASSWORD_RECOVERY; once a
// session exists we let the admin set a new password.
export function ResetPasswordPage() {
  const [ready, setReady] = useState(false)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setHasSession(!!data.session))
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setHasSession(true)
    })
    setReady(true)
    return () => data.subscription.unsubscribe()
  }, [])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== confirm) {
      toast.error('Las contraseñas no coinciden.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      toast.success('Contraseña actualizada. Redirigiendo...')
      setTimeout(() => {
        window.location.href = '/'
      }, 800)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="grid min-h-full place-items-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h1 className="text-lg font-semibold">Nueva contraseña</h1>
        {!ready ? (
          <Loader2 className="mx-auto mt-6 size-5 animate-spin text-zinc-400" />
        ) : !hasSession ? (
          <p className="mt-3 text-sm text-zinc-500">
            El enlace no es válido o expiró. Solicita uno nuevo desde la pantalla de login.
          </p>
        ) : (
          <>
            <p className="mt-1 text-sm text-zinc-500">Elige una contraseña nueva (mínimo 8 caracteres).</p>
            <label className="mt-4 block text-sm font-medium">
              Nueva contraseña
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-zinc-700"
              />
            </label>
            <label className="mt-3 block text-sm font-medium">
              Confirma la contraseña
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-zinc-700"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Guardar contraseña
            </button>
          </>
        )}
      </form>
    </div>
  )
}
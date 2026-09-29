import { ArrowRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'

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
      toast.success('Contraseña actualizada. Redirigiendo…')
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
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-zinc-950 text-zinc-100 lg:flex lg:flex-col lg:justify-between lg:p-10 xl:p-14">
        <div className="relative flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-brand-500 text-base font-black tracking-tight text-white">
            S4F
          </div>
          <div className="text-[10px] font-bold leading-tight uppercase tracking-[0.18em] text-zinc-400">
            Centro de<br />moderación
          </div>
        </div>

        <div className="relative max-w-md space-y-5">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-brand-500">
            <span className="size-1.5 rounded-full bg-brand-500" />
            Recuperar acceso
          </div>
          <h1 className="text-4xl font-black leading-[1.05] tracking-tight xl:text-5xl">
            Restablece tu<br />
            <span className="text-brand-500">contraseña.</span>
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-zinc-400">
            Define una contraseña nueva para tu cuenta. Debe tener al menos 8 caracteres.
          </p>
        </div>

        <div className="relative flex items-center justify-between text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
          <span>Spot For Fun</span>
          <span>v1</span>
        </div>
      </aside>

      <main className="relative flex items-center justify-center bg-zinc-50 px-6 py-10 dark:bg-zinc-950">
        <div className="absolute top-6 left-6 flex items-center gap-2 lg:hidden">
          <div className="grid size-9 place-items-center rounded-lg bg-brand-500 text-sm font-black text-white">
            S4F
          </div>
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
            Centro de moderación
          </span>
        </div>

        <form onSubmit={submit} className="w-full max-w-sm">
          <div className="mb-10 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-600">
              Restablecer
            </p>
            <h2 className="text-3xl font-black leading-tight tracking-tight text-zinc-900 dark:text-zinc-50">
              Nueva contraseña
            </h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Mínimo 8 caracteres. No la compartas con nadie.
            </p>
          </div>

          {!ready ? (
            <div className="grid place-items-center py-10">
              <Loader2 className="size-6 animate-spin text-zinc-400" />
            </div>
          ) : !hasSession ? (
            <div className="space-y-4">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                El enlace no es válido o expiró. Solicita uno nuevo desde la pantalla de inicio de sesión.
              </p>
              <a
                href="/"
                className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.18em] text-brand-600 hover:text-brand-700"
              >
                Ir al inicio de sesión <ArrowRight className="size-4" />
              </a>
            </div>
          ) : (
            <>
              <div className="space-y-6">
                <Field label="Nueva contraseña">
                  <input
                    type="password"
                    autoComplete="new-password"
                    autoFocus
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-0 border-b-2 border-zinc-300 bg-transparent px-0 py-3 text-lg font-medium text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-brand-500 focus:outline-none dark:border-zinc-700 dark:text-zinc-100"
                  />
                </Field>

                <Field label="Confirmar contraseña">
                  <input
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-0 border-b-2 border-zinc-300 bg-transparent px-0 py-3 text-lg font-medium text-zinc-900 placeholder:text-zinc-400 transition-colors focus:border-brand-500 focus:outline-none dark:border-zinc-700 dark:text-zinc-100"
                  />
                </Field>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="group mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-4 text-sm font-black uppercase tracking-[0.18em] text-white transition-colors hover:bg-brand-500 disabled:opacity-60 dark:bg-brand-500 dark:hover:bg-brand-600"
              >
                {saving ? <Loader2 className="size-4 animate-spin" /> : null}
                Guardar contraseña
                {!saving && <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />}
              </button>
            </>
          )}

          <p className="mt-14 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            Spot For Fun · Centro de moderación
          </p>
        </form>
      </main>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  )
}


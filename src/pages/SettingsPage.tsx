import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../auth/useAuth'
import { useTheme, type Theme } from '../components/ThemeProvider'
import { Button, Card, PageHeader } from '../components/ui'

export function SettingsPage() {
  const { state } = useAuth()
  const { theme, setTheme } = useTheme()
  const [newPw, setNewPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)

  const email = state.status === 'admin' ? state.session.user.email : null
  const username = state.status === 'admin' ? state.username : ''

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPw.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (newPw !== confirm) {
      toast.error('Las contraseñas no coinciden.')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPw })
      if (error) throw error
      toast.success('Contraseña actualizada.')
      setNewPw('')
      setConfirm('')
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const themes: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Claro' },
    { value: 'system', label: 'Sistema' },
    { value: 'dark', label: 'Oscuro' },
  ]

  return (
    <>
      <PageHeader title="Ajustes" subtitle="Tu cuenta y las preferencias del panel." />

      <div className="grid gap-6">
        <Card className="p-5">
          <h2 className="font-semibold">Cuenta</h2>
          <dl className="mt-3 grid gap-1 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Usuario</dt>
              <dd>@{username}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500">Email</dt>
              <dd>{email ?? '—'}</dd>
            </div>
          </dl>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Tema</h2>
          <p className="mt-1 text-sm text-zinc-500">Cambia la paleta del panel. "Sistema" sigue al sistema operativo.</p>
          <div role="radiogroup" className="mt-4 flex gap-2">
            {themes.map(({ value, label }) => (
              <button
                key={value}
                role="radio"
                aria-checked={theme === value}
                onClick={() => setTheme(value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  theme === value
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                    : 'border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Cambiar contraseña</h2>
          <p className="mt-1 text-sm text-zinc-500">Mínimo 8 caracteres.</p>
          <form onSubmit={changePassword} className="mt-4 grid gap-3 sm:max-w-sm">
            <label className="text-sm font-medium">
              Nueva contraseña
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="mt-1 w-full rounded-lg border border-zinc-300 bg-transparent px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-zinc-700"
              />
            </label>
            <label className="text-sm font-medium">
              Confirma la nueva contraseña
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
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              Guardar contraseña
            </Button>
          </form>
        </Card>
      </div>
    </>
  )
}
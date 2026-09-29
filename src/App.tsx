import { Loader2 } from 'lucide-react'
import { Navigate, Route, Routes } from 'react-router'
import { useAuth } from './auth/useAuth'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Layout } from './components/Layout'
import { isSupabaseConfigured } from './lib/supabase'
import { AdminUsersPage } from './pages/AdminUsersPage'
import { AuditPage } from './pages/AuditPage'
import { LoginPage } from './pages/LoginPage'
import { OverviewPage } from './pages/OverviewPage'
import { PhotosPage } from './pages/PhotosPage'
import { ReportsPage } from './pages/ReportsPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { ReviewsPage } from './pages/ReviewsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SpotsPage } from './pages/SpotsPage'

export default function App() {
  const { state } = useAuth()

  if (!isSupabaseConfigured) {
    return (
      <div className="grid min-h-full place-items-center p-6 text-center">
        <div>
          <h1 className="text-lg font-semibold">Supabase no configurado</h1>
          <p className="mt-2 text-sm text-zinc-500">
            Copia <code>.env.example</code> a <code>.env.local</code> y llena las variables.
          </p>
        </div>
      </div>
    )
  }

  if (state.status === 'loading') {
    return (
      <div className="grid min-h-full place-items-center text-zinc-400">
        <Loader2 className="size-6 animate-spin" />
      </div>
    )
  }

  if (state.status === 'signed_out') {
    return (
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    )
  }

  return (
    <ErrorBoundary>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<OverviewPage />} />
          <Route path="spots" element={<SpotsPage />} />
          <Route path="reviews" element={<ReviewsPage />} />
          <Route path="photos" element={<PhotosPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="admins" element={<AdminUsersPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  )
}
import { useQuery } from '@tanstack/react-query'
import { fetchAudit } from '../lib/api'
import { formatDate } from '../lib/format'
import { Card, PageHeader, QueryState } from '../components/ui'

const actionLabels: Record<string, string> = {
  'spot.approved': 'Aprobó spot',
  'spot.rejected': 'Rechazó spot',
  'spot.pending': 'Regresó spot a pendiente',
  'spot.deleted': 'Eliminó spot',
  'rating.approved': 'Aprobó reseña',
  'rating.rejected': 'Rechazó reseña',
  'rating.pending': 'Regresó reseña a pendiente',
  'photo.approved': 'Aprobó foto',
  'photo.rejected': 'Rechazó foto',
  'photo.pending': 'Regresó foto a pendiente',
  'report.reviewed': 'Cerró reporte',
  'report.dismissed': 'Descartó reporte',
  'report.open': 'Reabrió reporte',
}

export function AuditPage() {
  const query = useQuery({ queryKey: ['audit'], queryFn: fetchAudit })

  return (
    <>
      <PageHeader title="Auditoría" subtitle="Últimas 200 acciones de moderación." />
      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={query.data?.length === 0}
        emptyText="Aún no hay acciones registradas."
      >
        <Card className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs text-zinc-500 uppercase dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Admin</th>
                <th className="px-4 py-3 font-medium">Acción</th>
                <th className="px-4 py-3 font-medium">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {query.data?.map((e) => {
                const reason = typeof e.details.reason === 'string' ? e.details.reason : null
                const name = typeof e.details.name === 'string' ? e.details.name : null
                return (
                  <tr key={e.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-500">{formatDate(e.created_at)}</td>
                    <td className="px-4 py-3">@{e.admin?.username ?? '—'}</td>
                    <td className="px-4 py-3">{actionLabels[e.action] ?? e.action}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {[name, reason].filter(Boolean).join(' · ') || (
                        <code className="text-xs">{e.target_id.slice(0, 8)}</code>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      </QueryState>
    </>
  )
}

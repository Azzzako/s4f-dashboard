import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { useState } from 'react'
import { fetchAudit } from '../lib/api'
import { downloadCsv, toCsv } from '../lib/csv'
import { Button, Card, PageHeader, QueryState } from '../components/ui'
import { TableRowSkeleton } from '../components/Skeleton'
import { useSearchParam } from '../lib/useSearchParam'

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
  'user.promoted': 'Promovió a admin',
  'user.demoted': 'Quitó rol de admin',
}

const PAGE_SIZE = 50

const ACTION_FILTERS = ['spot', 'rating', 'photo', 'report', 'user'] as const

export function AuditPage() {
  const [offset, setOffset] = useState(0)
  const [filter, setFilter] = useSearchParam<string>('type', '', ['', ...ACTION_FILTERS])

  const query = useQuery({
    queryKey: ['audit', filter, offset],
    queryFn: () => fetchAudit({ offset, limit: PAGE_SIZE, paginate: offset > 0 }),
    placeholderData: (prev) => prev,
  })

  const items = (query.data ?? []).filter((e) => !filter || e.action.startsWith(filter))

  const exportCsv = () => {
    // Map rows into a flat shape so the CSV serializer stays generic.
    const flat = items.map((e) => ({
      created_at: new Date(e.created_at).toISOString(),
      admin: `@${e.admin?.username ?? ''}`,
      action: e.action,
      target_type: e.target_type,
      target_id: e.target_id,
      details: JSON.stringify(e.details ?? {}),
    }))
    const csv = toCsv(flat, [
      { key: 'created_at', header: 'Fecha' },
      { key: 'admin', header: 'Admin' },
      { key: 'action', header: 'Acción' },
      { key: 'target_type', header: 'Tipo de objetivo' },
      { key: 'target_id', header: 'ID de objetivo' },
      { key: 'details', header: 'Detalles' },
    ])
    const date = new Date().toISOString().slice(0, 10)
    const suffix = filter ? `-${filter}` : ''
    downloadCsv(`auditoria${suffix}-${date}.csv`, csv)
  }

  const exportable = !query.isLoading && items.length > 0

  return (
    <>
      <PageHeader title="Auditoría" subtitle="Registro de cada acción de moderación y cambio de rol." />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
            setOffset(0)
          }}
          aria-label="Tipo de acción"
          className="rounded-lg border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="">Todas las acciones</option>
          {ACTION_FILTERS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
        {exportable && (
          <Button variant="ghost" icon={<Download className="size-4" />} onClick={exportCsv} className="ml-auto">
            Exportar CSV
          </Button>
        )}
      </div>

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={items.length === 0}
        emptyText="Aún no hay acciones registradas."
        onRetry={query.refetch}
        skeleton={<TableRowSkeleton rows={8} cols={4} />}
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
              {items.map((e) => {
                const reason = typeof e.details.reason === 'string' ? e.details.reason : null
                const name = typeof e.details.name === 'string' ? e.details.name : null
                const newRole = typeof e.details.new_role === 'string' ? e.details.new_role : null
                return (
                  <tr key={e.id}>
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-500">
                      {new Date(e.created_at).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })}
                    </td>
                    <td className="px-4 py-3">@{e.admin?.username ?? '—'}</td>
                    <td className="px-4 py-3">{actionLabels[e.action] ?? e.action}</td>
                    <td className="px-4 py-3 text-zinc-500">
                      {[name, newRole ? `rol → ${newRole}` : null, reason].filter(Boolean).join(' · ') || (
                        <code className="text-xs">{e.target_id.slice(0, 8)}</code>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>

        {query.data && query.data.length === PAGE_SIZE && (
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" onClick={() => setOffset((o) => o + PAGE_SIZE)} loading={query.isFetching}>
              Cargar más
            </Button>
          </div>
        )}
      </QueryState>
    </>
  )
}
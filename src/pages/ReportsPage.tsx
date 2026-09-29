import { useQuery } from '@tanstack/react-query'
import { EyeOff, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { deleteSpot, fetchReports, setReportStatus, setReportsStatusBulk, setSpotStatus } from '../lib/api'
import type { Report, ReportStatus } from '../lib/types'
import { useModeration } from '../lib/useModeration'
import { useSearchParam } from '../lib/useSearchParam'
import { Avatar, Button, Card, PageHeader, QueryState, ReasonDialog, StatusBadge, Tabs } from '../components/ui'
import { BulkBar } from '../components/BulkBar'
import { Checkbox } from '../components/Checkbox'
import { SearchInput } from '../components/SearchInput'

const statuses: ReportStatus[] = ['open', 'reviewed', 'dismissed']
const PAGE_SIZE = 50

export function ReportsPage() {
  const [status, setStatus] = useSearchParam<ReportStatus>('status', 'open', statuses)
  const [search, setSearch] = useSearchParam<string>('q', '', [''])
  const [offset, setOffset] = useState(0)
  const [unpublishing, setUnpublishing] = useState<Report | null>(null)
  const [deleting, setDeleting] = useState<Report | null>(null)
  const [dismissing, setDismissing] = useState<Report | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDismissing, setBulkDismissing] = useState(false)

  const query = useQuery({
    queryKey: ['reports', status, search, offset],
    queryFn: () => fetchReports(status, { search: search || undefined, offset, limit: PAGE_SIZE, paginate: offset > 0 }),
    placeholderData: (prev) => prev,
  })

  const items = query.data ?? []
  const ids = items.map((r) => r.id)
  const allChecked = ids.length > 0 && ids.every((id) => selected.has(id))

  const onSearch = (v: string) => {
    setSearch(v)
    setOffset(0)
    setSelected(new Set())
  }
  const onStatus = (v: ReportStatus) => {
    setStatus(v)
    setOffset(0)
    setSelected(new Set())
  }

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allChecked) ids.forEach((id) => next.delete(id))
      else ids.forEach((id) => next.add(id))
      return next
    })
  }
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }
  const clearSelection = () => setSelected(new Set())

  const unpublish = useModeration(async ({ report, reason }: { report: Report; reason: string }) => {
    await setSpotStatus(report.spot_id, 'rejected', reason)
    await setReportStatus(report.id, 'reviewed')
  }, 'Spot despublicado y reporte cerrado.')
  const remove = useModeration(
    async ({ report, reason }: { report: Report; reason: string }) => {
      await deleteSpot(report.spot_id, reason)
      await setReportStatus(report.id, 'reviewed')
    },
    'Spot eliminado y reporte cerrado.',
  )
  const dismiss = useModeration(
    ({ report, reason }: { report: Report; reason: string }) => setReportStatus(report.id, 'dismissed', reason),
    'Reporte descartado.',
  )
  const bulkDismiss = useModeration(
    ({ ids, reason }: { ids: string[]; reason: string }) => setReportsStatusBulk(ids, 'dismissed', reason),
    'Reportes descartados.',
    { invalidate: ['reports', 'pending-counts'] },
  )

  const selectedCount = selected.size

  return (
    <>
      <PageHeader title="Reportes" subtitle="Reportes de usuarios sobre spots.">
        <Tabs value={status} options={statuses} onChange={onStatus} />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <SearchInput value={search} onChange={onSearch} placeholder="Buscar en motivos…" />
        </div>
        {status === 'open' && items.length > 0 && (
          <button
            onClick={toggleAll}
            className="ml-auto inline-flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Checkbox checked={allChecked} onChange={toggleAll} label="Seleccionar todo" />
            {selectedCount > 0 ? `${selectedCount}/${items.length}` : 'Seleccionar todo'}
          </button>
        )}
      </div>

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={items.length === 0}
        emptyText={search ? 'Sin resultados para la búsqueda.' : 'No hay reportes en esta lista.'}
        onRetry={query.refetch}
      >
        <div className="grid gap-3">
          {items.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  {status === 'open' && (
                    <Checkbox checked={selected.has(r.id)} onChange={() => toggleOne(r.id)} label={`Seleccionar reporte`} />
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{r.spot?.name ?? 'Spot eliminado'}</p>
                      {r.spot && <StatusBadge status={r.spot.status} />}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                      <Avatar name={r.reporter?.username} url={r.reporter?.avatar_url} />
                      Reportado por @{r.reporter?.username ?? '—'} ·{' '}
                      {new Date(r.created_at).toLocaleDateString('es', { dateStyle: 'medium' })}
                    </div>
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-3 text-sm whitespace-pre-line">{r.reason}</p>

              {r.status === 'open' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="ghost" icon={<EyeOff className="size-4" />} onClick={() => setDismissing(r)}>
                    Descartar
                  </Button>
                  {r.spot?.status === 'approved' && (
                    <Button variant="reject" icon={<EyeOff className="size-4" />} onClick={() => setUnpublishing(r)}>
                      Despublicar spot
                    </Button>
                  )}
                  <Button variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setDeleting(r)}>
                    Eliminar spot
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>

        {items.length === PAGE_SIZE && (
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" onClick={() => setOffset((o) => o + PAGE_SIZE)} loading={query.isFetching}>
              Cargar más
            </Button>
          </div>
        )}
      </QueryState>

      <ReasonDialog
        open={dismissing !== null}
        title="Descartar reporte"
        description="Cierra el reporte sin tomar acción sobre el spot. La nota queda en el log de auditoría."
        confirmLabel="Descartar"
        loading={dismiss.isPending}
        onClose={() => setDismissing(null)}
        onConfirm={(reason) =>
          dismissing && dismiss.mutate({ report: dismissing, reason }, { onSuccess: () => setDismissing(null) })
        }
      />
      <ReasonDialog
        open={unpublishing !== null}
        title="Despublicar spot"
        description="El spot sale del mapa y el autor recibe el motivo."
        confirmLabel="Despublicar"
        loading={unpublish.isPending}
        onClose={() => setUnpublishing(null)}
        onConfirm={(reason) =>
          unpublishing && unpublish.mutate({ report: unpublishing, reason }, { onSuccess: () => setUnpublishing(null) })
        }
      />
      <ReasonDialog
        open={deleting !== null}
        title="Eliminar spot"
        description="Se borra el spot con fotos, reseñas y reportes. No se puede deshacer."
        confirmLabel="Eliminar definitivamente"
        required={false}
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={(reason) =>
          deleting && remove.mutate({ report: deleting, reason }, { onSuccess: () => setDeleting(null) })
        }
      />
      <ReasonDialog
        open={bulkDismissing}
        title={`Descartar ${selectedCount} reportes`}
        description="Cierra los reportes sin tomar acción sobre los spots. La nota queda en el log de auditoría."
        confirmLabel={`Descartar ${selectedCount}`}
        loading={bulkDismiss.isPending}
        onClose={() => setBulkDismissing(false)}
        onConfirm={(reason) =>
          bulkDismiss.mutate(
            { ids: Array.from(selected), reason },
            { onSuccess: () => { setBulkDismissing(false); clearSelection() } },
          )
        }
      />

      <BulkBar count={selectedCount} busy={bulkDismiss.isPending} onClear={clearSelection}>
        <Button
          variant="ghost"
          icon={<EyeOff className="size-4" />}
          loading={bulkDismiss.isPending}
          onClick={() => setBulkDismissing(true)}
        >
          Descartar seleccionados
        </Button>
      </BulkBar>
    </>
  )
}
import { useQuery } from '@tanstack/react-query'
import { EyeOff, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { deleteSpot, fetchReports, setReportStatus, setReportsStatusBulk, setSpotStatus } from '../lib/api'
import type { Report, ReportStatus } from '../lib/types'
import { useModeration } from '../lib/useModeration'
import { useSearchParam } from '../lib/useSearchParam'
import { Avatar, Button, Card, PageHeader, QueryState, ReasonDialog, StatusBadge, Tabs } from '../components/ui'
import { BulkBar } from '../components/BulkBar'
import { Checkbox } from '../components/Checkbox'
import { ConfirmDeleteDialog } from '../components/ConfirmDeleteDialog'
import { DateRangeFilter } from '../components/DateRangeFilter'
import { SearchInput } from '../components/SearchInput'

const statuses: ReportStatus[] = ['open', 'reviewed', 'dismissed']
const PAGE_SIZE = 50

interface Group {
  spotId: string | null
  spotName: string
  spotStatus: string | null
  reports: Report[]
}

function groupBySpot(reports: Report[]): Group[] {
  const map = new Map<string | null, Group>()
  for (const r of reports) {
    const key = r.spot_id
    if (!map.has(key)) {
      map.set(key, {
        spotId: key,
        spotName: r.spot?.name ?? 'Spot eliminado',
        spotStatus: r.spot?.status ?? null,
        reports: [],
      })
    }
    map.get(key)!.reports.push(r)
  }
  // Sort: groups with open reports first; then by most recent report
  return Array.from(map.values()).sort((a, b) => {
    const aOpen = a.reports.some((r) => r.status === 'open')
    const bOpen = b.reports.some((r) => r.status === 'open')
    if (aOpen !== bOpen) return aOpen ? -1 : 1
    const aT = Math.max(...a.reports.map((r) => new Date(r.created_at).getTime()))
    const bT = Math.max(...b.reports.map((r) => new Date(r.created_at).getTime()))
    return bT - aT
  })
}

export function ReportsPage() {
  const [status, setStatus] = useSearchParam<ReportStatus>('status', 'open', statuses)
  const [search, setSearch] = useSearchParam<string>('q', '', [''])
  const [dateFrom, setDateFrom] = useSearchParam<string>('from', '', [''])
  const [dateTo, setDateTo] = useSearchParam<string>('to', '', [''])
  const [offset, setOffset] = useState(0)
  const [unpublishing, setUnpublishing] = useState<Group | null>(null)
  const [deleting, setDeleting] = useState<Group | null>(null)
  const [dismissing, setDismissing] = useState<Group | null>(null)
  const [expanded, setExpanded] = useState<Set<string | null>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkDismissing, setBulkDismissing] = useState(false)

  const query = useQuery({
    queryKey: ['reports', status, search, dateFrom, dateTo, offset],
    queryFn: () =>
      fetchReports(status, {
        search: search || undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        offset,
        limit: PAGE_SIZE,
        paginate: offset > 0,
      }),
    placeholderData: (prev) => prev,
  })

  const groups = useMemo(() => groupBySpot(query.data ?? []), [query.data])

  const onSearch = (v: string) => {
    setSearch(v)
    setOffset(0)
    setSelected(new Set())
  }
  const onDateRange = (range: { from: string; to: string }) => {
    setDateFrom(range.from)
    setDateTo(range.to)
    setOffset(0)
    setSelected(new Set())
  }
  const onStatus = (v: ReportStatus) => {
    setStatus(v)
    setOffset(0)
    setSelected(new Set())
  }

  const toggleGroup = (key: string | null) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  const toggleGroupSelected = (g: Group) => {
    setSelected((prev) => {
      const next = new Set(prev)
      const allSelected = g.reports.every((r) => next.has(r.id))
      if (allSelected) g.reports.forEach((r) => next.delete(r.id))
      else g.reports.forEach((r) => next.add(r.id))
      return next
    })
  }
  const clearSelection = () => setSelected(new Set())

  const unpublish = useModeration(async ({ group, reason }: { group: Group; reason: string }) => {
    if (!group.spotId) return
    await setSpotStatus(group.spotId, 'rejected', reason)
    await Promise.all(group.reports.map((r) => setReportStatus(r.id, 'reviewed')))
  }, 'Spot despublicado y reportes cerrados.')
  const remove = useModeration(
    async ({ group, reason }: { group: Group; reason: string }) => {
      if (!group.spotId) return
      await deleteSpot(group.spotId, reason)
      await Promise.all(group.reports.map((r) => setReportStatus(r.id, 'reviewed')))
    },
    'Spot eliminado y reportes cerrados.',
  )
  const dismiss = useModeration(
    async ({ group, reason }: { group: Group; reason: string }) => {
      await Promise.all(group.reports.map((r) => setReportStatus(r.id, 'dismissed', reason)))
    },
    'Reportes descartados.',
  )
  const bulkDismiss = useModeration(
    ({ ids, reason }: { ids: string[]; reason: string }) => setReportsStatusBulk(ids, 'dismissed', reason),
    'Reportes descartados.',
    { invalidate: ['reports', 'pending-counts'] },
  )

  const selectedCount = selected.size

  return (
    <>
      <PageHeader title="Reportes" subtitle="Reportes de usuarios sobre spots, agrupados por spot.">
        <Tabs value={status} options={statuses} onChange={onStatus} />
      </PageHeader>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="min-w-0 flex-1 sm:max-w-xs">
          <SearchInput value={search} onChange={onSearch} placeholder="Buscar en motivos…" />
        </div>
        <DateRangeFilter from={dateFrom} to={dateTo} onChange={onDateRange} />
      </div>

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={groups.length === 0}
        emptyText={search ? 'Sin resultados para la búsqueda.' : 'No hay reportes en esta lista.'}
        onRetry={query.refetch}
      >
        <div className="grid gap-3">
          {groups.map((g, idx) => {
            const isOpen = g.reports.some((r) => r.status === 'open')
            const allChecked = g.reports.length > 0 && g.reports.every((r) => selected.has(r.id))
            const someChecked = g.reports.some((r) => selected.has(r.id))
            const isExpanded = expanded.has(g.spotId)
            const visibleReports = isExpanded ? g.reports : g.reports.slice(0, 1)
            const hiddenCount = g.reports.length - visibleReports.length
            return (
              <Card key={g.spotId ?? `deleted-${idx}`} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    {isOpen && status === 'open' && (
                      <Checkbox
                        checked={allChecked}
                        onChange={() => toggleGroupSelected(g)}
                        label={`Seleccionar reportes de ${g.spotName}`}
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{g.spotName}</p>
                        {g.spotStatus && <StatusBadge status={g.spotStatus} />}
                        <span className="inline-flex items-center rounded-full bg-zinc-200 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-300">
                          {g.reports.length} {g.reports.length === 1 ? 'reporte' : 'reportes'}
                        </span>
                      </div>
                      {someChecked && !allChecked && (
                        <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
                          {g.reports.filter((r) => selected.has(r.id)).length} de {g.reports.length} seleccionados
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {visibleReports.map((r) => (
                    <div key={r.id} className="flex items-start gap-2 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800/50">
                      <Avatar name={r.reporter?.username} url={r.reporter?.avatar_url} />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-zinc-500">
                          @{r.reporter?.username ?? '—'} · {new Date(r.created_at).toLocaleDateString('es', { dateStyle: 'medium' })}
                        </p>
                        <p className="mt-0.5 whitespace-pre-line">{r.reason}</p>
                      </div>
                      <StatusBadge status={r.status} />
                    </div>
                  ))}
                  {hiddenCount > 0 && (
                    <button
                      onClick={() => toggleGroup(g.spotId)}
                      className="text-sm text-brand-600 hover:underline"
                    >
                      Mostrar {hiddenCount} más
                    </button>
                  )}
                  {isExpanded && g.reports.length > 1 && (
                    <button
                      onClick={() => toggleGroup(g.spotId)}
                      className="block text-sm text-brand-600 hover:underline"
                    >
                      Colapsar
                    </button>
                  )}
                </div>

                {isOpen && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="ghost" icon={<EyeOff className="size-4" />} onClick={() => setDismissing(g)}>
                      Descartar {g.reports.length > 1 ? `los ${g.reports.length}` : ''}
                    </Button>
                    {g.spotStatus === 'approved' && (
                      <Button variant="reject" icon={<EyeOff className="size-4" />} onClick={() => setUnpublishing(g)}>
                        Despublicar spot
                      </Button>
                    )}
                    {g.spotId && (
                      <Button variant="ghost" icon={<Trash2 className="size-4" />} onClick={() => setDeleting(g)}>
                        Eliminar spot
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>

        {(query.data?.length ?? 0) === PAGE_SIZE && (
          <div className="mt-6 flex justify-center">
            <Button variant="ghost" onClick={() => setOffset((o) => o + PAGE_SIZE)} loading={query.isFetching}>
              Cargar más
            </Button>
          </div>
        )}
      </QueryState>

      <ReasonDialog
        open={dismissing !== null}
        title="Descartar reportes"
        description="Cierra los reportes del spot sin tomar acción sobre él. La nota queda en el log de auditoría."
        confirmLabel="Descartar"
        loading={dismiss.isPending}
        onClose={() => setDismissing(null)}
        onConfirm={(reason) =>
          dismissing && dismiss.mutate({ group: dismissing, reason }, { onSuccess: () => setDismissing(null) })
        }
      />
      <ReasonDialog
        open={unpublishing !== null}
        title="Despublicar spot"
        description="El spot sale del mapa y el autor recibe el motivo. Todos los reportes abiertos se cierran."
        confirmLabel="Despublicar"
        loading={unpublish.isPending}
        onClose={() => setUnpublishing(null)}
        onConfirm={(reason) =>
          unpublishing && unpublish.mutate({ group: unpublishing, reason }, { onSuccess: () => setUnpublishing(null) })
        }
      />
      <ConfirmDeleteDialog
        open={deleting !== null}
        spotName={deleting?.spotName}
        loading={remove.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={(reason) =>
          deleting && remove.mutate({ group: deleting, reason }, { onSuccess: () => setDeleting(null) })
        }
      />
      <ReasonDialog
        open={bulkDismissing}
        title={`Descartar ${selectedCount} reportes`}
        description="Cierra los reportes seleccionados sin tomar acción sobre los spots."
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
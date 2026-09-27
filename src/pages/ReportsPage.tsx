import { useQuery } from '@tanstack/react-query'
import { Check, EyeOff, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { deleteSpot, fetchReports, setReportStatus, setSpotStatus } from '../lib/api'
import { timeAgo } from '../lib/format'
import type { Report, ReportStatus } from '../lib/types'
import { useModeration } from '../lib/useModeration'
import { Avatar, Button, Card, PageHeader, QueryState, ReasonDialog, StatusBadge, Tabs } from '../components/ui'

const statuses: ReportStatus[] = ['open', 'reviewed', 'dismissed']

export function ReportsPage() {
  const [status, setStatus] = useState<ReportStatus>('open')
  const [unpublishing, setUnpublishing] = useState<Report | null>(null)
  const [deleting, setDeleting] = useState<Report | null>(null)
  const query = useQuery({ queryKey: ['reports', status], queryFn: () => fetchReports(status) })

  const resolve = useModeration(
    ({ id, next }: { id: string; next: ReportStatus }) => setReportStatus(id, next),
    'Reporte actualizado.',
  )
  const unpublish = useModeration(async ({ report, reason }: { report: Report; reason: string }) => {
    await setSpotStatus(report.spot_id, 'rejected', reason)
    await setReportStatus(report.id, 'reviewed')
  }, 'Spot despublicado y reporte cerrado.')
  const remove = useModeration(
    ({ report, reason }: { report: Report; reason: string }) => deleteSpot(report.spot_id, reason),
    'Spot eliminado.',
  )

  return (
    <>
      <PageHeader title="Reportes" subtitle="Reportes de usuarios sobre spots.">
        <Tabs value={status} options={statuses} onChange={setStatus} />
      </PageHeader>

      <QueryState
        isLoading={query.isLoading}
        error={query.error}
        isEmpty={query.data?.length === 0}
        emptyText="No hay reportes en esta lista."
      >
        <div className="grid gap-3">
          {query.data?.map((r) => (
            <Card key={r.id} className="p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{r.spot?.name ?? 'Spot eliminado'}</p>
                    {r.spot && <StatusBadge status={r.spot.status} />}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
                    <Avatar name={r.reporter?.username} url={r.reporter?.avatar_url} />
                    Reportado por @{r.reporter?.username ?? '—'} · {timeAgo(r.created_at)}
                  </div>
                </div>
                <StatusBadge status={r.status} />
              </div>
              <p className="mt-3 text-sm whitespace-pre-line">{r.reason}</p>

              {r.status === 'open' && (
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="ghost"
                    icon={<Check className="size-4" />}
                    loading={resolve.isPending && resolve.variables?.id === r.id}
                    onClick={() => resolve.mutate({ id: r.id, next: 'dismissed' })}
                  >
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
      </QueryState>

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
    </>
  )
}

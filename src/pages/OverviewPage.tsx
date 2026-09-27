import { Flag, Image, MapPin, MessageSquareText } from 'lucide-react'
import { Link } from 'react-router'
import { Card, PageHeader, QueryState } from '../components/ui'
import { usePendingCounts } from '../lib/queries'

const tiles = [
  { key: 'spots', label: 'Spots pendientes', to: '/spots', icon: MapPin },
  { key: 'ratings', label: 'Reseñas pendientes', to: '/reviews', icon: MessageSquareText },
  { key: 'photos', label: 'Fotos pendientes', to: '/photos', icon: Image },
  { key: 'reports', label: 'Reportes abiertos', to: '/reports', icon: Flag },
] as const

export function OverviewPage() {
  const { data, isLoading, error } = usePendingCounts()
  const total = data ? data.spots + data.ratings + data.photos + data.reports : 0

  return (
    <>
      <PageHeader
        title="Resumen"
        subtitle={total === 0 ? 'Todo al día. No hay nada por moderar.' : `${total} elementos esperan revisión.`}
      />
      <QueryState isLoading={isLoading} error={error} isEmpty={false} emptyText="">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map(({ key, label, to, icon: Icon }) => (
            <Link key={key} to={to}>
              <Card className="p-5 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400">
                  <span className="text-sm">{label}</span>
                  <Icon className="size-4" />
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums">{data?.[key] ?? 0}</p>
              </Card>
            </Link>
          ))}
        </div>
      </QueryState>
    </>
  )
}

import { useQuery } from '@tanstack/react-query'
import { Flag, Image, MapPin, MessageSquareText } from 'lucide-react'
import { Link } from 'react-router'
import { Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, PieChart, Pie, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchAuditRecent } from '../lib/api'
import { actionMix, dailyActions, topModerators } from '../lib/analytics'
import { Card, PageHeader, QueryState } from '../components/ui'
import { usePendingCounts } from '../lib/queries'

const tiles = [
  { key: 'spots', label: 'Spots pendientes', to: '/spots', icon: MapPin },
  { key: 'ratings', label: 'Reseñas pendientes', to: '/reviews', icon: MessageSquareText },
  { key: 'photos', label: 'Fotos pendientes', to: '/photos', icon: Image },
  { key: 'reports', label: 'Reportes abiertos', to: '/reports', icon: Flag },
] as const

const MIX_COLORS = ['#f97316', '#10b981', '#e11d48', '#6366f1', '#eab308']

export function OverviewPage() {
  const { data, isLoading, error } = usePendingCounts()
  const total = data ? data.spots + data.ratings + data.photos + data.reports : 0

  const audit = useQuery({
    queryKey: ['audit-analytics'],
    queryFn: () => fetchAuditRecent(1000),
    staleTime: 60_000,
  })

  const daily = audit.data ? dailyActions(audit.data, 30) : []
  const mix = audit.data ? actionMix(audit.data).slice(0, 5) : []
  const top = audit.data ? topModerators(audit.data, 5) : []

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

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="font-semibold">Actividad diaria (30 días)</h2>
          <p className="mt-1 text-sm text-zinc-500">Aprobaciones, rechazos y otras acciones por día.</p>
          <div className="mt-4 h-64">
            {audit.isLoading ? (
              <div className="grid h-full place-items-center text-sm text-zinc-400">Cargando…</div>
            ) : (
              <ResponsiveContainer>
                <LineChart data={daily}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.1} />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke="currentColor" fontSize={11} />
                  <YAxis allowDecimals={false} stroke="currentColor" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, white)',
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="approved" name="Aprobadas" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="rejected" name="Rechazadas" stroke="#e11d48" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="other" name="Otras" stroke="#6366f1" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="font-semibold">Mix por tipo (últimas 1000 acciones)</h2>
          <p className="mt-1 text-sm text-zinc-500">Distribución entre spots, reseñas, fotos y reportes.</p>
          <div className="mt-4 h-64">
            {audit.isLoading ? (
              <div className="grid h-full place-items-center text-sm text-zinc-400">Cargando…</div>
            ) : mix.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-zinc-400">Sin actividad aún.</div>
            ) : (
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={mix} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={80} label>
                    {mix.map((_, i) => (
                      <Cell key={i} fill={MIX_COLORS[i % MIX_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card className="p-5 lg:col-span-2">
          <h2 className="font-semibold">Top moderadores</h2>
          <p className="mt-1 text-sm text-zinc-500">Quién ha hecho más acciones recientemente.</p>
          <div className="mt-4 h-64">
            {audit.isLoading ? (
              <div className="grid h-full place-items-center text-sm text-zinc-400">Cargando…</div>
            ) : top.length === 0 ? (
              <div className="grid h-full place-items-center text-sm text-zinc-400">Sin actividad aún.</div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={top} layout="vertical" margin={{ left: 80 }}>
                  <CartesianGrid stroke="currentColor" strokeOpacity={0.1} />
                  <XAxis type="number" allowDecimals={false} stroke="currentColor" fontSize={11} />
                  <YAxis dataKey="username" type="category" stroke="currentColor" fontSize={11} width={80} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="approved" name="Aprobadas" stackId="a" fill="#10b981" />
                  <Bar dataKey="rejected" name="Rechazadas" stackId="a" fill="#e11d48" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>
    </>
  )
}
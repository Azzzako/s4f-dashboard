const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' })

const steps: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31_536_000],
  ['month', 2_592_000],
  ['week', 604_800],
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

export function timeAgo(iso: string): string {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000
  for (const [unit, secs] of steps) {
    if (Math.abs(diff) >= secs) return rtf.format(Math.round(diff / secs), unit)
  }
  return 'justo ahora'
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
}

export const labels: Record<string, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
  open: 'Abierto',
  reviewed: 'Revisado',
  dismissed: 'Descartado',
  street: 'Street',
  park: 'Park',
  bowl: 'Bowl',
  plaza: 'Plaza',
  diy: 'DIY',
  skateshop: 'Skateshop',
  skatepark: 'Skatepark',
  gap: 'Gap',
  beginner: 'Principiante',
  intermediate: 'Intermedio',
  advanced: 'Avanzado',
  morning: 'Mañana',
  midday: 'Mediodía',
  afternoon: 'Tarde',
  evening: 'Atardecer',
  night: 'Noche',
}

export const label = (value: string) => labels[value] ?? value

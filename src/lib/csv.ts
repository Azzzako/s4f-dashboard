// Tiny CSV exporter. Handles quoting (commas, quotes, newlines) and
// downloads via an in-memory Blob. No deps.

export function toCsv<T extends object>(rows: T[], columns: { key: keyof T; header: string }[]): string {
  if (rows.length === 0) return columns.map((c) => escape(c.header)).join(',')
  const header = columns.map((c) => escape(c.header)).join(',')
  const body = rows
    .map((row) => columns.map((c) => escape(row[c.key])).join(','))
    .join('\n')
  return `${header}\n${body}`
}

function escape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = typeof value === 'string' ? value : String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function downloadCsv(filename: string, content: string) {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
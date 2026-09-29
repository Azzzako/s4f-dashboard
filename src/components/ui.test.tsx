import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { QueryState } from './ui'

describe('<QueryState>', () => {
  it('shows a spinner when loading', () => {
    const { container } = render(
      <QueryState isLoading error={null} isEmpty={false} emptyText="empty">
        <div>content</div>
      </QueryState>,
    )
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('shows an error card with a retry button when onRetry is provided', async () => {
    const onRetry = vi.fn()
    render(
      <QueryState isLoading={false} error={new Error('falló')} isEmpty={false} emptyText="empty" onRetry={onRetry}>
        <div>content</div>
      </QueryState>,
    )
    expect(screen.getByText('No se pudo cargar.')).toBeInTheDocument()
    expect(screen.getByText('falló')).toBeInTheDocument()
    const btn = screen.getByRole('button', { name: /reintentar/i })
    await userEvent.click(btn)
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('does not show a retry button when onRetry is missing', () => {
    render(
      <QueryState isLoading={false} error={new Error('x')} isEmpty={false} emptyText="empty">
        <div>content</div>
      </QueryState>,
    )
    expect(screen.queryByRole('button', { name: /reintentar/i })).not.toBeInTheDocument()
  })

  it('shows empty state with provided text', () => {
    render(
      <QueryState isLoading={false} error={null} isEmpty emptyText="No hay nada">
        <div />
      </QueryState>,
    )
    expect(screen.getByText('No hay nada')).toBeInTheDocument()
  })

  it('renders children when there is data', () => {
    render(
      <QueryState isLoading={false} error={null} isEmpty={false} emptyText="empty">
        <p>datos reales</p>
      </QueryState>,
    )
    expect(screen.getByText('datos reales')).toBeInTheDocument()
  })
})
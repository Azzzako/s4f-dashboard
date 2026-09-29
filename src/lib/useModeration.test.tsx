import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useModeration } from './useModeration'

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const { toast } = await import('sonner')

afterEach(() => {
  vi.clearAllMocks()
})

describe('useModeration', () => {
  it('toasts success and invalidates matching keys on success', async () => {
    const fn = vi.fn(async () => {})
    const invalidateSpy = vi.fn()
    const qc = new QueryClient()
    qc.invalidateQueries = invalidateSpy

    const { result } = renderHook(() => useModeration<number>(fn, 'Listo.'), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    })

    await act(async () => {
      result.current.mutate(42)
    })

    await waitFor(() => {
      expect(fn).toHaveBeenCalled()
      const args = fn.mock.calls[0] as unknown as [number]
      expect(args[0]).toBe(42)
      expect(toast.success).toHaveBeenCalledWith('Listo.')
      expect(invalidateSpy).toHaveBeenCalled()
    })
  })

  it('toasts error and skips invalidation on failure', async () => {
    const fn = vi.fn(async () => {
      throw new Error('boom')
    })
    const invalidateSpy = vi.fn()
    const qc = new QueryClient()
    qc.invalidateQueries = invalidateSpy

    const { result } = renderHook(() => useModeration(fn, 'OK'), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    })

    await act(async () => {
      result.current.mutate(undefined)
    })

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('boom')
      expect(invalidateSpy).not.toHaveBeenCalled()
    })
  })

  it('invalidates only the provided keys when given', async () => {
    const fn = vi.fn(async () => {})
    const invalidateSpy = vi.fn()
    const qc = new QueryClient()
    qc.invalidateQueries = invalidateSpy

    const { result } = renderHook(() => useModeration(fn, 'OK', { invalidate: ['spots'] }), {
      wrapper: ({ children }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>,
    })

    await act(async () => {
      result.current.mutate(undefined)
    })

    await waitFor(() => {
      const calls = invalidateSpy.mock.calls.flat()
      const keys = calls.map((c: unknown) => (c as { queryKey: string[] }).queryKey[0])
      expect(keys).toContain('spots')
      expect(keys).not.toContain('audit')
    })
  })
})
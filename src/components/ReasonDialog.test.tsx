import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { ReasonDialog } from './ui'

describe('<ReasonDialog>', () => {
  it('clears the textarea each time it reopens', () => {
    const onConfirm = vi.fn()
    const onClose = vi.fn()

    const { rerender } = render(
      <ReasonDialog open title="X" confirmLabel="OK" onConfirm={onConfirm} onClose={onClose} />,
    )
    const textarea = screen.getByPlaceholderText(/motivo/i) as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'primer texto' } })
    expect(textarea.value).toBe('primer texto')

    // Close
    rerender(
      <ReasonDialog open={false} title="X" confirmLabel="OK" onConfirm={onConfirm} onClose={onClose} />,
    )
    // Reopen
    rerender(
      <ReasonDialog open title="X" confirmLabel="OK" onConfirm={onConfirm} onClose={onClose} />,
    )
    const textareaAfter = screen.getByPlaceholderText(/motivo/i) as HTMLTextAreaElement
    expect(textareaAfter.value).toBe('')
  })

  it('disables submit when reason is required but empty', () => {
    render(<ReasonDialog open title="X" confirmLabel="OK" onConfirm={() => {}} onClose={() => {}} />)
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
  })

  it('enables submit when reason meets the 3-char minimum', () => {
    render(<ReasonDialog open title="X" confirmLabel="OK" onConfirm={() => {}} onClose={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText(/motivo/i), { target: { value: 'ok' } })
    expect(screen.getByRole('button', { name: 'OK' })).toBeDisabled()
    fireEvent.change(screen.getByPlaceholderText(/motivo/i), { target: { value: 'ok ahora sí' } })
    expect(screen.getByRole('button', { name: 'OK' })).not.toBeDisabled()
  })

  it('calls onConfirm with the trimmed reason', () => {
    const onConfirm = vi.fn()
    render(<ReasonDialog open title="X" confirmLabel="OK" onConfirm={onConfirm} onClose={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText(/motivo/i), { target: { value: '   hola   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'OK' }))
    expect(onConfirm).toHaveBeenCalledWith('hola')
  })

  it('allows submitting empty when required is false', () => {
    const onConfirm = vi.fn()
    render(
      <ReasonDialog open title="X" confirmLabel="OK" required={false} onConfirm={onConfirm} onClose={() => {}} />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'OK' }))
    expect(onConfirm).toHaveBeenCalledWith('')
  })
})
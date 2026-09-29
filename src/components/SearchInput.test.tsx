import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SearchInput } from './SearchInput'

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe('<SearchInput>', () => {
  it('renders with the initial value', () => {
    render(<SearchInput value="hola" onChange={() => {}} />)
    expect(screen.getByDisplayValue('hola')).toBeInTheDocument()
  })

  it('shows a clear button only when there is text', () => {
    const { rerender } = render(<SearchInput value="" onChange={() => {}} />)
    expect(screen.queryByRole('button', { name: /limpiar búsqueda/i })).not.toBeInTheDocument()

    rerender(<SearchInput value="algo" onChange={() => {}} />)
    expect(screen.getByRole('button', { name: /limpiar búsqueda/i })).toBeInTheDocument()
  })

  it('debounces onChange calls', () => {
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} debounce={300} />)
    const input = screen.getByPlaceholderText('Buscar…') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'a' } })
    fireEvent.change(input, { target: { value: 'ab' } })
    fireEvent.change(input, { target: { value: 'abc' } })

    // Debounce hasn't fired yet.
    expect(onChange).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith('abc')
  })

  it('does not debounce when debounce is 0', () => {
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} debounce={0} />)
    const input = screen.getByPlaceholderText('Buscar…') as HTMLInputElement

    fireEvent.change(input, { target: { value: 'x' } })
    expect(onChange).toHaveBeenCalledWith('x')
  })

  it('clears the input when the X is clicked', () => {
    const onChange = vi.fn()
    render(<SearchInput value="hola" onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: /limpiar búsqueda/i }))
    expect(onChange).toHaveBeenCalledWith('')
  })
})
import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('returns just the header when there are no rows', () => {
    expect(toCsv([], [{ key: 'a', header: 'A' }])).toBe('A')
  })

  it('serializes simple rows', () => {
    const out = toCsv([{ a: 1, b: 'x' }], [
      { key: 'a', header: 'A' },
      { key: 'b', header: 'B' },
    ])
    expect(out).toBe('A,B\n1,x')
  })

  it('quotes values containing commas', () => {
    const out = toCsv([{ a: 'hello, world' }], [{ key: 'a', header: 'A' }])
    expect(out).toBe('A\n"hello, world"')
  })

  it('escapes embedded quotes by doubling them', () => {
    const out = toCsv([{ a: 'say "hi"' }], [{ key: 'a', header: 'A' }])
    expect(out).toBe('A\n"say ""hi"""')
  })

  it('renders newlines inside quoted strings', () => {
    const out = toCsv([{ a: 'line1\nline2' }], [{ key: 'a', header: 'A' }])
    expect(out).toBe('A\n"line1\nline2"')
  })

  it('emits empty cells for null and undefined', () => {
    const out = toCsv([{ a: null, b: undefined }], [
      { key: 'a', header: 'A' },
      { key: 'b', header: 'B' },
    ])
    expect(out).toBe('A,B\n,')
  })
})
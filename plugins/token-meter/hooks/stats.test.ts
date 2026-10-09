import { expect, test } from 'claude-code/testing'

import { add, empty, fmt, line, plain } from './stats'

const one = (input: number, output: number, read: number, write: number) =>
  add(empty(), {
    input_tokens: input,
    output_tokens: output,
    cache_read_input_tokens: read,
    cache_creation_input_tokens: write,
  })

test('formats token counts', async () => {
  expect(fmt(950)).toBe('950')
  expect(fmt(6100)).toBe('6.1k')
  expect(fmt(182_400)).toBe('182k')
  expect(fmt(3_400_000)).toBe('3.4M')
})

test('shows the latest request and running subagents', async () => {
  const last = one(50, 300, 4000, 1150)
  const agents = {
    a1: { last: one(100, 200, 900, 0), type: 'Explore', done: false },
    a2: { last: one(500, 300, 0, 500), type: 'Plan', done: true },
  }
  const total = add(add(last, { input_tokens: 2000, output_tokens: 900, cache_read_input_tokens: 30_000, cache_creation_input_tokens: 0 }), {
    input_tokens: 100, output_tokens: 200, cache_read_input_tokens: 900, cache_creation_input_tokens: 0,
  })
  const segs = line(last, agents, total)!
  expect(plain(segs)).toBe('↑1.2k ↓300 77%   explore ↑100 ↓200 90% | session ↑3.3k ↓1.4k')
  expect(segs.filter(s => s.tone === 'warn').map(s => s.text)).toEqual(['77%'])
})

test('empty before any request', async () => {
  expect(line(null, {}, empty())).toBe(undefined)
})

test('keeps the session total once the latest requests are gone', async () => {
  expect(plain(line(null, {}, one(50, 300, 4000, 1150))!)).toBe('session ↑1.2k ↓300')
})

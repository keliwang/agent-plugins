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
  expect(fmt(6199)).toBe('6.1K')
  expect(fmt(182_400)).toBe('182.4K')
  expect(fmt(3_400_000)).toBe('3.4M')
})

test('shows the latest request and running subagents', async () => {
  const last = one(50, 300, 4000, 1150)
  const agents = {
    a1: { last: one(100, 200, 900, 0), type: 'Explore', done: false },
    a2: { last: one(500, 300, 0, 500), type: 'Plan', done: true },
  }
  const segs = line(last, agents)!
  expect(plain(segs)).toBe('in 50 out 300 | cache 4.0K +1.1K hit 77%   explore in 100 out 200 | cache 900 hit 90%')
  expect(segs.filter(s => s.text.endsWith('%')).map(s => [s.text, s.tone])).toEqual([
    ['77%', 'warn'],
    ['90%', 'good'],
  ])
})

test('shows ctx after the latest request when given', async () => {
  const last = one(50, 300, 4000, 1150)
  expect(plain(line(last, {}, 12)!)).toBe('in 50 out 300 | cache 4.0K +1.1K hit 77% | ctx 12%')
  expect(line(last, {}, 72)!.find(s => s.text === 'ctx 72%')?.tone).toBe('warn')
  expect(line(last, {}, 90)!.find(s => s.text === 'ctx 90%')?.tone).toBe('bad')
  expect(plain(line(last, {}, null)!)).not.toContain('ctx')
})

test('empty before any request', async () => {
  expect(line(null, {})).toBe(undefined)
})

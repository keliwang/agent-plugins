import type { ModelUsage } from 'claude-code'

import type { AgentBucket, Bucket } from '../types'

export const empty = (): Bucket => ({ in: 0, out: 0, read: 0, write: 0, reqs: 0 })

export const add = (b: Bucket, u: ModelUsage): Bucket => ({
  in: b.in + u.input_tokens + u.cache_read_input_tokens + u.cache_creation_input_tokens,
  out: b.out + u.output_tokens,
  read: b.read + u.cache_read_input_tokens,
  write: b.write + u.cache_creation_input_tokens,
  reqs: b.reqs + 1,
})

export const fmt = (n: number): string =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e5 ? 0 : 1)}k` : `${n}`

/** Hit-rate colour bands, red to green. */
export type Tone = 'good' | 'warn' | 'bad'
const tone = (r: number): Tone => (r >= 0.8 ? 'good' : r >= 0.5 ? 'warn' : 'bad')

/** A run of the line's text, coloured by `tone` when set. */
export type Seg = { text: string; tone?: Tone }

const ratio = (b: Bucket) => (b.in === 0 ? 0 : b.read / b.in)

/** ↑ input the cache did not serve (uncached + cache writes), ↓ output, hit %. */
const req = (b: Bucket): Seg[] => [
  { text: `↑${fmt(b.in - b.read)} ↓${fmt(b.out)} ` },
  { text: `${Math.round(ratio(b) * 100)}%`, tone: tone(ratio(b)) },
]

/** The line as runs of text, or undefined before the first request:
 *  the latest requests, then ` | ` and the session's running total. */
export const line = (
  last: Bucket | null,
  agents: Readonly<Record<string, AgentBucket>>,
  total: Bucket,
): Seg[] | undefined => {
  const running = Object.values(agents).filter(a => !a.done && a.last?.reqs > 0)
  if (last === null && running.length === 0 && total.reqs === 0) return undefined

  const segs: Seg[] = []
  if (last !== null) segs.push(...req(last))
  for (const a of running) {
    if (segs.length > 0) segs.push({ text: '   ' })
    // Lowercased to match `session`: built-in types mix `Explore` and `general-purpose`.
    segs.push({ text: `${a.type.toLowerCase()} ` }, ...req(a.last))
  }
  if (segs.length > 0) segs.push({ text: ' | ' })
  segs.push({ text: `session ↑${fmt(total.in - total.read)} ↓${fmt(total.out)}` })
  return segs
}

export const plain = (segs: readonly Seg[]) => segs.map(s => s.text).join('')

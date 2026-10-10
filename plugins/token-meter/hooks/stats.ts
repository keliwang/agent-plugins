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

/** One decimal, truncated, as the status line script prints it: `34.9K`, `1.2M`. */
export const fmt = (n: number): string =>
  n >= 1e6
    ? `${Math.floor(n / 1e6)}.${Math.floor(n / 1e5) % 10}M`
    : n >= 1e3
      ? `${Math.floor(n / 1e3)}.${Math.floor(n / 100) % 10}K`
      : `${n}`

/** Colour bands, red to green, and `dim` for labels and separators. */
export type Tone = 'good' | 'warn' | 'bad' | 'dim'
const hitTone = (pct: number): Tone => (pct >= 80 ? 'good' : pct >= 50 ? 'warn' : 'bad')
const ctxTone = (pct: number): Tone => (pct >= 85 ? 'bad' : pct >= 70 ? 'warn' : 'dim')

/** A run of the line's text, coloured by `tone` when set. */
export type Seg = { text: string; tone?: Tone }

const dim = (text: string): Seg => ({ text, tone: 'dim' })
const SEP = dim(' | ')
const GAP: Seg = { text: '   ' }

/** `in 50 out 300 | cache 4.0K +1.1K hit 77%`: uncached input, output, cache reads,
 *  cache writes when any, and the share of input the cache served. */
const req = (b: Bucket): Seg[] => {
  const segs: Seg[] = [
    dim('in '),
    { text: fmt(b.in - b.read - b.write), tone: 'good' },
    dim(' out '),
    { text: fmt(b.out), tone: 'good' },
    SEP,
    dim('cache '),
    { text: fmt(b.read), tone: 'warn' },
  ]
  if (b.write > 0) segs.push(dim(' +'), { text: fmt(b.write), tone: 'warn' })
  segs.push(dim(' hit '))
  if (b.in === 0) {
    segs.push(dim('--'))
  } else {
    const pct = Math.round((b.read / b.in) * 100)
    segs.push({ text: `${pct}%`, tone: hitTone(pct) })
  }
  return segs
}

/** The line as runs of text, or undefined with nothing to show: the main loop's
 *  latest request and `ctx` (when given), then each running subagent's latest request. */
export const line = (
  last: Bucket | null,
  agents: Readonly<Record<string, AgentBucket>>,
  ctx?: number | null,
): Seg[] | undefined => {
  const running = Object.values(agents).filter(a => !a.done && a.last?.reqs > 0)
  const groups: Seg[][] = []
  const main: Seg[] = last === null ? [] : req(last)
  if (ctx != null) {
    if (main.length > 0) main.push(SEP)
    main.push({ text: `ctx ${ctx}%`, tone: ctxTone(ctx) })
  }
  if (main.length > 0) groups.push(main)
  // Lowercased, as built-in types mix `Explore` and `general-purpose`.
  for (const a of running) groups.push([dim(`${a.type.toLowerCase()} `), ...req(a.last)])
  if (groups.length === 0) return undefined
  return groups.flatMap((g, i) => (i === 0 ? g : [GAP, ...g]))
}

export const plain = (segs: readonly Seg[]) => segs.map(s => s.text).join('')

import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { AgentBucket } from '../types'
import { add, empty, line } from './stats'
import type { Tone } from './stats'

const last = atom({ plugin: 'token-meter', key: 'last' } as const, null)
const agents = atom({ plugin: 'token-meter', key: 'agents' } as const, {})
const ctx = atom({ plugin: 'token-meter', key: 'ctx' } as const, null)

// Theme keys, so the colours follow the person's light or dark theme.
const STYLE = {
  good: { color: 'success', bold: true },
  warn: { color: 'warning', bold: true },
  bad: { color: 'error', bold: true },
  dim: { dimColor: true },
} as const satisfies Record<Tone, object>

const blankAgent = (): AgentBucket => ({ last: empty(), type: 'agent', done: false })

export const register: Register = on => {
  // Drawn above the prompt; the atom writes below redraw it.
  // Only the CLI shows `ctx`; the other surfaces draw their own context meter.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const fill = e.surface === 'terminal' ? await read($, ctx) : null
    const segs = line(await read($, last), await read($, agents), fill)
    if (e.props.hasSurvey || segs === undefined) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box marginTop={1}>
        <Text>
          {segs.map((s, i) => (s.tone ? <Text key={`${i}`} {...STYLE[s.tone]}>{s.text}</Text> : s.text))}
        </Text>
      </Box>
    )
  })

  // The context window's fill, as the status line reads it; absent until a response.
  on('session.measure', async ($, e, next) => {
    if (e.changed.includes('context')) await update($, ctx, () => e.context.percent ?? null)
    return next(e)
  })

  // One model request; its usage arrives with the step's result.
  on('turn.step', async function* ($, e, next) {
    const r = yield* next(e)
    const u = r.usage
    if (u) {
      const cur = add(empty(), u)
      const id = e.agentId
      if (id === undefined) {
        await update($, last, () => cur)
      } else {
        await update($, agents, all => ({ ...all, [id]: { ...(all[id] ?? blankAgent()), last: cur, done: false } }))
      }
    }
    return r
  })

  // Label subagents by type. A step may land before the spawn resolves, so merge.
  on('agent.spawn', async ($, e, next) => {
    const r = await next(e)
    const id = r.agentId
    if (id !== undefined) {
      await update($, agents, all => ({ ...all, [id]: { ...(all[id] ?? blankAgent()), type: e.subagentType || 'agent' } }))
    }
    return r
  })

  // A subagent's run is one turn; drop it from the line once it completes.
  on('turn.complete', async ($, e, next) => {
    const r = await next(e)
    const id = e.agentId
    if (id !== undefined) {
      await update($, agents, all => ({ ...all, [id]: { ...(all[id] ?? blankAgent()), done: true } }))
    }
    return r
  })

  on('session.end', async ($, e, next) => {
    if (e.reason === 'clear') {
      await update($, last, () => null)
      await update($, agents, () => ({}))
      await update($, ctx, () => null)
    }
    return next(e)
  })
}

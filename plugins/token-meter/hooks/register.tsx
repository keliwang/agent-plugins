import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { AgentBucket } from '../types'
import { add, empty, line } from './stats'
import type { Tone } from './stats'

const last = atom({ plugin: 'token-meter', key: 'last' } as const, null)
const agents = atom({ plugin: 'token-meter', key: 'agents' } as const, {})

const COLOR: Record<Tone, string> = { good: 'green', warn: 'yellow', bad: 'red' }

const blankAgent = (): AgentBucket => ({ last: empty(), type: 'agent', done: false })

export const register: Register = on => {
  // Drawn above the prompt; the atom writes below redraw it.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const segs = line(await read($, last), await read($, agents))
    if (e.props.hasSurvey || segs === undefined) return next(e)
    const { Box, Text } = $.ui.resolve(e)
    return (
      <Box marginTop={1}>
        <Text dimColor>
          {segs.map((s, i) => (s.tone ? <Text key={`${i}`} color={COLOR[s.tone]}>{s.text}</Text> : s.text))}
        </Text>
      </Box>
    )
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
    }
    return next(e)
  })
}

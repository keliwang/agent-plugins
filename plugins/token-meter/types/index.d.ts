/** Token counts summed over requests. `in` includes cache reads and writes. */
export type Bucket = { in: number; out: number; read: number; write: number; reqs: number }

/** One subagent: its latest request, its type, whether its run completed. */
export type AgentBucket = { last: Bucket; type: string; done: boolean }

declare module 'claude-code' {
  interface PluginState {
    'token-meter': {
      /** The main loop's latest request. */
      last: Bucket | null
      agents: Record<string, AgentBucket>
      /** Context window fill, whole percent; null before the window's first response. */
      ctx: number | null
    }
  }
}

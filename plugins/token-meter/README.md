# token-meter

A line above the prompt showing the latest model request's token usage and prompt-cache hit rate, for the main loop and each running subagent:

```
↑1.2k ↓300 77%   Explore ↑100 ↓200 90%
```

- `↑` input the cache did not serve (uncached input + cache writes)
- `↓` output tokens
- `%` cache hit rate: green ≥ 80%, yellow ≥ 50%, red below

Subagents drop off the line once their run completes; `/clear` resets it.

## Install

```
/plugin install token-meter --marketplace keliwang/agent-plugins
```

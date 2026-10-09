# token-meter

A line above the prompt in two parts, split by `|`:

```
↑1.2k ↓300 77%   explore ↑100 ↓200 90% | session ↑3.3k ↓1.4k
```

1. The latest model request of the main loop and of each running subagent: input, output, prompt-cache hit rate.
2. The session's running total over every request, main loop and subagents.

- `↑` input the cache did not serve (uncached input + cache writes)
- `↓` output tokens
- `%` cache hit rate: green ≥ 80%, yellow ≥ 50%, red below

Subagents drop off the first part once their run completes; `/clear` resets both.

## Install

```
/plugin install token-meter --marketplace keliwang/agent-plugins
```

# token-meter

A line above the prompt in the format of a Claude Code status line, the groups split by a wide gap:

```
in 50 out 300 | cache 4.0K +1.1K hit 77% | ctx 12%   explore in 100 out 200 | cache 900 hit 90%
```

1. The main loop's latest model request, then the context window's fill.
2. The latest request of each running subagent, labelled by its type.

- `in` uncached input tokens
- `out` output tokens
- `cache` input tokens served from the prompt cache, `+` tokens written to it
- `hit` cache reads over all input: green ≥ 80%, yellow ≥ 50%, red below
- `ctx` context window fill, CLI only: yellow ≥ 70%, red ≥ 85%

Subagents drop off the line once their run completes; `/clear` resets the line.

## Install

```
/plugin install token-meter --marketplace keliwang/agent-plugins
```

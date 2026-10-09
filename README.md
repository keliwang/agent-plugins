# agent-plugins

Claude Code plugins by [keliwang](https://github.com/keliwang).

## Plugins

| Plugin | Description |
| --- | --- |
| [token-meter](plugins/token-meter) | Status line with per-request in/out tokens and prompt-cache hit rate, plus session totals |

## Install

In a Claude Code terminal session:

```
/plugin install token-meter --marketplace keliwang/agent-plugins
```

Answer `y` to add the marketplace, then pick a scope (user scope is the default).

## Development

Run a plugin from its folder:

```
claude --plugin-dir plugins/token-meter
```

Check and test:

```
claude plugin validate plugins/token-meter
claude plugin test plugins/token-meter
```

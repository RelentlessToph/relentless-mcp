# Relentless DECS MCP Client Guide

This guide covers general MCP usage plus client-specific setup.

## Shared Prerequisites

- Node.js 18+
- A Relentless API key
- Buildspace id (UUID shown in your Relentless URL)

Credentials are stored in:

- `~/.relentless/decs-config.json` (preferred)
- `~/.claude/decs-config.json` (legacy fallback)

Format:

```json
{
  "relentlessApiKey": "rlnt_...",
  "relentlessUrl": "https://relentless.build",
  "buildspaceId": "..."
}
```

## Codex

Recommended:

```bash
npx @relentlessbuild/decs-mcp setup codex --repo /path/to/your/repo
```

Local clone alternative:

```bash
./install-codex.sh /path/to/your/repo
```

Manual target file:

- `~/.codex/config.toml`

Expected MCP block:

```toml
[mcp_servers.relentless_decs]
command = "npx"
args = ["-y", "@relentlessbuild/decs-mcp", "serve"]

[mcp_servers.relentless_decs.env]
RELENTLESS_API_KEY = "rlnt_..."
RELENTLESS_URL = "https://relentless.build"
RELENTLESS_BUILDSPACE_ID = "..."
```

## Claude Desktop

### Manual setup

Use the correct platform path:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\\Claude\\claude_desktop_config.json`

Add:

```json
{
  "mcpServers": {
    "relentless-decs": {
      "command": "npx",
      "args": ["-y", "@relentlessbuild/decs-mcp", "serve"],
      "env": {
        "RELENTLESS_API_KEY": "rlnt_...",
        "RELENTLESS_URL": "https://relentless.build",
        "RELENTLESS_BUILDSPACE_ID": "..."
      }
    }
  }
}
```

### Optional automation

```bash
npx @relentlessbuild/decs-mcp setup claude-desktop
```

Local clone alternative:

```bash
./install-claude-desktop-mcp.sh
```

Optional flags:

- `--platform macos|windows`
- `--dry-run`
- `--yes`
- `--use-local-server` (for local clone installs)

The command performs idempotent merge and writes a `.bak` backup before changes.

## MCP Tools Exposed

- `decs_get_context`
- `decs_list`
- `decs_create`
- `decs_update`
- `decs_init_space`
- `decs_write_repo_config`

## Troubleshooting

- `doctor` command:
  - `npx @relentlessbuild/decs-mcp doctor --repo /path/to/your/repo`
- If Codex/Claude does not show tools:
  - restart client fully
  - confirm config path and JSON/TOML validity
  - verify `npx -y @relentlessbuild/decs-mcp serve` runs

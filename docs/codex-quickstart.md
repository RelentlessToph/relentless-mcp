# Codex Quickstart (DECS)

This is the simplest path for Codex users.

## One-Time Setup

Run:

```bash
npx -y @relentlessbuild/decs-mcp setup codex --repo /path/to/your/repo
```

The setup command will:

1. Prompt for your Relentless credentials (API key, URL, buildspace id).
2. Save them to `~/.relentless/decs-config.json`.
3. Add/update DECS MCP config in `~/.codex/config.toml`.
4. Install DECS prompt shortcuts in `~/.codex/prompts/`.
5. Merge DECS guidance into your repo `AGENTS.md`.

If you cloned this repository locally, you can also run:

```bash
./install-codex.sh /path/to/your/repo
```

The local script writes Codex MCP config pointing to your local `dist/index.js`.

## Enable DECS in a Repo

After setup, in Codex run:

```text
npx -y @relentlessbuild/decs-mcp init <project-node-id> [project-name] --repo /path/to/your/repo
```

This creates a decisions collection in Relentless and writes `.decs.json` in your repo.

Optional in-chat prompt command:

```text
/prompts:decs-init <project-node-id> [project-name]
```

## Daily Usage

- `/prompts:decs-context`: read key/recent decisions
- `/prompts:decs-log`: create a new decision (asks confirmation before write)
- `/prompts:decs-update`: update an existing decision (asks confirmation before write)

## Validation

Run:

```bash
npx -y @relentlessbuild/decs-mcp doctor --repo /path/to/your/repo
```

It checks credentials, Codex MCP wiring, and `.decs.json`.

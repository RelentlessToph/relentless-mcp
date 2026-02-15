# Relentless DECS MCP

Relentless DECS gives AI coding sessions architectural memory.

It stores decisions in Relentless and lets Codex or Claude Desktop read/write them through MCP tools.

## Quick Start (Codex)

If you are already in the repo you want to track:

```bash
npx @relentlessbuild/decs-mcp setup codex
```

If you are not in that repo:

```bash
npx @relentlessbuild/decs-mcp setup codex --repo /path/to/your/repo
```

Then initialize DECS for that repo:

```bash
npx @relentlessbuild/decs-mcp init <project-node-id> [project-name] --repo /path/to/your/repo
```

What setup does:

1. Prompts for Relentless API key + buildspace id.
2. Writes `~/.relentless/decs-config.json`.
3. Adds MCP server config to `~/.codex/config.toml`.
4. Installs Codex prompts in `~/.codex/prompts`.
5. Merges DECS guidance into repo `AGENTS.md`.

## Quick Start (Claude Desktop MCP)

```bash
npx @relentlessbuild/decs-mcp setup claude-desktop
```

Then fully restart Claude Desktop.

## Local Clone Setup (No npm Publish Needed)

```bash
git clone https://github.com/RelentlessToph/relentless-mcp.git
cd relentless-mcp
./install-codex.sh /path/to/your/repo
./install-claude-desktop-mcp.sh
```

## Main Commands

- `npx @relentlessbuild/decs-mcp setup codex [--repo <path>]`
- `npx @relentlessbuild/decs-mcp setup claude-desktop`
- `npx @relentlessbuild/decs-mcp init <project-node-id> [project-name] [--repo <path>]`
- `npx @relentlessbuild/decs-mcp doctor [--repo <path>]`

## Docs

- `docs/codex-quickstart.md`
- `docs/mcp-clients.md`
- `docs/legacy-claude-code-hooks.md`

## Development

```bash
npm install
npm run typecheck
npm test
npm run build
```

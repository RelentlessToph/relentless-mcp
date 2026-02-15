# Relentless DECS MCP

Relentless DECS gives AI coding sessions architectural memory.

It stores decisions in Relentless and lets Codex or Claude Desktop read/write them through MCP tools.

All commands below use `npx` so no global install is required.

## Quick Start (Codex)

If you are already in the repo you want to track:

```bash
npx -y @relentlessbuild/decs-mcp setup codex
```

Note for maintainers: if you are testing from inside the `relentless-mcp` source repo itself, use:

```bash
node dist/index.js setup codex --repo .
```

If you are not in that repo:

```bash
npx -y @relentlessbuild/decs-mcp setup codex --repo /path/to/your/repo
```

Then initialize DECS for that repo:

```bash
npx -y @relentlessbuild/decs-mcp init <project-node-id> [project-name] --repo /path/to/your/repo
```

What setup does:

1. Prompts for Relentless API key + buildspace id.
2. Writes `~/.relentless/decs-config.json`.
3. Adds MCP server config to `~/.codex/config.toml`.
4. Installs Codex prompts in `~/.codex/prompts`.
5. Merges DECS guidance into repo `AGENTS.md`.

## Quick Start (Claude Desktop MCP)

```bash
npx -y @relentlessbuild/decs-mcp setup claude-desktop
```

Setup only prompts for missing credential fields. If your API key is already saved, it may only ask for URL/buildspace.

Then fully restart Claude Desktop.

On WSL, this command now auto-targets the Windows Claude Desktop config path.
It writes to `%APPDATA%\Claude\claude_desktop_config.json` (Windows), which maps to:
`/mnt/c/Users/<you>/AppData/Roaming/Claude/claude_desktop_config.json` in WSL.

WSL explicit flag (optional):

```bash
npx -y @relentlessbuild/decs-mcp setup claude-desktop --platform windows
```

WSL verification:

```bash
APPDATA_WIN=$(cmd.exe /c echo %APPDATA% | tr -d '\r')
cat "$(wslpath -u "$APPDATA_WIN")/Claude/claude_desktop_config.json"
```

If APPDATA detection fails in WSL, run:

```bash
APPDATA_WIN=$(cmd.exe /c echo %APPDATA% | tr -d '\r')
APPDATA="$(wslpath -u "$APPDATA_WIN")" npx -y @relentlessbuild/decs-mcp setup claude-desktop --platform windows
```

## Local Clone Setup (No npm Publish Needed)

```bash
git clone https://github.com/RelentlessToph/relentless-mcp.git
cd relentless-mcp
./install-codex.sh /path/to/your/repo
./install-claude-desktop-mcp.sh
```

## Main Commands

- `npx -y @relentlessbuild/decs-mcp setup codex [--repo <path>]`
- `npx -y @relentlessbuild/decs-mcp setup claude-desktop`
- `npx -y @relentlessbuild/decs-mcp init <project-node-id> [project-name] [--repo <path>]`
- `npx -y @relentlessbuild/decs-mcp doctor [--repo <path>]`

## Troubleshooting

- If `decs_list` shows `total: 0` for a DECS node that definitely has decisions, upgrade to `@relentlessbuild/decs-mcp@0.2.3` or newer and rerun setup.

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

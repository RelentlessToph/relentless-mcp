# Legacy Claude Code Hooks Setup

This is the original hook-based workflow for Claude Code CLI.

## One-Time Setup

```bash
git clone https://github.com/RelentlessToph/relentless-mcp.git
cd relentless-mcp
./install.sh
```

Create `~/.claude/decs-config.json`:

```json
{
  "relentlessApiKey": "rlnt_...",
  "relentlessUrl": "https://relentless.build",
  "buildspaceId": "..."
}
```

## Enable in a Repository

In Claude Code, run:

```text
/init-decs-project <project-node-id> [project-name]
```

This writes `.decs.json` and links the repository to a Relentless decisions collection.

## Hook Behavior

- Session start: loads prior decisions
- Prompt submit: refreshes when decision-related keywords appear
- Session stop: prompts decision hygiene and recording

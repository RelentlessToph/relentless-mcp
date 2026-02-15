#!/usr/bin/env node
import path from "node:path";
import { parseArgs, flagBoolean, flagString } from "./cli/args.js";
import { logError, logStep } from "./cli/output.js";
import { runDoctor } from "./commands/doctor.js";
import { runInit } from "./commands/init.js";
import { runSetupClaudeDesktop } from "./commands/setup-claude-desktop.js";
import { runSetupCodex } from "./commands/setup-codex.js";
import type { SupportedDesktopPlatform } from "./install/paths.js";
import { startMcpServer } from "./server.js";

function printUsage(): void {
  logStep("relentless-decs-mcp");
  logStep("");
  logStep("Usage:");
  logStep("  relentless-decs-mcp serve");
  logStep(
    "  relentless-decs-mcp setup codex [--repo <path>] [--yes] [--dry-run] [--no-prompts] [--use-local-server]"
  );
  logStep(
    "  relentless-decs-mcp setup claude-desktop [--platform macos|windows] [--yes] [--dry-run] [--use-local-server]"
  );
  logStep("  relentless-decs-mcp doctor [--repo <path>]");
  logStep(
    "  relentless-decs-mcp init <project-node-id> [project-name] [--repo <path>] [--bootstrap]"
  );
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv.slice(2));
  const command = parsed.positional[0] ?? "serve";

  if (command === "help" || command === "--help" || command === "-h") {
    printUsage();
    return;
  }

  if (command === "serve") {
    await startMcpServer();
    return;
  }

  if (command === "setup") {
    const target = parsed.positional[1];
    const yes = flagBoolean(parsed.flags, "yes", false);
    const dryRun = flagBoolean(parsed.flags, "dry-run", false);

    if (target === "codex") {
      await runSetupCodex({
        repoPath: flagString(parsed.flags, "repo") ?? process.cwd(),
        yes,
        dryRun,
        noPrompts: flagBoolean(parsed.flags, "no-prompts", false),
        useLocalServer: flagBoolean(parsed.flags, "use-local-server", false)
      });
      return;
    }

    if (target === "claude-desktop") {
      const platform = flagString(parsed.flags, "platform");
      if (
        platform !== undefined &&
        platform !== "macos" &&
        platform !== "windows"
      ) {
        throw new Error("--platform must be one of: macos, windows");
      }

      await runSetupClaudeDesktop({
        yes,
        dryRun,
        platform: platform as SupportedDesktopPlatform | undefined,
        useLocalServer: flagBoolean(parsed.flags, "use-local-server", false)
      });
      return;
    }

    throw new Error("setup requires a target: codex | claude-desktop");
  }

  if (command === "doctor") {
    runDoctor(path.resolve(flagString(parsed.flags, "repo") ?? process.cwd()));
    return;
  }

  if (command === "init") {
    const projectNodeId = parsed.positional[1];
    const projectName = parsed.positional[2];

    if (!projectNodeId) {
      throw new Error("init requires <project-node-id>");
    }

    await runInit({
      projectNodeId,
      projectName,
      repoPath: flagString(parsed.flags, "repo") ?? process.cwd(),
      createBootstrapDecision: flagBoolean(parsed.flags, "bootstrap", false)
    });
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

await main().catch((error) => {
  logError(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

import fs from "node:fs";
import path from "node:path";
import { ensureParentDirectory, maybeBackupFile, readTextFileIfExists, writeTextFile } from "../install/fs-utils.js";
import {
  type SupportedDesktopPlatform,
  resolveClaudeDesktopConfigPath
} from "../install/paths.js";
import { upsertClaudeDesktopServer } from "../install/json-merge.js";
import { logStep } from "../cli/output.js";
import { resolveCredentialsForSetup } from "./shared.js";

export interface SetupClaudeDesktopOptions {
  yes: boolean;
  dryRun: boolean;
  platform?: SupportedDesktopPlatform;
  useLocalServer: boolean;
}

const CLAUDE_SERVER_NAME = "relentless-decs";

export async function runSetupClaudeDesktop(
  options: SetupClaudeDesktopOptions
): Promise<void> {
  logStep("Configuring Relentless DECS for Claude Desktop...");

  const { credentials, configPath, wroteConfig } = await resolveCredentialsForSetup({
    yes: options.yes,
    dryRun: options.dryRun
  });

  if (wroteConfig && configPath) {
    logStep(`Saved credentials to ${configPath}`);
  } else {
    logStep("Using credentials from environment or existing config.");
  }

  let command = "npx";
  let args = ["-y", "@relentlessbuild/decs-mcp", "serve"];
  if (options.useLocalServer) {
    const localServerPath = path.resolve(process.cwd(), "dist", "index.js");
    if (!fs.existsSync(localServerPath)) {
      throw new Error(
        `Local server mode requested but ${localServerPath} does not exist. Run npm run build first.`
      );
    }
    command = "node";
    args = [localServerPath, "serve"];
  }

  const claudeConfigPath = resolveClaudeDesktopConfigPath(options.platform);
  const current = readTextFileIfExists(claudeConfigPath);
  const { nextJson, changed } = upsertClaudeDesktopServer({
    currentJson: current,
    serverName: CLAUDE_SERVER_NAME,
    serverConfig: {
      command,
      args,
      env: {
        RELENTLESS_API_KEY: credentials.relentlessApiKey,
        RELENTLESS_URL: credentials.relentlessUrl,
        RELENTLESS_BUILDSPACE_ID: credentials.buildspaceId
      }
    }
  });

  if (changed) {
    if (options.dryRun) {
      logStep(`[dry-run] Would update ${claudeConfigPath}`);
    } else {
      ensureParentDirectory(claudeConfigPath);
      maybeBackupFile(claudeConfigPath);
      writeTextFile(claudeConfigPath, nextJson);
      logStep(`Updated ${claudeConfigPath}`);
    }
  } else {
    logStep(`${claudeConfigPath} already has the DECS MCP server config.`);
  }

  logStep("");
  logStep("Next steps:");
  logStep("1) Fully restart Claude Desktop.");
  logStep("2) Open Claude Desktop and verify relentless-decs appears in MCP tools.");
}

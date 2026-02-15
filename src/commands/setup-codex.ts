import path from "node:path";
import fs from "node:fs";
import { ensureParentDirectory, maybeBackupFile, readTextFileIfExists, writeTextFile } from "../install/fs-utils.js";
import { getCodexPromptDirPath, getCodexUserConfigPath } from "../install/paths.js";
import { upsertCodexMcpServer } from "../install/toml-merge.js";
import { installPrompts, mergeAgentsBlock } from "../install/codex-assets.js";
import { logStep, logWarn } from "../cli/output.js";
import { resolveCredentialsForSetup } from "./shared.js";

export interface SetupCodexOptions {
  repoPath: string;
  yes: boolean;
  dryRun: boolean;
  noPrompts: boolean;
  useLocalServer: boolean;
}

const CODEX_SERVER_NAME = "relentless_decs";

export async function runSetupCodex(options: SetupCodexOptions): Promise<void> {
  const repoPath = path.resolve(options.repoPath);
  logStep("Configuring Relentless DECS for Codex...");

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
  let args = ["-y", "@relentless/decs-mcp", "serve"];

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

  const codexConfigPath = getCodexUserConfigPath();
  const currentToml = readTextFileIfExists(codexConfigPath);
  const { nextToml, changed } = upsertCodexMcpServer({
    currentToml,
    serverName: CODEX_SERVER_NAME,
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
      logStep(`[dry-run] Would update ${codexConfigPath}`);
    } else {
      ensureParentDirectory(codexConfigPath);
      maybeBackupFile(codexConfigPath);
      writeTextFile(codexConfigPath, nextToml);
      logStep(`Updated ${codexConfigPath}`);
    }
  } else {
    logStep(`${codexConfigPath} already has the DECS MCP server config.`);
  }

  if (!options.noPrompts) {
    const promptDir = getCodexPromptDirPath();
    if (options.dryRun) {
      logStep(`[dry-run] Would install DECS prompts into ${promptDir}`);
    } else {
      const installed = installPrompts(promptDir);
      logStep(`Installed ${installed.files.length} prompt files in ${promptDir}`);
    }
  } else {
    logWarn("Skipped prompt installation (--no-prompts).");
  }

  if (options.dryRun) {
    logStep(`[dry-run] Would merge DECS guidance into ${path.join(repoPath, "AGENTS.md")}`);
  } else {
    const agents = mergeAgentsBlock(repoPath);
    if (agents.changed) {
      logStep(`Updated ${agents.path}`);
    } else {
      logStep(`${agents.path} already contains current DECS guidance.`);
    }
  }

  logStep("");
  logStep("Next steps:");
  logStep("1) Restart Codex.");
  logStep(
    "2) In your repo, run: npx -y @relentlessbuild/decs-mcp init <project-node-id> [project-name] --repo ."
  );
  logStep("3) Optional in-chat command: /prompts:decs-init <project-node-id> [project-name]");
}

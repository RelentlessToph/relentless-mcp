import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import TOML from "@iarna/toml";
import { getConfigPaths, resolveCredentials } from "../config.js";
import { logStep } from "../cli/output.js";
import { readRepoDecsConfig } from "../repo-config.js";
import { getCodexUserConfigPath, resolveClaudeDesktopConfigPath } from "../install/paths.js";

function printStatus(label: string, ok: boolean, detail: string): void {
  const status = ok ? "OK" : "MISSING";
  logStep(`${status.padEnd(7)} ${label} - ${detail}`);
}

export function runDoctor(repoPath: string): void {
  logStep("Relentless DECS doctor");
  logStep("");

  const configPaths = getConfigPaths();
  printStatus(
    "Credentials file (~/.relentless/decs-config.json)",
    fs.existsSync(configPaths.defaultPath),
    configPaths.defaultPath
  );
  printStatus(
    "Legacy credentials file (~/.claude/decs-config.json)",
    fs.existsSync(configPaths.legacyPath),
    configPaths.legacyPath
  );

  try {
    const credentials = resolveCredentials();
    printStatus(
      "Resolved credentials",
      true,
      `URL=${credentials.baseUrl}, Buildspace=${credentials.buildspaceId}`
    );
  } catch (error) {
    printStatus("Resolved credentials", false, error instanceof Error ? error.message : String(error));
  }

  const codexConfigPath = getCodexUserConfigPath();
  if (fs.existsSync(codexConfigPath)) {
    try {
      const parsed = TOML.parse(fs.readFileSync(codexConfigPath, "utf8")) as Record<
        string,
        unknown
      >;
      const mcpServers = (parsed.mcp_servers ?? {}) as Record<string, unknown>;
      const hasServer = Object.hasOwn(mcpServers, "relentless_decs");
      printStatus("Codex MCP config", hasServer, codexConfigPath);
    } catch (error) {
      printStatus("Codex MCP config", false, `Invalid TOML: ${codexConfigPath}`);
    }
  } else {
    printStatus("Codex MCP config", false, codexConfigPath);
  }

  try {
    const claudePath = resolveClaudeDesktopConfigPath();
    printStatus("Claude Desktop MCP config", fs.existsSync(claudePath), claudePath);
  } catch (error) {
    printStatus(
      "Claude Desktop MCP config (macOS)",
      false,
      "~/Library/Application Support/Claude/claude_desktop_config.json"
    );
    printStatus(
      "Claude Desktop MCP config (Windows)",
      false,
      "%APPDATA%\\Claude\\claude_desktop_config.json"
    );
  }

  try {
    const repo = readRepoDecsConfig(repoPath);
    printStatus("Repo .decs.json", true, `${repo.path} (space=${repo.config.relentlessSpaceId})`);
  } catch (error) {
    printStatus(
      "Repo .decs.json",
      false,
      error instanceof Error ? error.message : String(error)
    );
  }

  const promptsPath = path.join(os.homedir(), ".codex", "prompts");
  printStatus("Codex prompts directory", fs.existsSync(promptsPath), promptsPath);
}

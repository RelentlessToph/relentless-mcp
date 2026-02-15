import os from "node:os";
import path from "node:path";

export type SupportedDesktopPlatform = "macos" | "windows";

export function getRelentlessConfigPath(): string {
  return path.join(os.homedir(), ".relentless", "decs-config.json");
}

export function getCodexUserConfigPath(): string {
  return path.join(os.homedir(), ".codex", "config.toml");
}

export function getCodexPromptDirPath(): string {
  return path.join(os.homedir(), ".codex", "prompts");
}

export function resolveClaudeDesktopConfigPath(
  platformOverride?: SupportedDesktopPlatform
): string {
  const platform =
    platformOverride ??
    (process.platform === "darwin"
      ? "macos"
      : process.platform === "win32"
        ? "windows"
        : null);

  if (!platform) {
    throw new Error(
      "Unsupported platform for Claude Desktop auto-config. Use --platform macos or --platform windows."
    );
  }

  if (platform === "macos") {
    return path.join(
      os.homedir(),
      "Library",
      "Application Support",
      "Claude",
      "claude_desktop_config.json"
    );
  }

  const appData = process.env.APPDATA ?? path.join(os.homedir(), "AppData", "Roaming");
  return path.join(appData, "Claude", "claude_desktop_config.json");
}

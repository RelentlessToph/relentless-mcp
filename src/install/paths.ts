import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

export type SupportedDesktopPlatform = "macos" | "windows";

function isWslLinux(): boolean {
  if (process.platform !== "linux") {
    return false;
  }

  const release = os.release().toLowerCase();
  return Boolean(
    process.env.WSL_DISTRO_NAME || process.env.WSL_INTEROP || release.includes("microsoft")
  );
}

function resolveWslWindowsAppDataDir(): string | null {
  try {
    const rawAppData = execFileSync("cmd.exe", ["/c", "echo", "%APPDATA%"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();

    if (!rawAppData || rawAppData === "%APPDATA%") {
      return null;
    }

    const converted = execFileSync("wslpath", ["-u", rawAppData], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"]
    }).trim();

    return converted || null;
  } catch {
    return null;
  }
}

function inferWindowsAppDataFromWslPath(): string | null {
  const pathCandidates = [process.cwd(), process.env.PWD ?? ""];
  for (const candidate of pathCandidates) {
    const match = candidate.match(/^\/mnt\/([a-zA-Z])\/Users\/([^/]+)/);
    if (!match) {
      continue;
    }
    const drivePart = match[1];
    const user = match[2];
    if (!drivePart || !user) {
      continue;
    }
    const drive = drivePart.toLowerCase();
    return path.join(`/mnt/${drive}`, "Users", user, "AppData", "Roaming");
  }

  return null;
}

function inferWindowsAppDataFromWslProfiles(): string | null {
  const usersRoot = "/mnt/c/Users";
  if (!fs.existsSync(usersRoot)) {
    return null;
  }

  const ignoreProfiles = new Set([
    "All Users",
    "Default",
    "Default User",
    "Public",
    "defaultuser0",
    "WDAGUtilityAccount"
  ]);

  const profiles = fs
    .readdirSync(usersRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !ignoreProfiles.has(entry.name))
    .map((entry) => {
      try {
        const appDataPath = path.join(usersRoot, entry.name, "AppData", "Roaming");
        if (!fs.existsSync(appDataPath)) {
          return null;
        }
        const profilePath = path.join(usersRoot, entry.name);
        const modifiedAt = fs.statSync(profilePath).mtimeMs;
        return {
          name: entry.name.toLowerCase(),
          appDataPath,
          modifiedAt
        };
      } catch {
        return null;
      }
    })
    .filter((value): value is { name: string; appDataPath: string; modifiedAt: number } =>
      value !== null
    );

  if (profiles.length === 0) {
    return null;
  }

  if (profiles.length === 1) {
    return profiles[0]?.appDataPath ?? null;
  }

  const userHints = [process.env.USER, process.env.LOGNAME]
    .filter((value): value is string => Boolean(value))
    .map((value) => value.toLowerCase());

  for (const hint of userHints) {
    const matched = profiles.find((profile) => profile.name === hint);
    if (matched) {
      return matched.appDataPath;
    }
  }

  profiles.sort((left, right) => right.modifiedAt - left.modifiedAt);
  return profiles[0]?.appDataPath ?? null;
}

function resolveWindowsAppDataDir(): string {
  if (process.env.APPDATA && process.env.APPDATA.trim().length > 0) {
    return process.env.APPDATA;
  }

  if (process.platform === "win32") {
    return path.join(os.homedir(), "AppData", "Roaming");
  }

  if (isWslLinux()) {
    const wslAppData = resolveWslWindowsAppDataDir();
    if (wslAppData) {
      return wslAppData;
    }

    const inferred = inferWindowsAppDataFromWslPath();
    if (inferred) {
      return inferred;
    }

    const fromProfiles = inferWindowsAppDataFromWslProfiles();
    if (fromProfiles) {
      return fromProfiles;
    }

    throw new Error(
      "Could not resolve Windows %APPDATA% from WSL. Set APPDATA to your Windows Roaming path and retry."
    );
  }

  return path.join(os.homedir(), "AppData", "Roaming");
}

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
      : process.platform === "win32" || isWslLinux()
        ? "windows"
        : null);

  if (!platform) {
    throw new Error(
      "Unsupported platform for Claude Desktop auto-config. Use --platform macos or --platform windows (WSL is treated as windows automatically)."
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

  const appData = resolveWindowsAppDataDir();
  return path.join(appData, "Claude", "claude_desktop_config.json");
}

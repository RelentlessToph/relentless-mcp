import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";
import { DecsError } from "./errors.js";
import type { DecsUserConfig, RelentlessCredentials } from "./types.js";

const CONFIG_SCHEMA = z.object({
  relentlessApiKey: z.string().trim().min(1).optional(),
  relentlessUrl: z.string().trim().min(1).optional(),
  buildspaceId: z.string().trim().min(1).optional()
});

const REQUIRED_SCHEMA = z.object({
  relentlessApiKey: z.string().trim().min(1),
  relentlessUrl: z.string().trim().min(1),
  buildspaceId: z.string().trim().min(1)
});

function resolvePathConfig(): { defaultPath: string; legacyPath: string } {
  return {
    defaultPath: path.join(os.homedir(), ".relentless", "decs-config.json"),
    legacyPath: path.join(os.homedir(), ".claude", "decs-config.json")
  };
}

function readConfigFile(filePath: string): DecsUserConfig {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new DecsError(
      "CONFIG_ERROR",
      `Invalid JSON in config file: ${filePath}`,
      error
    );
  }

  const result = CONFIG_SCHEMA.safeParse(parsed);
  if (!result.success) {
    throw new DecsError(
      "CONFIG_ERROR",
      `Invalid config shape in file: ${filePath}`,
      result.error.flatten()
    );
  }

  return result.data;
}

function ensureConfigDirectory(filePath: string): void {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
}

function trimTrailingSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

export function resolveCredentials(): RelentlessCredentials {
  const { defaultPath, legacyPath } = resolvePathConfig();
  const legacyConfig = readConfigFile(legacyPath);
  const defaultConfig = readConfigFile(defaultPath);

  const fileConfig: DecsUserConfig = {
    ...legacyConfig,
    ...defaultConfig
  };

  const mergedConfig: DecsUserConfig = {
    relentlessApiKey:
      process.env.RELENTLESS_API_KEY ?? fileConfig.relentlessApiKey,
    relentlessUrl: process.env.RELENTLESS_URL ?? fileConfig.relentlessUrl,
    buildspaceId:
      process.env.RELENTLESS_BUILDSPACE_ID ?? fileConfig.buildspaceId
  };

  const parsed = REQUIRED_SCHEMA.safeParse(mergedConfig);
  if (!parsed.success) {
    throw new DecsError(
      "CONFIG_ERROR",
      "Missing Relentless credentials. Set RELENTLESS_API_KEY, RELENTLESS_URL, RELENTLESS_BUILDSPACE_ID or configure ~/.relentless/decs-config.json",
      parsed.error.flatten()
    );
  }

  return {
    apiKey: parsed.data.relentlessApiKey,
    baseUrl: trimTrailingSlash(parsed.data.relentlessUrl),
    buildspaceId: parsed.data.buildspaceId
  };
}

export function getConfigPaths(): { defaultPath: string; legacyPath: string } {
  return resolvePathConfig();
}

export function readUserConfigFromDisk(): DecsUserConfig {
  const { defaultPath, legacyPath } = resolvePathConfig();
  const legacyConfig = readConfigFile(legacyPath);
  const defaultConfig = readConfigFile(defaultPath);
  return {
    ...legacyConfig,
    ...defaultConfig
  };
}

export function writeUserConfigToDisk(config: {
  relentlessApiKey: string;
  relentlessUrl: string;
  buildspaceId: string;
}): string {
  const { defaultPath } = resolvePathConfig();
  ensureConfigDirectory(defaultPath);
  fs.writeFileSync(
    defaultPath,
    `${JSON.stringify(
      {
        relentlessApiKey: config.relentlessApiKey,
        relentlessUrl: trimTrailingSlash(config.relentlessUrl),
        buildspaceId: config.buildspaceId
      },
      null,
      2
    )}\n`,
    {
      encoding: "utf8",
      mode: 0o600
    }
  );
  return defaultPath;
}

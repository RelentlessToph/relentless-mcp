import { readUserConfigFromDisk, writeUserConfigToDisk } from "../config.js";
import { promptText } from "../cli/prompt.js";

export interface SetupCommonOptions {
  yes: boolean;
  dryRun: boolean;
}

export interface CredentialsForSetup {
  relentlessApiKey: string;
  relentlessUrl: string;
  buildspaceId: string;
}

function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export async function resolveCredentialsForSetup(
  options: SetupCommonOptions
): Promise<{ credentials: CredentialsForSetup; configPath: string | null; wroteConfig: boolean }> {
  const existing = readUserConfigFromDisk();

  let apiKey =
    process.env.RELENTLESS_API_KEY ?? existing.relentlessApiKey ?? "";
  let relentlessUrl =
    process.env.RELENTLESS_URL ?? existing.relentlessUrl ?? "https://relentless.build";
  let buildspaceId =
    process.env.RELENTLESS_BUILDSPACE_ID ?? existing.buildspaceId ?? "";

  if (!options.yes) {
    if (!apiKey) {
      apiKey = await promptText("Relentless API key", { secret: true });
    }
    relentlessUrl = await promptText("Relentless URL", {
      defaultValue: relentlessUrl
    });
    if (!buildspaceId) {
      buildspaceId = await promptText("Relentless buildspace id");
    }
  }

  if (!apiKey || !relentlessUrl || !buildspaceId) {
    throw new Error(
      "Missing credentials. Provide RELENTLESS_API_KEY, RELENTLESS_URL, RELENTLESS_BUILDSPACE_ID or run setup without --yes for prompts."
    );
  }

  const credentials: CredentialsForSetup = {
    relentlessApiKey: apiKey,
    relentlessUrl: normalizeUrl(relentlessUrl),
    buildspaceId
  };

  if (options.dryRun) {
    return { credentials, configPath: null, wroteConfig: false };
  }

  const wroteConfigPath = writeUserConfigToDisk(credentials);
  return { credentials, configPath: wroteConfigPath, wroteConfig: true };
}

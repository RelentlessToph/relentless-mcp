import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { DecsError } from "./errors.js";
import type { RepoDecsConfig } from "./types.js";

const REPO_CONFIG_FILENAME = ".decs.json";

const REPO_CONFIG_SCHEMA = z.object({
  relentlessSpaceId: z.string().trim().min(1),
  version: z.number().int().positive().optional()
});

function findAncestorFile(startDirectory: string, filename: string): string | null {
  let currentDir = path.resolve(startDirectory);

  while (currentDir !== path.parse(currentDir).root) {
    const candidate = path.join(currentDir, filename);
    if (fs.existsSync(candidate)) {
      return candidate;
    }
    currentDir = path.dirname(currentDir);
  }

  const rootCandidate = path.join(path.parse(currentDir).root, filename);
  if (fs.existsSync(rootCandidate)) {
    return rootCandidate;
  }

  return null;
}

function readJsonFile(filePath: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new DecsError(
      "CONFIG_ERROR",
      `Could not parse JSON file: ${filePath}`,
      error
    );
  }
}

function findGitRoot(startDirectory: string): string | null {
  let currentDir = path.resolve(startDirectory);

  while (currentDir !== path.parse(currentDir).root) {
    const gitDir = path.join(currentDir, ".git");
    if (fs.existsSync(gitDir)) {
      return currentDir;
    }
    currentDir = path.dirname(currentDir);
  }

  return null;
}

export function readRepoDecsConfig(cwd = process.cwd()): {
  path: string;
  repoRoot: string;
  config: RepoDecsConfig;
} {
  const configPath = findAncestorFile(cwd, REPO_CONFIG_FILENAME);
  if (!configPath) {
    throw new DecsError(
      "NOT_FOUND",
      `No ${REPO_CONFIG_FILENAME} found in ${cwd} or parent directories`
    );
  }

  const parsed = REPO_CONFIG_SCHEMA.safeParse(readJsonFile(configPath));
  if (!parsed.success) {
    throw new DecsError(
      "CONFIG_ERROR",
      `Invalid ${REPO_CONFIG_FILENAME} at ${configPath}`,
      parsed.error.flatten()
    );
  }

  return {
    path: configPath,
    repoRoot: path.dirname(configPath),
    config: parsed.data
  };
}

export function writeRepoDecsConfig(
  relentlessSpaceId: string,
  cwd = process.cwd()
): { path: string; repoRoot: string } {
  const repoRoot = findGitRoot(cwd) ?? path.resolve(cwd);
  const configPath = path.join(repoRoot, REPO_CONFIG_FILENAME);

  const payload: RepoDecsConfig = {
    relentlessSpaceId,
    version: 1
  };

  fs.writeFileSync(configPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  return {
    path: configPath,
    repoRoot
  };
}

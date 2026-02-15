import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { readRepoDecsConfig, writeRepoDecsConfig } from "../src/repo-config.js";

describe("repo config", () => {
  it("finds .decs.json in ancestor directories", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "decs-repo-"));
    fs.mkdirSync(path.join(repoRoot, ".git"));

    const nested = path.join(repoRoot, "apps", "api");
    fs.mkdirSync(nested, { recursive: true });

    fs.writeFileSync(
      path.join(repoRoot, ".decs.json"),
      JSON.stringify({ relentlessSpaceId: "space_123", version: 1 }),
      "utf8"
    );

    const found = readRepoDecsConfig(nested);
    expect(found.config.relentlessSpaceId).toBe("space_123");
    expect(found.repoRoot).toBe(repoRoot);
  });

  it("writes .decs.json to git root when available", () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "decs-repo-"));
    fs.mkdirSync(path.join(repoRoot, ".git"));

    const nested = path.join(repoRoot, "packages", "service");
    fs.mkdirSync(nested, { recursive: true });

    const writeResult = writeRepoDecsConfig("space_abc", nested);
    expect(writeResult.path).toBe(path.join(repoRoot, ".decs.json"));

    const parsed = JSON.parse(
      fs.readFileSync(path.join(repoRoot, ".decs.json"), "utf8")
    ) as { relentlessSpaceId: string; version: number };

    expect(parsed.relentlessSpaceId).toBe("space_abc");
    expect(parsed.version).toBe(1);
  });
});

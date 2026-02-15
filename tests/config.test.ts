import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { resolveCredentials } from "../src/config.js";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("resolveCredentials", () => {
  it("loads credentials from ~/.relentless/decs-config.json", () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "decs-home-"));
    const relentlessDir = path.join(tmpHome, ".relentless");
    fs.mkdirSync(relentlessDir, { recursive: true });

    fs.writeFileSync(
      path.join(relentlessDir, "decs-config.json"),
      JSON.stringify({
        relentlessApiKey: "rlnt_file_key",
        relentlessUrl: "https://relentless.build/",
        buildspaceId: "bs_file"
      }),
      "utf8"
    );

    process.env.HOME = tmpHome;
    delete process.env.RELENTLESS_API_KEY;
    delete process.env.RELENTLESS_URL;
    delete process.env.RELENTLESS_BUILDSPACE_ID;

    const credentials = resolveCredentials();
    expect(credentials).toEqual({
      apiKey: "rlnt_file_key",
      baseUrl: "https://relentless.build",
      buildspaceId: "bs_file"
    });
  });

  it("prefers env vars over file config", () => {
    const tmpHome = fs.mkdtempSync(path.join(os.tmpdir(), "decs-home-"));
    const relentlessDir = path.join(tmpHome, ".relentless");
    fs.mkdirSync(relentlessDir, { recursive: true });

    fs.writeFileSync(
      path.join(relentlessDir, "decs-config.json"),
      JSON.stringify({
        relentlessApiKey: "rlnt_file_key",
        relentlessUrl: "https://file.example.com",
        buildspaceId: "file-buildspace"
      }),
      "utf8"
    );

    process.env.HOME = tmpHome;
    process.env.RELENTLESS_API_KEY = "rlnt_env_key";
    process.env.RELENTLESS_URL = "https://env.example.com";
    process.env.RELENTLESS_BUILDSPACE_ID = "env-buildspace";

    const credentials = resolveCredentials();
    expect(credentials).toEqual({
      apiKey: "rlnt_env_key",
      baseUrl: "https://env.example.com",
      buildspaceId: "env-buildspace"
    });
  });
});

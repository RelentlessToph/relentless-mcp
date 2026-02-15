import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveClaudeDesktopConfigPath } from "../src/install/paths.js";

describe("resolveClaudeDesktopConfigPath", () => {
  it("returns macOS path for macos override", () => {
    const result = resolveClaudeDesktopConfigPath("macos");
    expect(result.endsWith(path.join("Claude", "claude_desktop_config.json"))).toBe(
      true
    );
    expect(result.includes(path.join("Library", "Application Support"))).toBe(true);
  });

  it("uses APPDATA when provided on windows override", () => {
    const original = process.env.APPDATA;
    process.env.APPDATA = path.join("/tmp", "custom-appdata");
    const resolved = resolveClaudeDesktopConfigPath("windows");
    expect(resolved).toBe(
      path.join("/tmp", "custom-appdata", "Claude", "claude_desktop_config.json")
    );
    if (original === undefined) {
      delete process.env.APPDATA;
    } else {
      process.env.APPDATA = original;
    }
  });

  it("uses fallback if APPDATA is missing on windows override", () => {
    const original = process.env.APPDATA;
    delete process.env.APPDATA;
    const resolved = resolveClaudeDesktopConfigPath("windows");
    expect(resolved.includes(path.join("AppData", "Roaming"))).toBe(true);
    if (original === undefined) {
      delete process.env.APPDATA;
    } else {
      process.env.APPDATA = original;
    }
  });
});

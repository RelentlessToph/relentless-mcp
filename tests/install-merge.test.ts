import { describe, expect, it } from "vitest";
import TOML from "@iarna/toml";
import { upsertCodexMcpServer } from "../src/install/toml-merge.js";
import { upsertClaudeDesktopServer } from "../src/install/json-merge.js";

describe("upsertCodexMcpServer", () => {
  it("creates mcp_servers block when missing", () => {
    const result = upsertCodexMcpServer({
      currentToml: null,
      serverName: "relentless_decs",
      serverConfig: {
        command: "npx",
        args: ["-y", "@relentless/decs-mcp", "serve"],
        env: {
          RELENTLESS_API_KEY: "k",
          RELENTLESS_URL: "https://relentless.build",
          RELENTLESS_BUILDSPACE_ID: "b"
        }
      }
    });

    const parsed = TOML.parse(result.nextToml) as Record<string, unknown>;
    const mcpServers = parsed.mcp_servers as Record<string, unknown>;
    expect(mcpServers.relentless_decs).toBeTruthy();
    expect(result.changed).toBe(true);
  });

  it("updates server entry without deleting others", () => {
    const current = `
[mcp_servers.other]
command = "node"
args = ["other.js"]
`;

    const result = upsertCodexMcpServer({
      currentToml: current,
      serverName: "relentless_decs",
      serverConfig: {
        command: "npx",
        args: ["-y", "@relentless/decs-mcp", "serve"]
      }
    });

    const parsed = TOML.parse(result.nextToml) as Record<string, unknown>;
    const mcpServers = parsed.mcp_servers as Record<string, unknown>;
    expect(mcpServers.other).toBeTruthy();
    expect(mcpServers.relentless_decs).toBeTruthy();
  });
});

describe("upsertClaudeDesktopServer", () => {
  it("creates mcpServers when missing", () => {
    const result = upsertClaudeDesktopServer({
      currentJson: null,
      serverName: "relentless-decs",
      serverConfig: {
        command: "npx",
        args: ["-y", "@relentless/decs-mcp", "serve"]
      }
    });

    const parsed = JSON.parse(result.nextJson) as {
      mcpServers: Record<string, unknown>;
    };
    expect(parsed.mcpServers["relentless-decs"]).toBeTruthy();
    expect(result.changed).toBe(true);
  });

  it("preserves existing servers", () => {
    const current = JSON.stringify({
      mcpServers: {
        existing: {
          command: "node",
          args: ["a.js"]
        }
      }
    });

    const result = upsertClaudeDesktopServer({
      currentJson: current,
      serverName: "relentless-decs",
      serverConfig: {
        command: "npx",
        args: ["-y", "@relentless/decs-mcp", "serve"]
      }
    });

    const parsed = JSON.parse(result.nextJson) as {
      mcpServers: Record<string, unknown>;
    };
    expect(parsed.mcpServers.existing).toBeTruthy();
    expect(parsed.mcpServers["relentless-decs"]).toBeTruthy();
  });
});

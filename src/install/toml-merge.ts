import TOML from "@iarna/toml";

export interface CodexMcpServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

type TomlObject = Record<string, unknown>;

function normalizeServerConfig(input: CodexMcpServerConfig): TomlObject {
  const normalized: TomlObject = {
    command: input.command,
    args: input.args
  };

  if (input.env && Object.keys(input.env).length > 0) {
    normalized.env = input.env;
  }

  return normalized;
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function upsertCodexMcpServer(input: {
  currentToml: string | null;
  serverName: string;
  serverConfig: CodexMcpServerConfig;
}): { nextToml: string; changed: boolean } {
  const parsed: TomlObject = input.currentToml
    ? (TOML.parse(input.currentToml) as TomlObject)
    : {};

  const mcpServers =
    typeof parsed.mcp_servers === "object" && parsed.mcp_servers
      ? ({ ...(parsed.mcp_servers as TomlObject) } as TomlObject)
      : {};

  const desiredServer = normalizeServerConfig(input.serverConfig);
  const existingServer = mcpServers[input.serverName];

  mcpServers[input.serverName] = desiredServer;
  parsed.mcp_servers = mcpServers;

  const nextToml = TOML.stringify(parsed as TOML.JsonMap).trimEnd() + "\n";
  return {
    nextToml,
    changed: !deepEqual(existingServer, desiredServer) || input.currentToml === null
  };
}

import { z } from "zod";

const CLAUDE_DESKTOP_SCHEMA = z.object({
  mcpServers: z.record(z.any()).optional()
});

export interface ClaudeDesktopServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

function deepEqual(left: unknown, right: unknown): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function upsertClaudeDesktopServer(input: {
  currentJson: string | null;
  serverName: string;
  serverConfig: ClaudeDesktopServerConfig;
}): { nextJson: string; changed: boolean } {
  let parsed: Record<string, unknown> = {};

  if (input.currentJson) {
    const raw = JSON.parse(input.currentJson);
    const validated = CLAUDE_DESKTOP_SCHEMA.safeParse(raw);
    if (!validated.success) {
      throw new Error(
        `Invalid Claude Desktop config JSON shape: ${validated.error.message}`
      );
    }
    parsed = raw as Record<string, unknown>;
  }

  const servers =
    typeof parsed.mcpServers === "object" && parsed.mcpServers
      ? ({ ...(parsed.mcpServers as Record<string, unknown>) } as Record<
          string,
          unknown
        >)
      : {};

  const existingServer = servers[input.serverName];
  servers[input.serverName] = input.serverConfig;
  parsed.mcpServers = servers;

  return {
    nextJson: `${JSON.stringify(parsed, null, 2)}\n`,
    changed: !deepEqual(existingServer, input.serverConfig) || input.currentJson === null
  };
}

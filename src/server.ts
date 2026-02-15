import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerToolHandlers } from "./tools.js";

export async function startMcpServer(): Promise<void> {
  const server = new Server(
    {
      name: "relentless-decs-mcp",
      version: "0.2.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  registerToolHandlers(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

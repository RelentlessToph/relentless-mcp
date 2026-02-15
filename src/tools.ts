import path from "node:path";
import { z } from "zod";
import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool
} from "@modelcontextprotocol/sdk/types.js";
import { resolveCredentials } from "./config.js";
import {
  partitionDecisions,
  renderDecisionContextMarkdown,
  toDecisionSummary
} from "./decision-context.js";
import { DecsError, toDecsError } from "./errors.js";
import { readRepoDecsConfig, writeRepoDecsConfig } from "./repo-config.js";
import { RelentlessApiClient } from "./relentless-api.js";

const LIST_SCHEMA = z.object({
  cwd: z.string().trim().min(1).optional(),
  spaceId: z.string().trim().min(1).optional(),
  isKeyDecision: z.boolean().optional(),
  limit: z.number().int().positive().max(100).optional()
});

const GET_CONTEXT_SCHEMA = z.object({
  cwd: z.string().trim().min(1).optional(),
  spaceId: z.string().trim().min(1).optional(),
  includeRecentLimit: z.number().int().positive().max(100).optional()
});

const CREATE_DECISION_SCHEMA = z.object({
  cwd: z.string().trim().min(1).optional(),
  parentId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  what: z.string().trim().min(1),
  why: z.string().trim().min(1),
  purpose: z.string().trim().min(1),
  constraints: z.string().trim().min(1),
  isKeyDecision: z.boolean().optional()
});

const UPDATE_DECISION_SCHEMA = z
  .object({
    decisionId: z.string().trim().min(1),
    title: z.string().trim().min(1).optional(),
    what: z.string().trim().min(1).optional(),
    why: z.string().trim().min(1).optional(),
    purpose: z.string().trim().min(1).optional(),
    constraints: z.string().trim().min(1).optional(),
    isKeyDecision: z.boolean().optional()
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.what !== undefined ||
      data.why !== undefined ||
      data.purpose !== undefined ||
      data.constraints !== undefined ||
      data.isKeyDecision !== undefined,
    "At least one field must be provided for update"
  );

const INIT_SPACE_SCHEMA = z.object({
  projectNodeId: z.string().trim().min(1),
  projectName: z.string().trim().min(1).optional(),
  cwd: z.string().trim().min(1).optional()
});

const WRITE_REPO_CONFIG_SCHEMA = z.object({
  spaceId: z.string().trim().min(1),
  cwd: z.string().trim().min(1).optional()
});

const TOOLS: Tool[] = [
  {
    name: "decs_get_context",
    description:
      "Fetches decision history from Relentless and returns key decisions plus recent decisions formatted for prompt context.",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string" },
        spaceId: { type: "string" },
        includeRecentLimit: { type: "number", minimum: 1, maximum: 100 }
      },
      additionalProperties: false
    }
  },
  {
    name: "decs_list",
    description:
      "Lists decisions from the configured Relentless decisions space or a supplied spaceId.",
    inputSchema: {
      type: "object",
      properties: {
        cwd: { type: "string" },
        spaceId: { type: "string" },
        isKeyDecision: { type: "boolean" },
        limit: { type: "number", minimum: 1, maximum: 100 }
      },
      additionalProperties: false
    }
  },
  {
    name: "decs_create",
    description:
      "Creates a decision node in Relentless. Use for architectural decisions after explicit user confirmation.",
    inputSchema: {
      type: "object",
      required: ["title", "what", "why", "purpose", "constraints"],
      properties: {
        cwd: { type: "string" },
        parentId: { type: "string" },
        title: { type: "string" },
        what: { type: "string" },
        why: { type: "string" },
        purpose: { type: "string" },
        constraints: { type: "string" },
        isKeyDecision: { type: "boolean" }
      },
      additionalProperties: false
    }
  },
  {
    name: "decs_update",
    description:
      "Updates an existing decision node by id. Missing fields are preserved from the existing node.",
    inputSchema: {
      type: "object",
      required: ["decisionId"],
      properties: {
        decisionId: { type: "string" },
        title: { type: "string" },
        what: { type: "string" },
        why: { type: "string" },
        purpose: { type: "string" },
        constraints: { type: "string" },
        isKeyDecision: { type: "boolean" }
      },
      additionalProperties: false
    }
  },
  {
    name: "decs_init_space",
    description:
      "Creates a '<projectName> - Decisions' collection inside the supplied Relentless project node.",
    inputSchema: {
      type: "object",
      required: ["projectNodeId"],
      properties: {
        projectNodeId: { type: "string" },
        projectName: { type: "string" },
        cwd: { type: "string" }
      },
      additionalProperties: false
    }
  },
  {
    name: "decs_write_repo_config",
    description:
      "Writes a .decs.json file at repo root (or cwd) pointing to a Relentless decisions space id.",
    inputSchema: {
      type: "object",
      required: ["spaceId"],
      properties: {
        spaceId: { type: "string" },
        cwd: { type: "string" }
      },
      additionalProperties: false
    }
  }
];

function jsonResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}

function errorResult(error: unknown) {
  const normalized = toDecsError(error);
  return {
    isError: true,
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            code: normalized.code,
            message: normalized.message,
            details: normalized.details
          },
          null,
          2
        )
      }
    ]
  };
}

function resolveSpaceId(input: { cwd?: string; spaceId?: string }): string {
  if (input.spaceId) {
    return input.spaceId;
  }
  const repoConfig = readRepoDecsConfig(input.cwd ?? process.cwd());
  return repoConfig.config.relentlessSpaceId;
}

function getClient(): RelentlessApiClient {
  return new RelentlessApiClient(resolveCredentials());
}

export function registerToolHandlers(server: Server): void {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOLS
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      const toolName = request.params.name;
      const rawArgs = request.params.arguments ?? {};
      const client = getClient();

      if (toolName === "decs_get_context") {
        const args = GET_CONTEXT_SCHEMA.parse(rawArgs);
        const spaceId = resolveSpaceId(args);
        const decisions = (await client.listDecisions(spaceId)).map(toDecisionSummary);
        const { keyDecisions, recentDecisions } = partitionDecisions(
          decisions,
          args.includeRecentLimit ?? 10
        );

        return jsonResult({
          spaceId,
          counts: {
            total: decisions.length,
            key: keyDecisions.length,
            recent: recentDecisions.length
          },
          keyDecisions,
          recentDecisions,
          markdown: renderDecisionContextMarkdown({ keyDecisions, recentDecisions })
        });
      }

      if (toolName === "decs_list") {
        const args = LIST_SCHEMA.parse(rawArgs);
        const spaceId = resolveSpaceId(args);
        let decisions = (await client.listDecisions(spaceId)).map(toDecisionSummary);

        if (args.isKeyDecision !== undefined) {
          decisions = decisions.filter(
            (decision) => decision.isKeyDecision === args.isKeyDecision
          );
        }

        const sorted = decisions.sort((a, b) => {
          const aTs = a.updatedAt ? Date.parse(a.updatedAt) : 0;
          const bTs = b.updatedAt ? Date.parse(b.updatedAt) : 0;
          return bTs - aTs;
        });

        const limit = args.limit ?? 25;
        return jsonResult({
          spaceId,
          total: sorted.length,
          decisions: sorted.slice(0, limit)
        });
      }

      if (toolName === "decs_create") {
        const args = CREATE_DECISION_SCHEMA.parse(rawArgs);
        const parentId = args.parentId ?? resolveSpaceId(args);

        const created = await client.createNode({
          kind: "decision",
          title: args.title,
          parentId,
          content: {
            what: args.what,
            why: args.why,
            purpose: args.purpose,
            constraints: args.constraints,
            isKeyDecision: args.isKeyDecision ?? false
          }
        });

        return jsonResult({
          created: true,
          decision: toDecisionSummary(created)
        });
      }

      if (toolName === "decs_update") {
        const args = UPDATE_DECISION_SCHEMA.parse(rawArgs);
        const current = await client.getNode(args.decisionId);
        const currentContent = (current.content ?? {}) as Record<string, unknown>;

        const updated = await client.patchNode(args.decisionId, {
          title: args.title ?? current.title,
          content: {
            what: args.what ?? String(currentContent.what ?? ""),
            why: args.why ?? String(currentContent.why ?? ""),
            purpose: args.purpose ?? String(currentContent.purpose ?? ""),
            constraints: args.constraints ?? String(currentContent.constraints ?? ""),
            isKeyDecision:
              args.isKeyDecision ?? Boolean(currentContent.isKeyDecision === true)
          }
        });

        return jsonResult({
          updated: true,
          decision: toDecisionSummary(updated)
        });
      }

      if (toolName === "decs_init_space") {
        const args = INIT_SPACE_SCHEMA.parse(rawArgs);
        await client.getNode(args.projectNodeId);

        const cwd = args.cwd ?? process.cwd();
        const projectName = args.projectName ?? path.basename(path.resolve(cwd));

        const createdSpace = await client.createNode({
          kind: "collection",
          title: `${projectName} - Decisions`,
          parentId: args.projectNodeId
        });

        if (!createdSpace.id) {
          throw new DecsError(
            "UPSTREAM_ERROR",
            "Relentless returned a collection without an id"
          );
        }

        return jsonResult({
          projectNodeId: args.projectNodeId,
          projectName,
          spaceId: createdSpace.id,
          spaceTitle: createdSpace.title
        });
      }

      if (toolName === "decs_write_repo_config") {
        const args = WRITE_REPO_CONFIG_SCHEMA.parse(rawArgs);
        const result = writeRepoDecsConfig(args.spaceId, args.cwd ?? process.cwd());

        return jsonResult({
          saved: true,
          relentlessSpaceId: args.spaceId,
          configPath: result.path,
          repoRoot: result.repoRoot
        });
      }

      throw new DecsError("VALIDATION_ERROR", `Unknown tool: ${toolName}`);
    } catch (error) {
      return errorResult(error);
    }
  });
}

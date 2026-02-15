import path from "node:path";
import { resolveCredentials } from "../config.js";
import { logStep } from "../cli/output.js";
import { writeRepoDecsConfig } from "../repo-config.js";
import { RelentlessApiClient } from "../relentless-api.js";

export interface InitCommandOptions {
  projectNodeId: string;
  projectName?: string;
  repoPath: string;
  createBootstrapDecision: boolean;
}

export async function runInit(options: InitCommandOptions): Promise<void> {
  const repoPath = path.resolve(options.repoPath);
  const projectName = options.projectName ?? path.basename(repoPath);

  const client = new RelentlessApiClient(resolveCredentials());

  await client.getNode(options.projectNodeId);

  const space = await client.createNode({
    kind: "collection",
    title: `${projectName} - Decisions`,
    parentId: options.projectNodeId
  });

  const writeResult = writeRepoDecsConfig(space.id, repoPath);
  logStep(`Created decisions space: ${space.title} (${space.id})`);
  logStep(`Wrote ${writeResult.path}`);

  if (options.createBootstrapDecision) {
    await client.createNode({
      kind: "decision",
      title: "Use DECS for architectural decision tracking",
      parentId: space.id,
      content: {
        what: "We adopted Relentless DECS for architectural decision tracking.",
        why: "AI sessions are stateless and need explicit architectural memory.",
        purpose: "Maintain architecture consistency and preserve rationale over time.",
        constraints:
          "Significant architecture decisions must be captured as DECS entries.",
        isKeyDecision: true
      }
    });
    logStep("Created bootstrap key decision.");
  }

  logStep("Initialization complete.");
}

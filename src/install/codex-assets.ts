import fs from "node:fs";
import path from "node:path";
import { ensureParentDirectory, readTextFileIfExists, writeTextFile } from "./fs-utils.js";

const AGENTS_START = "<!-- RELENTLESS_DECS:START -->";
const AGENTS_END = "<!-- RELENTLESS_DECS:END -->";

const AGENTS_BLOCK = `${AGENTS_START}
# Relentless DECS Workflow

1. Before architecture-affecting work, call \`decs_get_context\`.
2. Draft decisions with: title, what, why, purpose, constraints.
3. Ask explicit confirmation before \`decs_create\` or \`decs_update\`.
4. If a key decision is contradicted, explain it and ask whether to supersede.
5. If \`.decs.json\` is missing, run DECS init flow first.
${AGENTS_END}
`;

const PROMPTS: Array<{ fileName: string; content: string }> = [
  {
    fileName: "decs-init.md",
    content: `Initialize Relentless DECS for this repository.

Arguments: <project-node-id> [project-name]

1. Validate project node id.
2. Call \`decs_init_space\`.
3. Ask for confirmation to write \`.decs.json\`.
4. Call \`decs_write_repo_config\`.
5. Offer bootstrap key decision via \`decs_create\`.
`
  },
  {
    fileName: "decs-context.md",
    content: `Load current architectural decisions.

1. Call \`decs_get_context\`.
2. Render markdown context.
3. Highlight key decisions and contradictions for current task.
`
  },
  {
    fileName: "decs-log.md",
    content: `Log a new architectural decision.

1. Collect: title, what, why, purpose, constraints, isKeyDecision.
2. Show payload preview.
3. Ask explicit confirmation.
4. Call \`decs_create\`.
`
  },
  {
    fileName: "decs-update.md",
    content: `Update an existing architectural decision.

1. If id missing, list decisions via \`decs_list\`.
2. Collect changed fields.
3. Show patch preview.
4. Ask explicit confirmation.
5. Call \`decs_update\`.
`
  }
];

export function mergeAgentsBlock(repoPath: string): { path: string; changed: boolean } {
  const agentsPath = path.join(repoPath, "AGENTS.md");
  const current = readTextFileIfExists(agentsPath);

  if (!current) {
    writeTextFile(agentsPath, `${AGENTS_BLOCK}\n`);
    return { path: agentsPath, changed: true };
  }

  if (current.includes(AGENTS_START) && current.includes(AGENTS_END)) {
    const next = current.replace(
      new RegExp(`${escapeRegExp(AGENTS_START)}[\\s\\S]*${escapeRegExp(AGENTS_END)}`),
      AGENTS_BLOCK.trimEnd()
    );
    if (next !== current) {
      writeTextFile(agentsPath, `${next.trimEnd()}\n`);
      return { path: agentsPath, changed: true };
    }
    return { path: agentsPath, changed: false };
  }

  const next = `${current.trimEnd()}\n\n${AGENTS_BLOCK}`;
  writeTextFile(agentsPath, next);
  return { path: agentsPath, changed: true };
}

function escapeRegExp(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function installPrompts(promptDir: string): { files: string[]; changed: boolean } {
  ensureParentDirectory(path.join(promptDir, ".keep"));
  const writtenFiles: string[] = [];
  let changed = false;

  for (const prompt of PROMPTS) {
    const target = path.join(promptDir, prompt.fileName);
    const current = readTextFileIfExists(target);
    const next = `${prompt.content.trimEnd()}\n`;
    if (current !== next) {
      fs.writeFileSync(target, next, "utf8");
      changed = true;
    }
    writtenFiles.push(target);
  }

  return { files: writtenFiles, changed };
}

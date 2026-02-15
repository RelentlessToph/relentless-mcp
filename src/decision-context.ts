import type { DecisionSummary, RelentlessNode } from "./types.js";

function asString(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  return "—";
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

export function toDecisionSummary(node: RelentlessNode): DecisionSummary {
  const content = (node.content ?? {}) as Record<string, unknown>;

  return {
    id: node.id,
    title: node.title,
    updatedAt: node.updatedAt,
    what: asString(content.what),
    why: asString(content.why),
    purpose: asString(content.purpose),
    constraints: asString(content.constraints),
    isKeyDecision: asBoolean(content.isKeyDecision)
  };
}

function sortNewestFirst<T extends { updatedAt?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aTime = a.updatedAt ? Date.parse(a.updatedAt) : 0;
    const bTime = b.updatedAt ? Date.parse(b.updatedAt) : 0;
    return bTime - aTime;
  });
}

export function partitionDecisions(
  decisions: DecisionSummary[],
  recentLimit = 10
): { keyDecisions: DecisionSummary[]; recentDecisions: DecisionSummary[] } {
  const sorted = sortNewestFirst(decisions);
  const keyDecisions = sorted.filter((decision) => decision.isKeyDecision);
  const recentDecisions = sorted
    .filter((decision) => !decision.isKeyDecision)
    .slice(0, recentLimit);

  return { keyDecisions, recentDecisions };
}

function renderDecision(decision: DecisionSummary): string {
  const updated = decision.updatedAt
    ? `**Updated:** ${decision.updatedAt.split("T")[0]}`
    : "**Updated:** —";

  return [
    `## ${decision.title}`,
    updated,
    "",
    `**What:** ${decision.what}`,
    `**Why:** ${decision.why}`,
    `**Purpose:** ${decision.purpose}`,
    `**Constraints:** ${decision.constraints}`,
    "",
    "---",
    ""
  ].join("\n");
}

export function renderDecisionContextMarkdown(input: {
  keyDecisions: DecisionSummary[];
  recentDecisions: DecisionSummary[];
}): string {
  const sections: string[] = ["=== DECS: Prior Architectural Decisions ===", ""];

  if (input.keyDecisions.length > 0) {
    sections.push("### Key Decisions (always active)", "");
    for (const decision of input.keyDecisions) {
      sections.push(renderDecision(decision));
    }
  }

  if (input.recentDecisions.length > 0) {
    sections.push("### Recent Decisions", "");
    for (const decision of input.recentDecisions) {
      sections.push(renderDecision(decision));
    }
  }

  sections.push(
    "When making architectural decisions, consider how they relate to the above.",
    "Key decisions marked above are foundational and should only be changed deliberately."
  );

  return sections.join("\n");
}

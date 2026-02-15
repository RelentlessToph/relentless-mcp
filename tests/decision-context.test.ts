import { describe, expect, it } from "vitest";
import {
  partitionDecisions,
  renderDecisionContextMarkdown
} from "../src/decision-context.js";
import type { DecisionSummary } from "../src/types.js";

const decisions: DecisionSummary[] = [
  {
    id: "d1",
    title: "Foundational architecture",
    updatedAt: "2026-02-12T10:00:00.000Z",
    what: "Use modular monolith",
    why: "Balance speed and complexity",
    purpose: "Fast delivery",
    constraints: "Avoid distributed services for now",
    isKeyDecision: true
  },
  {
    id: "d2",
    title: "API transport",
    updatedAt: "2026-02-13T10:00:00.000Z",
    what: "Use REST APIs",
    why: "Simple client support",
    purpose: "Interoperability",
    constraints: "No GraphQL schema tooling",
    isKeyDecision: false
  },
  {
    id: "d3",
    title: "Queue strategy",
    updatedAt: "2026-02-14T10:00:00.000Z",
    what: "Use bullmq",
    why: "Operational familiarity",
    purpose: "Background jobs",
    constraints: "Redis required",
    isKeyDecision: false
  }
];

describe("decision context rendering", () => {
  it("keeps key decisions and limits recent", () => {
    const partitioned = partitionDecisions(decisions, 1);

    expect(partitioned.keyDecisions).toHaveLength(1);
    expect(partitioned.keyDecisions[0].id).toBe("d1");

    expect(partitioned.recentDecisions).toHaveLength(1);
    expect(partitioned.recentDecisions[0].id).toBe("d3");
  });

  it("renders markdown sections", () => {
    const partitioned = partitionDecisions(decisions, 2);
    const markdown = renderDecisionContextMarkdown(partitioned);

    expect(markdown).toContain("Key Decisions (always active)");
    expect(markdown).toContain("Recent Decisions");
    expect(markdown).toContain("Foundational architecture");
  });
});

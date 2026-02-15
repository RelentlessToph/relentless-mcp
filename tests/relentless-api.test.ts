import { describe, expect, it, vi } from "vitest";
import { RelentlessApiClient } from "../src/relentless-api.js";
import type { RelentlessCredentials, RelentlessNode } from "../src/types.js";

const credentials: RelentlessCredentials = {
  apiKey: "rlnt_test",
  baseUrl: "https://relentless.build",
  buildspaceId: "buildspace_test"
};

function makeResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

describe("RelentlessApiClient.listDecisions", () => {
  it("supports wrapped { nodes, nextCursor } responses", async () => {
    const firstNode: RelentlessNode = {
      id: "decision_1",
      kind: "decision",
      title: "Decision 1"
    };
    const secondNode: RelentlessNode = {
      id: "decision_2",
      kind: "decision",
      title: "Decision 2"
    };

    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        makeResponse({ nodes: [firstNode], nextCursor: "cursor_1" })
      )
      .mockResolvedValueOnce(
        makeResponse({ nodes: [secondNode], nextCursor: null })
      );

    const client = new RelentlessApiClient(credentials, fetchMock);
    const result = await client.listDecisions("space_1");

    expect(result.map((node) => node.id)).toEqual(["decision_1", "decision_2"]);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstUrl = new URL(String(fetchMock.mock.calls[0]?.[0]));
    expect(firstUrl.searchParams.get("parentId")).toBe("space_1");
    expect(firstUrl.searchParams.get("kind")).toBe("decision");
    expect(firstUrl.searchParams.get("buildspaceId")).toBe("buildspace_test");
    expect(firstUrl.searchParams.has("cursor")).toBe(false);

    const secondUrl = new URL(String(fetchMock.mock.calls[1]?.[0]));
    expect(secondUrl.searchParams.get("cursor")).toBe("cursor_1");
  });

  it("supports legacy array responses", async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      makeResponse([
        {
          id: "decision_legacy",
          kind: "decision",
          title: "Legacy"
        }
      ])
    );

    const client = new RelentlessApiClient(credentials, fetchMock);
    const result = await client.listDecisions("space_legacy");

    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("decision_legacy");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

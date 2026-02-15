import { DecsError } from "./errors.js";
import type { DecisionContent, RelentlessCredentials, RelentlessNode } from "./types.js";

type HttpMethod = "GET" | "POST" | "PATCH";

interface RequestOptions {
  query?: Record<string, string | number | boolean | undefined>;
  body?: unknown;
}

function appendQuery(
  url: URL,
  query: Record<string, string | number | boolean | undefined>
): void {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined) {
      continue;
    }
    url.searchParams.set(key, String(value));
  }
}

function mapHttpError(status: number, message: string, details: unknown): DecsError {
  if (status === 401 || status === 403) {
    return new DecsError("AUTH_ERROR", message, details);
  }
  if (status === 404) {
    return new DecsError("NOT_FOUND", message, details);
  }
  if (status === 429) {
    return new DecsError("RATE_LIMITED", message, details);
  }
  return new DecsError("UPSTREAM_ERROR", message, details);
}

function sleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

export class RelentlessApiClient {
  private readonly credentials: RelentlessCredentials;
  private readonly fetchImpl: typeof fetch;

  constructor(credentials: RelentlessCredentials, fetchImpl: typeof fetch = fetch) {
    this.credentials = credentials;
    this.fetchImpl = fetchImpl;
  }

  private buildUrl(pathname: string, query?: RequestOptions["query"]): URL {
    const url = new URL(pathname, this.credentials.baseUrl);
    appendQuery(url, { buildspaceId: this.credentials.buildspaceId, ...query });
    return url;
  }

  private async request<T>(
    method: HttpMethod,
    pathname: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(pathname, options.query);
    const body = options.body === undefined ? undefined : JSON.stringify(options.body);

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.credentials.apiKey}`
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const attempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      try {
        const response = await this.fetchImpl(url, {
          method,
          headers,
          body
        });

        const raw = await response.text();
        const payload = raw.length > 0 ? safeParseJson(raw) : null;

        if (!response.ok) {
          throw mapHttpError(
            response.status,
            `Relentless API request failed with status ${response.status}`,
            payload ?? raw
          );
        }

        return payload as T;
      } catch (error) {
        lastError = error;
        if (attempt < attempts) {
          await sleep(attempt * 250);
          continue;
        }
      }
    }

    if (lastError instanceof DecsError) {
      throw lastError;
    }

    throw new DecsError("UPSTREAM_ERROR", "Relentless API request failed", lastError);
  }

  async getNode(nodeId: string): Promise<RelentlessNode> {
    return this.request<RelentlessNode>("GET", `/api/nodes/${nodeId}`);
  }

  async listDecisions(spaceId: string): Promise<RelentlessNode[]> {
    const result = await this.request<RelentlessNode[]>("GET", "/api/nodes", {
      query: {
        parentId: spaceId,
        kind: "decision"
      }
    });
    return Array.isArray(result) ? result : [];
  }

  async createNode(payload: {
    kind: string;
    title: string;
    parentId: string;
    content?: Record<string, unknown>;
  }): Promise<RelentlessNode> {
    return this.request<RelentlessNode>("POST", "/api/nodes", {
      body: payload
    });
  }

  async patchNode(
    nodeId: string,
    payload: { title?: string; content?: Partial<DecisionContent> }
  ): Promise<RelentlessNode> {
    return this.request<RelentlessNode>("PATCH", `/api/nodes/${nodeId}`, {
      body: payload
    });
  }
}

function safeParseJson(input: string): unknown {
  try {
    return JSON.parse(input);
  } catch {
    return input;
  }
}

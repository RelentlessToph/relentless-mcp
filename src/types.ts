export interface RelentlessCredentials {
  apiKey: string;
  baseUrl: string;
  buildspaceId: string;
}

export interface DecsUserConfig {
  relentlessApiKey?: string;
  relentlessUrl?: string;
  buildspaceId?: string;
}

export interface RepoDecsConfig {
  relentlessSpaceId: string;
  version?: number;
}

export interface DecisionContent {
  what: string;
  why: string;
  purpose: string;
  constraints: string;
  isKeyDecision: boolean;
}

export interface RelentlessNode {
  id: string;
  kind: string;
  title: string;
  parentId?: string;
  updatedAt?: string;
  createdAt?: string;
  content?: Record<string, unknown>;
}

export interface DecisionSummary {
  id: string;
  title: string;
  updatedAt?: string;
  what: string;
  why: string;
  purpose: string;
  constraints: string;
  isKeyDecision: boolean;
}

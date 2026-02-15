export interface ParsedArgs {
  positional: string[];
  flags: Record<string, string | boolean>;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token) {
      continue;
    }

    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const [rawKey, rawValue] = token.slice(2).split("=", 2);
    if (!rawKey) {
      continue;
    }

    if (rawValue !== undefined) {
      flags[rawKey] = rawValue;
      continue;
    }

    const next = argv[i + 1];
    if (next && !next.startsWith("--")) {
      flags[rawKey] = next;
      i += 1;
      continue;
    }

    flags[rawKey] = true;
  }

  return { positional, flags };
}

export function flagBoolean(
  flags: Record<string, string | boolean>,
  name: string,
  defaultValue = false
): boolean {
  const value = flags[name];
  if (value === undefined) {
    return defaultValue;
  }
  if (typeof value === "boolean") {
    return value;
  }
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

export function flagString(
  flags: Record<string, string | boolean>,
  name: string
): string | undefined {
  const value = flags[name];
  if (typeof value === "string") {
    return value;
  }
  return undefined;
}

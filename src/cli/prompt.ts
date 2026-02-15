import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

interface PromptOptions {
  defaultValue?: string;
  secret?: boolean;
}

function maskSecret(value: string): string {
  if (value.length <= 4) {
    return "****";
  }
  return `${value.slice(0, 4)}***`;
}

export async function promptText(
  label: string,
  options?: PromptOptions
): Promise<string> {
  const rl = createInterface({ input, output });
  try {
    const suffix = options?.defaultValue ? ` [${options.defaultValue}]` : "";
    const raw = await rl.question(`${label}${suffix}: `);
    const value = raw.trim();
    if (value.length > 0) {
      if (options?.secret) {
        output.write(`Saved ${label}: ${maskSecret(value)}\n`);
      }
      return value;
    }
    if (options?.defaultValue) {
      return options.defaultValue;
    }
    return "";
  } finally {
    rl.close();
  }
}

export async function promptYesNo(
  label: string,
  defaultYes = true
): Promise<boolean> {
  const rl = createInterface({ input, output });
  try {
    const suffix = defaultYes ? " [Y/n]" : " [y/N]";
    const raw = (await rl.question(`${label}${suffix}: `)).trim().toLowerCase();
    if (!raw) {
      return defaultYes;
    }
    return raw === "y" || raw === "yes";
  } finally {
    rl.close();
  }
}

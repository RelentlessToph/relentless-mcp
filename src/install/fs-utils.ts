import fs from "node:fs";
import path from "node:path";

export function ensureParentDirectory(filePath: string): void {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
}

export function writeTextFile(
  filePath: string,
  content: string,
  options?: { mode?: number }
): void {
  ensureParentDirectory(filePath);
  fs.writeFileSync(filePath, content, {
    encoding: "utf8",
    mode: options?.mode
  });
}

export function maybeBackupFile(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const backupPath = `${filePath}.bak`;
  if (!fs.existsSync(backupPath)) {
    fs.copyFileSync(filePath, backupPath);
  }
  return backupPath;
}

export function readTextFileIfExists(filePath: string): string | null {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath, "utf8");
}

export function logStep(message: string): void {
  process.stdout.write(`${message}\n`);
}

export function logWarn(message: string): void {
  process.stdout.write(`WARN: ${message}\n`);
}

export function logError(message: string): void {
  process.stderr.write(`ERROR: ${message}\n`);
}

export function logJson(data: unknown): void {
  process.stdout.write(`${JSON.stringify(data, null, 2)}\n`);
}

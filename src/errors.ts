export type DecsErrorCode =
  | "CONFIG_ERROR"
  | "AUTH_ERROR"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "UPSTREAM_ERROR"
  | "RATE_LIMITED";

export class DecsError extends Error {
  public readonly code: DecsErrorCode;
  public readonly details?: unknown;

  constructor(code: DecsErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "DecsError";
    this.code = code;
    this.details = details;
  }
}

export function toDecsError(error: unknown): DecsError {
  if (error instanceof DecsError) {
    return error;
  }

  if (error instanceof Error) {
    return new DecsError("UPSTREAM_ERROR", error.message);
  }

  return new DecsError("UPSTREAM_ERROR", "Unknown error");
}

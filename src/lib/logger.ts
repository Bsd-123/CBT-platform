type Level = "info" | "warn" | "error";

export type LogContext = Record<string, unknown>;

function serializeError(error: unknown): LogContext | undefined {
  if (error === undefined || error === null) return undefined;
  if (error instanceof Error) {
    return { name: error.name, message: error.message, stack: error.stack };
  }
  return { message: String(error) };
}

/** JSON.stringify that survives circular references and BigInt. */
function safeStringify(value: unknown): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(value, (_key, item) => {
    if (typeof item === "bigint") return item.toString();
    if (typeof item === "object" && item !== null) {
      if (seen.has(item)) return "[Circular]";
      seen.add(item);
    }
    return item;
  });
}

export function formatLog(
  level: Level,
  message: string,
  error?: unknown,
  context: LogContext = {},
  now = new Date(),
): string {
  return safeStringify({
    level,
    time: now.toISOString(),
    message,
    ...context,
    error: serializeError(error),
  });
}

function write(level: Level, message: string, error?: unknown, context?: LogContext) {
  const line = formatLog(level, message, error, context);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

/**
 * One JSON line per event, ready for any log shipper. Pass only identifiers and
 * error objects as context: never request bodies, tokens or personal data.
 */
export const logger = {
  info: (message: string, context?: LogContext) => write("info", message, undefined, context),
  warn: (message: string, context?: LogContext) => write("warn", message, undefined, context),
  error: (message: string, error?: unknown, context?: LogContext) =>
    write("error", message, error, context),
};

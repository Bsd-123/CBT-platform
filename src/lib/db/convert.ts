/**
 * PostgREST returns timestamps/dates/times as strings, while the rest of the app (models,
 * formatters, tests) works with `Date`s. These helpers convert rows on the way out and
 * date columns on the way in, with the same semantics Prisma used:
 *   timestamptz -> instant, date -> UTC midnight, time -> 1970-01-01 at that UTC time.
 */

const TIMESTAMP_KEYS = new Set(["created_at", "reviewed_at"]);

function parseTime(value: string): Date {
  return new Date(`1970-01-01T${value.length === 5 ? `${value}:00` : value}Z`);
}

/** Recursively converts known date columns of a row (or array of rows) to Dates. */
export function revive<T>(value: unknown): T {
  if (Array.isArray(value)) return value.map((item) => revive(item)) as T;
  if (value === null || typeof value !== "object") return value as T;
  if (value instanceof Date) return value as T;

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (typeof item === "string" && TIMESTAMP_KEYS.has(key)) {
      out[key] = new Date(item);
    } else if (typeof item === "string" && key === "event_date") {
      out[key] = new Date(`${item}T00:00:00Z`);
    } else if (typeof item === "string" && key === "event_time") {
      out[key] = parseTime(item);
    } else {
      out[key] = revive(item);
    }
  }
  return out as T;
}

/** `date` column value ("YYYY-MM-DD") from a Date (UTC). */
export function toDbDate(value: Date | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value;
  return value.toISOString().slice(0, 10);
}

/** `time` column value ("HH:MM:SS") from a Date (UTC). */
export function toDbTime(value: Date | null | undefined): string | null | undefined {
  if (value === null || value === undefined) return value;
  return value.toISOString().slice(11, 19);
}

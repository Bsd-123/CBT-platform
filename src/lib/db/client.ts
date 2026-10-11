import "server-only";
import type { PostgrestError } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { revive } from "@/lib/db/convert";

/**
 * Database access runs as the signed-in user through PostgREST, so Row Level Security (see
 * supabase/migrations) decides what each query may read or write.
 */
export type Db = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export function getDb(): Promise<Db> {
  return createSupabaseServerClient();
}

/** PostgREST/Postgres error codes that mean "not allowed" rather than "broken". */
const PERMISSION_CODES = new Set(["42501", "PGRST301"]);

export function toError(error: PostgrestError): Error {
  if (PERMISSION_CODES.has(error.code)) return new Error("Forbidden");
  const wrapped = new Error(error.message);
  (wrapped as Error & { code?: string }).code = error.code;
  return wrapped;
}

type Result<T> = { data: T | null; error: PostgrestError | null };

/** Returns the rows (Dates revived) or throws. Use for queries that must succeed. */
export function rows<T>(result: Result<unknown[]>): T[] {
  if (result.error) throw toError(result.error);
  return revive<T[]>(result.data ?? []);
}

/** Returns one row (Dates revived), or null when there is none. */
export function row<T>(result: Result<unknown>): T | null {
  if (result.error) throw toError(result.error);
  return result.data === null || result.data === undefined ? null : revive<T>(result.data);
}

/** Throws on error; returns nothing. For inserts/updates/deletes that need no result. */
export function done(result: { error: PostgrestError | null }): void {
  if (result.error) throw toError(result.error);
}

/** Row count from a `{ count: "exact", head: true }` query. */
export function countOf(result: { count: number | null; error: PostgrestError | null }): number {
  if (result.error) throw toError(result.error);
  return result.count ?? 0;
}

export function isUniqueViolation(error: PostgrestError | null | undefined): boolean {
  return error?.code === "23505";
}

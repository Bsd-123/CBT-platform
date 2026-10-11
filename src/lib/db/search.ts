/**
 * Builds a PostgREST `or=` filter matching `query` (case-insensitive substring) in any of
 * `columns`. Characters that act as wildcards or quoting in the filter syntax are removed
 * from the search text rather than escaped, so user input can never alter the filter.
 */
export function ilikeAny(columns: string[], query: string): string {
  const safe = query.replace(/[%_\\"]/g, " ").trim();
  return columns.map((column) => `${column}.ilike."%${safe}%"`).join(",");
}

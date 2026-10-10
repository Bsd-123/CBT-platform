const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Route ids are UUID columns: a malformed one must 404, not reach Prisma and throw. */
export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

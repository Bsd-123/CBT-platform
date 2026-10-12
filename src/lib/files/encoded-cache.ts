import "server-only";

/**
 * Short-lived, per-instance cache of already-encoded Data URLs. Vercel instances are ephemeral,
 * so this only absorbs repeat hits on a warm isolate; HTTP ETag revalidation still does the rest.
 */
const MAX_CACHE_BYTES = 8 * 1024 * 1024;

type Entry = { dataUrl: string; bytes: number };

const cache = new Map<string, Entry>();
let totalBytes = 0;

function cacheKey(fileKey: string, etag: string): string {
  return `${fileKey}\n${etag}`;
}

export function getEncodedCache(fileKey: string, etag: string): string | undefined {
  const key = cacheKey(fileKey, etag);
  const entry = cache.get(key);
  if (!entry) return undefined;
  cache.delete(key);
  cache.set(key, entry);
  return entry.dataUrl;
}

export function setEncodedCache(fileKey: string, etag: string, dataUrl: string): void {
  const key = cacheKey(fileKey, etag);
  const size = dataUrl.length;
  const previous = cache.get(key);
  if (previous) {
    totalBytes -= previous.bytes;
    cache.delete(key);
  }
  while (cache.size > 0 && totalBytes + size > MAX_CACHE_BYTES) {
    const oldest = cache.keys().next().value;
    if (oldest === undefined) break;
    const evicted = cache.get(oldest);
    cache.delete(oldest);
    if (evicted) totalBytes -= evicted.bytes;
  }
  if (size > MAX_CACHE_BYTES) return;
  cache.set(key, { dataUrl, bytes: size });
  totalBytes += size;
}

export function clearEncodedCache(): void {
  cache.clear();
  totalBytes = 0;
}

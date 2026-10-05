import "server-only";
import { RateLimitError } from "@/lib/errors";

/**
 * In-memory sliding-window limiter. State is per server instance, so on a
 * multi-instance or serverless deployment swap `hits` for a shared store
 * (for example Upstash Redis) behind the same `enforceRateLimit` signature.
 */
const hits = new Map<string, number[]>();
let lastSweep = 0;

function sweep(now: number, maxWindowMs: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, stamps] of hits) {
    if (stamps.every((t) => now - t > maxWindowMs)) hits.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  max: number,
  windowSeconds: number,
  now = Date.now(),
): boolean {
  const windowMs = windowSeconds * 1000;
  sweep(now, 3_600_000);

  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

export const LIMITS = {
  write: { max: 30, windowSeconds: 60 },
  upload: { max: 20, windowSeconds: 3600 },
  download: { max: 60, windowSeconds: 60 },
  register: { max: 5, windowSeconds: 3600 },
  report: { max: 10, windowSeconds: 3600 },
} as const;

export function enforceRateLimit(
  bucket: keyof typeof LIMITS,
  identity: string,
): void {
  const { max, windowSeconds } = LIMITS[bucket];
  if (!checkRateLimit(`${bucket}:${identity}`, max, windowSeconds)) {
    throw new RateLimitError();
  }
}

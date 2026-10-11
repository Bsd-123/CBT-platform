/**
 * Server-side fetch for Supabase (Node fetch; local dev only: npm run dev:insecure-tls).
 * Network-level failures on idempotent reads are retried, as the old database client did
 * for transient connection errors. Writes are never retried: a failed response could still
 * have been applied.
 */
const MAX_RETRIES = 2;

export const supabaseFetch: typeof fetch = async (input, init) => {
  const method = (init?.method ?? (input instanceof Request ? input.method : "GET")).toUpperCase();
  const idempotent = method === "GET" || method === "HEAD";

  for (let attempt = 0; ; attempt += 1) {
    try {
      return await fetch(input, init);
    } catch (error) {
      if (!idempotent || attempt >= MAX_RETRIES) throw error;
    }
  }
};

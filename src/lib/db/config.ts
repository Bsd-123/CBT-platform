/**
 * Supabase configuration - validated environment variables. The app talks to the database
 * only through Supabase (PostgREST, as the signed-in user), so no database URL is needed.
 */

const ENV_MAP: Record<string, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

function requireEnv(name: string): string {
  const value = process.env[name] || ENV_MAP[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const supabaseConfig = {
  get url(): string {
    return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  },

  get anonKey(): string {
    return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },
} as const;

export type SupabaseConfig = typeof supabaseConfig;

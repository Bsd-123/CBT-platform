/**
 * Database configuration — validated environment variables for Prisma and Supabase.
 */

const ENV_MAP: Record<string, string | undefined> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  DATABASE_URL: process.env.DATABASE_URL,
  DIRECT_URL: process.env.DIRECT_URL,
  

};

function requireEnv(name: string): string {
  const value = process.env[name] || ENV_MAP[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name: string): string | undefined {
  return process.env[name];
}

export const dbConfig = {
  /** Pooled PostgreSQL URL — used by Prisma at runtime (Supabase connection pooler). */
  get databaseUrl(): string {
    return requireEnv("DATABASE_URL");
  },

  /** Direct PostgreSQL URL — used by Prisma for migrations. */
  get directUrl(): string {
    return requireEnv("DIRECT_URL");
  },
} as const;

export const supabaseConfig = {
  get url(): string {
    return requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  },

  get anonKey(): string {
    return requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  },

  /** Server-side only — never expose to the client. */
  get serviceRoleKey(): string | undefined {
    return optionalEnv("SUPABASE_SERVICE_ROLE_KEY");
  },
} as const;

export type DbConfig = typeof dbConfig;
export type SupabaseConfig = typeof supabaseConfig;

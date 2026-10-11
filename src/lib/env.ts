import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1),
  DIRECT_URL: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  R2_ACCOUNT_ID: z.string().min(1),
  R2_ACCESS_KEY_ID: z.string().min(1),
  R2_SECRET_ACCESS_KEY: z.string().min(1),
  R2_BUCKET_NAME: z.string().min(1),
});

/** Fails fast at boot, listing every missing or malformed variable. */
export function validateEnv(env: NodeJS.ProcessEnv = process.env): void {
  const result = serverEnvSchema.safeParse(env);
  if (!result.success) {
    const names = [...new Set(result.error.issues.map((i) => i.path.join(".")))];
    throw new Error(`Invalid environment configuration: ${names.join(", ")}`);
  }
}

/**
 * Email is an optional feature: with any of the required variables missing it is switched off
 * (and the app works exactly as before). The secrets are read from the server environment only.
 */

export type EmailConfig = {
  /** Resend API key (RESEND_API_KEY). */
  apiKey: string;
  /** Verified sender, e.g. "קהילת מטפלי CBT <no-reply@your-domain.com>". */
  from: string;
  /** Public site URL used for absolute links in emails (NEXT_PUBLIC_SITE_URL). */
  siteUrl: string;
  /** Used to look up recipients' addresses, which live in Supabase Auth (SUPABASE_SERVICE_ROLE_KEY). */
  supabaseUrl: string;
  serviceRoleKey: string;
};

/** Resend's shared test sender; it only delivers to the Resend account owner. */
export const DEFAULT_FROM = "קהילת מטפלי CBT <onboarding@resend.dev>";

export function getEmailConfig(env: NodeJS.ProcessEnv = process.env): EmailConfig | null {
  const apiKey = env.RESEND_API_KEY?.trim();
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const siteUrl = env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");

  if (!apiKey || !serviceRoleKey || !supabaseUrl || !siteUrl) return null;

  return {
    apiKey,
    serviceRoleKey,
    supabaseUrl,
    siteUrl,
    from: env.EMAIL_FROM?.trim() || DEFAULT_FROM,
  };
}

/** Names of the variables that still have to be set for email to work (for the startup hint). */
export function missingEmailSettings(env: NodeJS.ProcessEnv = process.env): string[] {
  return ["RESEND_API_KEY", "SUPABASE_SERVICE_ROLE_KEY", "NEXT_PUBLIC_SITE_URL"].filter(
    (name) => !env[name]?.trim(),
  );
}

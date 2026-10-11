import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { EmailConfig } from "@/lib/email/config";
import type { ModeratedKind } from "@/lib/email/templates";

/**
 * Reads that need to bypass Row Level Security, used only to address emails: a member's address
 * (kept in Supabase Auth), the people who favorited an event, and the owner of moderated
 * content. The service-role key never leaves this module and nothing here is exposed to the client.
 */

let cached: { key: string; client: SupabaseClient } | null = null;

function admin(config: EmailConfig): SupabaseClient {
  if (cached?.key === config.serviceRoleKey) return cached.client;
  const client = createClient(config.supabaseUrl, config.serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  cached = { key: config.serviceRoleKey, client };
  return client;
}

export type Recipient = { id: string; email: string; name: string | null };

export async function getRecipient(config: EmailConfig, userId: string): Promise<Recipient | null> {
  const client = admin(config);
  const [{ data: auth }, { data: profile }] = await Promise.all([
    client.auth.admin.getUserById(userId),
    client.from("users").select("full_name").eq("id", userId).maybeSingle(),
  ]);
  const email = auth?.user?.email;
  if (!email) return null;
  return { id: userId, email, name: (profile as { full_name?: string } | null)?.full_name ?? null };
}

export async function getDisplayName(config: EmailConfig, userId: string): Promise<string | null> {
  const { data } = await admin(config).from("users").select("full_name").eq("id", userId).maybeSingle();
  return (data as { full_name?: string } | null)?.full_name ?? null;
}

export async function getFavoriteUserIds(config: EmailConfig, eventId: string): Promise<string[]> {
  const { data, error } = await admin(config).from("event_favorites").select("user_id").eq("event_id", eventId);
  if (error) throw new Error(`event_favorites lookup failed: ${error.message}`);
  return ((data ?? []) as { user_id: string }[]).map((row) => row.user_id);
}

export async function getRow<T>(
  config: EmailConfig,
  table: string,
  id: string,
  columns: string,
): Promise<T | null> {
  const { data, error } = await admin(config).from(table).select(columns).eq("id", id).maybeSingle();
  if (error) throw new Error(`${table} lookup failed: ${error.message}`);
  return (data as T | null) ?? null;
}

export type ContentSnapshot = {
  ownerId: string;
  kind: ModeratedKind;
  title: string | null;
  excerpt: string | null;
};

const SNAPSHOT: Record<ModeratedKind, { table: string; columns: string }> = {
  material: { table: "materials", columns: "user_id, title, description" },
  forum_question: { table: "forum_questions", columns: "user_id, title, content" },
  forum_answer: { table: "forum_answers", columns: "user_id, content" },
  recommendation: { table: "recommendations", columns: "user_id, content" },
  event: { table: "events", columns: "user_id, title, description" },
  professional_request: { table: "professional_requests", columns: "user_id, title, description" },
};

/** Who wrote a piece of content and what it said, captured before it is hidden or deleted. */
export async function snapshotContent(
  config: EmailConfig,
  kind: ModeratedKind,
  id: string,
): Promise<ContentSnapshot | null> {
  const { table, columns } = SNAPSHOT[kind];
  const row = await getRow<{ user_id: string; title?: string; description?: string; content?: string }>(
    config,
    table,
    id,
    columns,
  );
  if (!row) return null;
  return {
    ownerId: row.user_id,
    kind,
    title: row.title ?? null,
    excerpt: row.description ?? row.content ?? null,
  };
}

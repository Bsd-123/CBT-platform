import "server-only";
import { countOf, done, getDb } from "@/lib/db/client";

/** A member's own favorites; Row Level Security only ever shows and changes their own rows. */
export async function isEventFavorited(user_id: string, event_id: string): Promise<boolean> {
  const db = await getDb();
  return (
    countOf(
      await db
        .from("event_favorites")
        .select("event_id", { count: "exact", head: true })
        .eq("user_id", user_id)
        .eq("event_id", event_id),
    ) > 0
  );
}

/** Idempotent: favoriting twice leaves a single row. */
export async function addEventFavorite(user_id: string, event_id: string): Promise<void> {
  const db = await getDb();
  done(
    await db
      .from("event_favorites")
      .upsert({ user_id, event_id }, { onConflict: "user_id,event_id", ignoreDuplicates: true }),
  );
}

export async function removeEventFavorite(user_id: string, event_id: string): Promise<void> {
  const db = await getDb();
  done(await db.from("event_favorites").delete().eq("user_id", user_id).eq("event_id", event_id));
}

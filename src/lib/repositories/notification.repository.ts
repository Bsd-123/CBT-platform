import "server-only";
import type { PublicNotification } from "@/lib/models/notification";
import { pickPublicNotificationFields } from "@/lib/models/notification";
import { countOf, done, getDb, row, rows } from "@/lib/db/client";
import type { Notification } from "@/lib/db/types";

// Notifications are created by database triggers (see supabase/migrations), never by the app,
// so a user cannot notify someone else.

export async function listNotificationsForUser(
  user_id: string,
  unreadOnly = false,
): Promise<PublicNotification[]> {
  const db = await getDb();
  let query = db
    .from("notifications")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });
  if (unreadOnly) query = query.eq("is_read", false);
  return rows<Notification>(await query).map(pickPublicNotificationFields);
}

export async function markNotificationAsRead(
  id: string,
  user_id: string,
): Promise<PublicNotification> {
  const db = await getDb();
  const notification = row<Notification>(
    await db
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id)
      .eq("user_id", user_id)
      .select("*")
      .maybeSingle(),
  );
  if (!notification) throw new Error("Notification not found.");
  return pickPublicNotificationFields(notification);
}

export async function markAllNotificationsAsRead(user_id: string): Promise<void> {
  const db = await getDb();
  done(
    await db
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user_id)
      .eq("is_read", false),
  );
}

export async function countUnreadNotifications(user_id: string): Promise<number> {
  const db = await getDb();
  return countOf(
    await db
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user_id)
      .eq("is_read", false),
  );
}

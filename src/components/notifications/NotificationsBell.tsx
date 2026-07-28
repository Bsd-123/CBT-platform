"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import {
  fetchNotifications,
  readAllNotifications,
  readNotification,
} from "@/lib/actions/notifications";
import type { PublicNotification } from "@/lib/models/notification";

type NotificationsBellProps = {
  userId: string;
};

export function NotificationsBell({ userId }: NotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PublicNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const load = useCallback(async () => {
    const notifications = await fetchNotifications(userId);
    setItems(notifications);
    setUnreadCount(notifications.filter((item) => !item.is_read).length);
  }, [userId]);

  useEffect(() => {
    void load();

    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void load();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, load]);

  async function handleMarkRead(id: string) {
    await readNotification(id, userId);
    await load();
  }

  async function handleMarkAllRead() {
    await readAllNotifications(userId);
    await load();
  }

  const tooltipLabel =
    unreadCount > 0 ? `התראות (${unreadCount})` : "התראות";

  return (
    <div className="notifications-wrap">
      <button
        type="button"
        className="nav-icon-btn"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={tooltipLabel}
        data-tooltip={tooltipLabel}
      >
        <MaterialIcon name="notifications" />
        {unreadCount > 0 && (
          <span className="nav-icon-badge" aria-hidden="true">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="notifications-panel card">
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.75rem",
            }}
          >
            <strong>התראות</strong>
            {unreadCount > 0 && (
              <button
                type="button"
                className="button secondary"
                onClick={() => void handleMarkAllRead()}
              >
                סמן הכל כנקרא
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="muted">אין התראות חדשות</p>
          ) : (
            <ul className="list-plain">
              {items.map((item) => (
                <li key={item.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem" }}>
                    <span>{formatNotificationLabel(item.type)}</span>
                    {!item.is_read && (
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => void handleMarkRead(item.id)}
                      >
                        סמן כנקרא
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function formatNotificationLabel(type: PublicNotification["type"]) {
  switch (type) {
    case "comment_on_content":
      return "תגובה חדשה על התוכן שלך";
    case "comment_on_recommendation":
      return "תגובה חדשה על ההמלצה שלך";
    case "forum_answer":
      return "תשובה חדשה לשאלתך בפורום";
    case "material_request_response":
      return "תגובה חדשה לבקשת החומר שלך";
    default:
      return "התראה חדשה";
  }
}

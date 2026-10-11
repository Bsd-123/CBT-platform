"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { MaterialIcon } from "@/components/shared/MaterialIcon";
import {
  fetchNotifications,
  readAllNotifications,
  readNotification,
} from "@/lib/actions/notifications";
import type { PublicNotification } from "@/lib/models/notification";
import { getNotificationHref } from "@/lib/utils/notification-links";

type NotificationsBellProps = {
  userId: string;
};

export function NotificationsBell({ userId }: NotificationsBellProps) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<PublicNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const wrapRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  async function handleMarkRead(id: string) {
    await readNotification(id, userId);
    await load();
  }

  async function handleMarkAllRead() {
    await readAllNotifications(userId);
    await load();
  }

  async function handleOpenItem(item: PublicNotification) {
    setOpen(false);
    if (!item.is_read) {
      await handleMarkRead(item.id);
    }
  }

  const tooltipLabel =
    unreadCount > 0 ? `התראות (${unreadCount})` : "התראות";

  return (
    <div className="notifications-wrap" ref={wrapRef}>
      <button
        type="button"
        className="nav-icon-btn"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-haspopup="true"
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
          <div className="notifications-header">
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
              {items.map((item) => {
                const href = getNotificationHref(item.reference_type, item.reference_id);
                const label = formatNotificationLabel(item.type);

                return (
                  <li
                    key={item.id}
                    className="notifications-item"
                    data-unread={!item.is_read}
                  >
                    {href ? (
                      <Link
                        href={href}
                        className="notifications-item-link"
                        onClick={() => void handleOpenItem(item)}
                      >
                        {label}
                      </Link>
                    ) : (
                      <span>{label}</span>
                    )}
                    {!item.is_read && (
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => void handleMarkRead(item.id)}
                      >
                        סמן כנקרא
                      </button>
                    )}
                  </li>
                );
              })}
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
    case "material_approved":
      return "החומר שהעלית אושר ופורסם";
    case "material_rejected":
      return "החומר שהעלית נדחה";
    default:
      return "התראה חדשה";
  }
}

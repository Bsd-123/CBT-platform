import type { Notification, NotificationType } from "@prisma/client";

export type { Notification, NotificationType };

export const NOTIFICATION_TYPES: readonly NotificationType[] = [
  "comment_on_content",
  "comment_on_recommendation",
  "forum_answer",
  "material_request_response",
  "material_approved",
  "material_rejected",
] as const;

export type CreateNotificationInput = {
  user_id: string;
  type: NotificationType;
  reference_type?: string | null;
  reference_id?: string | null;
};

export function pickPublicNotificationFields(notification: Notification) {
  return {
    id: notification.id,
    user_id: notification.user_id,
    type: notification.type,
    reference_type: notification.reference_type,
    reference_id: notification.reference_id,
    is_read: notification.is_read,
    created_at: notification.created_at,
  };
}

export type PublicNotification = ReturnType<typeof pickPublicNotificationFields>;

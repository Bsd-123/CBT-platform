import "server-only";
import type {
  CreateNotificationInput,
  PublicNotification,
} from "@/lib/models/notification";
import { pickPublicNotificationFields } from "@/lib/models/notification";
import { prisma } from "@/lib/db";

export async function listNotificationsForUser(
  user_id: string,
  unreadOnly = false,
): Promise<PublicNotification[]> {
  const notifications = await prisma.notification.findMany({
    where: {
      user_id,
      ...(unreadOnly && { is_read: false }),
    },
    orderBy: { created_at: "desc" },
  });
  return notifications.map(pickPublicNotificationFields);
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<PublicNotification> {
  const notification = await prisma.notification.create({
    data: {
      user_id: input.user_id,
      type: input.type,
      reference_type: input.reference_type ?? null,
      reference_id: input.reference_id ?? null,
    },
  });
  return pickPublicNotificationFields(notification);
}

export async function markNotificationAsRead(
  id: string,
  user_id: string,
): Promise<PublicNotification> {
  const existing = await prisma.notification.findFirst({
    where: { id, user_id },
  });

  if (!existing) {
    throw new Error("Notification not found.");
  }

  const notification = await prisma.notification.update({
    where: { id },
    data: { is_read: true },
  });
  return pickPublicNotificationFields(notification);
}

export async function markAllNotificationsAsRead(
  user_id: string,
): Promise<void> {
  await prisma.notification.updateMany({
    where: { user_id, is_read: false },
    data: { is_read: true },
  });
}

export async function countUnreadNotifications(user_id: string): Promise<number> {
  return prisma.notification.count({
    where: { user_id, is_read: false },
  });
}

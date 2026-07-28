"use server";

import {
  listNotificationsForUser,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/lib/repositories/notification.repository";
import { requireApprovedRegistration } from "@/lib/auth";

export async function fetchNotifications(userId: string) {
  const auth = await requireApprovedRegistration();
  if (auth.userId !== userId) {
    throw new Error("Forbidden");
  }
  return listNotificationsForUser(userId);
}

export async function readNotification(id: string, userId: string) {
  const auth = await requireApprovedRegistration();
  if (auth.userId !== userId) {
    throw new Error("Forbidden");
  }
  return markNotificationAsRead(id, userId);
}

export async function readAllNotifications(userId: string) {
  const auth = await requireApprovedRegistration();
  if (auth.userId !== userId) {
    throw new Error("Forbidden");
  }
  return markAllNotificationsAsRead(userId);
}

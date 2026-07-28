import type { PrismaClient } from "@prisma/client";

/**
 * Collect admin user UUIDs from env.
 * Supports FIRST_ADMIN_USER_IDS (comma-separated) and legacy FIRST_ADMIN_USER_ID.
 */
function getBootstrapAdminUserIds(): string[] {
  const fromList = process.env.FIRST_ADMIN_USER_IDS?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (fromList && fromList.length > 0) {
    return [...new Set(fromList)];
  }

  const single = process.env.FIRST_ADMIN_USER_ID?.trim();
  return single ? [single] : [];
}

/**
 * Promote existing users rows to admin on seed.
 * Users must already exist in `users` (same UUID as Supabase Auth).
 */
export async function bootstrapAdmins(prisma: PrismaClient): Promise<void> {
  const adminUserIds = getBootstrapAdminUserIds();
  if (adminUserIds.length === 0) {
    return;
  }

  for (const adminUserId of adminUserIds) {
    const user = await prisma.user.findUnique({ where: { id: adminUserId } });
    if (!user) {
      console.warn(
        `[seed] Admin bootstrap: no users row for ${adminUserId}. Register and complete profile first.`,
      );
      continue;
    }

    if (user.role === "admin") {
      console.log(`[seed] ${user.full_name} (${adminUserId}) is already admin.`);
      continue;
    }

    await prisma.user.update({
      where: { id: adminUserId },
      data: { role: "admin" },
    });

    console.log(`[seed] Promoted ${user.full_name} (${adminUserId}) to admin.`);
  }
}

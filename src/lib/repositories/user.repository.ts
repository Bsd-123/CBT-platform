import type {
  AdminUserDirectoryEntry,
  AdminUsersPageStats,
  CreateUserInput,
  PublicExpertDirectoryEntry,
  UpdateUserInput,
} from "@/lib/models/user";
import {
  DEFAULT_USER_ROLE,
  pickPublicUserFields,
  type PublicUser,
} from "@/lib/models/user";
import { prisma } from "@/lib/db";

export async function getUserById(id: string): Promise<PublicUser | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? pickPublicUserFields(user) : null;
}

export async function createUser(input: CreateUserInput): Promise<PublicUser> {
  const user = await prisma.user.create({
    data: {
      id: input.id,
      full_name: input.full_name,
      title: input.title ?? null,
      role: input.role ?? DEFAULT_USER_ROLE,
    },
  });

  return pickPublicUserFields(user);
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<PublicUser> {
  const user = await prisma.user.update({
    where: { id },
    data: input,
  });

  return pickPublicUserFields(user);
}

export async function listUsers(): Promise<PublicUser[]> {
  const users = await prisma.user.findMany({ orderBy: { created_at: "desc" } });
  return users.map(pickPublicUserFields);
}

function mapRegistrationStatus(
  approval: { status: "pending" | "approved" | "rejected" } | undefined,
): AdminUserDirectoryEntry["registration_status"] {
  if (!approval) return "none";
  return approval.status;
}

export async function listAdminUsersDirectory(): Promise<AdminUserDirectoryEntry[]> {
  const users = await prisma.user.findMany({
    orderBy: { created_at: "desc" },
    include: {
      expert_approvals_as_user: {
        take: 1,
        orderBy: { created_at: "desc" },
      },
    },
  });

  return users.map((user) => ({
    ...pickPublicUserFields(user),
    registration_status: mapRegistrationStatus(user.expert_approvals_as_user[0]),
  }));
}

export async function getAdminUsersPageStats(): Promise<AdminUsersPageStats> {
  const dayAgo = new Date();
  dayAgo.setDate(dayAgo.getDate() - 1);

  const [total, pending_verifications, recently_joined] = await Promise.all([
    prisma.user.count(),
    prisma.expertApproval.count({ where: { status: "pending" } }),
    prisma.user.count({ where: { created_at: { gte: dayAgo } } }),
  ]);

  return { total, pending_verifications, recently_joined };
}

export async function listExpertDirectory(): Promise<PublicExpertDirectoryEntry[]> {
  const experts = await prisma.user.findMany({
    where: { role: "expert" },
    orderBy: { full_name: "asc" },
    include: {
      expert_approvals_as_expert: {
        select: { status: true },
      },
    },
  });

  return experts.map((expert) => {
    const referrals = expert.expert_approvals_as_expert;

    return {
      ...pickPublicUserFields(expert),
      pending_referrals: referrals.filter((referral) => referral.status === "pending").length,
      approved_referrals: referrals.filter((referral) => referral.status === "approved").length,
      total_referrals: referrals.length,
    };
  });
}

export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}

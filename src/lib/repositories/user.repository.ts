import "server-only";
import type {
  AdminUserDirectoryEntry,
  AdminUsersPageStats,
  PublicExpertDirectoryEntry,
  UpdateUserInput,
} from "@/lib/models/user";
import { pickPublicUserFields, type PublicUser } from "@/lib/models/user";
import { countOf, done, getDb, row, rows } from "@/lib/db/client";
import type { ExpertApproval, User, UserRole } from "@/lib/db/types";

export async function getUserById(id: string): Promise<PublicUser | null> {
  const db = await getDb();
  const user = row<User>(await db.from("users").select("*").eq("id", id).maybeSingle());
  return user ? pickPublicUserFields(user) : null;
}

/**
 * Updates the caller's own name/title. Row Level Security only lets a user edit their own
 * row and only those two columns; role changes go through `admin_set_user_role`.
 */
export async function updateUser(
  id: string,
  input: Pick<UpdateUserInput, "full_name" | "title">,
): Promise<PublicUser> {
  const db = await getDb();
  const user = row<User>(
    await db.from("users").update(input).eq("id", id).select("*").maybeSingle(),
  );
  if (!user) throw new Error("User not found.");
  return pickPublicUserFields(user);
}

/** Admin-only: changes a role atomically, keeping at least one admin. */
export async function setUserRole(id: string, role: UserRole): Promise<PublicUser> {
  const db = await getDb();
  const result = await db.rpc("admin_set_user_role", { p_user_id: id, p_role: role });
  const user = row<User>(result);
  if (!user) throw new Error("User not found.");
  return pickPublicUserFields(user);
}

export async function listUsers(): Promise<PublicUser[]> {
  const db = await getDb();
  const users = rows<User>(await db.from("users").select("*").order("created_at", { ascending: false }));
  return users.map(pickPublicUserFields);
}

function mapRegistrationStatus(
  approval: Pick<ExpertApproval, "status"> | undefined,
): AdminUserDirectoryEntry["registration_status"] {
  if (!approval) return "none";
  return approval.status;
}

export async function listAdminUsersDirectory(): Promise<AdminUserDirectoryEntry[]> {
  const db = await getDb();
  const [users, approvals] = await Promise.all([
    db.from("users").select("*").order("created_at", { ascending: false }),
    db.from("expert_approvals").select("user_id, status, created_at").order("created_at", { ascending: false }),
  ]);

  // Newest approval per user (approvals are already newest-first).
  const latest = new Map<string, Pick<ExpertApproval, "status">>();
  for (const approval of rows<ExpertApproval>(approvals)) {
    if (!latest.has(approval.user_id)) latest.set(approval.user_id, approval);
  }

  return rows<User>(users).map((user) => ({
    ...pickPublicUserFields(user),
    registration_status: mapRegistrationStatus(latest.get(user.id)),
  }));
}

export async function getAdminUsersPageStats(): Promise<AdminUsersPageStats> {
  const dayAgo = new Date();
  dayAgo.setDate(dayAgo.getDate() - 1);
  const db = await getDb();

  const [total, pending, recent] = await Promise.all([
    db.from("users").select("id", { count: "exact", head: true }),
    db.from("expert_approvals").select("id", { count: "exact", head: true }).eq("status", "pending"),
    db.from("users").select("id", { count: "exact", head: true }).gte("created_at", dayAgo.toISOString()),
  ]);

  return {
    total: countOf(total),
    pending_verifications: countOf(pending),
    recently_joined: countOf(recent),
  };
}

export async function listExpertDirectory(): Promise<PublicExpertDirectoryEntry[]> {
  const db = await getDb();
  const [experts, approvals] = await Promise.all([
    db.from("users").select("*").eq("role", "expert").order("full_name", { ascending: true }),
    db.from("expert_approvals").select("expert_id, status"),
  ]);

  const byExpert = new Map<string, Pick<ExpertApproval, "status">[]>();
  for (const approval of rows<ExpertApproval>(approvals)) {
    const list = byExpert.get(approval.expert_id) ?? [];
    list.push(approval);
    byExpert.set(approval.expert_id, list);
  }

  return rows<User>(experts).map((expert) => {
    const referrals = byExpert.get(expert.id) ?? [];
    return {
      ...pickPublicUserFields(expert),
      pending_referrals: referrals.filter((referral) => referral.status === "pending").length,
      approved_referrals: referrals.filter((referral) => referral.status === "approved").length,
      total_referrals: referrals.length,
    };
  });
}

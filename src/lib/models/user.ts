import type { User, UserRole } from "@prisma/client";
import { formatExpertCode } from "@/lib/utils/expert-code";

export type { User, UserRole };
export const DEFAULT_USER_ROLE: UserRole = "user";

/** All valid user roles in the system. */
export const USER_ROLES: readonly UserRole[] = ["user", "expert", "admin"] as const;

export type CreateUserInput = {
  /** Must match the Supabase Auth user id (auth.users.id). */
  id: string;
  full_name: string;
  title?: string | null;
  role?: UserRole;
};

export type UpdateUserInput = {
  full_name?: string;
  title?: string | null;
  role?: UserRole;
};

export function isUserRole(value: string): value is UserRole {
  return (USER_ROLES as readonly string[]).includes(value);
}

export function pickPublicUserFields(user: User) {
  return {
    id: user.id,
    full_name: user.full_name,
    title: user.title,
    role: user.role,
    created_at: user.created_at,
    expert_code: user.role === "expert" ? formatExpertCode(user.id) : null,
  };
}

export type PublicUser = ReturnType<typeof pickPublicUserFields>;

export type PublicExpertDirectoryEntry = PublicUser & {
  pending_referrals: number;
  approved_referrals: number;
  total_referrals: number;
};

export type AdminUserRegistrationStatus = "approved" | "pending" | "rejected" | "none";

export type AdminUserDirectoryEntry = PublicUser & {
  registration_status: AdminUserRegistrationStatus;
};

export type AdminUsersPageStats = {
  total: number;
  pending_verifications: number;
  recently_joined: number;
};

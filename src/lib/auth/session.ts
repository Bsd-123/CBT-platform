import type { UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getUserById } from "@/lib/repositories/user.repository";
import type { PublicUser } from "@/lib/models/user";
import { isRegistrationApproved } from "@/lib/auth/register";
import { AuthError, ForbiddenError } from "@/lib/auth/errors";
import { canReviewMaterials } from "@/lib/materials/approval";

export type AuthSession = {
  userId: string;
  email: string | undefined;
};

export type AuthenticatedProfile = AuthSession & {
  profile: PublicUser;
};

export async function getAuthSession(): Promise<AuthSession | null> {
  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return {
      userId: data.user.id,
      email: data.user.email,
    };
  } catch {
    return null;
  }
}

export async function getAuthenticatedProfile(): Promise<AuthenticatedProfile | null> {
  const session = await getAuthSession();
  if (!session) return null;

  const profile = await getUserById(session.userId);
  if (!profile) return null;

  return { ...session, profile };
}

export async function requireAuthSession(): Promise<AuthSession> {
  const session = await getAuthSession();
  if (!session) {
    throw new AuthError("Authentication required.");
  }
  return session;
}

export async function requireAuthenticatedProfile(): Promise<AuthenticatedProfile> {
  const auth = await getAuthenticatedProfile();
  if (!auth) {
    throw new AuthError("Authentication required.");
  }
  return auth;
}

/** Blocks users pending or rejected expert referral approval. */
export async function requireApprovedRegistration(): Promise<AuthenticatedProfile> {
  const auth = await requireAuthenticatedProfile();
  const approved = await isRegistrationApproved(auth.userId);
  if (!approved) {
    throw new AuthError("הגישה לפלטפורמה חסומה עד לאישור המומחה המפנה.");
  }
  return auth;
}

export async function requireRole(
  ...roles: UserRole[]
): Promise<AuthenticatedProfile> {
  const auth = await requireAuthenticatedProfile();
  if (!roles.includes(auth.profile.role)) {
    throw new ForbiddenError();
  }
  return auth;
}

/** Page-level admin guard: redirects instead of throwing during render. */
export async function assertAdminAccess(): Promise<AuthenticatedProfile> {
  const auth = await getAuthenticatedProfile();
  if (!auth) {
    redirect("/login");
  }
  if (auth.profile.role !== "admin") {
    redirect("/");
  }
  return auth;
}

/** Page-level guard for the material review queue (experts and admins). */
export async function assertReviewerAccess(): Promise<AuthenticatedProfile> {
  const auth = await getAuthenticatedProfile();
  if (!auth) {
    redirect("/login");
  }
  if (!canReviewMaterials(auth.profile.role)) {
    redirect("/");
  }
  return auth;
}

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AuthError(error.message);
  }
}

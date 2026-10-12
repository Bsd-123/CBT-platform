"use server";

import { UserFacingError } from "@/lib/errors";
import { runAction } from "@/lib/actions/result";
import {
  getAuthenticatedProfile,
  getAuthSession,
  isRegistrationApproved,
  registerProfile,
  requireAuthSession,
  requireAuthenticatedProfile,
  requireApprovedRegistration,
  requireRole,
  resolvePostLoginPath,
  signOut,
  type RegisterProfileInput,
} from "@/lib/auth";
import { AuthError } from "@/lib/auth/errors";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { parseInput, registerSchema } from "@/lib/validation/schemas";

export async function fetchAuthSession() {
  return getAuthSession();
}

export async function fetchAuthenticatedProfile() {
  return getAuthenticatedProfile();
}

export async function fetchPostLoginPath() {
  return resolvePostLoginPath();
}

export async function completeRegistration(raw: RegisterProfileInput) {
  return runAction(async () => {
    const session = await requireAuthSession();
    await enforceRateLimit("register", session.userId);
    const input = parseInput(registerSchema, raw);
    if (session.userId !== input.id) {
      throw new AuthError("אין הרשאה לשמור פרופיל זה.");
    }

    return registerProfile(input);

  });
}

export async function checkRegistrationApproved() {
  const session = await requireAuthSession();
  return isRegistrationApproved(session.userId);
}

export async function logout() {
  return signOut();
}

export async function requireUser() {
  return requireAuthenticatedProfile();
}

export async function requireAdmin() {
  return requireRole("admin");
}

export async function requireExpert() {
  return requireRole("expert");
}

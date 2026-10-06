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
import { prisma } from "@/lib/db";
import { canViewMaterial } from "@/lib/materials/approval";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { parseInput, registerSchema } from "@/lib/validation/schemas";
import {
  isValidFileKey,
  createSignedDownloadUrl,
} from "@/lib/r2";

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
    enforceRateLimit("register", session.userId);
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

export async function requestFileDownloadUrl(key: string) {
  return runAction(async () => {
    const auth = await requireApprovedRegistration();
    enforceRateLimit("download", auth.userId);

    if (typeof key !== "string" || !isValidFileKey(key)) {
      throw new UserFacingError("מפתח קובץ לא תקין.");
    }

    if (auth.profile.role !== "admin") {
      const [material, response] = await Promise.all([
        prisma.material.findFirst({
          where: { file_url: key, is_hidden: false },
          select: { user_id: true, approval_status: true },
        }),
        prisma.materialResponse.findFirst({
          where: { file_url: key },
          select: { id: true },
        }),
      ]);

      if (!material && !response) {
        throw new UserFacingError("הקובץ לא נמצא.");
      }

      // Files of materials still awaiting approval are for the uploader and reviewers only.
      if (
        material &&
        !response &&
        !canViewMaterial(material, { userId: auth.userId, role: auth.profile.role })
      ) {
        throw new UserFacingError("הקובץ לא נמצא.");
      }
    }

    return createSignedDownloadUrl({ key });

  });
}

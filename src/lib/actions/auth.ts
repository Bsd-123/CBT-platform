"use server";

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
import {
  buildMaterialFileKey,
  buildMaterialResponseFileKey,
  createSignedDownloadUrl,
  createSignedUploadUrl,
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

export async function completeRegistration(input: RegisterProfileInput) {
  const session = await requireAuthSession();
  if (session.userId !== input.id) {
    throw new AuthError("אין הרשאה לשמור פרופיל זה.");
  }

  return registerProfile(input);
}

export async function checkRegistrationApproved(user_id: string) {
  return isRegistrationApproved(user_id);
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

export async function requestMaterialUploadUrl(fileName: string, contentType: string) {
  const auth = await requireApprovedRegistration();
  const key = buildMaterialFileKey(auth.userId, fileName);
  return createSignedUploadUrl({ key, contentType });
}

export async function requestMaterialResponseUploadUrl(
  fileName: string,
  contentType: string,
) {
  const auth = await requireApprovedRegistration();
  const key = buildMaterialResponseFileKey(auth.userId, fileName);
  return createSignedUploadUrl({ key, contentType });
}

export async function requestFileDownloadUrl(key: string) {
  await requireApprovedRegistration();
  return createSignedDownloadUrl({ key });
}

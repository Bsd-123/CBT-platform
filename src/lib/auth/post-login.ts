import { getAuthenticatedProfile } from "@/lib/auth/session";
import { getRegistrationStatus } from "@/lib/auth/register";

/** Where to send the user immediately after a successful login. */
export async function resolvePostLoginPath(): Promise<string> {
  const auth = await getAuthenticatedProfile();

  if (!auth) {
    return "/complete-profile?reason=missing_profile";
  }

  const registrationStatus = await getRegistrationStatus(auth.userId);
  if (registrationStatus === "pending" || registrationStatus === "rejected") {
    return "/pending-approval";
  }

  return "/";
}

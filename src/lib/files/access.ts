import "server-only";
import { requireApprovedRegistration, type AuthenticatedProfile } from "@/lib/auth";
import { getDb, row } from "@/lib/db/client";
import type { MaterialApprovalStatus } from "@/lib/db/types";
import { canViewMaterial } from "@/lib/materials/approval";
import { isValidFileKey } from "@/lib/r2";
import { enforceRateLimit } from "@/lib/security/rate-limit";

/** Unknown, malformed or not-yours: callers answer 404 for all of them so nothing leaks. */
export class FileNotFoundError extends Error {
  constructor() {
    super("File not found.");
    this.name = "FileNotFoundError";
  }
}

/**
 * Decides whether the signed-in member may download `key`. Throws `AuthError` (not signed in or
 * not approved), `RateLimitError`, or `FileNotFoundError`.
 */
export async function authorizeFileDownload(key: string): Promise<AuthenticatedProfile> {
  const auth = await requireApprovedRegistration();
  await enforceRateLimit("download", auth.userId);

  if (typeof key !== "string" || !isValidFileKey(key)) throw new FileNotFoundError();

  if (auth.profile.role === "admin") return auth;

  // Queries run as the user, so Row Level Security already hides hidden materials and other
  // people's unapproved ones.
  const db = await getDb();
  const [materialResult, responseResult] = await Promise.all([
    db
      .from("materials")
      .select("user_id, approval_status")
      .eq("file_url", key)
      .eq("is_hidden", false)
      .limit(1)
      .maybeSingle(),
    db.from("material_responses").select("id").eq("file_url", key).limit(1).maybeSingle(),
  ]);
  const material = row<{ user_id: string; approval_status: MaterialApprovalStatus }>(materialResult);
  const response = row<{ id: string }>(responseResult);

  if (!material && !response) throw new FileNotFoundError();

  // Files of materials still awaiting approval are for the uploader and reviewers only.
  if (
    material &&
    !response &&
    !canViewMaterial(material, { userId: auth.userId, role: auth.profile.role })
  ) {
    throw new FileNotFoundError();
  }

  return auth;
}

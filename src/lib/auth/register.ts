import { done, getDb, row } from "@/lib/db/client";
import type { User } from "@/lib/db/types";
import { UserFacingError } from "@/lib/errors";
import { pickPublicUserFields, type PublicUser } from "@/lib/models/user";

export type RegisterProfileInput = {
  id: string;
  full_name: string;
  title?: string | null;
  expert_code?: string | null;
};

export type RegisterProfileResult = {
  profile: PublicUser;
  pending_expert_approval: boolean;
};

function mapRegistrationError(error: unknown): Error {
  if (error instanceof Error) {
    if (error.message === "Expert referral code required.") {
      return new UserFacingError("יש להזין קוד מומחה מפנה כדי להירשם.");
    }
    if (error.message === "Invalid expert referral.") {
      return new UserFacingError("קוד המומחה המפנה אינו תקין.");
    }
    if (error.message === "Invalid expert code format.") {
      return new UserFacingError("קוד המומחה חייב להיות בפורמט #D90963D6 (8 תווים).");
    }
    if (error.message === "Cannot refer yourself.") {
      return new UserFacingError("לא ניתן להפנות את עצמכם.");
    }
    if (error.message === "Full name required.") {
      return new UserFacingError("יש להזין שם מלא.");
    }

    const message = error.message.toLowerCase();
    if (
      message.includes("timed out") ||
      message.includes("timeout") ||
      message.includes("fetch failed") ||
      message.includes("econnrefused")
    ) {
      return new UserFacingError(
        "לא ניתן להתחבר למסד הנתונים. בדקו חיבור לאינטרנט ונסו שוב בעוד רגע.",
      );
    }
  }

  return new UserFacingError("אירעה שגיאה בשמירת הפרופיל. נסו שוב.");
}

/**
 * Creates the signed-in user's profile (and the pending referral approval) in one database
 * call. `register_profile` always acts on the caller's own id, so `input.id` is only checked
 * by the calling action; the role of a new profile is always "user".
 */
export async function registerProfile(input: RegisterProfileInput): Promise<RegisterProfileResult> {
  if (!input.full_name.trim()) {
    throw new Error("יש להזין שם מלא.");
  }

  try {
    const db = await getDb();
    const result = await db.rpc("register_profile", {
      p_full_name: input.full_name.trim(),
      p_title: input.title?.trim() || null,
      p_expert_code: input.expert_code?.trim() || null,
    });
    if (result.error) throw new Error(result.error.message);

    const registered = row<{ profile: User; pending_expert_approval: boolean }>(result);
    if (!registered) throw new Error("Registration returned no profile.");
    return {
      profile: pickPublicUserFields(registered.profile),
      pending_expert_approval: registered.pending_expert_approval,
    };
  } catch (error) {
    throw mapRegistrationError(error);
  }
}

/** Whether registration needs a referral code (false only while no expert exists yet). */
export async function isReferralCodeRequired(): Promise<boolean> {
  const db = await getDb();
  const result = await db.rpc("is_referral_code_required");
  if (result.error) throw new Error(result.error.message);
  return result.data === true;
}

export type RegistrationStatus = "approved" | "pending" | "rejected" | "none";

export async function getRegistrationStatus(user_id: string): Promise<RegistrationStatus> {
  const db = await getDb();
  const approval = row<{ status: Exclude<RegistrationStatus, "none"> }>(
    await db
      .from("expert_approvals")
      .select("status")
      .eq("user_id", user_id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  );
  return approval?.status ?? "none";
}

export async function isRegistrationApproved(user_id: string): Promise<boolean> {
  const status = await getRegistrationStatus(user_id);
  return status === "approved" || status === "none";
}

/** The signed-in user's newest referral approval and the referring expert's name. */
export async function getPendingApprovalState(_user_id: string) {
  const db = await getDb();
  const result = await db.rpc("my_registration_state");
  done(result);
  return row<{ status: Exclude<RegistrationStatus, "none">; expert_name: string }>(result);
}

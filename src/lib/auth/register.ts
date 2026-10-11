import { prisma } from "@/lib/db";
import { pickPublicUserFields, type PublicUser } from "@/lib/models/user";
import { resolveExpertReferralId } from "@/lib/auth/resolve-expert-referral";

const REGISTER_TIMEOUT_MS = 15_000;

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

function normalizeRegisterInput(input: RegisterProfileInput): RegisterProfileInput {
  return {
    id: input.id,
    full_name: input.full_name.trim(),
    title: input.title?.trim() || null,
    expert_code: input.expert_code?.trim() || null,
  };
}

function mapRegistrationError(error: unknown): Error {
  if (error instanceof Error) {
    if (error.message === "Invalid expert referral.") {
      return new Error("קוד המומחה המפנה אינו תקין.");
    }
    if (error.message === "Invalid expert code format.") {
      return new Error("קוד המומחה חייב להיות בפורמט #D90963D6 (8 תווים).");
    }
    if (error.message === "Cannot refer yourself.") {
      return new Error("לא ניתן להפנות את עצמכם.");
    }

    const message = error.message.toLowerCase();
    if (
      message.includes("timed out") ||
      message.includes("timeout") ||
      message.includes("connect") ||
      message.includes("econnrefused") ||
      message.includes("can't reach database")
    ) {
      return new Error(
        "לא ניתן להתחבר למסד הנתונים. בדקו חיבור לאינטרנט ונסו שוב בעוד רגע.",
      );
    }
  }

  return new Error("אירעה שגיאה בשמירת הפרופיל. נסו שוב.");
}

export async function registerProfile(
  input: RegisterProfileInput,
): Promise<RegisterProfileResult> {
  const normalized = normalizeRegisterInput(input);

  if (!normalized.full_name) {
    throw new Error("יש להזין שם מלא.");
  }

  try {
    return await prisma.$transaction(
      async (tx) => {
        const existing = await tx.user.findUnique({ where: { id: normalized.id } });
        if (existing) {
          const pendingApproval = await tx.expertApproval.findFirst({
            where: { user_id: normalized.id, status: "pending" },
          });
          return {
            profile: pickPublicUserFields(existing),
            pending_expert_approval: pendingApproval !== null,
          };
        }

        const expertId = await resolveExpertReferralId(
          tx,
          normalized.expert_code,
          normalized.id,
        );

        const user = await tx.user.create({
          data: {
            id: normalized.id,
            full_name: normalized.full_name,
            title: normalized.title ?? null,
          },
        });

        let pendingExpertApproval = false;

        if (expertId) {
          await tx.expertApproval.create({
            data: {
              expert_id: expertId,
              user_id: normalized.id,
              status: "pending",
            },
          });
          pendingExpertApproval = true;
        }

        return {
          profile: pickPublicUserFields(user),
          pending_expert_approval: pendingExpertApproval,
        };
      },
      { maxWait: 5_000, timeout: REGISTER_TIMEOUT_MS },
    );
  } catch (error) {
    throw mapRegistrationError(error);
  }
}

export type RegistrationStatus = "approved" | "pending" | "rejected" | "none";

export async function getRegistrationStatus(
  user_id: string,
): Promise<RegistrationStatus> {
  const approval = await prisma.expertApproval.findFirst({
    where: { user_id },
    orderBy: { created_at: "desc" },
  });

  if (!approval) {
    return "none";
  }

  return approval.status;
}

export async function isRegistrationApproved(user_id: string): Promise<boolean> {
  const status = await getRegistrationStatus(user_id);
  return status === "approved" || status === "none";
}

export async function getPendingApprovalState(user_id: string) {
  const approval = await prisma.expertApproval.findFirst({
    where: { user_id },
    include: { expert: true },
  });

  if (!approval) {
    return null;
  }

  return {
    status: approval.status,
    expert_name: approval.expert.full_name,
  };
}

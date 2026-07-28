import type { Prisma } from "@prisma/client";
import {
  expertIdMatchesCode,
  isValidExpertCodeFormat,
  normalizeExpertCodeInput,
} from "@/lib/utils/expert-code";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TransactionClient = Prisma.TransactionClient;

export async function resolveExpertReferralId(
  tx: TransactionClient,
  raw: string | null | undefined,
  registeringUserId: string,
): Promise<string | null> {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  if (UUID_PATTERN.test(trimmed)) {
    const expert = await tx.user.findUnique({ where: { id: trimmed } });
    if (!expert || expert.role !== "expert") {
      throw new Error("Invalid expert referral.");
    }
    if (trimmed === registeringUserId) {
      throw new Error("Cannot refer yourself.");
    }
    return trimmed;
  }

  const code = normalizeExpertCodeInput(trimmed);
  if (!isValidExpertCodeFormat(code)) {
    throw new Error("Invalid expert code format.");
  }

  const experts = await tx.user.findMany({
    where: { role: "expert" },
    select: { id: true },
  });

  const match = experts.find((expert) => expertIdMatchesCode(expert.id, code));
  if (!match) {
    throw new Error("Invalid expert referral.");
  }

  if (match.id === registeringUserId) {
    throw new Error("Cannot refer yourself.");
  }

  return match.id;
}

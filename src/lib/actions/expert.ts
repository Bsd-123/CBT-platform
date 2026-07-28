"use server";

import type { UpdateExpertApprovalStatusInput } from "@/lib/models/expert-approval";
import {
  listExpertApprovalsForExpert,
  listPendingApprovalsForExpert,
  updateExpertApprovalStatus,
} from "@/lib/repositories/expert-approval.repository";
import type { ListExpertApprovalsFilter } from "@/lib/models/expert-approval";
import { requireRole } from "@/lib/auth";

export async function fetchPendingReferrals() {
  const auth = await requireRole("expert", "admin");
  return listPendingApprovalsForExpert(auth.userId);
}

export async function fetchExpertReferrals(filter: ListExpertApprovalsFilter = {}) {
  const auth = await requireRole("expert", "admin");
  return listExpertApprovalsForExpert(auth.userId, filter);
}

export async function decideReferralApproval(
  expert_id: string,
  user_id: string,
  input: UpdateExpertApprovalStatusInput,
) {
  const auth = await requireRole("expert", "admin");

  if (auth.profile.role === "expert" && auth.userId !== expert_id) {
    throw new Error("Forbidden");
  }

  return updateExpertApprovalStatus(expert_id, user_id, input);
}

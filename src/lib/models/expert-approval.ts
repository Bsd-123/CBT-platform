import type { ExpertApproval, ExpertApprovalStatus } from "@prisma/client";
import { pickPublicUserFields } from "@/lib/models/user";

export type { ExpertApproval, ExpertApprovalStatus };

export const EXPERT_APPROVAL_STATUSES: readonly ExpertApprovalStatus[] = [
  "pending",
  "approved",
  "rejected",
] as const;

export const DEFAULT_EXPERT_APPROVAL_STATUS: ExpertApprovalStatus = "pending";

export type CreateExpertApprovalInput = {
  expert_id: string;
  user_id: string;
  status?: ExpertApprovalStatus;
};

export type UpdateExpertApprovalStatusInput = {
  status: Extract<ExpertApprovalStatus, "approved" | "rejected">;
};

export type ListExpertApprovalsFilter = {
  status?: ExpertApprovalStatus;
  search?: string;
};

export function isExpertApprovalStatus(
  value: string,
): value is ExpertApprovalStatus {
  return (EXPERT_APPROVAL_STATUSES as readonly string[]).includes(value);
}

export function pickPublicExpertApprovalFields(
  approval: ExpertApproval & {
    expert?: Parameters<typeof pickPublicUserFields>[0];
    user?: Parameters<typeof pickPublicUserFields>[0];
  },
) {
  return {
    id: approval.id,
    expert_id: approval.expert_id,
    user_id: approval.user_id,
    status: approval.status,
    created_at: approval.created_at,
    expert: approval.expert ? pickPublicUserFields(approval.expert) : undefined,
    user: approval.user ? pickPublicUserFields(approval.user) : undefined,
  };
}

export type PublicExpertApproval = ReturnType<
  typeof pickPublicExpertApprovalFields
>;

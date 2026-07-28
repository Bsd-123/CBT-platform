import type { Report, ReportStatus, ReportTargetType } from "@prisma/client";
import { pickPublicUserFields } from "@/lib/models/user";

export type { Report, ReportStatus, ReportTargetType };

export const REPORT_TARGET_TYPES: readonly ReportTargetType[] = [
  "material",
  "forum_question",
  "forum_answer",
  "recommendation",
  "event",
  "professional_request",
] as const;

export const REPORT_STATUSES: readonly ReportStatus[] = [
  "open",
  "reviewing",
  "resolved",
] as const;

export type CreateReportInput = {
  user_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
};

export type UpdateReportStatusInput = {
  status: ReportStatus;
};

export type ListReportsFilter = {
  status?: ReportStatus;
};

export function pickPublicReportFields(
  report: Report & {
    user?: Parameters<typeof pickPublicUserFields>[0];
  },
) {
  return {
    id: report.id,
    user_id: report.user_id,
    target_type: report.target_type,
    target_id: report.target_id,
    reason: report.reason,
    status: report.status,
    created_at: report.created_at,
    user: report.user ? pickPublicUserFields(report.user) : undefined,
  };
}

export type PublicReport = ReturnType<typeof pickPublicReportFields>;

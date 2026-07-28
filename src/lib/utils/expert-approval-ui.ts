import type { ExpertApprovalStatus } from "@prisma/client";
import type { PublicExpertApproval } from "@/lib/models/expert-approval";

export const EXPERT_APPROVAL_STATUS_LABELS: Record<ExpertApprovalStatus, string> = {
  pending: "ממתין",
  approved: "אושר",
  rejected: "נדחה",
};

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function formatShortId(id: string): string {
  return `#${id.slice(0, 8).toUpperCase()}`;
}

export function formatApprovalDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("he-IL", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function matchesApprovalSearch(
  approval: PublicExpertApproval,
  query: string,
  includeExpert = true,
): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [
    approval.user?.full_name,
    approval.user?.title,
    includeExpert ? approval.expert?.full_name : null,
    approval.id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

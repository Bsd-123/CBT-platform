import type { MaterialApprovalStatus, UserRole } from "@prisma/client";

/** Roles that may approve or reject uploaded materials. */
export const REVIEWER_ROLES: readonly UserRole[] = ["expert", "admin"];

export function canReviewMaterials(role: UserRole | null | undefined): boolean {
  return role !== null && role !== undefined && REVIEWER_ROLES.includes(role);
}

/**
 * Uploads by regular users wait for an expert; experts and admins are trusted,
 * so their uploads are approved immediately.
 */
export function initialApprovalFor(role: UserRole): {
  approval_status: MaterialApprovalStatus;
  autoApproved: boolean;
} {
  return canReviewMaterials(role)
    ? { approval_status: "approved", autoApproved: true }
    : { approval_status: "pending", autoApproved: false };
}

type MaterialAccess = { user_id: string; approval_status: MaterialApprovalStatus };
type Viewer = { userId: string; role: UserRole } | null | undefined;

/** Approved materials are public; others are visible only to the uploader and reviewers. */
export function canViewMaterial(material: MaterialAccess, viewer: Viewer): boolean {
  if (material.approval_status === "approved") return true;
  if (!viewer) return false;
  return viewer.userId === material.user_id || canReviewMaterials(viewer.role);
}

export const APPROVAL_LABELS: Record<MaterialApprovalStatus, string> = {
  pending: "ממתין לאישור מומחה",
  approved: "אושר",
  rejected: "נדחה",
};

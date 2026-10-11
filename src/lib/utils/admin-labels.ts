import type { ReportStatus, ReportTargetType } from "@prisma/client";

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  open: "פתוח",
  reviewing: "בטיפול",
  resolved: "טופל",
};

export const REPORT_TARGET_LABELS: Record<ReportTargetType, string> = {
  material: "חומר",
  forum_question: "שאלה בפורום",
  forum_answer: "תשובה בפורום",
  recommendation: "המלצה",
  event: "אירוע",
  professional_request: "פנייה מקצועית",
};

/** Page where a reported item can be viewed, or null when it has no standalone page. */
export function getReportTargetHref(
  targetType: ReportTargetType,
  targetId: string,
): string | null {
  switch (targetType) {
    case "material":
      return `/materials/${targetId}`;
    case "forum_question":
      return `/forum/${targetId}`;
    case "recommendation":
      return `/recommendations#rec-${targetId}`;
    case "event":
      return `/events/${targetId}`;
    case "professional_request":
      return `/professional-requests/${targetId}`;
    case "forum_answer":
      return null;
  }
}

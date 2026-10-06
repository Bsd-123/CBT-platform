import { describe, expect, it } from "vitest";
import {
  REPORT_STATUS_LABELS,
  REPORT_TARGET_LABELS,
  getReportTargetHref,
} from "@/lib/utils/admin-labels";

const id = "0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f";

describe("admin labels", () => {
  it("labels every report status and target type", () => {
    expect(Object.keys(REPORT_STATUS_LABELS).sort()).toEqual(["open", "resolved", "reviewing"]);
    expect(Object.keys(REPORT_TARGET_LABELS)).toHaveLength(6);
  });

  it("links reported content to its page", () => {
    expect(getReportTargetHref("material", id)).toBe(`/materials/${id}`);
    expect(getReportTargetHref("forum_question", id)).toBe(`/forum/${id}`);
    expect(getReportTargetHref("event", id)).toBe(`/events/${id}`);
    expect(getReportTargetHref("professional_request", id)).toBe(`/professional-requests/${id}`);
    expect(getReportTargetHref("recommendation", id)).toBe(`/recommendations#rec-${id}`);
  });

  it("has no standalone page for forum answers", () => {
    expect(getReportTargetHref("forum_answer", id)).toBeNull();
  });
});

import { describe, expect, it } from "vitest";
import { UserFacingError } from "@/lib/errors";
import {
  approvalDecisionSchema,
  eventSchema,
  materialRatingSchema,
  parseInput,
  reportSchema,
} from "@/lib/validation/schemas";

const id = "0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f";

describe("input schemas", () => {
  it("rejects invalid dates and times", () => {
    const base = { title: "t", description: "d" };
    expect(() => parseInput(eventSchema, { ...base, event_date: "" })).toThrow(
      UserFacingError,
    );
    expect(() => parseInput(eventSchema, { ...base, event_date: "2026-13-45" })).toThrow();
    expect(() =>
      parseInput(eventSchema, { ...base, event_date: "2026-10-05", event_time: "25:99" }),
    ).toThrow();
    expect(
      parseInput(eventSchema, { ...base, event_date: "2026-10-05", event_time: "09:30" })
        .event_time,
    ).toBe("09:30");
  });

  it("enforces rating bounds and integer values", () => {
    expect(() => parseInput(materialRatingSchema, { material_id: id, rating: 6 })).toThrow();
    expect(() => parseInput(materialRatingSchema, { material_id: id, rating: 2.5 })).toThrow();
    expect(parseInput(materialRatingSchema, { material_id: id, rating: 5 }).rating).toBe(5);
  });

  it("rejects unknown report targets and oversized reasons", () => {
    expect(() =>
      parseInput(reportSchema, { target_type: "user", target_id: id, reason: "x" }),
    ).toThrow();
    expect(() =>
      parseInput(reportSchema, {
        target_type: "event",
        target_id: id,
        reason: "x".repeat(1001),
      }),
    ).toThrow();
  });

  it("only allows approved or rejected decisions", () => {
    expect(() => parseInput(approvalDecisionSchema, { status: "pending" })).toThrow();
    expect(() => parseInput(approvalDecisionSchema, { status: "admin" })).toThrow();
  });
});

import { forumQuestionSchema } from "@/lib/validation/schemas";

describe("forumQuestionSchema", () => {
  const base = { title: "Title", content: "Body" };
  const tag = "0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f";

  it("accepts no tags, one tag or several", () => {
    expect(forumQuestionSchema.safeParse({ ...base, tag_ids: [] }).success).toBe(true);
    expect(forumQuestionSchema.safeParse({ ...base, tag_ids: [tag] }).success).toBe(true);
    expect(
      forumQuestionSchema.safeParse({ ...base, tag_ids: [tag, "1b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f"] }).success,
    ).toBe(true);
  });

  it("rejects ids that are not uuids and more than 10 tags", () => {
    expect(forumQuestionSchema.safeParse({ ...base, tag_ids: ["anxiety"] }).success).toBe(false);
    expect(forumQuestionSchema.safeParse({ ...base, tag_ids: Array(11).fill(tag) }).success).toBe(false);
  });
});

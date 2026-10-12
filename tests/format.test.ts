import { describe, expect, it } from "vitest";
import { countLabel, formatDate, isRecent } from "@/lib/utils/format";

describe("format helpers", () => {
  it("uses singular for 1 and plural otherwise", () => {
    expect(countLabel(1, "תשובה", "תשובות")).toBe("1 תשובה");
    expect(countLabel(0, "תשובה", "תשובות")).toBe("0 תשובות");
    expect(countLabel(3, "תשובה", "תשובות")).toBe("3 תשובות");
  });

  it("formats dates in the Israel time zone regardless of the host zone", () => {
    const lateUtc = new Date("2026-10-05T22:30:00Z"); // already Oct 6 in Israel
    const original = process.env.TZ;
    process.env.TZ = "America/Los_Angeles";
    try {
      expect(formatDate(lateUtc)).toBe(formatDate("2026-10-05T22:30:00Z"));
      expect(formatDate(lateUtc)).toContain("6");
    } finally {
      process.env.TZ = original;
    }
  });
});

describe("isRecent", () => {
  const now = new Date("2026-10-12T12:00:00Z");

  it("marks content from the last 48 hours as recent", () => {
    expect(isRecent("2026-10-11T12:00:00Z", now)).toBe(true);
  });

  it("does not mark older or future-dated content", () => {
    expect(isRecent("2026-10-10T11:59:00Z", now)).toBe(false);
    expect(isRecent("2026-10-13T12:00:00Z", now)).toBe(false);
  });
});

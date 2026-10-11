import { describe, expect, it } from "vitest";
import { countLabel, formatDate } from "@/lib/utils/format";

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

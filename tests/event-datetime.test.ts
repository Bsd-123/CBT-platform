import { afterEach, describe, expect, it } from "vitest";
import {
  formatEventDate,
  formatEventTimeValue,
} from "@/lib/utils/calendar";

const originalTz = process.env.TZ;
afterEach(() => {
  process.env.TZ = originalTz;
});

// What Prisma returns for @db.Time / @db.Date: wall-clock values as UTC Dates.
const nineAm = new Date(Date.UTC(1970, 0, 1, 9, 0));
const oct5 = new Date(Date.UTC(2026, 9, 5));

describe("event date/time display", () => {
  it.each(["Asia/Jerusalem", "America/Los_Angeles", "Pacific/Auckland", "UTC"])(
    "shows the stored wall-clock value in %s",
    (tz) => {
      process.env.TZ = tz;
      expect(formatEventTimeValue(nineAm)).toBe("09:00");
      expect(formatEventTimeValue("09:00:00")).toBe("09:00");
      expect(formatEventDate(oct5)).toBe(
        new Date("2026-10-05T12:00:00Z").toLocaleDateString("he-IL", {
          timeZone: "UTC",
        }),
      );
    },
  );

  it("guards against the original bug (local-time formatting shifts the value)", () => {
    process.env.TZ = "Asia/Jerusalem";
    const local = nineAm.toLocaleTimeString("he-IL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    expect(local).not.toBe("09:00");
  });
});

import { describe, expect, it } from "vitest";
import { checkRateLimit } from "@/lib/security/rate-limit";

describe("checkRateLimit", () => {
  it("allows up to max then blocks within the window", () => {
    const now = 1_000_000;
    for (let i = 0; i < 3; i++) {
      expect(checkRateLimit("t1", 3, 60, now + i)).toBe(true);
    }
    expect(checkRateLimit("t1", 3, 60, now + 10)).toBe(false);
  });

  it("allows again after the window passes", () => {
    const now = 2_000_000;
    expect(checkRateLimit("t2", 1, 10, now)).toBe(true);
    expect(checkRateLimit("t2", 1, 10, now + 1000)).toBe(false);
    expect(checkRateLimit("t2", 1, 10, now + 11_000)).toBe(true);
  });

  it("tracks keys independently", () => {
    expect(checkRateLimit("a", 1, 60, 5)).toBe(true);
    expect(checkRateLimit("b", 1, 60, 5)).toBe(true);
  });
});

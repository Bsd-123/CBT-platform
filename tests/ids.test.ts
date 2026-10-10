import { describe, expect, it } from "vitest";
import { isUuid } from "@/lib/utils/ids";

describe("isUuid", () => {
  it("accepts UUIDs", () => {
    expect(isUuid("0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f")).toBe(true);
  });
  it("rejects anything else", () => {
    for (const value of ["abc", "", "../admin", "0b9f2b1e7c1d4c559c0a5a1b2c3d4e5f", "0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f/x"]) {
      expect(isUuid(value)).toBe(false);
    }
  });
});

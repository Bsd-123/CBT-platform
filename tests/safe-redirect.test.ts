import { describe, expect, it } from "vitest";
import { isSafeRedirectPath } from "@/lib/auth/safe-redirect";

describe("isSafeRedirectPath", () => {
  it.each(["/", "/reset-password", "/materials?type=game", "/recommendations#rec-1"])(
    "accepts %s",
    (value) => expect(isSafeRedirectPath(value)).toBe(true),
  );

  it.each([
    "//evil.com",
    "/\\evil.com",
    "https://evil.com",
    "evil.com",
    "",
    "/ok\nhttps://evil.com",
    "/a\\b",
  ])("rejects %j", (value) => expect(isSafeRedirectPath(value)).toBe(false));
});

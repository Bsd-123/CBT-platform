import { describe, expect, it } from "vitest";
import { buildContentSecurityPolicy, createNonce } from "@/lib/security/csp";

describe("buildContentSecurityPolicy", () => {
  it("allows scripts by nonce only in production", () => {
    const csp = buildContentSecurityPolicy("abc", false);
    expect(csp).toContain("script-src 'self' 'nonce-abc' 'strict-dynamic'");
    expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);
    expect(csp).not.toContain("unsafe-eval");
  });

  it("adds unsafe-eval only in development", () => {
    expect(buildContentSecurityPolicy("abc", true)).toContain("'unsafe-eval'");
  });

  it("creates unique nonces", () => {
    expect(createNonce()).not.toBe(createNonce());
  });
});

import { describe, expect, it } from "vitest";
import {
  buildContentSecurityPolicy,
  buildFileResponsePolicy,
  createNonce,
  isFileRoute,
} from "@/lib/security/csp";

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

describe("file response policy", () => {
  it("lets only the app itself frame a stored file, and runs no scripts in it", () => {
    const csp = buildFileResponsePolicy();
    expect(csp).toContain("frame-ancestors 'self'");
    expect(csp).toContain("default-src 'none'");
    expect(csp).not.toMatch(/script-src/);
  });

  it("keeps every other page unframeable", () => {
    expect(buildContentSecurityPolicy("abc", false)).toContain("frame-ancestors 'none'");
  });

  it("applies the file policy to the file route only", () => {
    expect(isFileRoute("/api/files/materials/x/1-a.pdf")).toBe(true);
    expect(isFileRoute("/api/upload/material")).toBe(false);
    expect(isFileRoute("/materials/123")).toBe(false);
  });
});

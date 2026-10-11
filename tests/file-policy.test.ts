import { describe, expect, it } from "vitest";
import { checkUpload, MAX_UPLOAD_BYTES } from "@/lib/uploads/file-policy";

const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]);

describe("checkUpload", () => {
  it("accepts a real PDF and derives the content type from the extension", () => {
    expect(checkUpload("a.pdf", 100, pdf)).toEqual({
      ok: true,
      contentType: "application/pdf",
    });
  });

  it.each(["x.exe", "x.html", "x.svg", "x.js", "noext"])("rejects %s", (name) => {
    expect(checkUpload(name, 100, pdf).ok).toBe(false);
  });

  it("rejects content that does not match the extension", () => {
    const html = new TextEncoder().encode("<html><script>");
    expect(checkUpload("evil.pdf", 100, html).ok).toBe(false);
  });

  it("rejects empty and oversized files", () => {
    expect(checkUpload("a.pdf", 0, pdf).ok).toBe(false);
    expect(checkUpload("a.pdf", MAX_UPLOAD_BYTES + 1, pdf).ok).toBe(false);
  });
});

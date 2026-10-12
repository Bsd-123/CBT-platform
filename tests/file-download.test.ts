import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  getObject: vi.fn(),
}));

vi.mock("@/lib/files/access", async () => {
  class FileNotFoundError extends Error {}
  return { authorizeFileDownload: mocks.authorize, FileNotFoundError };
});
vi.mock("@/lib/r2/download", () => ({ getObjectFromR2: mocks.getObject }));

import { AuthError } from "@/lib/auth/errors";
import { RateLimitError } from "@/lib/errors";
import { FileNotFoundError } from "@/lib/files/access";
import { fileDownloadPath, fileNameFromKey } from "@/lib/files/path";
import { serveFile } from "@/lib/files/serve";

const KEY = "materials/0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f/1700000000000-lesson plan.pdf".replace(" ", "_");
const url = (query = "") => `https://app.test/api/files/x${query}`;
const request = (headers: Record<string, string> = {}, query = "") =>
  new Request(url(query), { headers });

const stream = (text: string) =>
  new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(text));
      controller.close();
    },
  });

beforeEach(() => {
  vi.clearAllMocks();
  mocks.authorize.mockResolvedValue({ userId: "u1" });
  mocks.getObject.mockResolvedValue({
    status: 200, body: stream("PDFDATA"), contentLength: 7, etag: '"abc"', lastModified: new Date("2026-10-01T00:00:00Z"),
  });
});

describe("file URLs", () => {
  it("point at the app's own domain, one stable URL per file", () => {
    expect(fileDownloadPath(KEY)).toBe(`/api/files/${KEY}`);
    expect(fileDownloadPath(KEY)).toBe(fileDownloadPath(KEY));
    expect(fileDownloadPath(KEY)).not.toMatch(/X-Amz|Signature|Expires/i);
    expect(fileDownloadPath(KEY, { inline: true })).toMatch(/\?inline=1$/);
  });

  it("encodes each path segment but keeps the slashes", () => {
    expect(fileDownloadPath("materials/id/1-a b.pdf")).toBe("/api/files/materials/id/1-a%20b.pdf");
  });

  it("recovers the readable name from the stored key", () => {
    expect(fileNameFromKey(KEY)).toBe("lesson_plan.pdf");
  });
});

describe("serving a file", () => {
  it("streams it with a download disposition, the right type and cache validators", async () => {
    const response = await serveFile(request(), KEY, false);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("PDFDATA");
    expect(response.headers.get("Content-Type")).toBe("application/pdf");
    expect(response.headers.get("Content-Disposition")).toContain('attachment; filename="lesson_plan.pdf"');
    expect(response.headers.get("Content-Length")).toBe("7");
    expect(response.headers.get("ETag")).toBe('"abc"');
    expect(response.headers.get("Accept-Ranges")).toBe("bytes");
    expect(response.headers.get("Cache-Control")).toContain("private");
    expect(response.headers.get("X-Content-Type-Options")).toBe("nosniff");
  });

  it("checks permission for exactly the requested key before touching storage", async () => {
    await serveFile(request(), KEY, false);
    expect(mocks.authorize).toHaveBeenCalledWith(KEY);
    expect(mocks.authorize.mock.invocationCallOrder[0]).toBeLessThan(mocks.getObject.mock.invocationCallOrder[0]);
  });

  it("never trusts stored metadata for the type: it comes from the extension", async () => {
    const response = await serveFile(request(), "materials/0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f/1-x.exe", false);
    expect(response.headers.get("Content-Type")).toBe("application/octet-stream");
  });

  it("HEAD returns the headers without a body", async () => {
    const response = await serveFile(request(), KEY, true);
    expect(response.status).toBe(200);
    expect(response.body).toBeNull();
    expect(mocks.getObject).toHaveBeenCalledWith(KEY, expect.objectContaining({ head: true }));
  });

  it("opens viewable types in the browser only when asked, never active content", async () => {
    expect((await serveFile(request({}, "?inline=1"), KEY, false)).headers.get("Content-Disposition")).toMatch(/^inline/);
    mocks.getObject.mockResolvedValue({ status: 200, body: stream("x"), contentLength: 1 });
    const doc = "materials/0b9f2b1e-7c1d-4c55-9c0a-5a1b2c3d4e5f/1-notes.docx";
    expect((await serveFile(request({}, "?inline=1"), doc, false)).headers.get("Content-Disposition")).toMatch(/^attachment/);
  });
});

describe("ranges and caching", () => {
  it("passes a byte range through and answers 206 with Content-Range", async () => {
    mocks.getObject.mockResolvedValue({ status: 206, body: stream("DF"), contentLength: 2, contentRange: "bytes 1-2/7" });
    const response = await serveFile(request({ Range: "bytes=1-2" }), KEY, false);
    expect(mocks.getObject).toHaveBeenCalledWith(KEY, expect.objectContaining({ range: "bytes=1-2" }));
    expect(response.status).toBe(206);
    expect(response.headers.get("Content-Range")).toBe("bytes 1-2/7");
  });

  it("ignores malformed or multi-range headers and serves the whole file", async () => {
    await serveFile(request({ Range: "bytes=0-1,5-9" }), KEY, false);
    expect(mocks.getObject).toHaveBeenCalledWith(KEY, expect.objectContaining({ range: undefined }));
    await serveFile(request({ Range: "items=1-2" }), KEY, false);
    expect(mocks.getObject).toHaveBeenLastCalledWith(KEY, expect.objectContaining({ range: undefined }));
  });

  it("answers 304 for an unchanged file", async () => {
    mocks.getObject.mockResolvedValue({ status: 304, body: null, etag: '"abc"' });
    const response = await serveFile(request({ "If-None-Match": '"abc"' }), KEY, false);
    expect(mocks.getObject).toHaveBeenCalledWith(KEY, expect.objectContaining({ ifNoneMatch: '"abc"' }));
    expect(response.status).toBe(304);
    expect(response.body).toBeNull();
  });

  it("answers 416 for a range outside the file", async () => {
    mocks.getObject.mockResolvedValue({ status: 416, body: null });
    expect((await serveFile(request({ Range: "bytes=999-" }), KEY, false)).status).toBe(416);
  });
});

describe("refusals", () => {
  const status = async () => (await serveFile(request(), KEY, false)).status;

  it("401 when not signed in, 429 when rate limited", async () => {
    mocks.authorize.mockRejectedValue(new AuthError("no"));
    expect(await status()).toBe(401);
    mocks.authorize.mockRejectedValue(new RateLimitError());
    expect(await status()).toBe(429);
  });

  it("404 for files the member may not have, and for objects missing from storage", async () => {
    mocks.authorize.mockRejectedValue(new FileNotFoundError());
    expect(await status()).toBe(404);
    mocks.authorize.mockResolvedValue({ userId: "u1" });
    mocks.getObject.mockResolvedValue(null);
    expect(await status()).toBe(404);
    expect(mocks.getObject).toHaveBeenCalledTimes(1);
  });

  it("refusals are readable JSON that is never cached", async () => {
    mocks.authorize.mockRejectedValue(new FileNotFoundError());
    const response = await serveFile(request(), KEY, false);
    expect(await response.json()).toEqual({ error: "הקובץ לא נמצא." });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });

  it("500 with a generic message when storage fails, without leaking details", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.getObject.mockRejectedValue(new Error("R2 secret details"));
    const response = await serveFile(request(), KEY, false);
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain("R2 secret");
  });
});

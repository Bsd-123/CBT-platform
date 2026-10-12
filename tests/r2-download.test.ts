import { beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.hoisted(() => vi.fn());
vi.mock("@/lib/r2/client", () => ({ getR2Client: () => ({ send }) }));
vi.mock("@/lib/r2/config", () => ({ r2Config: { bucketName: "bucket" } }));

import { getObjectFromR2 } from "@/lib/r2/download";
import { config as proxyConfig } from "@/proxy";

const awsError = (name: string, status: number) =>
  Object.assign(new Error(name), { name, $metadata: { httpStatusCode: status } });

beforeEach(() => send.mockReset());

describe("reading from R2", () => {
  it("returns the stream and the validators of a full object", async () => {
    const web = new ReadableStream();
    send.mockResolvedValue({
      Body: { transformToWebStream: () => web }, ContentLength: 5, ETag: '"e"', LastModified: new Date(0),
    });
    const result = await getObjectFromR2("k");
    expect(result).toMatchObject({ status: 200, body: web, contentLength: 5, etag: '"e"' });
  });

  it("reports a partial response when R2 returns a content range", async () => {
    send.mockResolvedValue({ Body: { transformToWebStream: () => new ReadableStream() }, ContentRange: "bytes 0-1/9", ContentLength: 2 });
    expect(await getObjectFromR2("k", { range: "bytes=0-1" })).toMatchObject({ status: 206, contentRange: "bytes 0-1/9" });
    expect(send.mock.calls[0][0].input).toMatchObject({ Bucket: "bucket", Key: "k", Range: "bytes=0-1" });
  });

  it("uses a HEAD request when only headers are needed", async () => {
    send.mockResolvedValue({ ContentLength: 5, ETag: '"e"' });
    const result = await getObjectFromR2("k", { head: true });
    expect(result).toMatchObject({ status: 200, body: null, contentLength: 5 });
    expect(send.mock.calls[0][0].constructor.name).toBe("HeadObjectCommand");
  });

  it("maps R2's not-modified, bad-range and missing-object answers", async () => {
    send.mockRejectedValueOnce(awsError("NotModified", 304));
    expect(await getObjectFromR2("k", { ifNoneMatch: '"e"' })).toMatchObject({ status: 304, body: null });
    send.mockRejectedValueOnce(awsError("InvalidRange", 416));
    expect(await getObjectFromR2("k", { range: "bytes=9-" })).toMatchObject({ status: 416 });
    send.mockRejectedValueOnce(awsError("NoSuchKey", 404));
    expect(await getObjectFromR2("k")).toBeNull();
  });

  it("lets real failures surface", async () => {
    send.mockRejectedValueOnce(awsError("InternalError", 500));
    await expect(getObjectFromR2("k")).rejects.toThrow("InternalError");
  });
});

describe("proxy coverage", () => {
  it("still runs for file downloads whose names end in an image extension", () => {
    expect(proxyConfig.matcher).toContain("/api/files/:path*");
  });
});

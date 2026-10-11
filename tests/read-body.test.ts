import { describe, expect, it } from "vitest";
import { readBodyWithLimit } from "@/lib/uploads/read-body";

function chunkedRequest(chunks: Uint8Array[]): Request {
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });
  return new Request("http://x.test/upload", {
    method: "POST",
    body: stream,
    // @ts-expect-error required by Node for streaming request bodies
    duplex: "half",
  });
}

describe("readBodyWithLimit", () => {
  it("returns the full body when under the limit", async () => {
    const body = await readBodyWithLimit(chunkedRequest([new Uint8Array(3), new Uint8Array(4)]), 10);
    expect(body?.byteLength).toBe(7);
  });

  it("returns null once the limit is exceeded, without a Content-Length header", async () => {
    const request = chunkedRequest([new Uint8Array(6), new Uint8Array(6)]);
    expect(request.headers.get("content-length")).toBeNull();
    expect(await readBodyWithLimit(request, 10)).toBeNull();
  });

  it("handles an empty body", async () => {
    const body = await readBodyWithLimit(new Request("http://x.test", { method: "POST" }), 10);
    expect(body?.byteLength).toBe(0);
  });
});

describe("multipart round trip", () => {
  it("rebuilt body still parses as form data", async () => {
    const form = new FormData();
    form.set("file", new File([new Uint8Array([0x25, 0x50, 0x44, 0x46])], "a.pdf"));
    const request = new Request("http://x.test/upload", { method: "POST", body: form });
    const body = await readBodyWithLimit(request, 1_000_000);
    const parsed = await new Response(body, {
      headers: { "content-type": request.headers.get("content-type") ?? "" },
    }).formData();
    const file = parsed.get("file") as File;
    expect(file.name).toBe("a.pdf");
    expect(file.size).toBe(4);
  });
});

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ENCODED_PARAM,
  FileFetchError,
  bytesToBase64,
  fetchImageSource,
  isEncodableImageName,
  parseEncodedPayload,
  parseEncodingUserIds,
  shouldEncodeForUser,
  toDataUrl,
} from "@/lib/files/encoded";
import { clearEncodedCache, getEncodedCache, setEncodedCache } from "@/lib/files/encoded-cache";

const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

afterEach(() => {
  clearEncodedCache();
  vi.unstubAllGlobals();
});

describe("encoding allow-list", () => {
  it("encodes only listed members and nobody when the list is empty", () => {
    expect(parseEncodingUserIds("u1, u2").has("u1")).toBe(true);
    expect(shouldEncodeForUser("u1", "u1,u2")).toBe(true);
    expect(shouldEncodeForUser("u3", "u1,u2")).toBe(false);
    expect(shouldEncodeForUser("u1", "")).toBe(false);
    expect(shouldEncodeForUser("u1", undefined)).toBe(false);
  });
});

describe("encodable names", () => {
  it("accepts common image extensions and rejects everything else", () => {
    expect(isEncodableImageName("photo.PNG")).toBe(true);
    expect(isEncodableImageName("x.jpeg")).toBe(true);
    expect(isEncodableImageName("x.webp")).toBe(true);
    expect(isEncodableImageName("notes.pdf")).toBe(false);
    expect(isEncodableImageName("noext")).toBe(false);
  });
});

describe("Data URLs", () => {
  it("wraps bytes as a data URL the browser can put in img src", () => {
    const dataUrl = toDataUrl(png, "image/png");
    expect(dataUrl).toBe(`data:image/png;base64,${bytesToBase64(png)}`);
    expect(parseEncodedPayload({ dataUrl })).toBe(dataUrl);
    expect(parseEncodedPayload({ dataUrl: "https://example" })).toBeNull();
    expect(parseEncodedPayload(null)).toBeNull();
  });
});

describe("encoded cache", () => {
  it("returns a stored payload and refreshes LRU order", () => {
    setEncodedCache("k", '"e1"', "data:image/png;base64,aaa");
    expect(getEncodedCache("k", '"e1"')).toBe("data:image/png;base64,aaa");
    expect(getEncodedCache("k", '"missing"')).toBeUndefined();
  });
});

describe("fetchImageSource", () => {
  it("uses a JSON Data URL when the server encoded the image", async () => {
    const dataUrl = toDataUrl(png, "image/png");
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ dataUrl }), { headers: { "Content-Type": "application/json" } })),
    );
    const source = await fetchImageSource(`/api/files/x?${ENCODED_PARAM}=1`);
    expect(source.src).toBe(dataUrl);
    source.release();
  });

  it("falls back to a blob URL when the server streamed the raw image", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(png, { headers: { "Content-Type": "image/png" } })),
    );
    const create = vi.fn(() => "blob:app/test");
    const revoke = vi.fn();
    vi.stubGlobal("URL", { createObjectURL: create, revokeObjectURL: revoke });
    const source = await fetchImageSource("/api/files/x");
    expect(source.src).toBe("blob:app/test");
    source.release();
    expect(revoke).toHaveBeenCalledWith("blob:app/test");
  });

  it("surfaces the HTTP status of a refused file", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 404 })));
    await expect(fetchImageSource("/api/files/x")).rejects.toBeInstanceOf(FileFetchError);
  });
});

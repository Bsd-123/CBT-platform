import "server-only";
import { getEncodedCache, setEncodedCache } from "@/lib/files/encoded-cache";
import {
  ENCODED_PARAM,
  MAX_ENCODED_BYTES,
  isEncodableImageName,
  shouldEncodeForUser,
  toDataUrl,
} from "@/lib/files/encoded";
import { getObjectFromR2, type R2Download } from "@/lib/r2/download";
import { contentTypeForFileName } from "@/lib/uploads/file-policy";

async function readWithLimit(
  body: ReadableStream<Uint8Array>,
  limit: number,
): Promise<Uint8Array | null> {
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > limit) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes;
}

function encodedJsonResponse(dataUrl: string, object: Pick<R2Download, "etag" | "lastModified">): Response {
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "private, max-age=0, must-revalidate",
    Vary: "Cookie",
    "X-Content-Type-Options": "nosniff",
  });
  if (object.etag) headers.set("ETag", object.etag);
  if (object.lastModified) headers.set("Last-Modified", object.lastModified.toUTCString());
  return Response.json({ dataUrl }, { headers });
}

function notModified(object: Pick<R2Download, "etag" | "lastModified">): Response {
  const headers = new Headers({
    "Cache-Control": "private, max-age=0, must-revalidate",
    Vary: "Cookie",
    "X-Content-Type-Options": "nosniff",
  });
  if (object.etag) headers.set("ETag", object.etag);
  if (object.lastModified) headers.set("Last-Modified", object.lastModified.toUTCString());
  return new Response(null, { status: 304, headers });
}

/**
 * Returns a JSON Data URL for allow-listed members and encodable images. `null` means the caller
 * should stream the object normally (wrong user, not an image, too large, or missing).
 */
export async function tryServeEncodedImage(
  request: Request,
  key: string,
  userId: string,
  fileName: string,
): Promise<Response | null> {
  if (new URL(request.url).searchParams.get(ENCODED_PARAM) !== "1") return null;
  if (!shouldEncodeForUser(userId)) return null;
  if (!isEncodableImageName(fileName)) return null;

  const ifNoneMatch = request.headers.get("if-none-match") ?? undefined;
  const meta = await getObjectFromR2(key, { head: true, ifNoneMatch });
  if (!meta) return null;
  if (meta.status === 304) return notModified(meta);
  if (meta.contentLength !== undefined && meta.contentLength > MAX_ENCODED_BYTES) return null;

  if (meta.etag) {
    const cached = getEncodedCache(key, meta.etag);
    if (cached) return encodedJsonResponse(cached, meta);
  }

  const object = await getObjectFromR2(key, { ifNoneMatch });
  if (!object) return null;
  if (object.status === 304) return notModified(object);
  if (!object.body) return null;

  const bytes = await readWithLimit(object.body, MAX_ENCODED_BYTES);
  if (!bytes) return null;

  const dataUrl = toDataUrl(bytes, contentTypeForFileName(fileName));
  if (object.etag) setEncodedCache(key, object.etag, dataUrl);
  return encodedJsonResponse(dataUrl, object);
}

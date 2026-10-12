/**
 * Encoded image delivery for members listed in FILE_ENCODING_USER_IDS. Some client networks
 * strip responses whose Content-Type is an image type; the file route instead returns a JSON
 * Data URL (text) and the browser paints it locally. Used by the file route and the preview.
 */

/** Query parameter that asks the file route for the encoded JSON form. */
export const ENCODED_PARAM = "encoded";

/**
 * Original size cap. Base64 grows ~33%, and Vercel serverless responses are limited to ~4.5MB,
 * so 3MB of image bytes stays under that after encoding. Larger files fall back to a normal stream.
 */
export const MAX_ENCODED_BYTES = 3 * 1024 * 1024;

const IMAGE_EXTENSIONS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

export type ImageSource = {
  src: string;
  /** Drop a blob: URL when the preview unmounts. Data URLs are a no-op. */
  release: () => void;
};

export class FileFetchError extends Error {
  constructor(readonly status: number) {
    super(`File request failed with ${status}`);
  }
}

export function parseEncodingUserIds(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

/** True only for members explicitly listed; an empty allow-list encodes for nobody. */
export function shouldEncodeForUser(
  userId: string,
  allowlist = process.env.FILE_ENCODING_USER_IDS,
): boolean {
  return parseEncodingUserIds(allowlist).has(userId);
}

export function isEncodableImageName(fileName: string): boolean {
  const dot = fileName.lastIndexOf(".");
  if (dot === -1) return false;
  return IMAGE_EXTENSIONS.has(fileName.slice(dot + 1).toLowerCase());
}

export function bytesToBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") return Buffer.from(bytes).toString("base64");
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export function toDataUrl(bytes: Uint8Array, contentType: string): string {
  return `data:${contentType};base64,${bytesToBase64(bytes)}`;
}

export function parseEncodedPayload(value: unknown): string | null {
  if (!value || typeof value !== "object") return null;
  const dataUrl = (value as { dataUrl?: unknown }).dataUrl;
  if (typeof dataUrl !== "string" || !dataUrl.startsWith("data:") || !dataUrl.includes(";base64,")) {
    return null;
  }
  return dataUrl;
}

/**
 * Loads a stored image. When the server encoded it, the JSON Data URL is used as-is; otherwise
 * the raw bytes become a blob: URL (same as pointing <img> at the file route).
 */
export async function fetchImageSource(url: string, signal?: AbortSignal): Promise<ImageSource> {
  const response = await fetch(url, { credentials: "same-origin", cache: "no-store", signal });
  if (!response.ok) throw new FileFetchError(response.status);

  const type = response.headers.get("Content-Type") ?? "";
  if (type.includes("application/json")) {
    const dataUrl = parseEncodedPayload(await response.json());
    if (!dataUrl) throw new FileFetchError(response.status);
    return { src: dataUrl, release() {} };
  }

  const src = URL.createObjectURL(await response.blob());
  return { src, release: () => URL.revokeObjectURL(src) };
}

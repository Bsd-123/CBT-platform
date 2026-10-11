export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

type Signature =
  | "pdf"
  | "zip"
  | "ole"
  | "png"
  | "jpeg"
  | "gif"
  | "webp"
  | "mp4"
  | "mp3"
  | "text";

const ALLOWED: Record<string, { contentType: string; signature: Signature }> = {
  pdf: { contentType: "application/pdf", signature: "pdf" },
  docx: {
    contentType:
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    signature: "zip",
  },
  pptx: {
    contentType:
      "application/vnd.openxmlformats-officedocument.presentationml.presentation",
    signature: "zip",
  },
  xlsx: {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    signature: "zip",
  },
  doc: { contentType: "application/msword", signature: "ole" },
  ppt: { contentType: "application/vnd.ms-powerpoint", signature: "ole" },
  xls: { contentType: "application/vnd.ms-excel", signature: "ole" },
  txt: { contentType: "text/plain; charset=utf-8", signature: "text" },
  png: { contentType: "image/png", signature: "png" },
  jpg: { contentType: "image/jpeg", signature: "jpeg" },
  jpeg: { contentType: "image/jpeg", signature: "jpeg" },
  gif: { contentType: "image/gif", signature: "gif" },
  webp: { contentType: "image/webp", signature: "webp" },
  mp4: { contentType: "video/mp4", signature: "mp4" },
  mp3: { contentType: "audio/mpeg", signature: "mp3" },
};

export const ALLOWED_EXTENSIONS = Object.keys(ALLOWED);

export function getExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

function startsWith(bytes: Uint8Array, magic: number[], offset = 0): boolean {
  return magic.every((value, i) => bytes[offset + i] === value);
}

function matchesSignature(bytes: Uint8Array, signature: Signature): boolean {
  switch (signature) {
    case "pdf":
      return startsWith(bytes, [0x25, 0x50, 0x44, 0x46]);
    case "zip":
      return startsWith(bytes, [0x50, 0x4b]);
    case "ole":
      return startsWith(bytes, [0xd0, 0xcf, 0x11, 0xe0]);
    case "png":
      return startsWith(bytes, [0x89, 0x50, 0x4e, 0x47]);
    case "jpeg":
      return startsWith(bytes, [0xff, 0xd8, 0xff]);
    case "gif":
      return startsWith(bytes, [0x47, 0x49, 0x46, 0x38]);
    case "webp":
      return (
        startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) &&
        startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)
      );
    case "mp4":
      return startsWith(bytes, [0x66, 0x74, 0x79, 0x70], 4);
    case "mp3":
      return (
        startsWith(bytes, [0x49, 0x44, 0x33]) ||
        (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0)
      );
    case "text":
      return !bytes.includes(0);
  }
}

export type FileCheck =
  | { ok: true; contentType: string }
  | { ok: false; error: string };

/**
 * Validates by extension allow-list plus magic bytes. The stored Content-Type is
 * derived from the extension; the client-supplied MIME type is never trusted.
 */
export function checkUpload(
  fileName: string,
  size: number,
  head: Uint8Array,
): FileCheck {
  if (!size) return { ok: false, error: "הקובץ ריק." };
  if (size > MAX_UPLOAD_BYTES) {
    return { ok: false, error: "גודל הקובץ חורג מ-50MB." };
  }

  const rule = ALLOWED[getExtension(fileName)];
  if (!rule) return { ok: false, error: "סוג הקובץ אינו נתמך." };

  if (!matchesSignature(head, rule.signature)) {
    return { ok: false, error: "תוכן הקובץ אינו תואם לסוג הקובץ." };
  }

  return { ok: true, contentType: rule.contentType };
}

import { fileNameFromKey } from "@/lib/files/path";
import { canViewInline, getExtension } from "@/lib/uploads/file-policy";

/** How the preview dialog shows a stored file. `none` means "no inline view, offer the download". */
export type PreviewKind = "pdf" | "image" | "video" | "audio" | "text" | "none";

const KIND_BY_EXTENSION: Record<string, PreviewKind> = {
  pdf: "pdf",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  mp4: "video",
  mp3: "audio",
  txt: "text",
};

export function previewKindForKey(key: string): PreviewKind {
  const fileName = fileNameFromKey(key);
  // The server only serves `?inline=1` for types it allows, so both lists must agree.
  if (!canViewInline(fileName)) return "none";
  return KIND_BY_EXTENSION[getExtension(fileName)] ?? "none";
}

/** A readable reason for a refused or failed file request, shown inside the preview. */
export function previewErrorMessage(status: number): string {
  if (status === 401) return "יש להתחבר מחדש כדי לצפות בקובץ.";
  if (status === 404) return "הקובץ לא נמצא.";
  if (status === 429) return "יותר מדי בקשות. נסו שוב בעוד רגע.";
  if (status === 502) return "שירות האחסון אינו זמין כרגע. נסו שוב מאוחר יותר.";
  return "לא ניתן להציג את הקובץ כעת.";
}

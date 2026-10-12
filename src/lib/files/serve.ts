import "server-only";
import { AuthError } from "@/lib/auth/errors";
import { RateLimitError } from "@/lib/errors";
import { authorizeFileDownload, FileNotFoundError } from "@/lib/files/access";
import { fileNameFromKey } from "@/lib/files/path";
import { logger } from "@/lib/logger";
import { getObjectFromR2 } from "@/lib/r2/download";
import { canViewInline, contentTypeForFileName } from "@/lib/uploads/file-policy";

const fail = (status: number, error: string) =>
  Response.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/** One `bytes=a-b` / `bytes=a-` / `bytes=-n` range; anything fancier is ignored (full file). */
function parseRange(header: string | null): string | undefined {
  return header && /^bytes=(\d+-\d*|-\d+)$/.test(header) ? header : undefined;
}

/** `attachment; filename="..."` with an ASCII fallback; stored names are already sanitized. */
function contentDisposition(disposition: "attachment" | "inline", fileName: string): string {
  const ascii = fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  return `${disposition}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

/**
 * Streams a stored file from the app's own domain after checking the member may have it. The
 * URL is the same every time, so a network filter sees a single known address on a known host
 * and can inspect and approve it once, instead of an endless series of one-off presigned links.
 */
export async function serveFile(request: Request, key: string, head: boolean): Promise<Response> {
  try {
    await authorizeFileDownload(key);

    const object = await getObjectFromR2(key, {
      head,
      range: parseRange(request.headers.get("range")),
      ifNoneMatch: request.headers.get("if-none-match") ?? undefined,
    });
    if (!object) return fail(404, "הקובץ לא נמצא.");

    const fileName = fileNameFromKey(key);
    const wantsInline = new URL(request.url).searchParams.get("inline") === "1";
    const disposition = wantsInline && canViewInline(fileName) ? "inline" : "attachment";

    const headers = new Headers({
      "Content-Type": contentTypeForFileName(fileName),
      "Content-Disposition": contentDisposition(disposition, fileName),
      "Accept-Ranges": "bytes",
      // Revalidate every time (access can be revoked), but let unchanged files answer 304.
      "Cache-Control": "private, max-age=0, must-revalidate",
      Vary: "Cookie",
      "X-Content-Type-Options": "nosniff",
    });
    if (object.etag) headers.set("ETag", object.etag);
    if (object.lastModified) headers.set("Last-Modified", object.lastModified.toUTCString());

    if (object.status === 416) return new Response(null, { status: 416, headers });
    if (object.status === 304) return new Response(null, { status: 304, headers });

    if (object.contentLength !== undefined) headers.set("Content-Length", String(object.contentLength));
    if (object.contentRange) headers.set("Content-Range", object.contentRange);
    return new Response(head ? null : object.body, { status: object.status, headers });
  } catch (error) {
    if (error instanceof AuthError) return fail(401, "יש להתחבר מחדש כדי להמשיך.");
    if (error instanceof RateLimitError) return fail(429, error.message);
    if (error instanceof FileNotFoundError) return fail(404, "הקובץ לא נמצא.");
    // 418 is what network filters answer when they block the storage host itself: the server
    // cannot reach R2 from this network, which no change to the download URL can fix.
    if ((error as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode === 418) {
      logger.error("storage host blocked by the network (HTTP 418)", error, { route: "/api/files" });
      return fail(502, "שירות האחסון חסום ברשת שבה רץ השרת. יש לאשר אותו במסנן או להריץ את האתר ברשת אחרת.");
    }
    logger.error("file download failed", error, { route: "/api/files" });
    return fail(500, "ההורדה נכשלה. נסו שוב.");
  }
}

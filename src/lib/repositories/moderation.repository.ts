import "server-only";
import { countOf, done, getDb, row } from "@/lib/db/client";
import type { ReportTargetType } from "@/lib/db/types";
import { logger } from "@/lib/logger";
import { deleteObjectFromR2 } from "@/lib/r2";

/** Admin-only: hides or restores content (checked inside `moderate_set_hidden`). */
export async function setReportedContentHidden(
  target_type: ReportTargetType,
  target_id: string,
  is_hidden: boolean,
): Promise<void> {
  const db = await getDb();
  done(
    await db.rpc("moderate_set_hidden", {
      p_type: target_type,
      p_id: target_id,
      p_hidden: is_hidden,
    }),
  );
}

/**
 * Admin-only: deletes reported content and its dependants atomically inside the database
 * (`moderate_delete_content`), which returns the stored file key of a deleted material. The
 * file is removed afterwards, and only when no other material still uses the same key.
 */
export async function deleteReportedContent(
  target_type: ReportTargetType,
  target_id: string,
): Promise<void> {
  const db = await getDb();
  const result = await db.rpc("moderate_delete_content", { p_type: target_type, p_id: target_id });
  if (result.error) throw new Error(result.error.code === "42501" ? "Forbidden" : result.error.message);
  const fileKey = row<string>(result);

  if (!fileKey) return;

  try {
    const stillReferenced = countOf(
      await db.from("materials").select("id", { count: "exact", head: true }).eq("file_url", fileKey),
    );
    if (stillReferenced > 0) return;

    await deleteObjectFromR2(fileKey);
  } catch (error) {
    // The database is already consistent; an orphaned object is harmless to users.
    logger.error("failed to delete stored file", error, { fileKey });
  }
}

export async function hideReportedContent(
  target_type: ReportTargetType,
  target_id: string,
): Promise<void> {
  return setReportedContentHidden(target_type, target_id, true);
}

export async function restoreReportedContent(
  target_type: ReportTargetType,
  target_id: string,
): Promise<void> {
  return setReportedContentHidden(target_type, target_id, false);
}

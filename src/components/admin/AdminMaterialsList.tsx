"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  adminDeleteReportedContent,
  adminHideReportedContent,
  adminRestoreReportedContent,
} from "@/lib/actions/admin";
import { TagList } from "@/components/shared/TagList";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUi } from "@/components/ui/UiProvider";
import type { AdminMaterialItem } from "@/lib/repositories/material.repository";
import { formatDate } from "@/lib/utils/format";
import { APPROVAL_LABELS } from "@/lib/materials/approval";
import { unwrap } from "@/lib/actions/result";

type Props = {
  materials: AdminMaterialItem[];
  total: number;
  page: number;
  pageSize: number;
};

export function AdminMaterialsList({ materials, total, page, pageSize }: Props) {
  const router = useRouter();
  const { toast, confirm } = useUi();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  async function handleAction(action: "hide" | "restore" | "delete", id: string) {
    if (action === "delete") {
      const approved = await confirm({
        title: "מחיקת חומר",
        message: "החומר, הדירוגים והקובץ שלו יימחקו לצמיתות.",
        confirmLabel: "מחיקה",
        danger: true,
      });
      if (!approved) return;
    }

    setLoadingId(id);
    try {
      if (action === "hide") unwrap(await adminHideReportedContent("material", id));
      if (action === "restore") unwrap(await adminRestoreReportedContent("material", id));
      if (action === "delete") unwrap(await adminDeleteReportedContent("material", id));
      toast(
        action === "delete" ? "החומר נמחק" : action === "hide" ? "החומר הוסתר" : "החומר שוחזר",
      );
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "הפעולה נכשלה", "error");
    } finally {
      setLoadingId(null);
    }
  }

  if (materials.length === 0) {
    return <EmptyState icon="folder_off" title="לא נמצאו חומרים" />;
  }

  return (
    <>
      <div className="ui-table-wrap">
        <table className="ui-table">
          <thead>
            <tr>
              <th>כותרת</th>
              <th>תגיות</th>
              <th>מצב</th>
              <th>אישור</th>
              <th>מעלה</th>
              <th>תאריך</th>
              <th>פעולות</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((material) => (
              <tr key={material.id}>
                <td>
                  <Link href={`/materials/${material.id}`}>{material.title}</Link>
                </td>
                <td>
                  <TagList tags={material.tags} />
                </td>
                <td>
                  {material.isHidden ? (
                    <span className="ui-badge" data-kind="danger">
                      מוסתר
                    </span>
                  ) : (
                    <span className="ui-badge">גלוי</span>
                  )}
                </td>
                <td>{APPROVAL_LABELS[material.approvalStatus]}</td>
                <td>{material.uploader?.full_name ?? "-"}</td>
                <td>{formatDate(material.createdAt)}</td>
                <td>
                  <div className="ui-table-actions">
                    {material.isHidden ? (
                      <button
                        type="button"
                        className="materials-btn-secondary"
                        disabled={loadingId === material.id}
                        onClick={() => void handleAction("restore", material.id)}
                      >
                        שחזור
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="materials-btn-secondary"
                        disabled={loadingId === material.id}
                        onClick={() => void handleAction("hide", material.id)}
                      >
                        הסתרה
                      </button>
                    )}
                    <button
                      type="button"
                      className="materials-btn-primary"
                      data-danger="true"
                      disabled={loadingId === material.id}
                      onClick={() => void handleAction("delete", material.id)}
                    >
                      מחיקה
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav className="ui-pagination" aria-label="עימוד">
          {page > 1 ? (
            <Link className="materials-btn-secondary" href={`/admin/materials?page=${page - 1}`}>
              הקודם
            </Link>
          ) : (
            <span />
          )}
          <span>
            עמוד {page} מתוך {totalPages}
          </span>
          {page < totalPages ? (
            <Link className="materials-btn-secondary" href={`/admin/materials?page=${page + 1}`}>
              הבא
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  adminDeleteReportedContent,
  adminHideReportedContent,
  adminRestoreReportedContent,
  resolveReport,
} from "@/lib/actions/admin";
import { EmptyState } from "@/components/ui/EmptyState";
import { useUi } from "@/components/ui/UiProvider";
import type { PublicReport, ReportStatus } from "@/lib/models/report";
import {
  REPORT_STATUS_LABELS,
  REPORT_TARGET_LABELS,
  getReportTargetHref,
} from "@/lib/utils/admin-labels";
import { formatDate } from "@/lib/utils/format";

type AdminReportsListProps = {
  reports: PublicReport[];
};

export function AdminReportsList({ reports }: AdminReportsListProps) {
  const router = useRouter();
  const { toast, confirm } = useUi();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function run(reportId: string, task: () => Promise<unknown>, success: string) {
    setLoadingId(reportId);
    try {
      await task();
      toast(success);
      router.refresh();
    } catch (error) {
      toast(error instanceof Error ? error.message : "הפעולה נכשלה", "error");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(report: PublicReport) {
    const approved = await confirm({
      title: "מחיקת התוכן המדווח",
      message: "התוכן וכל מה שמשויך אליו יימחקו לצמיתות. לא ניתן לבטל פעולה זו.",
      confirmLabel: "מחיקה",
      danger: true,
    });
    if (!approved) return;

    await run(
      report.id,
      () => adminDeleteReportedContent(report.target_type, report.target_id),
      "התוכן נמחק",
    );
  }

  if (reports.length === 0) {
    return (
      <EmptyState
        icon="flag"
        title="אין דיווחים"
        description="כשמשתמשים ידווחו על תוכן, הדיווחים יופיעו כאן."
      />
    );
  }

  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            <th>סוג תוכן</th>
            <th>סיבה</th>
            <th>דווח על ידי</th>
            <th>תאריך</th>
            <th>סטטוס</th>
            <th>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const href = getReportTargetHref(report.target_type, report.target_id);
            const busy = loadingId === report.id;

            return (
              <tr key={report.id}>
                <td>
                  {href ? (
                    <Link href={href}>{REPORT_TARGET_LABELS[report.target_type]}</Link>
                  ) : (
                    REPORT_TARGET_LABELS[report.target_type]
                  )}
                </td>
                <td>{report.reason}</td>
                <td>{report.user?.full_name ?? "משתמש"}</td>
                <td>{formatDate(report.created_at)}</td>
                <td>
                  <label className="visually-hidden" htmlFor={`status-${report.id}`}>
                    סטטוס דיווח
                  </label>
                  <select
                    id={`status-${report.id}`}
                    value={report.status}
                    disabled={busy}
                    onChange={(event) =>
                      void run(
                        report.id,
                        () => resolveReport(report.id, { status: event.target.value as ReportStatus }),
                        "הסטטוס עודכן",
                      )
                    }
                  >
                    {(Object.keys(REPORT_STATUS_LABELS) as ReportStatus[]).map((status) => (
                      <option key={status} value={status}>
                        {REPORT_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <div className="ui-table-actions">
                    <button
                      type="button"
                      className="materials-btn-secondary"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          report.id,
                          () => adminHideReportedContent(report.target_type, report.target_id),
                          "התוכן הוסתר",
                        )
                      }
                    >
                      הסתרה
                    </button>
                    <button
                      type="button"
                      className="materials-btn-secondary"
                      disabled={busy}
                      onClick={() =>
                        void run(
                          report.id,
                          () => adminRestoreReportedContent(report.target_type, report.target_id),
                          "התוכן שוחזר",
                        )
                      }
                    >
                      שחזור
                    </button>
                    <button
                      type="button"
                      className="materials-btn-primary"
                      data-danger="true"
                      disabled={busy}
                      onClick={() => void handleDelete(report)}
                    >
                      מחיקה
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

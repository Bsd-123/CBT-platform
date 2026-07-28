"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  adminDeleteReportedContent,
  adminHideReportedContent,
  adminRestoreReportedContent,
  resolveReport,
} from "@/lib/actions/admin";
import type { PublicReport } from "@/lib/models/report";
import type { ReportStatus } from "@/lib/models/report";

type AdminReportsListProps = {
  reports: PublicReport[];
};

export function AdminReportsList({ reports }: AdminReportsListProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function handleModeration(
    report: PublicReport,
    action: "hide" | "restore" | "delete",
  ) {
    setError(null);
    setLoadingId(report.id);

    try {
      if (action === "hide") {
        await adminHideReportedContent(report.target_type, report.target_id);
      } else if (action === "restore") {
        await adminRestoreReportedContent(report.target_type, report.target_id);
      } else {
        await adminDeleteReportedContent(report.target_type, report.target_id);
      }
      router.refresh();
    } catch (moderationError) {
      setError(moderationError instanceof Error ? moderationError.message : "הפעולה נכשלה");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleStatusChange(id: string, status: ReportStatus) {
    setError(null);
    setLoadingId(id);

    try {
      await resolveReport(id, { status });
      router.refresh();
    } catch (statusError) {
      setError(statusError instanceof Error ? statusError.message : "הפעולה נכשלה");
    } finally {
      setLoadingId(null);
    }
  }

  if (reports.length === 0) {
    return <p className="muted">אין דיווחים פתוחים.</p>;
  }

  return (
    <div className="stack">
      {error && <p className="error">{error}</p>}
      <ul className="list-plain">
        {reports.map((report) => (
          <li key={report.id}>
            <div className="stack">
              <div>
                <span className="badge">{report.status}</span>{" "}
                <span className="badge">{report.target_type}</span>
              </div>
              <p>{report.reason}</p>
              <p className="muted">
                דווח על ידי: {report.user?.full_name ?? "משתמש"}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                <button
                  type="button"
                  className="button secondary"
                  disabled={loadingId === report.id}
                  onClick={() => void handleModeration(report, "hide")}
                >
                  הסתרת תוכן
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={loadingId === report.id}
                  onClick={() => void handleModeration(report, "restore")}
                >
                  שחזור תוכן
                </button>
                <button
                  type="button"
                  className="button secondary"
                  disabled={loadingId === report.id}
                  onClick={() => void handleModeration(report, "delete")}
                >
                  מחיקת תוכן
                </button>
              </div>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {(["open", "reviewing", "resolved"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    className="button secondary"
                    disabled={loadingId === report.id || report.status === status}
                    onClick={() => void handleStatusChange(report.id, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

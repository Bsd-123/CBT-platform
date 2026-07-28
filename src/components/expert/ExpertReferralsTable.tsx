"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ExpertApprovalStatus } from "@prisma/client";
import { decideReferralApproval } from "@/lib/actions/expert";
import type { PublicExpertApproval } from "@/lib/models/expert-approval";
import { EXPERT_APPROVAL_STATUSES } from "@/lib/models/expert-approval";
import {
  EXPERT_APPROVAL_STATUS_LABELS,
  formatApprovalDate,
  formatShortId,
  getInitials,
  matchesApprovalSearch,
} from "@/lib/utils/expert-approval-ui";

const PAGE_SIZE = 10;

type ExpertReferralsTableProps = {
  expertId: string;
  approvals: PublicExpertApproval[];
};

type StatusFilter = ExpertApprovalStatus | "all";

export function ExpertReferralsTable({ expertId, approvals }: ExpertReferralsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return approvals.filter((approval) => {
      if (statusFilter !== "all" && approval.status !== statusFilter) return false;
      return matchesApprovalSearch(approval, search, false);
    });
  }, [approvals, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  async function handleDecision(
    approval: PublicExpertApproval,
    status: "approved" | "rejected",
  ) {
    setError(null);
    setLoadingKey(approval.user_id);

    try {
      await decideReferralApproval(expertId, approval.user_id, { status });
      router.refresh();
    } catch (decisionError) {
      setError(decisionError instanceof Error ? decisionError.message : "הפעולה נכשלה");
    } finally {
      setLoadingKey(null);
    }
  }

  return (
    <section className="admin-experts-table-card">
      <div style={{ padding: "1.5rem 1.5rem 0" }}>
        <div className="admin-experts-toolbar">
          <div>
            <h2>בקשות הרשמה לאישור</h2>
            <p>אשרו או דחו משתמשים שנרשמו דרך ההפניה שלכם בלבד.</p>
          </div>
          <label className="admin-experts-search">
            <span className="material-symbols-outlined" aria-hidden="true">
              search
            </span>
            <input
              type="search"
              placeholder="חיפוש לפי שם או תפקיד..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>

        <div className="admin-experts-filters" role="group" aria-label="סינון לפי סטטוס">
          <button
            type="button"
            className="admin-experts-filter-chip"
            data-active={statusFilter === "all"}
            onClick={() => {
              setStatusFilter("all");
              setPage(1);
            }}
          >
            הכל
          </button>
          {EXPERT_APPROVAL_STATUSES.map((status) => (
            <button
              key={status}
              type="button"
              className="admin-experts-filter-chip"
              data-active={statusFilter === status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
            >
              {EXPERT_APPROVAL_STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        {error && <p className="error">{error}</p>}
      </div>

      {filtered.length === 0 ? (
        <p className="admin-experts-empty">לא נמצאו בקשות הרשמה.</p>
      ) : (
        <div className="admin-experts-table-wrap">
          <table className="admin-experts-table">
            <thead>
              <tr>
                <th scope="col">משתמש</th>
                <th scope="col">תפקיד / בקשה</th>
                <th scope="col">תאריך הגשה</th>
                <th scope="col">סטטוס</th>
                <th scope="col" style={{ textAlign: "end" }}>
                  פעולות
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((approval) => {
                const userName = approval.user?.full_name ?? "משתמש";
                const isLoading = loadingKey === approval.user_id;

                return (
                  <tr key={approval.id}>
                    <td>
                      <div className="admin-experts-user-cell">
                        <div className="admin-experts-avatar" aria-hidden="true">
                          {getInitials(userName)}
                        </div>
                        <div>
                          <div className="admin-experts-user-name">{userName}</div>
                          <div className="admin-experts-user-meta">
                            {formatShortId(approval.id)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="admin-experts-request-title">
                        {approval.user?.title ?? "ללא תפקיד מקצועי"}
                      </div>
                      <div className="admin-experts-request-sub">הרשמה דרך הפניה</div>
                    </td>
                    <td className="admin-experts-date">{formatApprovalDate(approval.created_at)}</td>
                    <td>
                      <span
                        className={`admin-experts-badge admin-experts-badge--${approval.status}`}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">
                          {approval.status === "pending"
                            ? "schedule"
                            : approval.status === "approved"
                              ? "check_circle"
                              : "cancel"}
                        </span>
                        {EXPERT_APPROVAL_STATUS_LABELS[approval.status]}
                      </span>
                    </td>
                    <td>
                      <div className="admin-experts-actions">
                        {approval.status === "pending" ? (
                          <>
                            <button
                              type="button"
                              className="button"
                              disabled={isLoading}
                              onClick={() => void handleDecision(approval, "approved")}
                            >
                              אישור
                            </button>
                            <button
                              type="button"
                              className="button danger"
                              disabled={isLoading}
                              onClick={() => void handleDecision(approval, "rejected")}
                            >
                              דחייה
                            </button>
                          </>
                        ) : (
                          <span className="admin-experts-actions-muted">—</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="admin-experts-table-footer">
        <span className="admin-experts-table-footer-meta">
          {filtered.length === 0
            ? "0 רשומות"
            : `מציג ${rangeStart}–${rangeEnd} מתוך ${filtered.length}`}
        </span>
        <div className="admin-experts-pagination">
          <button
            type="button"
            className="button secondary"
            disabled={currentPage <= 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            הקודם
          </button>
          <button
            type="button"
            className="button secondary"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
          >
            הבא
          </button>
        </div>
      </div>
    </section>
  );
}

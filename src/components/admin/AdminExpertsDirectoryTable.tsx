"use client";

import { useMemo, useState } from "react";
import type { PublicExpertDirectoryEntry } from "@/lib/models/user";
import {
  formatApprovalDate,
  getInitials,
} from "@/lib/utils/expert-approval-ui";
import {
  buildExpertReferralPath,
} from "@/lib/utils/expert-code";

const PAGE_SIZE = 10;

type AdminExpertsDirectoryTableProps = {
  experts: PublicExpertDirectoryEntry[];
};

function matchesExpertSearch(expert: PublicExpertDirectoryEntry, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [expert.full_name, expert.title, expert.expert_code, expert.id]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function buildReferralLink(expertCode: string | null): string {
  if (!expertCode) return "/register";

  const path = buildExpertReferralPath(expertCode);
  if (typeof window === "undefined") {
    return path;
  }

  return `${window.location.origin}${path}`;
}

export function AdminExpertsDirectoryTable({ experts }: AdminExpertsDirectoryTableProps) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return experts.filter((expert) => matchesExpertSearch(expert, search));
  }, [experts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  async function handleCopyReferralLink(expert: PublicExpertDirectoryEntry) {
    if (!expert.expert_code) return;

    try {
      await navigator.clipboard.writeText(buildReferralLink(expert.expert_code));
      setCopiedId(expert.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  }

  async function handleCopyExpertCode(expert: PublicExpertDirectoryEntry) {
    if (!expert.expert_code) return;

    try {
      await navigator.clipboard.writeText(expert.expert_code);
      setCopiedId(`code:${expert.id}`);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(null);
    }
  }

  return (
    <section className="admin-experts-table-card">
      <div style={{ padding: "1.5rem 1.5rem 0" }}>
        <div className="admin-experts-toolbar">
          <div>
            <h2>רשימת מומחים</h2>
            <p>כל המומחים הרשומים במערכת, קודי ההפניה וקישורי ההרשמה שלהם.</p>
          </div>
          <label className="admin-experts-search">
            <span className="material-symbols-outlined" aria-hidden="true">
              search
            </span>
            <input
              type="search"
              placeholder="חיפוש לפי שם, תפקיד או קוד מומחה..."
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="admin-experts-empty">לא נמצאו מומחים.</p>
      ) : (
        <div className="admin-experts-table-wrap">
          <table className="admin-experts-table">
            <thead>
              <tr>
                <th scope="col">מומחה</th>
                <th scope="col">תפקיד מקצועי</th>
                <th scope="col">קוד מומחה</th>
                <th scope="col">תאריך הצטרפות</th>
                <th scope="col">ממתינות</th>
                <th scope="col">סה״כ הפניות</th>
                <th scope="col" style={{ textAlign: "end" }}>
                  הפניה
                </th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((expert) => (
                <tr key={expert.id}>
                  <td>
                    <div className="admin-experts-user-cell">
                      <div className="admin-experts-avatar" aria-hidden="true">
                        {getInitials(expert.full_name)}
                      </div>
                      <div>
                        <div className="admin-experts-user-name">{expert.full_name}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="admin-experts-request-title">
                      {expert.title ?? "ללא תפקיד מקצועי"}
                    </div>
                  </td>
                  <td>
                    <code className="admin-experts-code">{expert.expert_code ?? "—"}</code>
                  </td>
                  <td className="admin-experts-date">{formatApprovalDate(expert.created_at)}</td>
                  <td>
                    {expert.pending_referrals > 0 ? (
                      <span className="admin-experts-badge admin-experts-badge--pending">
                        <span className="material-symbols-outlined" aria-hidden="true">
                          schedule
                        </span>
                        {expert.pending_referrals}
                      </span>
                    ) : (
                      <span className="admin-experts-actions-muted">0</span>
                    )}
                  </td>
                  <td className="admin-experts-date">{expert.total_referrals}</td>
                  <td>
                    <div className="admin-experts-actions">
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => void handleCopyExpertCode(expert)}
                      >
                        {copiedId === `code:${expert.id}` ? "הועתק" : "העתק קוד"}
                      </button>
                      <button
                        type="button"
                        className="button secondary"
                        onClick={() => void handleCopyReferralLink(expert)}
                      >
                        {copiedId === expert.id ? "הועתק" : "העתק קישור"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

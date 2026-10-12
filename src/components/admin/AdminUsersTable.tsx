"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@/lib/db/types";
import { adminUpdateUserRole } from "@/lib/actions/admin";
import type {
  AdminUserDirectoryEntry,
  AdminUserRegistrationStatus,
  AdminUsersPageStats,
} from "@/lib/models/user";
import { USER_ROLES } from "@/lib/models/user";
import { getInitials } from "@/lib/utils/expert-approval-ui";
import { unwrap } from "@/lib/actions/result";

const PAGE_SIZE = 10;

const ROLE_LABELS: Record<UserRole, string> = {
  user: "מטפל/ת",
  expert: "מומחה/ית",
  admin: "מנהל/ת",
};

const REGISTRATION_LABELS: Record<AdminUserRegistrationStatus, string> = {
  none: "מאומת",
  approved: "מאומת",
  pending: "ממתין לאישור",
  rejected: "נדחה",
};

type AdminUsersTableProps = {
  users: AdminUserDirectoryEntry[];
  stats: AdminUsersPageStats;
};

type RoleFilter = UserRole | "all";
type StatusFilter = AdminUserRegistrationStatus | "all";

function formatJoinedRelative(value: Date | string): string {
  const created = new Date(value);
  const diffMs = Date.now() - created.getTime();
  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (minutes < 2) return "עכשיו";
  if (minutes < 60) return `לפני ${minutes} דקות`;
  if (hours < 24) return `לפני ${hours} שעות`;
  if (days < 30) return `לפני ${days} ימים`;
  return created.toLocaleDateString("he-IL", { day: "numeric", month: "short", year: "numeric" });
}

function matchesSearch(user: AdminUserDirectoryEntry, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;

  const haystack = [user.full_name, user.title, user.role, user.id]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return haystack.includes(normalized);
}

function getVerificationBadgeClass(status: AdminUserRegistrationStatus): string {
  if (status === "pending") return "status-pending";
  if (status === "rejected") return "status-rejected";
  return "status-approved";
}

function getVerificationIcon(status: AdminUserRegistrationStatus): string {
  if (status === "pending") return "history";
  if (status === "rejected") return "cancel";
  return "check_circle";
}

export function AdminUsersTable({ users, stats }: AdminUsersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users.filter((user) => {
      if (roleFilter !== "all" && user.role !== roleFilter) return false;
      if (statusFilter !== "all" && user.registration_status !== statusFilter) return false;
      return matchesSearch(user, search);
    });
  }, [users, search, roleFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filtered.length);

  async function handleRoleChange(userId: string, role: UserRole) {
    setError(null);
    setLoadingId(userId);

    try {
      unwrap(await adminUpdateUserRole(userId, role));
      router.refresh();
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : "העדכון נכשל");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="stack">
      <section className="stat-grid" aria-label="נתוני משתמשים">
        <div className="stat-card">
          <span className="stat-icon tone-primary">
            <span className="material-symbols-outlined" aria-hidden="true">
              groups
            </span>
          </span>
          <span className="stat-text">
            <strong className="stat-value">{stats.total}</strong>
            <span className="stat-label">סה״כ משתמשים</span>
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-icon tone-warning">
            <span className="material-symbols-outlined" aria-hidden="true">
              pending_actions
            </span>
          </span>
          <span className="stat-text">
            <strong className="stat-value">{stats.pending_verifications}</strong>
            <span className="stat-label">ממתינים לאישור</span>
          </span>
        </div>
        <div className="stat-card">
          <span className="stat-icon tone-success">
            <span className="material-symbols-outlined" aria-hidden="true">
              bolt
            </span>
          </span>
          <span className="stat-text">
            <strong className="stat-value">{stats.recently_joined}</strong>
            <span className="stat-label">הצטרפו ב־24 השעות האחרונות</span>
          </span>
        </div>
      </section>

      <section className="ui-section ui-section-flush">
        <div className="panel-head">
          <div>
            <h2>מדריך משתמשים</h2>
            <p>צפייה וניהול תפקידים וסטטוס אישור במערכת.</p>
          </div>
          <div className="panel-head-actions">
            <label className="search-field">
              <span className="material-symbols-outlined" aria-hidden="true">
                search
              </span>
              <input
                type="search"
                placeholder="חיפוש לפי שם, תפקיד..."
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
              />
            </label>
          </div>
        </div>

        <div className="filter-row" role="group" aria-label="סינון לפי תפקיד">
          <button
            type="button"
            className="filter-chip"
            aria-pressed={roleFilter === "all"}
            onClick={() => {
              setRoleFilter("all");
              setPage(1);
            }}
          >
            כל התפקידים
          </button>
          {USER_ROLES.map((role) => (
            <button
              key={role}
              type="button"
              className="filter-chip"
              aria-pressed={roleFilter === role}
              onClick={() => {
                setRoleFilter(role);
                setPage(1);
              }}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>

        <div className="filter-row" role="group" aria-label="סינון לפי אימות">
          {(["all", "none", "approved", "pending", "rejected"] as const).map((status) => (
            <button
              key={status}
              type="button"
              className="filter-chip"
              aria-pressed={statusFilter === status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
            >
              {status === "all" ? "כל הסטטוסים" : REGISTRATION_LABELS[status]}
            </button>
          ))}
        </div>

        {error && <p className="error panel-error">{error}</p>}

        {filtered.length === 0 ? (
          <p className="panel-empty">לא נמצאו משתמשים.</p>
        ) : (
          <div className="ui-table-scroll">
            <table className="ui-table">
              <thead>
                <tr>
                  <th scope="col">שם משתמש</th>
                  <th scope="col">תפקיד מקצועי</th>
                  <th scope="col">אימות</th>
                  <th scope="col">תפקיד במערכת</th>
                  <th scope="col">הצטרפות</th>
                  <th scope="col" className="ui-th-actions">
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((user, index) => (
                  <tr key={user.id}>
                    <td>
                      <div className="cell-user">
                        <div
                          className="avatar avatar-sm"
                          aria-hidden="true"
                        >
                          {getInitials(user.full_name)}
                        </div>
                        <span className="cell-strong">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="cell-muted">
                      {user.title ?? "ללא תפקיד מקצועי"}
                    </td>
                    <td>
                      <span
                        className={`status ${getVerificationBadgeClass(user.registration_status)}`}
                      >
                        <span
                          className="material-symbols-outlined"
                          aria-hidden="true"
                          style={
                            user.registration_status === "none" ||
                            user.registration_status === "approved"
                              ? { fontVariationSettings: "'FILL' 1" }
                              : undefined
                          }
                        >
                          {getVerificationIcon(user.registration_status)}
                        </span>
                        {REGISTRATION_LABELS[user.registration_status]}
                      </span>
                    </td>
                    <td>
                      <span className="status status-neutral">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="cell-muted">{formatJoinedRelative(user.created_at)}</td>
                    <td>
                      <div className="ui-table-actions">
                        {user.registration_status === "pending" && (
                          <Link href="/admin/experts" className="btn btn-secondary btn-sm">
                            אימות
                          </Link>
                        )}
                        <select
                          className="input input-sm"
                          value={user.role}
                          disabled={loadingId === user.id}
                          onChange={(event) =>
                            void handleRoleChange(user.id, event.target.value as UserRole)
                          }
                          aria-label={`שינוי תפקיד עבור ${user.full_name}`}
                        >
                          {USER_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="table-footer">
          <span className="table-footer-meta">
            {filtered.length === 0
              ? "0 רשומות"
              : `מציג ${rangeStart}–${rangeEnd} מתוך ${filtered.length}`}
          </span>
          <div className="table-pagination">
            <button
              type="button"
              className="btn btn-secondary btn-sm btn-icon"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              aria-label="עמוד קודם"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                chevron_right
              </span>
            </button>
            <span className="table-page-current" aria-current="page">
              {currentPage}
            </span>
            <button
              type="button"
              className="btn btn-secondary btn-sm btn-icon"
              disabled={currentPage >= totalPages}
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              aria-label="עמוד הבא"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                chevron_left
              </span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

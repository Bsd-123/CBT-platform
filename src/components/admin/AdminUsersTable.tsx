"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserRole } from "@prisma/client";
import { adminUpdateUserRole } from "@/lib/actions/admin";
import type {
  AdminUserDirectoryEntry,
  AdminUserRegistrationStatus,
  AdminUsersPageStats,
} from "@/lib/models/user";
import { USER_ROLES } from "@/lib/models/user";
import { getInitials } from "@/lib/utils/expert-approval-ui";

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
  if (status === "pending") return "admin-users-badge--pending";
  if (status === "rejected") return "admin-users-badge--rejected";
  return "admin-users-badge--verified";
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
      await adminUpdateUserRole(userId, role);
      router.refresh();
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : "העדכון נכשל");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="admin-users-page stack">
      <section className="admin-users-stats">
        <article className="admin-users-stat-card">
          <div className="admin-users-stat-top">
            <span className="admin-users-stat-label">סה״כ משתמשים</span>
            <span className="admin-users-stat-icon admin-users-stat-icon--primary">
              <span className="material-symbols-outlined" aria-hidden="true">
                groups
              </span>
            </span>
          </div>
          <div className="admin-users-stat-value">{stats.total}</div>
        </article>

        <article className="admin-users-stat-card admin-users-stat-card--pending">
          <div className="admin-users-stat-top">
            <span className="admin-users-stat-label">ממתינים לאישור</span>
            <span className="admin-users-stat-icon admin-users-stat-icon--secondary">
              <span className="material-symbols-outlined" aria-hidden="true">
                pending_actions
              </span>
            </span>
          </div>
          <div className="admin-users-stat-value admin-users-stat-value--secondary">
            {stats.pending_verifications}
          </div>
        </article>

        <article className="admin-users-stat-card">
          <div className="admin-users-stat-top">
            <span className="admin-users-stat-label">הצטרפו ב-24 שעות</span>
            <span className="admin-users-stat-icon admin-users-stat-icon--primary">
              <span className="material-symbols-outlined" aria-hidden="true">
                bolt
              </span>
            </span>
          </div>
          <div className="admin-users-stat-value">{stats.recently_joined}</div>
        </article>
      </section>

      <section className="admin-users-table-card">
        <div className="admin-users-toolbar">
          <div>
            <h2>מדריך משתמשים</h2>
            <p>צפייה וניהול תפקידים וסטטוס אישור במערכת.</p>
          </div>
          <div className="admin-users-toolbar-actions">
            <label className="admin-users-search">
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

        <div className="admin-users-filters" role="group" aria-label="סינון לפי תפקיד">
          <button
            type="button"
            className="admin-users-filter-chip"
            data-active={roleFilter === "all"}
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
              className="admin-users-filter-chip"
              data-active={roleFilter === role}
              onClick={() => {
                setRoleFilter(role);
                setPage(1);
              }}
            >
              {ROLE_LABELS[role]}
            </button>
          ))}
        </div>

        <div className="admin-users-filters" role="group" aria-label="סינון לפי אימות">
          {(["all", "none", "approved", "pending", "rejected"] as const).map((status) => (
            <button
              key={status}
              type="button"
              className="admin-users-filter-chip"
              data-active={statusFilter === status}
              onClick={() => {
                setStatusFilter(status);
                setPage(1);
              }}
            >
              {status === "all" ? "כל הסטטוסים" : REGISTRATION_LABELS[status]}
            </button>
          ))}
        </div>

        {error && <p className="error" style={{ padding: "0 1.5rem" }}>{error}</p>}

        {filtered.length === 0 ? (
          <p className="admin-users-empty">לא נמצאו משתמשים.</p>
        ) : (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th scope="col">שם משתמש</th>
                  <th scope="col">תפקיד מקצועי</th>
                  <th scope="col">אימות</th>
                  <th scope="col">תפקיד במערכת</th>
                  <th scope="col">הצטרפות</th>
                  <th scope="col" style={{ textAlign: "end" }}>
                    פעולות
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((user, index) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-users-user-cell">
                        <div
                          className={`admin-users-avatar admin-users-avatar--${index % 3}`}
                          aria-hidden="true"
                        >
                          {getInitials(user.full_name)}
                        </div>
                        <span className="admin-users-name">{user.full_name}</span>
                      </div>
                    </td>
                    <td className="admin-users-muted">
                      {user.title ?? "ללא תפקיד מקצועי"}
                    </td>
                    <td>
                      <span
                        className={`admin-users-badge ${getVerificationBadgeClass(user.registration_status)}`}
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
                      <span className="admin-users-badge admin-users-badge--role">
                        {ROLE_LABELS[user.role]}
                      </span>
                    </td>
                    <td className="admin-users-muted">{formatJoinedRelative(user.created_at)}</td>
                    <td>
                      <div className="admin-users-actions">
                        {user.registration_status === "pending" && (
                          <Link href="/admin/experts" className="admin-users-action-link admin-users-action-verify">
                            אימות
                          </Link>
                        )}
                        <select
                          className="admin-users-role-select"
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

        <div className="admin-users-table-footer">
          <span className="admin-users-table-footer-meta">
            {filtered.length === 0
              ? "0 רשומות"
              : `מציג ${rangeStart}–${rangeEnd} מתוך ${filtered.length}`}
          </span>
          <div className="admin-users-pagination">
            <button
              type="button"
              className="admin-users-page-btn"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              aria-label="עמוד קודם"
            >
              <span className="material-symbols-outlined" aria-hidden="true">
                chevron_right
              </span>
            </button>
            <span className="admin-users-page-btn" data-active="true" aria-current="page">
              {currentPage}
            </span>
            <button
              type="button"
              className="admin-users-page-btn"
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
